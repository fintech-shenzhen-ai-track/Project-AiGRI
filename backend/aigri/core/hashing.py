"""Canonical JSON (RFC 8785) and the hashes built on it (hashing-and-audit.md).

This is the only module that computes payload, entry and packet hashes.
"""

import hashlib
import hmac
from typing import Any

import rfc8785

HASH_PREFIX = "sha256:"
GENESIS_HASH = HASH_PREFIX + "0" * 64


def jcs(payload: Any) -> bytes:
    """Canonical JSON bytes: sorted keys, no whitespace, ES number serialisation, UTF-8."""
    return rfc8785.dumps(payload)


def sha256_payload(payload: Any) -> str:
    """``"sha256:" + hex(SHA-256(JCS(payload)))``."""
    return HASH_PREFIX + hashlib.sha256(jcs(payload)).hexdigest()


def _digest_bytes(value: str) -> bytes:
    if not value.startswith(HASH_PREFIX) or len(value) != len(GENESIS_HASH):
        raise ValueError(f"not a sha256 hash string: {value!r}")
    return bytes.fromhex(value[len(HASH_PREFIX) :])


def entry_hash(prev_hash: str, entry: Any) -> str:
    """Audit chain hash: ``sha256(prev_hash_bytes || JCS(entry))``."""
    digest = hashlib.sha256(_digest_bytes(prev_hash) + jcs(entry)).hexdigest()
    return HASH_PREFIX + digest


def hashes_equal(a: str, b: str) -> bool:
    """Constant-time comparison of two hash strings."""
    return hmac.compare_digest(a.encode(), b.encode())


def short_hash(value: str) -> str:
    """First 6 and last 4 hex characters (DESIGN.md 9.17)."""
    hex_part = value.removeprefix(HASH_PREFIX)
    return f"{hex_part[:6]}…{hex_part[-4:]}"
