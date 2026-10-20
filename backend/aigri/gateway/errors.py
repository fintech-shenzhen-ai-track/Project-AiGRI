"""Gateway errors. ``reason_code`` values are the ones in specs/02-gateway-agent/plan.md."""


class GatewayDenied(Exception):
    def __init__(self, reason_code: str, tool: str = "", detail: str = "") -> None:
        super().__init__(f"{tool}: {reason_code}" if tool else reason_code)
        self.reason_code = reason_code
        self.tool = tool
        self.detail = detail
