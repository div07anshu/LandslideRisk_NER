import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def generate_chat_response(message: str) -> str:

    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured")

    client = Groq(api_key=GROQ_API_KEY)

    completion = client.chat.completions.create(
        model="qwen/qwen3.6-27b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an AI assistant for the NER Landslide "
                    "Early Warning System. Help users understand "
                    "landslide risks, causes, warning signs, and "
                    "safety measures. Give clear and practical answers. "
                    "Do not claim to provide official emergency warnings."
                ),
            },
            {
                "role": "user",
                "content": message,
            },
        ],
        temperature=0.3,
    )

    answer = completion.choices[0].message.content

    if "</think>" in answer:
        answer = answer.split("</think>", 1)[1].strip()

    return answer