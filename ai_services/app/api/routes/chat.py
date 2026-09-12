from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.chat_service import generate_chat_response
from app.services.location_service import (
    find_location,
    location_from_context,
    question_requires_location,
)
from app.services.prediction_service import DEFAULT_LOW_MAX, DEFAULT_MODERATE_MAX

router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"],
)


class RiskThresholds(BaseModel):
    low_max: float
    moderate_max: float


class ChatInput(BaseModel):
    message: str
    language: str | None = None
    context_location: dict | None = None
    awaiting_location: bool = False
    # Optional: the Node backend's own admin-configured LOW/MODERATE
    # boundaries (see riskConfigService.ts), so this endpoint's live-location
    # risk classification matches what the rest of the app shows for the
    # same score. Falls back to this service's own defaults if omitted.
    risk_thresholds: RiskThresholds | None = None


@router.post("")
def chat(data: ChatInput):
    try:
        # First try to find a location directly in the user's message.
        location = find_location(data.message)

        # If no location is mentioned, use the previous location
        # remembered by the frontend.
        if location is None:
            location = location_from_context(data.context_location)

        # Location-specific questions need a location.
        if location is None and question_requires_location(data.message):
            return {
                "response": (
                    "Please provide the district or location name "
                    "so I can check its landslide risk and live conditions."
                ),
                "location_required": True,
                "resolved_location": None,
            }

        # Send the resolved location to the AI service so it can
        # calculate live risk, rainfall, elevation, slope, etc.
        thresholds = data.risk_thresholds
        response = generate_chat_response(
            data.message,
            location=location,
            language=data.language,
            low_max=thresholds.low_max if thresholds else DEFAULT_LOW_MAX,
            moderate_max=thresholds.moderate_max if thresholds else DEFAULT_MODERATE_MAX,
        )

        return {
            "response": response,
            "location_required": False,
            "resolved_location": location,
        }

    except Exception as error:
        print(f"[chat] Error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Chat service is currently unavailable. Please try again later.",
        )
