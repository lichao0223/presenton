import fs from "fs/promises";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import JSZip from "jszip";

import {
  BoundedTextBuffer,
  memorySnapshotMb,
} from "@/lib/runtime-limits";

const DOM_TO_PPTX_SELECTOR = ".main-slide";
const DOM_TO_PPTX_SLIDE_WIDTH_IN = "13.333333";
const DOM_TO_PPTX_SLIDE_HEIGHT_IN = "7.5";
const DOM_TO_PPTX_CJK_FONT_FACE = "PingFang SC";
const DOM_TO_PPTX_RENDER_MODE = "dom";
const DOM_TO_PPTX_TABLE_RING_COLOR = "3B82F6";
const EMUS_PER_INCH = 914400;
const DOM_TO_PPTX_SLIDE_WIDTH_EMU = Math.round(
  Number(DOM_TO_PPTX_SLIDE_WIDTH_IN) * EMUS_PER_INCH
);
const DOM_TO_PPTX_SLIDE_HEIGHT_EMU = Math.round(
  Number(DOM_TO_PPTX_SLIDE_HEIGHT_IN) * EMUS_PER_INCH
);
const EMUS_PER_CSS_PIXEL = 9525;
const DOM_TO_PPTX_WIDE_TEXT_MIN_WIDTH_EMU = 2_000_000;
const DOM_TO_PPTX_TEXT_Y_OFFSET_EMU = 5 * EMUS_PER_CSS_PIXEL;
const DOM_TO_PPTX_NATIVE_TABLE_FONT_SIZE = "800";
const DOM_TO_PPTX_HERO_TITLE_FONT_SIZE = "3525";
const DOM_TO_PPTX_HERO_TITLE_Y_OFFSET_EMU = 7_144;
const DOM_TO_PPTX_LARGE_HEADING_FONT_SIZE = "3162";
const DOM_TO_PPTX_FOOTER_MIN_Y_EMU = 4_600_000;
const DOM_TO_PPTX_FOOTER_Y_OFFSET_EMU = 7_144;
const EXPORT_DIRECTORY_MODE = 0o755;
const EXPORT_FILE_MODE = 0o644;
const DOM_TO_PPTX_EXPORTER_FILENAME = "dom-to-pptx-exporter.mjs";
const LANDPPT_DOM_TO_PPTX_BUNDLE_RELATIVE_PATH = path.join(
  "vendor",
  "landppt-dom-to-pptx",
  "dom-to-pptx.bundle.js"
);

function getExportFastApiUrl(): string {
  return (
    process.env.FAST_API_INTERNAL_URL?.trim() ||
    process.env.NEXT_PUBLIC_FAST_API?.trim() ||
    ""
  ).replace(/\/+$/, "");
}

function extractSessionTokenFromCookieHeader(cookieHeader?: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const match = cookieHeader.match(/(?:^|;\s*)presenton_session=([^;]+)/);
  if (!match?.[1]) {
    return undefined;
  }

  return decodeURIComponent(match[1]);
}

