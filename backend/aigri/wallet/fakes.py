"""Test and development stand-ins for contracts that are not merged yet."""

from __future__ import annotations

import uuid
from typing import Any


class RecordingAudit:
    """Fake for ``AuditPort`` (stands in for ``core.audit`` until 01 phase B part 2 merges)."""

    def __init__(self) -> None:
        self.events: list[dict[str, Any]] = []

    async def write(
        self,
        *,
        action: str,
        object_type: str,
        object_id: str,
        payload: dict[str, Any],
        client_id: uuid.UUID | None = None,
        insurer_id: uuid.UUID | None = None,
    ) -> None:
        self.events.append(
            {
                "action": action,
                "object_type": object_type,
                "object_id": object_id,
                "payload": payload,
                "client_id": client_id,
                "insurer_id": insurer_id,
            }
        )
