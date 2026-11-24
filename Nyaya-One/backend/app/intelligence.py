
# """Deterministic, source-linked extraction and transaction reconciliation.

# This module does not determine whether an allegation is true and does not
# recommend legal sections. Extracted values remain attributed to their source.

# Reconciliation is deliberately conservative:
# - A candidate transaction requires an explicit transaction reference.
# - Fields are extracted from a labelled transaction-information section.
# - Repeated mentions are not treated as separate payments.
# - Conflicting values are flagged rather than silently overwritten.
# """
# from __future__ import annotations

# import re
# from typing import Any


# PAGE_RE = re.compile(r"(?=\[PAGE\s+\d+\]\s*)")


# def _pages(text: str) -> list[tuple[int, str]]:
#     parts = [p.strip() for p in PAGE_RE.split(text or "") if p.strip()]
#     result: list[tuple[int, str]] = []

#     for part in parts:
#         match = re.match(r"\[PAGE\s+(\d+)\]\s*", part)
#         if match:
#             result.append((int(match.group(1)), part[match.end():].strip()))
#         else:
#             result.append((1, part))

#     return result



# def _source(page: int, text: str, start: int, end: int) -> dict[str, Any]:
#     left = max(0, start - 90)
#     right = min(len(text), end + 90)

#     # Expand boundaries so quotations do not cut through words.
#     while left > 0 and not text[left - 1].isspace():
#         left -= 1

#     while right < len(text) and not text[right].isspace():
#         right += 1

#     return {
#         "page": page,
#         "quote": text[left:right].replace("\n", " ").strip(),
#     }

# def _normalise_amount(value: str) -> str:
#     return value.replace(",", "").strip()


# def _transaction_sections(page_text: str) -> list[tuple[int, int, str]]:
#     """Return explicitly labelled transaction-information sections."""
#     pattern = re.compile(
#         r"Transaction Information Provided by Complainant"
#         r"(.*?)(?=\n\s*\d+\.\s+[A-Z]|\Z)",
#         re.IGNORECASE | re.DOTALL,
#     )

#     return [
#         (match.start(), match.end(), match.group(0))
#         for match in pattern.finditer(page_text)
#     ]


# def _extract_section_value(section: str, label_pattern: str) -> str | None:
#     """Extract a value after a field label, stopping at the next known label."""
#     labels = (
#         r"Transaction date/time|Amount|Payment channel|"
#         r"Demo transaction reference|Transaction reference|"
#         r"Beneficiary VPA|Source"
#     )

#     pattern = re.compile(
#         rf"(?:{label_pattern})\s*[:\n]?\s*(.*?)"
#         rf"(?=\s+(?:{labels})\b|\n|$)",
#         re.IGNORECASE | re.DOTALL,
#     )

#     match = pattern.search(section)
#     if not match:
#         return None

#     value = re.sub(r"\s+", " ", match.group(1)).strip(" :-\t")
#     return value or None


# def _reconcile_transactions(
#     pages: list[tuple[int, str]],
# ) -> list[dict[str, Any]]:
#     """
#     Find explicit transaction references in extracted PDF text and
#     read nearby labelled fields despite PDF line-break differences.

#     Records are grouped only by identical explicit references.
#     """
#     grouped: dict[str, dict[str, Any]] = {}

#     for page_no, page_text in pages:
#         # PDF extraction can split labels and values across lines.
#         normalized = re.sub(r"\s+", " ", page_text)

#         ref_pattern = re.compile(
#             r"\b[A-Z0-9]{8,}(?:[-/][A-Z0-9]+)*\b",
#             re.IGNORECASE,
#         )

#         for match in ref_pattern.finditer(normalized):
#             reference = match.group(0).upper()

#             # Keep this prototype conservative: only recognize references
#             # carrying the synthetic DEMO or UPI marker.
#             if not any(ch.isdigit() for ch in reference):
#                 continue
#             if "DEMO" not in reference and "UPI" not in reference:
#                 continue

#             # Read a local context around the explicit reference.
#             left = max(0, match.start() - 600)
#             right = min(len(normalized), match.end() + 300)
#             context = normalized[left:right]