function sanitizeExportFilename(
  input: string | null | undefined,
  replacement = ""
): string {
  let sanitized = (input ?? "").toString();
  sanitized = sanitized
    .replace(/\0/g, "")
    .replace(/\.\./g, replacement)
    .replace(/[\?<>\\:\*\|"]/g, replacement)
    .replace(/[\x00-\x1f\x80-\x9f]/g, replacement)
    .replace(/[\. ]+$/g, replacement);

  if (/^\.+$/.test(sanitized)) {
    sanitized = replacement;
  }

  if (/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(sanitized)) {
    sanitized = replacement;
  }

  return sanitized.trim();
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveFirstExistingPath(
  candidates: Array<string | undefined>,
  description: string
): Promise<string> {
  const checked = candidates.filter(
    (candidate): candidate is string => Boolean(candidate)
  );

  for (const candidate of checked) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(`${description} was not found. Checked: ${checked.join(", ")}`);
}

async function resolveDomToPptxExporterScript(): Promise<string> {
  const cwd = process.cwd();
  const appRoot = process.env.PRESENTON_APP_ROOT?.trim();

  return resolveFirstExistingPath(
    [
      path.join(cwd, "scripts", DOM_TO_PPTX_EXPORTER_FILENAME),
      path.join(cwd, "servers", "nextjs", "scripts", DOM_TO_PPTX_EXPORTER_FILENAME),
      appRoot
        ? path.join(appRoot, "servers", "nextjs", "scripts", DOM_TO_PPTX_EXPORTER_FILENAME)
        : undefined,
      appRoot ? path.join(appRoot, "scripts", DOM_TO_PPTX_EXPORTER_FILENAME) : undefined,
    ],
    "dom-to-pptx exporter script"
  );
}

async function resolveDomToPptxPackage(): Promise<string> {
  const cwd = process.cwd();
  const appRoot = process.env.PRESENTON_APP_ROOT?.trim();

  return resolveFirstExistingPath(
    [
      path.join(cwd, "node_modules", "dom-to-pptx", "package.json"),
      path.join(cwd, "servers", "nextjs", "node_modules", "dom-to-pptx", "package.json"),
      appRoot
        ? path.join(appRoot, "servers", "nextjs", "node_modules", "dom-to-pptx", "package.json")
        : undefined,
    appRoot
      ? path.join(appRoot, "node_modules", "dom-to-pptx", "package.json")
      : undefined,
    ],
    "dom-to-pptx package"
  );
}

async function resolveLandPptDomToPptxBundle(): Promise<string> {
  const cwd = process.cwd();
  const appRoot = process.env.PRESENTON_APP_ROOT?.trim();

  return resolveFirstExistingPath(
    [
      path.join(cwd, LANDPPT_DOM_TO_PPTX_BUNDLE_RELATIVE_PATH),
      path.join(cwd, "servers", "nextjs", LANDPPT_DOM_TO_PPTX_BUNDLE_RELATIVE_PATH),
      appRoot
        ? path.join(appRoot, "servers", "nextjs", LANDPPT_DOM_TO_PPTX_BUNDLE_RELATIVE_PATH)
        : undefined,
      appRoot ? path.join(appRoot, LANDPPT_DOM_TO_PPTX_BUNDLE_RELATIVE_PATH) : undefined,
    ],
    "LandPPT dom-to-pptx bundle"
  );
}

export async function domToPptxExportAvailable(): Promise<boolean> {
  try {
    await resolveDomToPptxExporterScript();
    await resolveDomToPptxPackage();
    await resolveLandPptDomToPptxBundle();
    return true;
  } catch {
    return false;
  }
}

function getExportsDirectory(): string {
  const appDataDirectory = process.env.APP_DATA_DIRECTORY?.trim();
  if (!appDataDirectory) {
    throw new Error("APP_DATA_DIRECTORY is required for dom-to-pptx export.");
  }
  return path.join(appDataDirectory, "exports");
}

function buildOutputPath(title: string | undefined): string {
  const safeBase =
    sanitizeExportFilename(title ?? "presentation")
      .replace(/\.pptx$/i, "")
      .replace(/[-_]+$/g, "") || "presentation";
  const suffix = randomUUID().slice(0, 8);
  return path.join(getExportsDirectory(), `${safeBase}-dom-to-pptx-${suffix}.pptx`);
}

async function ensureExportFileReadable(filePath: string): Promise<void> {
  const stats = await fs.stat(filePath);
  if (!stats.isFile()) {
    throw new Error("dom-to-pptx export finished but output path is not a file.");
  }

  await fs.chmod(path.dirname(filePath), EXPORT_DIRECTORY_MODE);
  await fs.chmod(filePath, EXPORT_FILE_MODE);
}

function getShapeExtent(shape: string): { cx: number; cy: number } | null {
  const match = shape.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/);
  if (!match) {
    return null;
  }
  return { cx: Number(match[1]), cy: Number(match[2]) };
}

function getShapeOffset(shape: string): { x: number; y: number } | null {
  const match = shape.match(/<a:off x="(\d+)" y="(\d+)"\/>/);
  if (!match) {
    return null;
  }
  return { x: Number(match[1]), y: Number(match[2]) };
}

function shouldCenterCompactCjkLabel(shape: string): boolean {
  const extent = getShapeExtent(shape);
  if (!extent) {
    return false;
  }

  if (extent.cx <= 900_000) {
    return true;
  }

  const offset = getShapeOffset(shape);
  const fontSize = Number(shape.match(/\bsz="(\d+)"/)?.[1] ?? 0);
  return (
    Boolean(offset) &&
    fontSize === 1000 &&
    extent.cx >= 1_350_000 &&
    extent.cx <= 1_650_000 &&
    offset!.y > 2_750_000
  );
}

function patchShapeTextOverflow(xml: string): { xml: string; count: number } {
  let count = 0;
  const patchedXml = xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shape) => {
    const text = Array.from(shape.matchAll(/<a:t>(.*?)<\/a:t>/g))
      .map((match) => match[1])
      .join("");
    if (!text) {
      return shape;
    }

    let patched = shape;
    const compactCjkLabel =
      text.length <= 5 && /[\u3400-\u9fff]/.test(text) && /<a:solidFill>/.test(shape);
    const urlLikeText = /^www\./i.test(text);

    if (compactCjkLabel || urlLikeText) {
      patched = patched.replace(
        /<a:bodyPr\b([^>]*)\bwrap="square"/,
        "<a:bodyPr$1wrap=\"none\""
      );
    }

    if (compactCjkLabel) {
      patched = patched
        .replace(/\blIns="\d+"/, 'lIns="0"')
        .replace(/\brIns="\d+"/, 'rIns="0"');

      if (shouldCenterCompactCjkLabel(shape)) {
        patched = patched.replace(
          /<a:pPr\b([^>]*?)\balgn="l"/,
          '<a:pPr$1algn="ctr"'
        );
      }

      if (!/[A-Za-z0-9]/.test(text)) {
        patched = patched.replace(
          /<a:latin\b([^>]*?)\btypeface="[^"]*"/g,
          `<a:latin$1typeface="${DOM_TO_PPTX_CJK_FONT_FACE}"`
        );
      }
    }

    if (urlLikeText) {
      const minUrlWidth = text.length > 22 ? 1_950_000 : 1_650_000;
      patched = patched.replace(
        /<a:ext cx="(\d+)" cy="(\d+)"\/>/,
        (_match: string, cx: string, cy: string) =>
          `<a:ext cx="${Math.max(Number(cx), minUrlWidth)}" cy="${cy}"/>`
      );
    }

    if (patched !== shape) {
      count += 1;
    }
    return patched;
  });

  return { xml: patchedXml, count };
}

