/**
 * LibreOffice download URLs for automated installation.
 *
 * Primary: TDF stable CDN (download.documentfoundation.org). Versions are
 * rotated off `/stable/` over time.
 *
 * Fallback: permanent archive at downloadarchive.documentfoundation.org —
 * `/libreoffice/old/` uses full build ids (e.g. 26.2.3.2), not the short stable
 * folder name (26.2.3). Keep LIBREOFFICE_ARCHIVE_BUILD in sync with the last
 * patch build for the chosen stable line when bumping versions.
 *
 * @see https://www.libreoffice.org/download/download-libreoffice/
 * @see https://downloadarchive.documentfoundation.org/libreoffice/old/
 */

/** Short version segment under …/stable/{version}/ (marketing release). */
export const LIBREOFFICE_STABLE_VERSION = "26.2.3";

/**
 * Full build directory under …/old/{build}/ — must match an existing folder on
 * the archive server; installer filenames use this string too.
 */
export const LIBREOFFICE_ARCHIVE_BUILD = "26.2.3.2";

/** Alias for stable version (logs, UI copy). */
export const LIBREOFFICE_VERSION = LIBREOFFICE_STABLE_VERSION;

const STABLE_CDN_BASE = "https://download.documentfoundation.org/libreoffice/stable";
const ARCHIVE_BASE = "https://downloadarchive.documentfoundation.org/libreoffice/old";

export type LibreOfficeDownloadPlatform = "win64" | "macX64" | "macArm64";

export interface LibreOfficeDownloadSpec {
  url: string;
  filename: string;
}

function winSpec(root: string, version: string): LibreOfficeDownloadSpec {
  const fn = `LibreOffice_${version}_Win_x86-64.msi`;
  return {
    url: `${root}/win/x86_64/${fn}`,
    filename: fn,
  };
}

function macX64Spec(root: string, version: string): LibreOfficeDownloadSpec {
  const fn = `LibreOffice_${version}_MacOS_x86-64.dmg`;
  return {
    url: `${root}/mac/x86_64/${fn}`,
    filename: fn,
  };
}

function macArm64Spec(root: string, version: string): LibreOfficeDownloadSpec {
  const fn = `LibreOffice_${version}_MacOS_aarch64.dmg`;
  return {
    url: `${root}/mac/aarch64/${fn}`,
    filename: fn,
  };
}

/**
 * Ordered download attempts: stable CDN first, then Document Foundation archive.
 */
export function libreOfficeDownloadChain(
  platform: LibreOfficeDownloadPlatform
): readonly [LibreOfficeDownloadSpec, LibreOfficeDownloadSpec] {
  const stableRoot = `${STABLE_CDN_BASE}/${LIBREOFFICE_STABLE_VERSION}`;
  const archiveRoot = `${ARCHIVE_BASE}/${LIBREOFFICE_ARCHIVE_BUILD}`;
  const vS = LIBREOFFICE_STABLE_VERSION;
  const vA = LIBREOFFICE_ARCHIVE_BUILD;

  switch (platform) {
    case "win64":
      return [winSpec(stableRoot, vS), winSpec(archiveRoot, vA)];
    case "macX64":
      return [macX64Spec(stableRoot, vS), macX64Spec(archiveRoot, vA)];
    case "macArm64":
      return [macArm64Spec(stableRoot, vS), macArm64Spec(archiveRoot, vA)];
    default: {
      const _exhaustive: never = platform;
      return _exhaustive;
    }
  }
}

/** Primary (stable) URLs only — useful for diagnostics. */
export const LIBREOFFICE_DOWNLOAD_URLS = {
  win64: libreOfficeDownloadChain("win64")[0].url,
  macX64: libreOfficeDownloadChain("macX64")[0].url,
  macArm64: libreOfficeDownloadChain("macArm64")[0].url,
} as const;
