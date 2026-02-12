# email_reader.py

import imaplib
import email
from datetime import datetime
from config import EMAIL, PASSWORD, IMAP_SERVER


def safe_decode(payload, charset):

    try:
        if charset:
            return payload.decode(charset)
        else:
            return payload.decode("utf-8")
    except:
        return payload.decode("latin-1", errors="ignore")


def fetch_unread_emails():

    mail = imaplib.IMAP4_SSL(IMAP_SERVER)
    mail.login(EMAIL, PASSWORD)
    mail.select("inbox")

    # Get today's date in IMAP format
    today = datetime.now().strftime("%d-%b-%Y")

    # Search: Unread + Today
    search_criteria = f'(UNSEEN SINCE "{today}")'

    _, data = mail.search(None, search_criteria)

    emails = []

    for num in data[0].split():

        _, msg_data = mail.fetch(num, "(RFC822)")
        raw = msg_data[0][1]

        msg = email.message_from_bytes(raw)

        from_email = email.utils.parseaddr(msg["From"])[1]
        subject = msg["subject"]


        body = ""

        if msg.is_multipart():

            for part in msg.walk():

                if part.get_content_type() == "text/plain":

                    payload = part.get_payload(decode=True)
                    charset = part.get_content_charset()

                    if payload:
                        body += safe_decode(payload, charset)

        else:

            payload = msg.get_payload(decode=True)
            charset = msg.get_content_charset()

            if payload:
                body = safe_decode(payload, charset)

        emails.append({
            "from": from_email,
            "subject": subject,
            "body": body.strip()
        })


    mail.logout()

    return emails