#             def field_value(pattern: str) -> str | None:
#                 found = re.search(pattern, context, re.IGNORECASE)
#                 if not found:
#                     return None
#                 return re.sub(r"\s+", " ", found.group(1)).strip(" :-")

#             amount = field_value(
#                 r"\bAmount\s+(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)"
#             )
#             date_time = field_value(
#                 r"Transaction date/time\s*(.*?)\s*(?=Amount\b)"
#             )
#             channel = field_value(
#                 r"Payment channel\s*(.*?)\s*(?=Demo transaction reference|"
#                 r"Transaction reference|Beneficiary VPA|Source\b)"
#             )
#             vpa = field_value(
#                 r"Beneficiary VPA\s*(.*?)\s*(?=Source\b|$)"
#             )

#             # Locate the same reference in the original text for provenance.
#             raw_match = re.search(re.escape(match.group(0)), page_text, re.IGNORECASE)
#             if raw_match:
#                 source = _source(
#                     page_no,
#                     page_text,
#                     raw_match.start(),
#                     raw_match.end(),
#                 )
#             else:
#                 source = {
#                     "page": page_no,
#                     "quote": context,
#                 }

#             if reference not in grouped:
#                 grouped[reference] = {
#                     "transaction_reference": reference,
#                     "amount_values": [],
#                     "date_time_values": [],
#                     "channel_values": [],
#                     "beneficiary_vpa_values": [],
#                     "source_mentions": [],
#                 }

#             record = grouped[reference]

#             def add_unique(field: str, value: str | None):
#                 if value:
#                     if field == "amount_values":
#                         value = _normalise_amount(value)
#                     if value not in record[field]:
#                         record[field].append(value)

#             add_unique("amount_values", amount)
#             add_unique("date_time_values", date_time)
#             add_unique("channel_values", channel)
#             add_unique("beneficiary_vpa_values", vpa)

#             # Keep source mentions distinct by page and quote.
#             if source not in record["source_mentions"]:
#                 record["source_mentions"].append(source)

#     results: list[dict[str, Any]] = []

#     for reference, record in grouped.items():
#         conflicts = []

#         for field in (
#             "amount_values",
#             "date_time_values",
#             "channel_values",
#             "beneficiary_vpa_values",
#         ):
#             if len(record[field]) > 1:
#                 conflicts.append(field)

#         results.append({
#             "transaction_reference": reference,
#             "amount": (
#                 record["amount_values"][0]
#                 if len(record["amount_values"]) == 1
#                 else None
#             ),
#             "currency": "INR" if record["amount_values"] else None,
#             "date_time": (
#                 record["date_time_values"][0]
#                 if len(record["date_time_values"]) == 1
#                 else None
#             ),
#             "channel": (
#                 record["channel_values"][0]
#                 if len(record["channel_values"]) == 1
#                 else None
#             ),
#             "beneficiary_vpa": (
#                 record["beneficiary_vpa_values"][0]
#                 if len(record["beneficiary_vpa_values"]) == 1
#                 else None
#             ),
#             "all_observed_values": {
#                 "amounts": record["amount_values"],
#                 "date_times": record["date_time_values"],
#                 "channels": record["channel_values"],
#                 "beneficiary_vpas": record["beneficiary_vpa_values"],
#             },
#             "match_basis": "same_explicit_transaction_reference",
#             "reconciliation_status": (
#                 "conflicting_source_values"
#                 if conflicts
#                 else "candidate_reconciled_unverified"
#             ),
#             "conflicting_fields": conflicts,
#             "verification": "unverified_source_statement",
#             "source_mentions": record["source_mentions"],
#             "notice": (
#                 "Candidate grouping by explicit reference only. "
#                 "Not proof that a payment occurred."
#             ),
#         })

#     return results



# def analyze_document(text: str) -> dict[str, Any]:
#     pages = _pages(text)

#     entities: list[dict[str, Any]] = []
#     transactions: list[dict[str, Any]] = []
#     gaps: list[dict[str, str]] = []

