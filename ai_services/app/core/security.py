import os

from fastapi import Header, HTTPException


def verify_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    """
    Optional shared-secret check between the Node backend and this service.

    If AI_SERVICE_TOKEN is unset, the check is skipped — this keeps local
    development working without extra setup. Set it (matching
    AI_SERVICE_TOKEN in backend/.env) in any environment where this
    service's network could be reached by anything other than the Node
    backend, so this service can't be called directly and bypass the Node
    backend's own auth, rate limiting, and audit logging.
    """
    expected = os.getenv("AI_SERVICE_TOKEN")

    if not expected:
        return

    if x_internal_token != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")
