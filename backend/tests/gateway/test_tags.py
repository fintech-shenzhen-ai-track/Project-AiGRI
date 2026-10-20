"""Property tests for capability tags (T-02.02)."""

import pytest
from hypothesis import given
from hypothesis import strategies as st

from aigri.gateway.tags import Origin, OriginError, Tagged, combine, least_trusted, map_tagged

ID = st.text(alphabet="abcdef0123456789-", min_size=1, max_size=8)
origin_strs = st.one_of(
    ID.map(lambda i: f"user:{i}"),
    st.tuples(ID, ID).map(lambda t: f"record:{t[0]}@{t[1]}"),
    ID.map(lambda i: f"rules_engine:{i}"),
    ID.map(lambda i: f"risk_model:{i}"),
    st.tuples(ID, ID).map(lambda t: f"pipeline:{t[0]}@{t[1]}"),
    st.just("system"),
    st.tuples(st.sampled_from(["insurer_pdf", "photo", "document", "hazard_text"]), ID).map(
        lambda t: f"untrusted:{t[0]}:{t[1]}"
    ),
)
principals = st.frozensets(st.sampled_from(["user:a", "user:b", "insurer:x", "role:superadmin"]))
tagged = st.builds(
    lambda v, o, r: Tagged.of(v, o, r),
    st.integers(),
    origin_strs,
    st.one_of(st.none(), principals),
)


@given(origin_strs)
def test_origin_round_trip(text: str) -> None:
    assert str(Origin.parse(text)) == text


@pytest.mark.parametrize(
    "bad",
    [
        "",
        "user",
        "user:",
        "untrusted:other:1",
        "untrusted:photo",
        "admin:1",
        "system:x",
        "record:x",
    ],
)
def test_bad_origins_rejected(bad: str) -> None:
    with pytest.raises(OriginError):
        Origin.parse(bad)


@given(st.lists(tagged, min_size=1, max_size=6))
def test_taint_never_lost(items: list[Tagged[int]]) -> None:
    out = combine(items, 0)
    if any(i.tainted for i in items):
        assert out.tainted
    if any(i.origin.untrusted for i in items):
        assert out.origin.untrusted


@given(st.lists(tagged, min_size=1, max_size=6))
def test_derived_origin_is_least_trusted_and_order_free(items: list[Tagged[int]]) -> None:
    out = combine(items, 0)
    assert out.origin.rank == min(i.origin.rank for i in items)
    assert combine(list(reversed(items)), 0) == out


@given(st.lists(tagged, min_size=1, max_size=6), principals)
def test_readers_only_shrink(items: list[Tagged[int]], who: frozenset[str]) -> None:
    out = combine(items, 0)
    if out.can_be_read_by(who):
        assert all(i.can_be_read_by(who) for i in items)
    for i in items:
        if i.readers is not None:
            assert out.readers is not None and out.readers <= i.readers


@given(tagged)
def test_map_keeps_tags(t: Tagged[int]) -> None:
    m = map_tagged(t, str)
    assert (m.origin, m.readers, m.sources) == (t.origin, t.readers, t.sources)


def test_least_trusted_empty_rejected() -> None:
    with pytest.raises(OriginError):
        least_trusted([])
