#!/usr/bin/env node

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import puppeteer from "puppeteer";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--svg-as-vector") {
      args.svgAsVector = true;
      continue;
    }

    if (arg.startsWith("--") && next && !next.startsWith("--")) {
      args[arg.slice(2)] = next;
      i += 1;
    }
  }
  return args;
}

async function resolveDomToPptxBundle(bundlePath) {
  if (bundlePath) {
    const resolvedBundlePath = path.resolve(bundlePath);
    if (!fsSync.existsSync(resolvedBundlePath)) {
      throw new Error(`dom-to-pptx bundle was not found: ${resolvedBundlePath}`);
    }
    return resolvedBundlePath;
  }

  const require = createRequire(import.meta.url);
  return path.join(path.dirname(require.resolve("dom-to-pptx")), "dom-to-pptx.bundle.js");
}

async function resolveBrowserExecutable() {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (envPath && fsSync.existsSync(envPath)) {
    return envPath;
  }

  try {
    const bundledPath = await puppeteer.executablePath();
    if (bundledPath && fsSync.existsSync(bundledPath)) {
      return bundledPath;
    }
  } catch {
    // Fall through to system browser paths.
  }

  const candidates = process.platform === "darwin"
    ? [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
      ]
    : process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        ]
      : [
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
        ];

  const executablePath = candidates.find((candidate) => fsSync.existsSync(candidate));
  if (!executablePath) {
    throw new Error(
      "No compatible browser found for dom-to-pptx export. Set PUPPETEER_EXECUTABLE_PATH or install Chrome/Chromium."
    );
  }
  return executablePath;
}

async function exportPageToPptx(args) {
  const width = Number(args.width);
  const height = Number(args.height);
  const executablePath = await resolveBrowserExecutable();
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
    });
    await page.goto(args.url, { waitUntil: "domcontentloaded", timeout: 60000 });

    await page.waitForFunction(
      () => window.__DOM_TO_PPTX_READY__ === true,
      { timeout: 60000 }
    );

    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const images = Array.from(document.images || []);
      await Promise.race([
        Promise.all(
          images.map((image) => {
            if (image.complete) {
              return Promise.resolve();
            }
            return new Promise((resolve) => {
              image.addEventListener("load", resolve, { once: true });
              image.addEventListener("error", resolve, { once: true });
            });
          })
        ),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);

      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    });

    await page.addScriptTag({ path: await resolveDomToPptxBundle(args.bundle) });

    const dataUrl = await page.evaluate(
      async ({ selector, pptxOptions }) => {
        if (!window.domToPptx?.exportToPptx) {
          throw new Error("dom-to-pptx library not found on the page context.");
        }

        const targets = Array.from(document.querySelectorAll(selector));
        if (targets.length === 0) {
          throw new Error(`No elements matching slide selector "${selector}" found.`);
        }

        const blob = await window.domToPptx.exportToPptx(targets, {
          ...pptxOptions,
          skipDownload: true,
        });

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      },
      {
        selector: args.selector || ".slide",
        pptxOptions: {
          ...(args.title ? { title: args.title } : {}),
          ...(Number.isFinite(width) && Number.isFinite(height)
            ? { width, height }
            : {}),
          svgAsVector: Boolean(args.svgAsVector),
          ...(args["render-mode"] ? { renderMode: args["render-mode"] } : {}),
          ...(Number.isFinite(Number(args["image-scale"]))
            ? { imageScale: Number(args["image-scale"]) }
            : {}),
          ...(Number.isFinite(Number(args["max-raster-pixels"]))
            ? { maxRasterPixels: Number(args["max-raster-pixels"]) }
            : {}),
        },
      }
    );

    return Buffer.from(dataUrl.split(",")[1], "base64");
  } finally {
    await browser.close();
  }
}

const args = parseArgs(process.argv.slice(2));

if (!args.url || !args.output) {
  throw new Error("Usage: dom-to-pptx-exporter.mjs --url <url> --output <path>");
}

await fs.writeFile(args.output, await exportPageToPptx(args));