function patchNativeTableBorders(xml: string): { xml: string; count: number } {
  let count = 0;
  const patchedXml = xml.replace(
    /<p:graphicFrame>[\s\S]*?<a:tbl>[\s\S]*?<\/a:tbl>[\s\S]*?<\/p:graphicFrame>/g,
    (graphicFrame) => {
      let patched = graphicFrame.replace(
        /<a:ln([LR])\b[^>]*>[\s\S]*?<\/a:ln\1>/g,
        (_line: string, side: string) => {
          count += 1;
          return `<a:ln${side} w="0"><a:noFill/></a:ln${side}>`;
        }
      );

      patched = patched.replace(
        /<a:ln([TB])\b[^>]*>[\s\S]*?<\/a:ln\1>/g,
        (_line: string, side: string) => {
          count += 1;
          return [
            `<a:ln${side} w="6350" cap="flat" cmpd="sng" algn="ctr">`,
            '<a:solidFill><a:srgbClr val="E5E7EB"/></a:solidFill>',
            '<a:prstDash val="solid"/>',
            `<a:round/>`,
            `<a:headEnd type="none" w="med" len="med"/>`,
            `<a:tailEnd type="none" w="med" len="med"/>`,
            `</a:ln${side}>`,
          ].join("");
        }
      );

      return patched;
    }
  );

  return { xml: patchedXml, count };
}

function patchNativeTableFontSize(xml: string): { xml: string; count: number } {
  let count = 0;
  const patchedXml = xml.replace(
    /<p:graphicFrame>[\s\S]*?<a:tbl>[\s\S]*?<\/a:tbl>[\s\S]*?<\/p:graphicFrame>/g,
    (graphicFrame) =>
      graphicFrame.replace(/\bsz="700"/g, () => {
        count += 1;
        return `sz="${DOM_TO_PPTX_NATIVE_TABLE_FONT_SIZE}"`;
      })
  );

  return { xml: patchedXml, count };
}

function patchTableWrapperRings(xml: string): { xml: string; count: number } {
  const tableOffsets = Array.from(
    xml.matchAll(
      /<p:graphicFrame>[\s\S]*?<p:xfrm>\s*<a:off x="(\d+)" y="(\d+)"\/>[\s\S]*?<a:tbl>[\s\S]*?<\/a:tbl>[\s\S]*?<\/p:graphicFrame>/g
    )
  ).map((match) => `${match[1]},${match[2]}`);

  let count = 0;
  const patchedXml = xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shape) => {
    const offset = shape.match(/<a:off x="(\d+)" y="(\d+)"\/>/);
    if (!offset || !tableOffsets.includes(`${offset[1]},${offset[2]}`)) {
      return shape;
    }
    if (
      !/<a:prstGeom prst="roundRect">/.test(shape) ||
      !/<a:solidFill>\s*<a:srgbClr val="FFFFFF"\/>\s*<\/a:solidFill>/.test(shape)
    ) {
      return shape;
    }

    return shape.replace(/<a:ln>\s*<\/a:ln>/, () => {
        count += 1;
        return [
          '<a:ln w="9525" cap="flat" cmpd="sng" algn="ctr">',
          `<a:solidFill><a:srgbClr val="${DOM_TO_PPTX_TABLE_RING_COLOR}"><a:alpha val="50000"/></a:srgbClr></a:solidFill>`,
          '<a:prstDash val="solid"/>',
          '<a:round/>',
          '<a:headEnd type="none" w="med" len="med"/>',
          '<a:tailEnd type="none" w="med" len="med"/>',
          '</a:ln>',
        ].join("");
    });
  });

  return { xml: patchedXml, count };
}