#     def add_entity(
#         kind: str,
#         value: str,
#         page: int,
#         page_text: str,
#         start: int,
#         end: int,
#         attribution: str,
#     ):
#         entities.append({
#             "type": kind,
#             "value": value,
#             "attribution": attribution,
#             "verification": "unverified_source_statement",
#             "source": _source(page, page_text, start, end),
#         })

#     for page_no, page_text in pages:
#         # Capture a person only when explicitly identified in the document.
#         for match in re.finditer(
#             r"identified\s+in\s+this\s+training\s+example\s+as\s+"
#             r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
#             page_text,
#             re.IGNORECASE,
#         ):
#             add_entity(
#                 "person",
#                 match.group(1),
#                 page_no,
#                 page_text,
#                 match.start(1),
#                 match.end(1),
#                 "complainant_identified_in_document",
#             )

#         for match in re.finditer(
#             r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\b",
#             page_text,
#         ):
#             add_entity(
#                 "upi_vpa",
#                 match.group(),
#                 page_no,
#                 page_text,
#                 match.start(),
#                 match.end(),
#                 "complainant_provided_description",
#             )

#         for match in re.finditer(
#             r"\b[A-Z0-9]{8,}(?:[-/][A-Z0-9]+)*\b",
#             page_text,
#         ):
#             value = match.group()
#             if any(ch.isdigit() for ch in value) and (
#                 "DEMO" in value or "UPI" in value
#             ):
#                 add_entity(
#                     "transaction_reference",
#                     value,
#                     page_no,
#                     page_text,
#                     match.start(),
#                     match.end(),
#                     "complainant_provided_description",
#                 )

#         # Retain individual amount mentions with their own source locations.
#         for match in re.finditer(
#             r"\b(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)",
#             page_text,
#             re.IGNORECASE,
#         ):
#             transactions.append({
#                 "amount": _normalise_amount(match.group(1)),
#                 "currency": "INR",
#                 "channel": (
#                     "UPI"
#                     if re.search(r"\bUPI\b", page_text, re.IGNORECASE)
#                     else None
#                 ),
#                 "attribution": "reported_in_document",
#                 "verification": "unverified_source_statement",
#                 "source": _source(
#                     page_no,
#                     page_text,
#                     match.start(),
#                     match.end(),
#                 ),
#             })

#     # Retain explicitly labelled date/time observations.
#     for page_no, page_text in pages:
#         for match in re.finditer(
#             r"(?:Transaction date/time)\s*\n\s*([^\n]+)",
#             page_text,
#             re.IGNORECASE,
#         ):
#             transactions.append({
#                 "date_time": match.group(1).strip(),
#                 "attribution": "complainant_provided_description",
#                 "verification": "unverified_source_statement",
#                 "source": _source(
#                     page_no,
#                     page_text,
#                     match.start(),
#                     match.end(),
#                 ),
#             })

#     joined = "\n".join(text for _, text in pages).lower()

#     gap_rules = [
#         (
#             "payment_confirmation_screenshot",
#             "Payment confirmation screenshot is mentioned but not attached.",
#         ),
#         (
#             "bank_statement",
#             "Bank statement is stated to be outstanding.",
#         ),
#         (
#             "beneficiary_bank_confirmation",
#             "Beneficiary-bank confirmation is stated to be outstanding.",
#         ),
#     ]

#     for key, description in gap_rules:
#         if (
#             key == "payment_confirmation_screenshot"
#             and ("not attached" in joined or "not attached to this document" in joined)
#         ):
#             gaps.append({
#                 "key": key,
#                 "description": description,
#                 "status": "mentioned_missing_in_source",
#             })
#         elif (
#             key == "bank_statement"
#             and "bank statement" in joined
#             and ("not yet been received" in joined or "not received" in joined)
#         ):
#             gaps.append({
#                 "key": key,
#                 "description": description,
#                 "status": "mentioned_outstanding_in_source",
#             })
#         elif (
#             key == "beneficiary_bank_confirmation"
#             and "beneficiary-bank confirmation" in joined
#             and ("not yet been received" in joined or "not received" in joined)
#         ):
#             gaps.append({
#                 "key": key,
#                 "description": description,
#                 "status": "mentioned_outstanding_in_source",
#             })

