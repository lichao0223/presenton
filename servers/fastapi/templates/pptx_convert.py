import asyncio
import errno
import os
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from typing import List, Optional

from templates.pptx_font_utils import (
    create_font_alias_config,
    extract_fonts_from_oxml,
    install_fonts_for_libreoffice,
)

_LIBREOFFICE_LOCK_FILE_PATH = "/tmp/libreoffice_convert.lock"
_LIBREOFFICE_LOCK_WAIT_TIMEOUT_SECONDS = 500
_LIBREOFFICE_LOCK_RETRY_SECONDS = 0.1
_SOFFICE_NOT_FOUND_MESSAGE = (
    "LibreOffice executable not found. Install LibreOffice or set SOFFICE_PATH "
    "to the soffice binary."
)


def _existing_executable(path: str) -> Optional[str]:
    candidate = (path or "").strip()
    if not candidate:
        return None
    if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
        return candidate
    return shutil.which(candidate)


def _scan_libreoffice_app_bundles(app_dir: str) -> List[str]:
    try:
        entries = os.listdir(app_dir)
    except OSError:
        return []

    return [
        os.path.join(app_dir, entry, "Contents", "MacOS", "soffice")
        for entry in entries
        if entry.lower().startswith("libreoffice") and entry.lower().endswith(".app")
    ]


def _candidate_soffice_binaries() -> List[str]:
    if os.name == "nt":
        candidates: List[str] = ["soffice.exe"]
        for root in [
            os.environ.get("ProgramFiles"),
            os.environ.get("ProgramFiles(x86)"),
            os.environ.get("LOCALAPPDATA"),
            os.environ.get("APPDATA"),
        ]:
            if not root:
                continue
            candidates.extend(
                [
                    os.path.join(root, "LibreOffice", "program", "soffice.exe"),
                    os.path.join(
                        root, "Programs", "LibreOffice", "program", "soffice.exe"
                    ),
                ]
            )
            try:
                for entry in os.listdir(root):
                    if entry.lower().startswith("libreoffice"):
                        candidates.append(
                            os.path.join(root, entry, "program", "soffice.exe")
                        )
            except OSError:
                pass
        return candidates

    candidates = ["soffice", "libreoffice"]
    if sys.platform == "darwin":
        home = os.environ.get("HOME")
        candidates.extend(_scan_libreoffice_app_bundles("/Applications"))
        if home:
            candidates.extend(
                _scan_libreoffice_app_bundles(os.path.join(home, "Applications"))
            )
        candidates.extend(
            [
                "/usr/local/bin/soffice",
                "/usr/local/lib/libreoffice/program/soffice",
                "/opt/homebrew/bin/soffice",
                "/opt/homebrew/lib/libreoffice/program/soffice",
                "/opt/local/bin/soffice",
            ]
        )
    else:
        candidates.extend(
            [
                "/usr/bin/soffice",
                "/usr/bin/libreoffice",
                "/usr/lib/libreoffice/program/soffice",
                "/usr/lib64/libreoffice/program/soffice",
                "/usr/local/bin/soffice",
                "/usr/local/lib/libreoffice/program/soffice",
                "/snap/bin/soffice",
                "/snap/bin/libreoffice",
                "/var/lib/snapd/snap/bin/soffice",
                "/var/lib/snapd/snap/bin/libreoffice",
                "/var/lib/flatpak/exports/bin/org.libreoffice.LibreOffice",
                "/var/lib/flatpak/app/org.libreoffice.LibreOffice/current/active/"
                "export/bin/libreoffice",
            ]
        )
        try:
            for entry in os.listdir("/opt"):
                if entry.lower().startswith("libreoffice"):
                    candidates.append(
                        os.path.join("/opt", entry, "program", "soffice")
                    )
        except OSError:
            pass
        home = os.environ.get("HOME")
        if home:
            candidates.extend(
                [
                    os.path.join(
                        home,
                        ".local/share/flatpak/exports/bin/org.libreoffice.LibreOffice",
                    ),
                    os.path.join(
                        home,
                        ".local/share/flatpak/app/org.libreoffice.LibreOffice/"
                        "current/active/export/bin/libreoffice",
                    ),
                    os.path.join(home, ".local/bin/soffice"),
                    os.path.join(home, ".local/lib/libreoffice/program/soffice"),
                ]
            )
    return candidates