function collectWhiteRoundRectExtents(xml: string): Map<string, { cx: string; cy: string }> {
  const extents = new Map<string, { cx: string; cy: string }>();
  for (const match of xml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)) {
    const shape = match[0];
    const offset = shape.match(/<a:off x="(\d+)" y="(\d+)"\/>/);
    const extent = shape.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/);
    if (
      offset &&
      extent &&
      /<a:prstGeom prst="roundRect">/.test(shape) &&
      /<a:solidFill>\s*<a:srgbClr val="FFFFFF"\/>\s*<\/a:solidFill>/.test(shape)
    ) {
      extents.set(`${offset[1]},${offset[2]}`, { cx: extent[1], cy: extent[2] });
    }
  }
  return extents;
}

function patchNativeTableRowHeights(xml: string): { xml: string; count: number } {
  const wrapperExtents = collectWhiteRoundRectExtents(xml);
  let count = 0;
  const patchedXml = xml.replace(
    /<p:graphicFrame>[\s\S]*?<a:tbl>[\s\S]*?<\/a:tbl>[\s\S]*?<\/p:graphicFrame>/g,
    (graphicFrame) => {
      const offset = graphicFrame.match(/<a:off x="(\d+)" y="(\d+)"\/>/);
      if (!offset) {
        return graphicFrame;
      }

      const wrapperExtent = wrapperExtents.get(`${offset[1]},${offset[2]}`);
      const rowCount = (graphicFrame.match(/<a:tr\b/g) ?? []).length;
      if (!wrapperExtent || rowCount === 0) {
        return graphicFrame;
      }

      const rowHeight = Math.round(Number(wrapperExtent.cy) / rowCount);
      return graphicFrame.replace(/<a:tr h="\d+">/g, () => {
        count += 1;
        return `<a:tr h="${rowHeight}">`;
      });
    }
  );

  return { xml: patchedXml, count };
}

function patchLongCjkHeadingWidth(xml: string): { xml: string; count: number } {
  let count = 0;
  const patchedXml = xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shape) => {
    const text = Array.from(shape.matchAll(/<a:t>(.*?)<\/a:t>/g))
      .map((match) => match[1])
      .join("");
    if (text.length < 16 || !/[\u3400-\u9fff]/.test(text)) {
      return shape;
    }

    const maxFontSize = Math.max(
      0,
      ...Array.from(shape.matchAll(/\bsz="(\d+)"/g)).map((match) =>
        Number(match[1])
      )
    );
    if (maxFontSize < 2700) {
      return shape;
    }

    return shape.replace(
      /<a:ext cx="(\d+)" cy="(\d+)"\/>/,
      (_match: string, cx: string, cy: string) => {
        count += 1;
        return `<a:ext cx="${Math.round(Number(cx) * 1.1)}" cy="${cy}"/>`;
      }
    );
  });

  return { xml: patchedXml, count };
}

function patchCjkSemiBoldWeight(xml: string): { xml: string; count: number } {
  let count = 0;
  const patchedXml = xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shape) =>
    shape.replace(
      /<a:rPr\b([^>]*\blang="zh-CN"[^>]*\bsz="(\d+)"[^>]*?)\s+b="1"([^>]*)>/g,
      (match: string, beforeSize: string, size: string, afterBold: string) => {
        const fontSize = Number(size);
        const shouldUseRegularWeight =
          fontSize >= 3000 || (fontSize >= 1100 && fontSize < 1800);
        if (!shouldUseRegularWeight) {
          return match;
        }

        count += 1;
        return `<a:rPr${beforeSize}${afterBold}>`;
      }
    )
  );

  return { xml: patchedXml, count };
}

function patchCjkLargeHeadingFontSize(xml: string): { xml: string; count: number } {
  let count = 0;
  const patchedXml = xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shape) =>
    shape
      .replace(
        /(<a:rPr\b[^>]*\blang="zh-CN"[^>]*\bsz=")3100("[^>]*>)/g,
        (_match: string, prefix: string, suffix: string) => {
          count += 1;
          return `${prefix}3162${suffix}`;
        }
      )
      .replace(
        /(<a:endParaRPr\b[^>]*\bsz=")3100("[^>]*>)/g,
        "$13162$2"
      )
  );

  return { xml: patchedXml, count };
}

