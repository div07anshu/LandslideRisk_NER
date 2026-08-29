from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.chat_service import generate_chat_response


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

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Chat request failed: {error}",
        )