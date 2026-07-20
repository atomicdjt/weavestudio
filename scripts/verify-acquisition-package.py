"""Validate the staged buyer package and its deterministic ZIP archive."""
from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path


FORBIDDEN_PATHS = {
    "OUTREACH_MESSAGES.md",
    "docs/buyer/OUTREACH.md",
}
REQUIRED_PATHS = {
    "docs/buyer/EXECUTIVE_SUMMARY.md",
    "src/pages/AcquirePage.tsx",
}
SELLER_CAMPAIGN_NAME_MARKERS = (
    "crm",
    "prospect list",
    "contact list",
    "outreach draft",
    "campaign tracker",
    "email sequence",
    "follow-up sequence",
    "seller negotiation notes",
    "private pricing notes",
)
SECRET_PATTERNS = (
    re.compile(r"\bsk-[A-Za-z0-9_-]{20,}"),
    re.compile(r"\bghp_[A-Za-z0-9]{20,}"),
    re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}"),
    re.compile(r"\bvercel_[A-Za-z0-9]{20,}"),
    re.compile(r"BEGIN PRIVATE KEY", re.IGNORECASE),
    re.compile(r"(?:Bearer|Authorization:)\s+['\"]?[A-Za-z0-9_-]{20,}", re.IGNORECASE),
    re.compile(r"(?:AWS_ACCESS_KEY_ID|OPENAI_API_KEY|GEMINI_API_KEY)\s*[=:]\s*['\"]?[A-Za-z0-9_-]{12,}", re.IGNORECASE),
)


def fail(reason: str) -> None:
    raise SystemExit(f"Package hygiene validation failed: {reason}")


def normalized(path: str) -> str:
    return path.replace("\\", "/").removeprefix("./")


def validate_path(path: str) -> None:
    if not path or path.startswith("/") or re.match(r"^[A-Za-z]:", path):
        fail("unsafe archive path detected")
    parts = path.split("/")
    if ".." in parts or "." in parts:
        fail("unsafe archive path detected")
    lowered = path.lower()
    if "/__pycache__/" in f"/{lowered}" or lowered.endswith((".pyc", ".pyo")):
        fail("generated cache material detected")
    if any(marker in lowered for marker in SELLER_CAMPAIGN_NAME_MARKERS):
        fail("seller-side campaign material detected")
    if lowered.endswith(".zip"):
        fail("nested release archive detected")


def validate_text(path: str, content: bytes) -> None:
    if path == "scripts/verify-acquisition-package.py":
        return
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        return
    if any(pattern.search(text) for pattern in SECRET_PATTERNS):
        fail("secret-like material detected")


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: verify-acquisition-package.py <staging-directory> <archive.zip>")

    stage, archive = Path(sys.argv[1]), Path(sys.argv[2])
    if not stage.is_dir() or not archive.is_file():
        fail("generated package is missing")

    staged_files = {
        normalized(str(path.relative_to(stage))) for path in stage.rglob("*") if path.is_file()
    }
    if staged_files & FORBIDDEN_PATHS:
        fail("prohibited seller outreach material detected")
    if not REQUIRED_PATHS <= staged_files:
        fail("required buyer documentation is missing")
    for path in staged_files:
        validate_path(path)
        if (stage / path).stat().st_size == 0:
            fail("unexpected empty packaged file detected")
        validate_text(path, (stage / path).read_bytes())

    manifest_path = stage / "PACKAGE_MANIFEST.json"
    try:
        manifest_files = {normalized(entry["path"]) for entry in json.loads(manifest_path.read_text("utf-8"))["files"]}
    except (KeyError, OSError, TypeError, ValueError):
        fail("package manifest is invalid")
    if manifest_files & FORBIDDEN_PATHS:
        fail("prohibited seller outreach material detected")
    if not REQUIRED_PATHS <= manifest_files:
        fail("required buyer documentation is missing from the manifest")
    if manifest_files != staged_files - {"PACKAGE_MANIFEST.json"}:
        fail("package manifest does not match staged files")

    with zipfile.ZipFile(archive) as package:
        archive_files = {normalized(info.filename) for info in package.infolist() if not info.is_dir()}
        if archive_files & FORBIDDEN_PATHS:
            fail("prohibited seller outreach material detected")
        if archive_files != staged_files:
            fail("archive does not match staged files")
        for info in package.infolist():
            if info.is_dir():
                fail("unexpected directory entry detected")
            path = normalized(info.filename)
            validate_path(path)
            if ((info.external_attr >> 16) & 0o170000) == 0o120000:
                fail("unsafe archive symlink detected")
            validate_text(path, package.read(info))

    acquire_page = (stage / "src/pages/AcquirePage.tsx").read_text("utf-8")
    if "$6,500" not in acquire_page or "one-time source-code and seller-owned-IP acquisition" not in acquire_page:
        fail("approved public acquisition copy is missing")
    if "davidelsey9513@gmail.com" not in acquire_page or "WeaveStudio%20acquisition%20inquiry" not in acquire_page:
        fail("approved acquisition inquiry contact is missing")
    if "Pricing is discussed privately" in acquire_page:
        fail("retired private-pricing copy detected")

    print("Package hygiene validation passed.")


if __name__ == "__main__":
    main()
