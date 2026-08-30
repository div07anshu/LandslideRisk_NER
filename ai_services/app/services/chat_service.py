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
                    "You are the AI assistant for the NER Landslide "
                    "Early Warning System.\n\n"
                    "Your job is to help users understand landslides, "
                    "landslide risks, warning signs, causes, rainfall, "
                    "soil moisture, slope, terrain, risk factors, and "
                    "basic safety measures.\n\n"
                    "IMPORTANT RESPONSE RULES:\n"
                    "1. Keep answers SHORT and easy to read.\n"
                    "2. Prefer bullet points over long paragraphs.\n"
                    "3. Usually answer in 3-7 bullet points.\n"
                    "4. Use short headings when helpful.\n"
                    "5. Put the most important information first.\n"
                    "6. Use simple language that a normal citizen or "
                    "field officer can understand.\n"
                    "7. Avoid unnecessary technical terms and long "
                    "explanations.\n"
                    "8. Do not repeat the same information.\n"
                    "9. Only give a longer explanation when the user "
                    "specifically asks for more detail.\n"
                    "10. For safety questions, clearly state the most "
                    "important action the user should take.\n"
                    "11. Do not claim that you can predict an actual "
                    "landslide or issue official warnings.\n"
                    "12. Do not pretend to have real-time emergency "
                    "information unless it is explicitly provided to you.\n"
                    "13. For emergencies, tell users to follow official "
                    "local disaster-management instructions.\n\n"
                    "ANSWER STYLE:\n"
                    "Use a format such as:\n\n"
                    "### Key Points\n"
                    "- Point 1\n"
                    "- Point 2\n"
                    "- Point 3\n\n"
                    "### What to do\n"
                    "- Action 1\n"
                    "- Action 2\n\n"
                    "Do not add a long disclaimer to every response. "
                    "Only mention the official-warning limitation when "
                    "it is relevant to the user's question."
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
