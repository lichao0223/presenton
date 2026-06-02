const fs = require("fs");
const path = require("path");
const {
  Browser,
  computeExecutablePath,
  detectBrowserPlatform,
  install,
} = require("@puppeteer/browsers");

const buildId = (process.env.EXPORT_CHROME_BUILD_ID || "146.0.7680.76").trim();
const cacheDir = path.join(__dirname, "..", "resources", "chromium");

function getRevisionDir(platform) {
  return path.join(cacheDir, Browser.CHROME, `${platform}-${buildId}`);
}

function runtimeLooksComplete(executablePath) {
  if (!fs.existsSync(executablePath)) {
    return false;
  }
  if (process.platform !== "win32") {
    return true;
  }

  const chromeDir = path.dirname(executablePath);
  return ["chrome.dll", "icudtl.dat"].every((fileName) =>
    fs.existsSync(path.join(chromeDir, fileName))
  );
}

function removeIncompleteRuntime(platform, executablePath) {
  if (runtimeLooksComplete(executablePath)) {
    return;
  }

  const revisionDir = getRevisionDir(platform);
  if (!fs.existsSync(revisionDir)) {
    return;
  }

  console.log(
    `[Chromium] Removing incomplete runtime before download: ${revisionDir}`
  );
  fs.rmSync(revisionDir, { recursive: true, force: true });
}

async function main() {
  if (process.env.SKIP_BUNDLED_CHROMIUM === "1") {
    console.log("[Chromium] SKIP_BUNDLED_CHROMIUM=1; leaving runtime unbundled.");
    return;
  }

  const platform = detectBrowserPlatform();
  if (!platform) {
    throw new Error(`Unsupported platform for bundled Chromium: ${process.platform}-${process.arch}`);
  }

  const options = {
    browser: Browser.CHROME,
    buildId,
    cacheDir,
    platform,
  };
  const executablePath = computeExecutablePath(options);
  if (runtimeLooksComplete(executablePath)) {
    console.log(`[Chromium] Bundled runtime already exists: ${executablePath}`);
    return;
  }

  removeIncompleteRuntime(platform, executablePath);
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log(`[Chromium] Downloading Chrome for Testing ${buildId} into ${cacheDir}`);
  await install({
    ...options,
    downloadProgressCallback(downloadedBytes, totalBytes) {
      if (totalBytes <= 0) return;
      const percent = Math.floor((downloadedBytes / totalBytes) * 100);
      process.stdout.write(`\r[Chromium] ${percent}%`);
    },
  });
  process.stdout.write("\n");

  if (!runtimeLooksComplete(executablePath)) {
    throw new Error(`Chromium install finished, but executable was not found at ${executablePath}`);
  }
  console.log(`[Chromium] Bundled runtime ready: ${executablePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
