const builder = require("electron-builder")
const { execFileSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const APP_ID = "com.presenton.presenton"
const TEAM_ID = "S6W5C54KL6"
const macTarget = process.env.PRESENTON_MAC_TARGET
const masDevProvisioningProfile = getMasDevProvisioningProfile()
const masDevIdentity =
  process.env.PRESENTON_MAS_DEV_IDENTITY || process.env.CSC_NAME || ""

function getMasDevProvisioningProfile() {
  try {
    return resolveMasDevProvisioningProfile()
  } catch (error) {
    console.error(`\n${error.message}\n`)
    process.exit(1)
  }
}

function resolveMasDevProvisioningProfile() {
  if (macTarget !== "mas-dev") {
    return undefined
  }

  const candidates = [
    "build/AppleDevelopment.provisionprofile",
    "build/AppleDev.provisionprofile",
    "build/AppDev.provisionprofile",
  ]
  const undecodableProfiles = []

  for (const candidate of candidates) {
    const candidatePath = path.join(__dirname, candidate)
    if (!fs.existsSync(candidatePath)) {
      continue
    }

    try {
      execFileSync("security", ["cms", "-D", "-i", candidatePath], {
        stdio: "ignore",
      })
      return candidate
    } catch {
      undecodableProfiles.push(candidate)
    }
  }

  if (undecodableProfiles.length > 0) {
    throw new Error(
      `Found MAS development provisioning profile, but macOS could not decode it: ${undecodableProfiles.join(", ")}. Re-download a macOS App Development provisioning profile and replace the local file.`
    )
  }

  throw new Error(
    `Missing MAS development provisioning profile. Expected one of: ${candidates.join(", ")}`
  )
}

// AfterPack hook: set executable permissions on macOS; no-op on Windows
const afterPack = async (context) => {
  if (context.electronPlatformName === "darwin") {
    const appPath = context.appOutDir
    const appBundleName = `${context.packager.appInfo.productFilename}.app`
    const resourcesRoot = path.join(
      appPath,
      appBundleName,
      "Contents",
      "Resources",
      "app",
      "resources"
    )
    const fastapiPath = path.join(resourcesRoot, "fastapi", "fastapi")
    const exportPyDir = path.join(resourcesRoot, "export", "py")
    const converterCandidates = [
      `convert-${process.platform}-${process.arch}`,
      `convert-${process.platform}`,
      "convert",
    ]

    console.log("Setting executable permissions for FastAPI binary...")
    console.log("FastAPI path:", fastapiPath)

    if (fs.existsSync(fastapiPath)) {
      fs.chmodSync(fastapiPath, 0o755)
      console.log("✓ Execute permissions set for FastAPI")
    } else {
      console.warn("⚠ FastAPI binary not found at:", fastapiPath)
    }

    console.log("Setting executable permissions for export converter binary...")
    let converterFound = false
    for (const candidate of converterCandidates) {
      const candidatePath = path.join(exportPyDir, candidate)
      if (fs.existsSync(candidatePath)) {
        fs.chmodSync(candidatePath, 0o755)
        console.log("✓ Execute permissions set for converter:", candidatePath)
        converterFound = true
      }
    }
    if (!converterFound) {
      console.warn("⚠ No converter binary found in:", exportPyDir)
    }

    const fastapiDir = path.join(resourcesRoot, "fastapi")
    if (fs.existsSync(fastapiDir)) {
      console.log("FastAPI directory contents:", fs.readdirSync(fastapiDir))
    }

    if (fs.existsSync(exportPyDir)) {
      console.log("Export py directory contents:", fs.readdirSync(exportPyDir))
    }
  }
}

const config = {
  appId: APP_ID,
  productName: "Presenton",
  asar: false,
  copyright: "Copyright © 2026 Presenton",
  directories: {
    output: "dist",
    buildResources: "build",
  },
  files: [
    "resources",
    "app_dist",
    "node_modules",
    "NOTICE"
  ],
  afterPack,
  mac: {
    artifactName: "Presenton-${version}.${ext}",
    target: [macTarget || "dmg"],
    category: "public.app-category.productivity",
    hardenedRuntime: false,
    gatekeeperAssess: false,
    identity: macTarget === "mas-dev" ? null : undefined,
    icon: "resources/ui/assets/images/presenton_short_filled.png",
    extendInfo: {
      ElectronTeamID: TEAM_ID,
    },
  },
  masDev: {
    type: "development",
    identity: masDevIdentity,
    provisioningProfile: masDevProvisioningProfile,
    entitlements: "build/entitlements.mas.plist",
    entitlementsInherit: "build/entitlements.mas.inherit.plist",
    // osx-sign always adds --timestamp; this later flag keeps local MAS dev signing offline-tolerant.
    additionalArguments: ["--timestamp=none"],
  },
  linux: {
    artifactName: "Presenton-${version}.${ext}",
    target: ["AppImage", "deb"],
    icon: "build/icons",
  },
  deb: {
    afterInstall: "build/after-install.tpl",
    recommends: ["libreoffice"],
  },
  win: {
    target: ["nsis", "appx"],
    icon: "build/icon.ico",
    artifactName: "Presenton-${version}.${ext}",
    executableName: "Presenton",
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    installerIcon: "build/icon.ico",
    uninstallerIcon: "build/icon.ico",
    installerHeaderIcon: "build/icon.ico",
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "Presenton",
    uninstallDisplayName: "Presenton",
  },
  appx: {
    identityName: "PresentonAI.Presenton",
    publisher: "CN=8A2C57B5-F1C6-473A-93EE-2E9B72134341",
    displayName: "Presenton",
    publisherDisplayName: "Presenton Inc.",
    applicationId: "PresentonAI.Presenton",
    
  },
}

const targets = macTarget ? builder.Platform.MAC.createTarget([macTarget]) : undefined

builder.build({ targets, config })
