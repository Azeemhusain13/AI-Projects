# main.py

from email_reader import fetch_unread_emails
from brand_detector import detect_brands
from excel_handler import get_suppliers
from email_sender import reply_to_customer


def main():

    emails = fetch_unread_emails()

    print(f"Found {len(emails)} new emails")

    for mail in emails:

        body = mail["body"]

        brands = detect_brands(body)

        print("Detected:", brands)

        if not brands:
            print("No brand found")
            continue

        suppliers_dict = {}

        for brand in brands:

            suppliers = get_suppliers(brand)

            if suppliers:
                suppliers_dict[brand] = suppliers

        if not suppliers_dict:
            print("No suppliers found")
            continue

        reply_to_customer(
            mail["from"],
            brands,
            suppliers_dict
        )

        print("Replied with supplier lists")


if __name__ == "__main__":
    main()
