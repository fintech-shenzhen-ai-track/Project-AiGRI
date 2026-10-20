"""core.hashing: RFC 8785 vectors, key-order independence, entry hash."""

import hashlib
import json
import struct

import pytest
from hypothesis import given
from hypothesis import strategies as st

from aigri.core import hashing

# RFC 8785 Appendix B: IEEE 754 bit pattern -> expected ECMAScript number text.
NUMBER_VECTORS = [
    ("0000000000000000", "0"),
    ("8000000000000000", "0"),  # minus zero serialises as 0
    ("0000000000000001", "5e-324"),
    ("8000000000000001", "-5e-324"),
    ("7fefffffffffffff", "1.7976931348623157e+308"),
    ("ffefffffffffffff", "-1.7976931348623157e+308"),
    ("4340000000000000", "9007199254740992"),
    ("c340000000000000", "-9007199254740992"),
    ("4430000000000000", "295147905179352830000"),
    ("44b52d02c7e14af5", "9.999999999999997e+22"),
    ("44b52d02c7e14af6", "1e+23"),
    ("44b52d02c7e14af7", "1.0000000000000001e+23"),
    ("444b1ae4d6e2ef4e", "999999999999999700000"),
    ("444b1ae4d6e2ef4f", "999999999999999900000"),
    ("444b1ae4d6e2ef50", "1e+21"),
    ("3eb0c6f7a0b5ed8c", "9.999999999999997e-7"),
    ("3eb0c6f7a0b5ed8d", "0.000001"),
    ("41b3de4355555553", "333333333.3333332"),
    ("41b3de4355555554", "333333333.33333325"),
    ("41b3de4355555555", "333333333.3333333"),
    ("41b3de4355555556", "333333333.3333334"),
    ("41b3de4355555557", "333333333.33333343"),
    ("becbf647612f3696", "-0.0000033333333333333333"),
    ("43143ff3c1cb0959", "1424953923781206.2"),
]


@pytest.mark.parametrize(("bits", "expected"), NUMBER_VECTORS)
def test_rfc8785_appendix_b_numbers(bits: str, expected: str) -> None:
    value = struct.unpack(">d", bytes.fromhex(bits))[0]
    assert hashing.jcs(value).decode() == expected


def test_rfc8785_section_3_2_2_example() -> None:
    doc = {
        "numbers": [333333333.33333329, 1e30, 4.50, 2e-3, 0.000000000000000000000000001],
        # decoded value of the RFC string: euro, $, U+000F, LF, A, ', B, ", \, \, ", /
        "string": '€$\x0f\nA\'B"\\\\"/',
        "literals": [None, True, False],
    }
    expected = (
        '{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],'
        '"string":"€$\\u000f\\nA\'B\\"\\\\\\\\\\"/"}'
    )
    assert hashing.jcs(doc).decode() == expected


def test_rfc8785_section_3_2_3_sorting_example() -> None:
    doc = {
        "€": "Euro Sign",
        "\r": "Carriage Return",
        "דּ": "Hebrew Letter Dalet With Dagesh",
        "1": "One",
        "\U0001f600": "Emoji: Grinning Face",
        "\x80": "Control",
        "ö": "Latin Small Letter O With Diaeresis",
    }
    out = hashing.jcs(doc).decode()
    # Keys sort by UTF-16 code units: the emoji (surrogate pair D83D) sorts before U+FB33.
    assert list(json.loads(out)) == [
        "\r",
        "1",
        "\x80",
        "ö",
        "€",
        "\U0001f600",
        "דּ",
    ]
    assert out.startswith('{"\\r":"Carriage Return","1":"One"')


def test_no_insignificant_whitespace() -> None:
    assert hashing.jcs({"b": [1, 2], "a": {"d": 1, "c": 2}}) == b'{"a":{"c":2,"d":1},"b":[1,2]}'


def test_sha256_payload_format_and_value() -> None:
    payload = {"b": 1, "a": "x"}
    expected = "sha256:" + hashlib.sha256(b'{"a":"x","b":1}').hexdigest()
    assert hashing.sha256_payload(payload) == expected


json_values = st.recursive(
    st.none() | st.booleans() | st.integers(-(2**53 - 1), 2**53 - 1) | st.text(max_size=8),
    lambda c: st.lists(c, max_size=4) | st.dictionaries(st.text(max_size=6), c, max_size=4),
    max_leaves=12,
)


def _reordered(v: object, salt: int) -> object:
    if isinstance(v, dict):
        items = [(k, _reordered(x, salt)) for k, x in v.items()]
        items.sort(key=lambda kv: hashlib.md5(f"{salt}{kv[0]}".encode()).digest())
        return dict(items)
    if isinstance(v, list):
        return [_reordered(x, salt) for x in v]
    return v


@given(json_values, st.integers(0, 1000))
def test_key_order_does_not_change_hash(value: object, salt: int) -> None:
    assert hashing.sha256_payload(value) == hashing.sha256_payload(_reordered(value, salt))


def test_entry_hash_chain_formula() -> None:
    assert hashing.GENESIS_HASH == "sha256:" + "0" * 64
    entry = {"seq": 1, "action": "x"}
    expected = "sha256:" + hashlib.sha256(bytes(32) + hashing.jcs(entry)).hexdigest()
    assert hashing.entry_hash(hashing.GENESIS_HASH, entry) == expected


def test_constant_time_equals() -> None:
    assert hashing.hashes_equal("sha256:ab", "sha256:ab")
    assert not hashing.hashes_equal("sha256:ab", "sha256:ac")
    assert not hashing.hashes_equal("sha256:ab", "sha256:abc")


def test_short_hash() -> None:
    h = "sha256:7c41e9" + "0" * 52 + "b02d"
    assert hashing.short_hash(h) == "7c41e9…b02d"


def test_integers_beyond_2_pow_53_are_rejected_not_rounded() -> None:
    with pytest.raises(ValueError):
        hashing.jcs({"amount_minor": 2**53})


def test_entry_hash_rejects_bad_prev() -> None:
    with pytest.raises(ValueError):
        hashing.entry_hash("nope", {})