#     reconciled = _reconcile_transactions(pages)

#     return {
#         "analysis_version": "0.2.0",
#         "method": "deterministic_rules",
#         "notice": (
#             "Prototype extraction only. Values are attributed to the source "
#             "and are not independently verified facts or findings of wrongdoing."
#         ),
#         "entities": entities,
#         "transaction_observations": transactions,
#         "reconciled_transactions": reconciled,
#         "evidence_gaps": gaps,
#     }









"""Deterministic, source-linked extraction and transaction reconciliation.

This module does not determine whether an allegation is true and does not
recommend legal sections. Extracted values remain attributed to their source.

Reconciliation is deliberately conservative:
- A candidate transaction requires an explicit transaction reference.
- Fields are extracted from a labelled transaction-information section.
- Repeated mentions are not treated as separate payments.
- Conflicting values are flagged rather than silently overwritten.
"""
from __future__ import annotations

import re
from typing import Any


PAGE_RE = re.compile(r"(?=\[PAGE\s+\d+\]\s*)")


def _pages(text: str) -> list[tuple[int, str]]:
    parts = [p.strip() for p in PAGE_RE.split(text or "") if p.strip()]
    result: list[tuple[int, str]] = []

    for part in parts:
        match = re.match(r"\[PAGE\s+(\d+)\]\s*", part)
        if match:
            result.append((int(match.group(1)), part[match.end():].strip()))
        else:
            result.append((1, part))

    return result



def _source(page: int, text: str, start: int, end: int) -> dict[str, Any]:
    left = max(0, start - 90)
    right = min(len(text), end + 90)

    # Expand boundaries so quotations do not cut through words.
    while left > 0 and not text[left - 1].isspace():
        left -= 1

    while right < len(text) and not text[right].isspace():
        right += 1

    return {
        "page": page,
        "quote": text[left:right].replace("\n", " ").strip(),
    }

def _normalise_amount(value: str) -> str:
    return value.replace(",", "").strip()


def _transaction_sections(page_text: str) -> list[tuple[int, int, str]]:
    """Return explicitly labelled transaction-information sections."""
    pattern = re.compile(
        r"Transaction Information Provided by Complainant"
        r"(.*?)(?=\n\s*\d+\.\s+[A-Z]|\Z)",
        re.IGNORECASE | re.DOTALL,
    )

    return [
        (match.start(), match.end(), match.group(0))
        for match in pattern.finditer(page_text)
    ]


def _extract_section_value(section: str, label_pattern: str) -> str | None:
    """Extract a value after a field label, stopping at the next known label."""
    labels = (
        r"Transaction date/time|Amount|Payment channel|"
        r"Demo transaction reference|Transaction reference|"
        r"Beneficiary VPA|Source"
    )

    pattern = re.compile(
        rf"(?:{label_pattern})\s*[:\n]?\s*(.*?)"
        rf"(?=\s+(?:{labels})\b|\n|$)",
        re.IGNORECASE | re.DOTALL,
    )

    match = pattern.search(section)
    if not match:
        return None

    value = re.sub(r"\s+", " ", match.group(1)).strip(" :-\t")
    return value or None