function patchLongCjkHeroTitleFont(xml: string): { xml: string; count: number } {
  let count = 0;
  const patchedXml = xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shape) => {
    const text = Array.from(shape.matchAll(/<a:t>(.*?)<\/a:t>/g))
      .map((match) => match[1])
      .join("");
    if (
      text.length < 12 ||
      !/[\u3400-\u9fff]/.test(text) ||
      !/\bsz="3600"/.test(shape)
    ) {
      return shape;
    }

    let changed = false;
    let patched = shape.replace(/\bsz="3600"/g, () => {
      changed = true;
      return `sz="${DOM_TO_PPTX_HERO_TITLE_FONT_SIZE}"`;
    });
    patched = patched.replace(/<a:rPr\b([^>]*)>/g, (match, attrs: string) => {
      if (
        !match.includes(`sz="${DOM_TO_PPTX_HERO_TITLE_FONT_SIZE}"`) ||
        /\sb=/.test(match)
      ) {
        return match;
      }

      changed = true;
      return `<a:rPr${attrs} b="1">`;
    });

    if (changed) {
      count += 1;
    }
    return patched;
  });

  return { xml: patchedXml, count };
}

function patchLongCjkHeroTitleVerticalOffset(xml: string): { xml: string; count: number } {
  let count = 0;
  const patchedXml = xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shape) => {
    const text = Array.from(shape.matchAll(/<a:t>(.*?)<\/a:t>/g))
      .map((match) => match[1])
      .join("");
    const offset = getShapeOffset(shape);

    if (
      text.length < 12 ||
      !/[\u3400-\u9fff]/.test(text) ||
      !shape.includes(`sz="${DOM_TO_PPTX_HERO_TITLE_FONT_SIZE}"`) ||
      !offset ||
      offset.y > 900_000
    ) {
      return shape;
    }

    return shape.replace(
      /<a:off x="(\d+)" y="(\d+)"\/>/,
      (_match: string, x: string, y: string) => {
        count += 1;
        return `<a:off x="${x}" y="${Math.max(
          0,
          Number(y) - DOM_TO_PPTX_HERO_TITLE_Y_OFFSET_EMU
        )}"/>`;
      }
    );
  });

  return { xml: patchedXml, count };
}

function patchCjkLargeHeadingWeight(xml: string): { xml: string; count: number } {
  let count = 0;
  const patchedXml = xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shape) => {
    const text = Array.from(shape.matchAll(/<a:t>(.*?)<\/a:t>/g))
      .map((match) => match[1])
      .join("");
    if (
      text.length < 4 ||
      !/[\u3400-\u9fff]/.test(text) ||
      !shape.includes(`sz="${DOM_TO_PPTX_LARGE_HEADING_FONT_SIZE}"`)
    ) {
      return shape;
    }

    let changed = false;
    const patched = shape.replace(/<a:rPr\b([^>]*)>/g, (match, attrs: string) => {
      if (
        !match.includes(`sz="${DOM_TO_PPTX_LARGE_HEADING_FONT_SIZE}"`) ||
        /\sb=/.test(match)
      ) {
        return match;
      }

      changed = true;
      return `<a:rPr${attrs} b="1">`;
    });

    if (changed) {
      count += 1;
    }
    return patched;
  });

  return { xml: patchedXml, count };
}

function patchWideTextVerticalOffset(xml: string): { xml: string; count: number } {
  let count = 0;
  const patchedXml = xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shape) => {
    const text = Array.from(shape.matchAll(/<a:t>(.*?)<\/a:t>/g))
      .map((match) => match[1])
      .join("");
    if (!text) {
      return shape;
    }

    const maxFontSize = Math.max(
      0,
      ...Array.from(shape.matchAll(/\bsz="(\d+)"/g)).map((match) =>
        Number(match[1])
      )
    );
    const extent = getShapeExtent(shape);
    const shouldShiftText =
      maxFontSize >= 2200 ||
      Boolean(extent && extent.cx >= DOM_TO_PPTX_WIDE_TEXT_MIN_WIDTH_EMU);

    if (!shouldShiftText) {
      return shape;
    }

    return shape.replace(
      /<a:off x="(\d+)" y="(\d+)"\/>/,
      (_match: string, x: string, y: string) => {
        count += 1;
        return `<a:off x="${x}" y="${Math.max(
          0,
          Number(y) - DOM_TO_PPTX_TEXT_Y_OFFSET_EMU
        )}"/>`;
      }
    );
  });

  return { xml: patchedXml, count };
}

function patchFooterVerticalOffset(xml: string): { xml: string; count: number } {
  let count = 0;
  const patchedXml = xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shape) => {
    const offset = getShapeOffset(shape);
    if (!offset || offset.y < DOM_TO_PPTX_FOOTER_MIN_Y_EMU) {
      return shape;
    }

    return shape.replace(
      /<a:off x="(\d+)" y="(\d+)"\/>/,
      (_match: string, x: string, y: string) => {
        count += 1;
        return `<a:off x="${x}" y="${Number(y) + DOM_TO_PPTX_FOOTER_Y_OFFSET_EMU}"/>`;
      }
    );
  });

  return { xml: patchedXml, count };
}

