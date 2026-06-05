import pytest

from templates import pptx_convert


def test_get_soffice_binary_uses_soffice_path(monkeypatch, tmp_path):
    binary = tmp_path / "soffice"
    binary.write_text("")
    binary.chmod(0o755)

    monkeypatch.setenv("SOFFICE_PATH", str(binary))

    assert pptx_convert._get_soffice_binary() == str(binary)


def test_get_soffice_binary_resolves_macos_application_bundle(monkeypatch):
    bundle_binary = "/Applications/LibreOffice.app/Contents/MacOS/soffice"

    monkeypatch.delenv("SOFFICE_PATH", raising=False)
    monkeypatch.setattr(pptx_convert.os, "name", "posix")
    monkeypatch.setattr(pptx_convert.sys, "platform", "darwin")
    monkeypatch.setattr(pptx_convert.shutil, "which", lambda _candidate: None)
    monkeypatch.setattr(
        pptx_convert,
        "_scan_libreoffice_app_bundles",
        lambda app_dir: [bundle_binary] if app_dir == "/Applications" else [],
    )
    monkeypatch.setattr(
        pptx_convert.os.path,
        "isfile",
        lambda candidate: candidate == bundle_binary,
    )
    monkeypatch.setattr(
        pptx_convert.os,
        "access",
        lambda candidate, _mode: candidate == bundle_binary,
    )

    assert pptx_convert._get_soffice_binary() == bundle_binary


def test_get_soffice_binary_raises_specific_message_when_missing(monkeypatch):
    monkeypatch.delenv("SOFFICE_PATH", raising=False)
    monkeypatch.setattr(
        pptx_convert, "_candidate_soffice_binaries", lambda: ["soffice"]
    )
    monkeypatch.setattr(pptx_convert, "_existing_executable", lambda _candidate: None)

    with pytest.raises(FileNotFoundError, match="LibreOffice executable not found"):
        pptx_convert._get_soffice_binary()
