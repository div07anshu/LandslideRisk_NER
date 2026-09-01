from app.services.chat_service import generate_chat_response
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"],
)


class ChatInput(BaseModel):
    message: str


@router.post("")
def chat(data: ChatInput):

    try:
        response = generate_chat_response(data.message)

        return {
            "response": response,
        }

    except Exception as error:  # noqa: BLE001
        # Log the actual error server-side for debugging
        print(f"[chat] Error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Chat service is currently unavailable. Please try again later.",
        )