function isFullSlideRasterOnlySlide(xml: string): boolean {
  if (/<a:t>/.test(xml) || /<a:tbl>/.test(xml) || /<p:sp>/.test(xml)) {
    return false;
  }

  return /<p:pic>[\s\S]*?<a:ext cx="(\d+)" cy="(\d+)"\/>[\s\S]*?<\/p:pic>/g.test(
    xml.replace(
      /<a:ext cx="(\d+)" cy="(\d+)"\/>/g,
      (match: string, cx: string, cy: string) => {
        const width = Number(cx);
        const height = Number(cy);
        const isFullSlide =
          width >= DOM_TO_PPTX_SLIDE_WIDTH_EMU * 0.95 &&
          height >= DOM_TO_PPTX_SLIDE_HEIGHT_EMU * 0.95;
        return isFullSlide ? match : "";
      }
    )
  );
}

async function patchDomToPptxOutput(filePath: string): Promise<{
  fontReplacements: number;
  overflowReplacements: number;
  cjkSemiBoldWeightReplacements: number;
  cjkLargeHeadingSizeReplacements: number;
  cjkLargeHeadingWeightReplacements: number;
  longCjkHeroTitleFontReplacements: number;
  longCjkHeroTitleVerticalOffsetReplacements: number;
  tableBorderReplacements: number;
  tableFontSizeReplacements: number;
  tableWrapperRingReplacements: number;
  tableRowHeightReplacements: number;
  headingWidthReplacements: number;
  wideTextVerticalOffsetReplacements: number;
  footerVerticalOffsetReplacements: number;
  fullSlideRasterOnlySlides: number;
}> {
  const source = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(source);
  const xmlFiles = Object.values(zip.files).filter(
    (file) =>
      !file.dir &&
      /^ppt\/(?:slides|slideLayouts|slideMasters|theme)\/.+\.xml$/.test(
        file.name
      )
  );
  const slideXmlFileCount = Object.values(zip.files).filter(
    (file) => !file.dir && /^ppt\/slides\/slide\d+\.xml$/.test(file.name)
  ).length;
  let fontReplacements = 0;
  let overflowReplacements = 0;
  let cjkSemiBoldWeightReplacements = 0;
  let cjkLargeHeadingSizeReplacements = 0;
  let cjkLargeHeadingWeightReplacements = 0;
  let longCjkHeroTitleFontReplacements = 0;
  let longCjkHeroTitleVerticalOffsetReplacements = 0;
  let tableBorderReplacements = 0;
  let tableFontSizeReplacements = 0;
  let tableWrapperRingReplacements = 0;
  let tableRowHeightReplacements = 0;
  let headingWidthReplacements = 0;
  let wideTextVerticalOffsetReplacements = 0;
  let footerVerticalOffsetReplacements = 0;
  let fullSlideRasterOnlySlides = 0;

  await Promise.all(
    xmlFiles.map(async (file) => {
      const xml = await file.async("string");
      if (
        /^ppt\/slides\/slide\d+\.xml$/.test(file.name) &&
        isFullSlideRasterOnlySlide(xml)
      ) {
        fullSlideRasterOnlySlides += 1;
      }

      const fontPatched = xml
        .replace(
          /<a:ea\b([^>]*?)\btypeface="[^"]*"/g,
          (_match: string, attrs: string) => {
            fontReplacements += 1;
            return `<a:ea${attrs}typeface="${DOM_TO_PPTX_CJK_FONT_FACE}"`;
          }
        )
        .replace(
          /<a:font\b([^>]*?\bscript="Hans"[^>]*?)\btypeface="[^"]*"/g,
          (_match: string, attrs: string) => {
            fontReplacements += 1;
            return `<a:font${attrs}typeface="${DOM_TO_PPTX_CJK_FONT_FACE}"`;
          }
      );
      const overflowPatched = patchShapeTextOverflow(fontPatched);
      overflowReplacements += overflowPatched.count;
      const cjkSemiBoldWeightPatched = patchCjkSemiBoldWeight(overflowPatched.xml);
      cjkSemiBoldWeightReplacements += cjkSemiBoldWeightPatched.count;
      const cjkLargeHeadingSizePatched = patchCjkLargeHeadingFontSize(
        cjkSemiBoldWeightPatched.xml
      );
      cjkLargeHeadingSizeReplacements += cjkLargeHeadingSizePatched.count;
      const cjkLargeHeadingWeightPatched = patchCjkLargeHeadingWeight(
        cjkLargeHeadingSizePatched.xml
      );
      cjkLargeHeadingWeightReplacements += cjkLargeHeadingWeightPatched.count;
      const longCjkHeroTitleFontPatched = patchLongCjkHeroTitleFont(
        cjkLargeHeadingWeightPatched.xml
      );
      longCjkHeroTitleFontReplacements += longCjkHeroTitleFontPatched.count;
      const headingWidthPatched = patchLongCjkHeadingWidth(
        longCjkHeroTitleFontPatched.xml
      );
      headingWidthReplacements += headingWidthPatched.count;
      const wideTextVerticalOffsetPatched = patchWideTextVerticalOffset(
        headingWidthPatched.xml
      );
      wideTextVerticalOffsetReplacements += wideTextVerticalOffsetPatched.count;
      const longCjkHeroTitleVerticalOffsetPatched =
        patchLongCjkHeroTitleVerticalOffset(wideTextVerticalOffsetPatched.xml);
      longCjkHeroTitleVerticalOffsetReplacements +=
        longCjkHeroTitleVerticalOffsetPatched.count;
      const footerVerticalOffsetPatched = patchFooterVerticalOffset(
        longCjkHeroTitleVerticalOffsetPatched.xml
      );
      footerVerticalOffsetReplacements += footerVerticalOffsetPatched.count;
      const tablePatched = patchNativeTableBorders(
        footerVerticalOffsetPatched.xml
      );
      tableBorderReplacements += tablePatched.count;
      const tableFontSizePatched = patchNativeTableFontSize(tablePatched.xml);
      tableFontSizeReplacements += tableFontSizePatched.count;
      const tableWrapperRingPatched = patchTableWrapperRings(
        tableFontSizePatched.xml
      );
      tableWrapperRingReplacements += tableWrapperRingPatched.count;
      const tableRowHeightPatched = patchNativeTableRowHeights(
        tableWrapperRingPatched.xml
      );
      tableRowHeightReplacements += tableRowHeightPatched.count;
      const patched = tableRowHeightPatched.xml;

      if (patched !== xml) {
        zip.file(file.name, patched);
      }
    })
  );

  if (
    fontReplacements === 0 &&
    overflowReplacements === 0 &&
    cjkSemiBoldWeightReplacements === 0 &&
    cjkLargeHeadingSizeReplacements === 0 &&
    cjkLargeHeadingWeightReplacements === 0 &&
    longCjkHeroTitleFontReplacements === 0 &&
    longCjkHeroTitleVerticalOffsetReplacements === 0 &&
    tableBorderReplacements === 0 &&
    tableFontSizeReplacements === 0 &&
    tableWrapperRingReplacements === 0 &&
    tableRowHeightReplacements === 0 &&
    headingWidthReplacements === 0 &&
    wideTextVerticalOffsetReplacements === 0 &&
    footerVerticalOffsetReplacements === 0
  ) {
    if (
      slideXmlFileCount > 0 &&
      fullSlideRasterOnlySlides === slideXmlFileCount
    ) {
      throw new Error(
        "dom-to-pptx export produced image-mode slides instead of editable DOM slides."
      );
    }

    return {
      fontReplacements,
      overflowReplacements,
      cjkSemiBoldWeightReplacements,
      cjkLargeHeadingSizeReplacements,
      cjkLargeHeadingWeightReplacements,
      longCjkHeroTitleFontReplacements,
      longCjkHeroTitleVerticalOffsetReplacements,
      tableBorderReplacements,
      tableFontSizeReplacements,
      tableWrapperRingReplacements,
      tableRowHeightReplacements,
      headingWidthReplacements,
      wideTextVerticalOffsetReplacements,
      footerVerticalOffsetReplacements,
      fullSlideRasterOnlySlides,
    };
  }

  if (
    slideXmlFileCount > 0 &&
    fullSlideRasterOnlySlides === slideXmlFileCount
  ) {
    throw new Error(
      "dom-to-pptx export produced image-mode slides instead of editable DOM slides."
    );
  }

  const output = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  await fs.writeFile(filePath, output);
  return {
    fontReplacements,
    overflowReplacements,
    cjkSemiBoldWeightReplacements,
    cjkLargeHeadingSizeReplacements,
    cjkLargeHeadingWeightReplacements,
    longCjkHeroTitleFontReplacements,
    longCjkHeroTitleVerticalOffsetReplacements,
    tableBorderReplacements,
    tableFontSizeReplacements,
    tableWrapperRingReplacements,
    tableRowHeightReplacements,
    headingWidthReplacements,
    wideTextVerticalOffsetReplacements,
    footerVerticalOffsetReplacements,
    fullSlideRasterOnlySlides,
  };
}

