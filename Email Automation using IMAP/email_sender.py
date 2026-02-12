# email_sender.py

import smtplib
from email.message import EmailMessage
from config import EMAIL, PASSWORD, SMTP_SERVER, SMTP_PORT


def send_to_suppliers(recipients, subject, message):

    msg = EmailMessage()

    msg["From"] = EMAIL
    msg["Subject"] = subject
    msg.set_content(message)

    with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:

        server.login(EMAIL, PASSWORD)

        for email_id in recipients:

            msg["To"] = email_id
            server.send_message(msg)

            del msg["To"]

def reply_to_customer(to_email, brands, suppliers_dict):

    msg = EmailMessage()

    msg["From"] = EMAIL
    msg["To"] = to_email

    brand_list = ", ".join(brands)

    msg["Subject"] = f"Available Suppliers for {brand_list}"

    body = "Hi,\n\nHere are the available suppliers:\n\n"

    for brand, suppliers in suppliers_dict.items():

        body += f"{brand}:\n"

        for s in suppliers:
            body += f"{s}\n"

        body += "\n"

    body += """We are currently requesting quotations and will update you soon.

Regards,
AHK
"""

    msg.set_content(body)

    with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:

        server.login(EMAIL, PASSWORD)
        server.send_message(msg)