def _get_soffice_binary() -> str:
    configured = (os.environ.get("SOFFICE_PATH") or "").strip()
    if configured:
        resolved = _existing_executable(configured)
        if resolved:
            return resolved
        raise FileNotFoundError(
            f"Configured SOFFICE_PATH was not found or is not executable: {configured}"
        )

    for candidate in _candidate_soffice_binaries():
        resolved = _existing_executable(candidate)
        if resolved:
            return resolved

    raise FileNotFoundError(_SOFFICE_NOT_FOUND_MESSAGE)


def _windows_hidden_subprocess_kwargs() -> dict:
    if os.name != "nt":
        return {}

    startupinfo = subprocess.STARTUPINFO()
    startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    return {
        "creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0),
        "startupinfo": startupinfo,
    }


def extract_slide_xmls(pptx_path: str, temp_dir: str) -> List[str]:
    slide_xmls: List[str] = []

    try:
        with zipfile.ZipFile(pptx_path, "r") as zip_ref:
            slide_names = [
                name
                for name in zip_ref.namelist()
                if name.startswith("ppt/slides/slide") and name.endswith(".xml")
            ]

            if not slide_names:
                raise Exception("No slide XMLs found in PPTX")

            slide_names.sort(
                key=lambda value: int(
                    os.path.basename(value).replace("slide", "").replace(".xml", "")
                )
            )

            for name in slide_names:
                with zip_ref.open(name) as slide_handle:
                    slide_xmls.append(slide_handle.read().decode("utf-8"))

        return slide_xmls

    except zipfile.BadZipFile as exc:
        raise Exception(f"Invalid or corrupted PPTX file: {exc}") from exc
    except Exception as exc:
        raise Exception(f"Failed to extract slide XMLs: {exc}") from exc


def _open_lock_file(lock_file_path: str):
    return open(lock_file_path, "w")


async def _acquire_libreoffice_lock(
    lock_file_path: str = _LIBREOFFICE_LOCK_FILE_PATH,
    timeout_seconds: float = _LIBREOFFICE_LOCK_WAIT_TIMEOUT_SECONDS,
    retry_seconds: float = _LIBREOFFICE_LOCK_RETRY_SECONDS,
):
    if os.name == "nt":
        return None

    import fcntl

    lock_file = await asyncio.to_thread(_open_lock_file, lock_file_path)
    deadline = time.monotonic() + timeout_seconds

    while True:
        try:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            return lock_file
        except OSError as exc:
            if exc.errno not in (errno.EACCES, errno.EAGAIN):
                await asyncio.to_thread(lock_file.close)
                raise

            if time.monotonic() >= deadline:
                await asyncio.to_thread(lock_file.close)
                raise TimeoutError(
                    "LibreOffice lock acquisition timed out after "
                    f"{timeout_seconds:g} seconds"
                ) from exc

            await asyncio.sleep(retry_seconds)


def _collect_unique_fonts_from_slide_xmls(slide_xmls: List[str]) -> List[str]:
    raw_fonts: List[str] = []
    for xml in slide_xmls:
        raw_fonts.extend(extract_fonts_from_oxml(xml))
    return list({font for font in raw_fonts if font})


def _log_message(logger, level: str, message: str):
    if logger and hasattr(logger, level):
        getattr(logger, level)(message)
    else:
        print(message)


def _list_pdf_files(directory: str) -> List[str]:
    return [
        file_name for file_name in os.listdir(directory) if file_name.endswith(".pdf")
    ]


