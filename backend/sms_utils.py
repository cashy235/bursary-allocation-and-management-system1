from twilio.rest import Client
from config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

def send_sms(to_phone_number: str, message: str) -> bool:
    """
    Send an SMS using Twilio.
    Returns True if successful, False otherwise.
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
        # SMS not configured, skip sending
        return False

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to_phone_number
        )
        return True
    except Exception as e:
        # Log the error (in a real app, use logging)
        print(f"Failed to send SMS: {e}")
        return False