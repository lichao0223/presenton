#!/usr/bin/env node
const fs = require("fs");
const https = require("https");
const path = require("path");
const { spawnSync } = require("child_process");
const { path7za } = require("7zip-bin");

const VERSION = process.env.IMAGEMAGICK_VERSION || "7.1.2-24";
const PLATFORM = process.platform;
const ARCH = process.arch;

function log(message) {
  console.log(`[imagemagick] ${message}`);
}

function fail(message) {
  console.error(`[imagemagick] ${message}`);
  process.exit(1);
}

function runtimeTargetDir() {
  return path.join(__dirname, "..", "resources", "imagemagick", `${PLATFORM}-${ARCH}`);
}

function archiveName() {
  if (PLATFORM === "win32" && ARCH === "x64") {
    return `ImageMagick-${VERSION}-portable-Q16-x64.7z`;
  }
  fail(`No bundled ImageMagick asset configured for ${PLATFORM}-${ARCH}`);
}

function downloadUrl() {
  if (process.env.IMAGEMAGICK_DOWNLOAD_URL) {
    return process.env.IMAGEMAGICK_DOWNLOAD_URL;
  }
  const name = archiveName();
  return `https://github.com/ImageMagick/ImageMagick/releases/download/${VERSION}/${name}`;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    windowsHide: true,
    ...options,
  });
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} failed with code ${result.status}`);
  }
}

function versionOutput(binaryPath) {
  const result = spawnSync(binaryPath, ["-version"], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    return null;
  }
  return `${result.stdout || ""}\n${result.stderr || ""}`.trim();
}

function validateRuntime(targetDir) {
  const binaryPath = path.join(targetDir, PLATFORM === "win32" ? "magick.exe" : "magick");
  if (!fs.existsSync(binaryPath)) {
    return null;
  }
  const output = versionOutput(binaryPath);
  if (!output || !output.toLowerCase().includes("imagemagick")) {
    return null;
  }
  return { binaryPath, output };
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "Presenton ImageMagick runtime fetcher",
        },
      },
      (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode || 0)) {
          const location = response.headers.location;
          if (!location) {
            reject(new Error(`Redirect from ${url} did not include Location`));
            return;
          }
          response.resume();
          downloadFile(new URL(location, url).toString(), destination).then(resolve, reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with HTTP ${response.statusCode}: ${url}`));
          response.resume();
          return;
        }

        fs.mkdirSync(path.dirname(destination), { recursive: true });
        const file = fs.createWriteStream(destination);
        response.pipe(file);
        file.on("finish", () => file.close(resolve));
        file.on("error", reject);
      },
    );
    request.on("error", reject);
  });
}

function findMagickDir(root) {
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    if (entries.some((entry) => entry.isFile() && entry.name.toLowerCase() === "magick.exe")) {
      return current;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        stack.push(path.join(current, entry.name));
      }
    }
  }
  return null;
}

async function main() {
  if (PLATFORM !== "win32" || ARCH !== "x64") {
    log(`Skipping bundled ImageMagick for ${PLATFORM}-${ARCH}; system runtime will be used.`);
    return;
  }

  if (!path7za || !fs.existsSync(path7za)) {
    fail("7zip-bin is unavailable; run npm install before preparing ImageMagick.");
  }

  const targetDir = runtimeTargetDir();
  const existing = validateRuntime(targetDir);
  if (existing) {
    log(`Existing runtime OK: ${existing.binaryPath}`);
    return;
  }

  const cacheDir = path.join(__dirname, "..", ".cache", "imagemagick", VERSION);
  const archivePath = path.join(cacheDir, archiveName());
  const extractDir = path.join(cacheDir, "extract");
  const tempTarget = `${targetDir}.tmp`;

  if (!fs.existsSync(archivePath)) {
    const url = downloadUrl();
    log(`Downloading ${url}`);
    await downloadFile(url, archivePath);
  } else {
    log(`Using cached archive: ${archivePath}`);
  }

  fs.rmSync(extractDir, { recursive: true, force: true });
  fs.mkdirSync(extractDir, { recursive: true });
  log(`Extracting ${archivePath}`);
  run(path7za, ["x", archivePath, `-o${extractDir}`, "-y"]);

  const magickDir = findMagickDir(extractDir);
  if (!magickDir) {
    fail("Extracted archive did not contain magick.exe");
  }

  fs.rmSync(tempTarget, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(tempTarget), { recursive: true });
  fs.cpSync(magickDir, tempTarget, { recursive: true });

  const prepared = validateRuntime(tempTarget);
  if (!prepared) {
    fail(`Prepared runtime failed validation at ${tempTarget}`);
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.renameSync(tempTarget, targetDir);
  fs.writeFileSync(
    path.join(targetDir, "presenton-runtime.json"),
    JSON.stringify(
      {
        version: VERSION,
        platform: PLATFORM,
        arch: ARCH,
        binary: "magick.exe",
        source: downloadUrl(),
      },
      null,
      2,
    ),
  );
  log(`Prepared ${path.join(targetDir, "magick.exe")}`);
}

main().catch((error) => fail(error?.stack || error?.message || String(error)));