export async function runDomToPptxExport(params: {
  presentationId: string;
  title: string | undefined;
  cookieHeader?: string;
}): Promise<{ path: string }> {
  const { presentationId, title, cookieHeader } = params;
  const exporterScriptPath = await resolveDomToPptxExporterScript();
  const landPptBundlePath = await resolveLandPptDomToPptxBundle();
  const nextjsUrl = process.env.NEXT_PUBLIC_URL?.trim() || "http://127.0.0.1:3000";
  const q = new URLSearchParams({
    id: presentationId,
    domToPptxCompat: "1",
  });

  const sessionToken = extractSessionTokenFromCookieHeader(cookieHeader);
  if (sessionToken) {
    q.set("exportSession", sessionToken);
  }

  const fastapiUrl = getExportFastApiUrl();
  if (fastapiUrl) {
    q.set("fastapiUrl", fastapiUrl);
  }

  const basePptUrl = `${nextjsUrl.replace(/\/+$/, "")}/pdf-maker?${q.toString()}`;
  const pptUrl = cookieHeader?.trim()
    ? `${basePptUrl}#exportCookie=${encodeURIComponent(cookieHeader)}`
    : basePptUrl;

  const tempBase =
    process.env.TEMP_DIRECTORY?.trim() || path.join(os.tmpdir(), "presenton");
  const puppeteerTempDirectory =
    process.env.PUPPETEER_TMP_DIR?.trim() || path.join(tempBase, "puppeteer");
  const puppeteerCacheDirectory =
    process.env.PUPPETEER_CACHE_DIR?.trim() || path.join(tempBase, "puppeteer-cache");

  await fs.mkdir(getExportsDirectory(), { recursive: true });
  await fs.mkdir(puppeteerTempDirectory, { recursive: true });
  await fs.mkdir(puppeteerCacheDirectory, { recursive: true });

  const outPath = buildOutputPath(title);
  const exportTitle = sanitizeExportFilename(title ?? "presentation") || "presentation";

  console.info("[dom-to-pptx-export] start", {
    presentationId,
    memory: memorySnapshotMb(),
  });

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        exporterScriptPath,
        "--url",
        pptUrl,
        "--output",
        outPath,
        "--selector",
        DOM_TO_PPTX_SELECTOR,
        "--bundle",
        landPptBundlePath,
        "--title",
        exportTitle,
        "--width",
        DOM_TO_PPTX_SLIDE_WIDTH_IN,
        "--height",
        DOM_TO_PPTX_SLIDE_HEIGHT_IN,
        "--render-mode",
        DOM_TO_PPTX_RENDER_MODE,
      ],
      {
        cwd: path.dirname(path.dirname(exporterScriptPath)),
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          PUPPETEER_TMP_DIR: puppeteerTempDirectory,
          PUPPETEER_CACHE_DIR: puppeteerCacheDirectory,
        },
      }
    );

    const stderr = new BoundedTextBuffer();
    const stdout = new BoundedTextBuffer();
    const onStderrData = (d: Buffer) => stderr.append(d);
    const onStdoutData = (d: Buffer) => stdout.append(d);
    let settled = false;

    const cleanup = () => {
      child.stderr?.removeListener("data", onStderrData);
      child.stdout?.removeListener("data", onStdoutData);
      child.removeListener("error", onError);
      child.removeListener("close", onClose);
    };
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const onError = (error: Error) => finish(() => reject(error));
    const onClose = (code: number | null, signal: NodeJS.Signals | null) => {
      console.info("[dom-to-pptx-export] child exit", {
        presentationId,
        pid: child.pid,
        code,
        signal,
        memory: memorySnapshotMb(),
      });

      if (code === 0) {
        finish(resolve);
        return;
      }

      const errText = stderr.toString();
      const outText = stdout.toString();
      finish(() => {
        reject(
          new Error(
            `dom-to-pptx export process exited with code ${code ?? "unknown"}${signal ? ` signal ${signal}` : ""}${errText ? `. ${errText}` : ""}${outText ? ` stdout: ${outText}` : ""}`
          )
        );
      });
    };

    child.stderr?.on("data", onStderrData);
    child.stdout?.on("data", onStdoutData);
    child.once("error", onError);
    child.once("close", onClose);
  });

  const patchedOutput = await patchDomToPptxOutput(outPath);
  console.info("[dom-to-pptx-export] patched PPTX output", {
    presentationId,
    fontFace: DOM_TO_PPTX_CJK_FONT_FACE,
    ...patchedOutput,
  });

  await ensureExportFileReadable(outPath);
  console.info("[dom-to-pptx-export] finish", {
    presentationId,
    memory: memorySnapshotMb(),
  });

  return { path: outPath };
}
