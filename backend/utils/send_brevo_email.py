import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

SMTP_SERVER = os.getenv("BREVO_SMTP_SERVER")
SMTP_PORT = int(os.getenv("BREVO_SMTP_PORT"))
SMTP_USER = os.getenv("BREVO_SMTP_USER")
SMTP_PASS = os.getenv("BREVO_SMTP_PASS")

FROM_EMAIL = os.getenv("FROM_EMAIL")
FROM_NAME = os.getenv("FROM_NAME")


LOG_DIR = "LOG/Sendmail"
os.makedirs(LOG_DIR, exist_ok=True)

LOG_FILE = f"{LOG_DIR}/sendmail.log"


def log_message(msg):
    with open(LOG_FILE, "a") as f:
        f.write(f"[{datetime.now()}] {msg}\n")


def send_brevo_email(to_email, subject, html_body, name="", reference=""):

    try:

        msg = MIMEMultipart()
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(html_body, "html"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()

        server.login(SMTP_USER, SMTP_PASS)

        server.sendmail(FROM_EMAIL, to_email, msg.as_string())

        server.quit()

        log_message(f"SUCCESS: Email sent to {to_email} | Ref: {reference} | Name: {name}")

        return True

    except Exception as e:

        log_message(f"ERROR sending to {to_email} | {str(e)}")

        return False