import os

from dotenv import load_dotenv
from groq import Groq

from app.services.risk_service import analyze_location

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def generate_chat_response(
    message: str,
    location: dict | None = None,
    language: str | None = None,
) -> str:

    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured")

    live_context = ""

    if location:
        analysis = analyze_location(
            latitude=location["latitude"],
            longitude=location["longitude"],
        )

        live_context = f"""
LIVE LOCATION DATA:

Location: {location["district"]}, {location["state"]}
City: {location["city"]}

Risk score: {analysis["risk_score"]}
Risk level: {analysis["risk_level"]}
Risk probability: {analysis["probability"]}

Rainfall in last 24 hours: {analysis["features"]["rainfall_24h"]}
Rainfall in last 48 hours: {analysis["features"]["rainfall_48h"]}
Rainfall in last 7 days: {analysis["features"]["rainfall_7d"]}

Average humidity in last 24 hours: {analysis["features"]["average_humidity_24h"]}
Soil moisture: {analysis["features"]["soil_moisture"]}
Elevation: {analysis["features"]["elevation"]}
Slope: {analysis["features"]["slope"]}
"""

    client = Groq(api_key=GROQ_API_KEY)

    system_prompt = """
You are the AI assistant for the NER Landslide Early Warning System.

Answer the user's question directly.

RULES:
- Give ONLY the final answer.
- Never show reasoning or internal thinking.
- Never output <think> tags.
- Keep the response short.
- Use simple language.
- Prefer 3-7 bullet points.
- Use the supplied live data when available.
- Never invent numerical values.
- Clearly mention the location when live data is provided.
- Do not claim to predict an actual landslide.
- Do not claim to issue official warnings.
- For emergencies, tell users to follow official local disaster-management instructions.

LIVE DATA:
"""

    system_prompt += live_context

    user_message = message

    if language:
        user_message += f"\nRespond in this language: {language}"

    completion = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_message,
            },
        ],
        temperature=0.2,
        max_tokens=500,
    )

    answer = completion.choices[0].message.content or ""

    # Remove any reasoning tags if the model happens to return them.
    if "</think>" in answer:
        answer = answer.split("</think>", 1)[1].strip()

    if "<think>" in answer and "</think>" not in answer:
        answer = answer.split("<think>", 1)[0].strip()

    answer = answer.replace("<think>", "").replace("</think>", "").strip()

    if not answer:
        answer = (
            "I could not generate a response right now. " "Please try asking again."
        )

    return answer

