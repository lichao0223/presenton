const crypto = require("node:crypto");
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

const puppeteer = loadPuppeteer();

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForStaticContent(page) {
  await page.evaluate(async () => {
    const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const imagePromises = Array.from(document.images).map((image) => {
      if (typeof image.decode === "function") {
        return image.decode().catch(() => undefined);
      }
      if (image.complete) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    });

    await Promise.race([Promise.all(imagePromises), timeout(3000)]);
    if (document.fonts) {
      await Promise.race([document.fonts.ready, timeout(3000)]);
    }
  });
  await sleep(100);
}

async function main() {
  const [, , taskPath, responsePath] = process.argv;
  if (!taskPath || !responsePath) {
    throw new Error("Usage: node html_preview_renderer.cjs <task.json> <response.json>");
  }

  const task = JSON.parse(await fs.readFile(taskPath, "utf8"));
  const htmls = Array.isArray(task.htmls) ? task.htmls : [];
  if (!htmls.length) {
    throw new Error("No HTML documents provided");
  }

  const width = positiveInteger(task.width, 1280);
  const height = positiveInteger(task.height, 720);
  const outputDir = task.output_dir;
  if (!outputDir) {
    throw new Error("output_dir is required");
  }
  await fs.mkdir(outputDir, { recursive: true });

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
    ],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.emulateMediaType("screen");

    const filePaths = [];
    for (let index = 0; index < htmls.length; index += 1) {
      const outputPath = path.join(
        outputDir,
        `preview-${String(index + 1).padStart(3, "0")}-${crypto.randomUUID()}.png`
      );
      console.log(`[html-preview-renderer] rendering ${index + 1}/${htmls.length}`);
      await page.setContent(htmls[index], {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await waitForStaticContent(page);
      await page.screenshot({
        path: outputPath,
        type: "png",
        clip: { x: 0, y: 0, width, height },
        captureBeyondViewport: false,
      });
      await fs.access(outputPath);
      filePaths.push(outputPath);
      console.log(`[html-preview-renderer] rendered ${index + 1}/${htmls.length}`);
    }

    await fs.writeFile(responsePath, JSON.stringify({ file_paths: filePaths }));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