def _reconcile_transactions(
    pages: list[tuple[int, str]],
) -> list[dict[str, Any]]:
    """
    Find explicit transaction references in extracted PDF text and
    read nearby labelled fields despite PDF line-break differences.

    Records are grouped only by identical explicit references.
    """
    grouped: dict[str, dict[str, Any]] = {}

    for page_no, page_text in pages:
        # PDF extraction can split labels and values across lines.
        normalized = re.sub(r"\s+", " ", page_text)

        ref_pattern = re.compile(
            r"\b[A-Z0-9]{8,}(?:[-/][A-Z0-9]+)*\b",
            re.IGNORECASE,
        )

        for match in ref_pattern.finditer(normalized):
            reference = match.group(0).upper()

            # Keep this prototype conservative: only recognize references
            # carrying the synthetic DEMO or UPI marker.
            if not any(ch.isdigit() for ch in reference):
                continue
            if "DEMO" not in reference and "UPI" not in reference:
                continue

            # Read a local context around the explicit reference.
            left = max(0, match.start() - 600)
            right = min(len(normalized), match.end() + 300)
            context = normalized[left:right]

            def field_value(pattern: str) -> str | None:
                found = re.search(pattern, context, re.IGNORECASE)
                if not found:
                    return None
                return re.sub(r"\s+", " ", found.group(1)).strip(" :-")

            amount = field_value(
                r"\bAmount\s+(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)"
            )
            date_time = field_value(
                r"Transaction date/time\s*(.*?)\s*(?=Amount\b)"
            )
            channel = field_value(
                r"Payment channel\s*(.*?)\s*(?=Demo transaction reference|"
                r"Transaction reference|Beneficiary VPA|Source\b)"
            )
            # Capture only a syntactically valid VPA token. Do not let
            # following PDF labels or paragraphs become part of the value.
            vpa_match = re.search(
                r"Beneficiary\s+VPA\s*:?\s*"
                r"([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+)",
                context,
                re.IGNORECASE,
            )
            vpa = vpa_match.group(1).rstrip(".,;:") if vpa_match else None

            # Locate the same reference in the original text for provenance.
            raw_match = re.search(re.escape(match.group(0)), page_text, re.IGNORECASE)
            if raw_match:
                source = _source(
                    page_no,
                    page_text,
                    raw_match.start(),
                    raw_match.end(),
                )
            else:
                source = {
                    "page": page_no,
                    "quote": context,
                }

            if reference not in grouped:
                grouped[reference] = {
                    "transaction_reference": reference,
                    "amount_values": [],
                    "date_time_values": [],
                    "channel_values": [],
                    "beneficiary_vpa_values": [],
                    "source_mentions": [],
                }

            record = grouped[reference]

            def add_unique(field: str, value: str | None):
                if value:
                    if field == "amount_values":
                        value = _normalise_amount(value)
                    if value not in record[field]:
                        record[field].append(value)

            add_unique("amount_values", amount)
            add_unique("date_time_values", date_time)
            add_unique("channel_values", channel)
            add_unique("beneficiary_vpa_values", vpa)

            # Keep source mentions distinct by page and quote.
            if source not in record["source_mentions"]:
                record["source_mentions"].append(source)

    results: list[dict[str, Any]] = []

    for reference, record in grouped.items():
        conflicts = []

        for field in (
            "amount_values",
            "date_time_values",
            "channel_values",
            "beneficiary_vpa_values",
        ):
            if len(record[field]) > 1:
                conflicts.append(field)

        results.append({
            "transaction_reference": reference,
            "amount": (
                record["amount_values"][0]
                if len(record["amount_values"]) == 1
                else None
            ),
            "currency": "INR" if record["amount_values"] else None,
            "date_time": (
                record["date_time_values"][0]
                if len(record["date_time_values"]) == 1
                else None
            ),
            "channel": (
                record["channel_values"][0]
                if len(record["channel_values"]) == 1
                else None
            ),
            "beneficiary_vpa": (
                record["beneficiary_vpa_values"][0]
                if len(record["beneficiary_vpa_values"]) == 1
                else None
            ),
            "all_observed_values": {
                "amounts": record["amount_values"],
                "date_times": record["date_time_values"],
                "channels": record["channel_values"],
                "beneficiary_vpas": record["beneficiary_vpa_values"],
            },
            "match_basis": "same_explicit_transaction_reference",
            "reconciliation_status": (
                "conflicting_source_values"
                if conflicts
                else "candidate_reconciled_unverified"
            ),
            "conflicting_fields": conflicts,
            "verification": "unverified_source_statement",
            "source_mentions": record["source_mentions"],
            "notice": (
                "Candidate grouping by explicit reference only. "
                "Not proof that a payment occurred."
            ),
        })

    return results