async def convert_pptx_to_pdf(
    pptx_path: str,
    temp_dir: str,
    font_paths: Optional[List[str]] = None,
    explicit_font_aliases: Optional[dict[str, str]] = None,
    protected_font_names: Optional[List[str]] = None,
    logger=None,
) -> str:
    """Convert a PPTX file to PDF via LibreOffice, applying optional custom fonts."""

    def _log(level: str, message: str):
        _log_message(logger, level, message)

    screenshots_dir = os.path.join(temp_dir, "screenshots")
    await asyncio.to_thread(os.makedirs, screenshots_dir, exist_ok=True)

    fonts_conf_path: Optional[str] = None
    lock_file = None

    try:
        slide_xmls = await asyncio.to_thread(extract_slide_xmls, pptx_path, temp_dir)
        _log("info", f"Found {len(slide_xmls)} slides in presentation")

        raw_fonts = await asyncio.to_thread(
            _collect_unique_fonts_from_slide_xmls, slide_xmls
        )

        if font_paths:
            fonts_conf_path = await install_fonts_for_libreoffice(
                font_paths,
                temp_dir,
            )
            try:
                env_cache = os.environ.copy()
                env_cache["FONTCONFIG_FILE"] = fonts_conf_path
                env_cache["XDG_CACHE_HOME"] = temp_dir
                subprocess.run(
                    ["fc-cache", "-f", "-v"],
                    check=True,
                    capture_output=True,
                    timeout=120,
                    env=env_cache,
                )
                _log("info", "Font cache refreshed via fc-cache")
            except Exception as exc:
                _log("warning", f"fc-cache failed (fonts may still work): {exc}")

        alias_fonts_conf = await asyncio.to_thread(
            create_font_alias_config,
            raw_fonts,
            extra_includes=[fonts_conf_path] if fonts_conf_path else None,
            temp_dir=temp_dir,
            explicit_aliases=explicit_font_aliases,
            protected_font_names=protected_font_names,
        )
        env = os.environ.copy()
        env["FONTCONFIG_FILE"] = alias_fonts_conf

        _log("info", "Starting LibreOffice PDF conversion...")

        if os.name != "nt":
            _log("info", "Acquiring file lock for LibreOffice...")
            lock_file = await _acquire_libreoffice_lock()
            _log("info", "File lock acquired, proceeding with LibreOffice conversion...")

        try:
            soffice_binary = _get_soffice_binary()
            _log("info", f"Using LibreOffice binary: {soffice_binary}")
            subprocess.run(
                [
                    soffice_binary,
                    "--headless",
                    "--convert-to",
                    "pdf",
                    "--outdir",
                    screenshots_dir,
                    pptx_path,
                ],
                check=True,
                capture_output=True,
                text=True,
                timeout=500,
                env=env,
                **_windows_hidden_subprocess_kwargs(),
            )
        except subprocess.TimeoutExpired as exc:
            raise Exception(
                "LibreOffice PDF conversion timed out after 500 seconds"
            ) from exc
        except subprocess.CalledProcessError as exc:
            error_msg = exc.stderr if exc.stderr else str(exc)
            raise Exception(f"LibreOffice PDF conversion failed: {error_msg}") from exc
        except FileNotFoundError as exc:
            raise Exception(str(exc)) from exc
        finally:
            if lock_file is not None:
                import fcntl

                try:
                    await asyncio.to_thread(
                        fcntl.flock, lock_file.fileno(), fcntl.LOCK_UN
                    )
                    await asyncio.to_thread(lock_file.close)
                    _log("info", "File lock released")
                except Exception as lock_exc:
                    _log("warning", f"Error releasing file lock: {lock_exc}")

        pdf_files = await asyncio.to_thread(_list_pdf_files, screenshots_dir)
        if not pdf_files:
            raise Exception("LibreOffice failed to generate PDF file")

        actual_pdf_path = os.path.join(screenshots_dir, pdf_files[0])
        _log("info", f"Generated PDF: {actual_pdf_path}")
        return actual_pdf_path
    except Exception as exc:
        if (
            "LibreOffice" in str(exc)
            or "timed out" in str(exc)
            or "failed" in str(exc)
        ):
            raise
        raise Exception("PPTX to PDF conversion failed") from exc
