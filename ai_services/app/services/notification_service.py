import os

from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")


def send_sms_alert(to_phone: str, message: str) -> str:
    if not TWILIO_ACCOUNT_SID:
        raise RuntimeError("TWILIO_ACCOUNT_SID is not configured")

    if not TWILIO_AUTH_TOKEN:
        raise RuntimeError("TWILIO_AUTH_TOKEN is not configured")

    if not TWILIO_PHONE_NUMBER:
        raise RuntimeError("TWILIO_PHONE_NUMBER is not configured")

    client = Client(
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
    )

    sms = client.messages.create(
        body=message,
        from_=TWILIO_PHONE_NUMBER,
        to=to_phone,
    )

    return sms.sid


def send_trial_alert(to_phone: str) -> str:
    if not TWILIO_ACCOUNT_SID:
        raise RuntimeError("TWILIO_ACCOUNT_SID is not configured")

    if not TWILIO_AUTH_TOKEN:
        raise RuntimeError("TWILIO_AUTH_TOKEN is not configured")

    if not TWILIO_PHONE_NUMBER:
        raise RuntimeError("TWILIO_PHONE_NUMBER is not configured")

    client = Client(
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
    )

    sms = client.messages.create(
        body="sms_internal_alerts",
        from_=TWILIO_PHONE_NUMBER,
        to=to_phone,
    )

    return sms.sid
