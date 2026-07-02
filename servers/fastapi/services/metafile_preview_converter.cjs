const fs = require("node:fs/promises");
const path = require("node:path");

function loadPuppeteer() {
  try {
    return require("puppeteer");
  } catch (error) {
    const repoRoot = path.resolve(__dirname, "../../..");
    return require(path.join(repoRoot, "servers", "nextjs", "node_modules", "puppeteer"));
  }
}

function repoRoot() {
  return path.resolve(__dirname, "../../..");
}

function fileUrlForPath(filePath) {
  return `file://${filePath.split(path.sep).map((part, index) => (
    index === 0 ? part : encodeURIComponent(part)
  )).join("/")}`;
}

async function main() {
  const [, , taskPath, responsePath] = process.argv;
  if (!taskPath || !responsePath) {
    throw new Error("Usage: node metafile_preview_converter.cjs <task.json> <response.json>");
  }

  const task = JSON.parse(await fs.readFile(taskPath, "utf8"));
  const files = Array.isArray(task.files) ? task.files : [];
  const maxWidth = Number.isFinite(Number(task.max_width)) ? Number(task.max_width) : 1280;
  const maxHeight = Number.isFinite(Number(task.max_height)) ? Number(task.max_height) : 720;

  const modulePath = path.join(repoRoot(), "node_modules", "emf-converter", "dist", "index.mjs");
  await fs.access(modulePath);

  const tempDir = path.dirname(responsePath);
  const htmlPath = path.join(tempDir, "metafile-preview-converter.html");
  await fs.writeFile(
    htmlPath,
    `<!doctype html>
<html>
<body>
<script type="module">
import { convertEmfToDataUrl, convertWmfToDataUrl } from ${JSON.stringify(fileUrlForPath(modulePath))};

window.__convertMetafile = async function(base64, extension, maxWidth, maxHeight) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const options = {
    dpiScale: 2,
    maxWidth,
    maxHeight,
    maxCanvasDimension: 8192,
  };
  if (extension === ".wmf") {
    return await convertWmfToDataUrl(bytes.buffer, undefined, undefined, options);
  }
  return await convertEmfToDataUrl(bytes.buffer, undefined, undefined, options);
};
window.__metafileConverterReady = true;
</script>
</body>
</html>`,
    "utf8"
  );

  const puppeteer = loadPuppeteer();
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    pipe: true,
    timeout: 60000,
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-zygote",
      "--no-extensions",
      "--disable-background-networking",
      "--allow-file-access-from-files",
    ],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);
    await page.goto(fileUrlForPath(htmlPath), { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForFunction("window.__metafileConverterReady === true", { timeout: 30000 });

    const conversions = {};
    const errors = {};
    for (const filePath of files) {
      const extension = path.extname(filePath).toLowerCase();
      if (extension !== ".emf" && extension !== ".wmf") {
        continue;
      }
      try {
        const base64 = await fs.readFile(filePath, "base64");
        const dataUrl = await page.evaluate(
          async ({ base64, extension, maxWidth, maxHeight }) =>
            window.__convertMetafile(base64, extension, maxWidth, maxHeight),
          { base64, extension, maxWidth, maxHeight }
        );
        if (typeof dataUrl === "string" && dataUrl.startsWith("data:image/png;base64,")) {
          conversions[filePath] = dataUrl;
        } else {
          errors[filePath] = "converter returned no image";
        }
      } catch (error) {
        errors[filePath] = error && error.message ? error.message : String(error);
      }
    }

    await fs.writeFile(responsePath, JSON.stringify({ conversions, errors }), "utf8");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