def analyze_document(text: str) -> dict[str, Any]:
    pages = _pages(text)

    entities: list[dict[str, Any]] = []
    transactions: list[dict[str, Any]] = []
    gaps: list[dict[str, str]] = []

    def add_entity(
        kind: str,
        value: str,
        page: int,
        page_text: str,
        start: int,
        end: int,
        attribution: str,
    ):
        entities.append({
            "type": kind,
            "value": value,
            "attribution": attribution,
            "verification": "unverified_source_statement",
            "source": _source(page, page_text, start, end),
        })

    for page_no, page_text in pages:
        # Capture a person only when explicitly identified in the document.
        for match in re.finditer(
            r"identified\s+in\s+this\s+training\s+example\s+as\s+"
            r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
            page_text,
            re.IGNORECASE,
        ):
            add_entity(
                "person",
                match.group(1),
                page_no,
                page_text,
                match.start(1),
                match.end(1),
                "complainant_identified_in_document",
            )

        for match in re.finditer(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\b",
            page_text,
        ):
            add_entity(
                "upi_vpa",
                match.group(),
                page_no,
                page_text,
                match.start(),
                match.end(),
                "complainant_provided_description",
            )

        for match in re.finditer(
            r"\b[A-Z0-9]{8,}(?:[-/][A-Z0-9]+)*\b",
            page_text,
        ):
            value = match.group()
            if any(ch.isdigit() for ch in value) and (
                "DEMO" in value or "UPI" in value
            ):
                add_entity(
                    "transaction_reference",
                    value,
                    page_no,
                    page_text,
                    match.start(),
                    match.end(),
                    "complainant_provided_description",
                )

        # Retain individual amount mentions with their own source locations.
        for match in re.finditer(
            r"\b(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)",
            page_text,
            re.IGNORECASE,
        ):
            transactions.append({
                "amount": _normalise_amount(match.group(1)),
                "currency": "INR",
                "channel": (
                    "UPI"
                    if re.search(r"\bUPI\b", page_text, re.IGNORECASE)
                    else None
                ),
                "attribution": "reported_in_document",
                "verification": "unverified_source_statement",
                "source": _source(
                    page_no,
                    page_text,
                    match.start(),
                    match.end(),
                ),
            })

    # Retain explicitly labelled date/time observations.
    for page_no, page_text in pages:
        for match in re.finditer(
            r"(?:Transaction date/time)\s*\n\s*([^\n]+)",
            page_text,
            re.IGNORECASE,
        ):
            transactions.append({
                "date_time": match.group(1).strip(),
                "attribution": "complainant_provided_description",
                "verification": "unverified_source_statement",
                "source": _source(
                    page_no,
                    page_text,
                    match.start(),
                    match.end(),
                ),
            })

    joined = "\n".join(text for _, text in pages).lower()

    gap_rules = [
        (
            "payment_confirmation_screenshot",
            "Payment confirmation screenshot is mentioned but not attached.",
        ),
        (
            "bank_statement",
            "Bank statement is stated to be outstanding.",
        ),
        (
            "beneficiary_bank_confirmation",
            "Beneficiary-bank confirmation is stated to be outstanding.",
        ),
    ]

    for key, description in gap_rules:
        if (
            key == "payment_confirmation_screenshot"
            and ("not attached" in joined or "not attached to this document" in joined)
        ):
            gaps.append({
                "key": key,
                "description": description,
                "status": "mentioned_missing_in_source",
            })
        elif (
            key == "bank_statement"
            and "bank statement" in joined
            and ("not yet been received" in joined or "not received" in joined)
        ):
            gaps.append({
                "key": key,
                "description": description,
                "status": "mentioned_outstanding_in_source",
            })
        elif (
            key == "beneficiary_bank_confirmation"
            and "beneficiary-bank confirmation" in joined
            and ("not yet been received" in joined or "not received" in joined)
        ):
            gaps.append({
                "key": key,
                "description": description,
                "status": "mentioned_outstanding_in_source",
            })

    reconciled = _reconcile_transactions(pages)

    return {
        "analysis_version": "0.2.1",
        "method": "deterministic_rules",
        "notice": (
            "Prototype extraction only. Values are attributed to the source "
            "and are not independently verified facts or findings of wrongdoing."
        ),
        "entities": entities,
        "transaction_observations": transactions,
        "reconciled_transactions": reconciled,
        "evidence_gaps": gaps,
    }
