import os, hashlib, uuid
from pathlib import Path
import fitz
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from sqlalchemy import create_engine, String, Text, Integer, ForeignKey, DateTime, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker, Session
from datetime import datetime, timezone
import json
import re
from .intelligence import analyze_document

DB_URL = os.getenv("DATABASE_URL", "sqlite:///./nyaya.db")
connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}
engine = create_engine(DB_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
STORAGE = Path(os.getenv("STORAGE_DIR", "./storage")); STORAGE.mkdir(parents=True, exist_ok=True)
MAX_BYTES = 20 * 1024 * 1024

class Base(DeclarativeBase): pass

class Case(Base):
    __tablename__ = "cases"
    id: Mapped[int] = mapped_column(primary_key=True)
    case_number: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    case_type: Mapped[str] = mapped_column(String(80), default="online_financial_fraud")
    status: Mapped[str] = mapped_column(String(30), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    documents: Mapped[list["Evidence"]] = relationship(back_populates="case", cascade="all, delete-orphan")

class Evidence(Base):
    __tablename__ = "evidence"
    id: Mapped[int] = mapped_column(primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    filename: Mapped[str] = mapped_column(String(255))
    stored_name: Mapped[str] = mapped_column(String(255), unique=True)
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    size_bytes: Mapped[int] = mapped_column(Integer)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="stored")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    analysis_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    analyzed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    case: Mapped[Case] = relationship(back_populates="documents")


class InvestigationTask(Base):
    __tablename__ = "investigation_tasks"
    id: Mapped[int] = mapped_column(primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    gap_key: Mapped[str] = mapped_column(String(100), index=True)
    title: Mapped[str] = mapped_column(String(240))
    description: Mapped[str] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String(20), default="medium")
    status: Mapped[str] = mapped_column(String(40), default="open")
    trigger_evidence_ids: Mapped[str] = mapped_column(Text, default="[]")
    officer_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class InvestigationTaskAudit(Base):
    __tablename__ = "investigation_task_audit"
    id: Mapped[int] = mapped_column(primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("investigation_tasks.id"), index=True)
    action: Mapped[str] = mapped_column(String(60))
    from_status: Mapped[str | None] = mapped_column(String(40), nullable=True)
    to_status: Mapped[str | None] = mapped_column(String(40), nullable=True)
    officer_name: Mapped[str] = mapped_column(String(160))
    officer_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    related_evidence_ids: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


Base.metadata.create_all(engine)

# Preserve a clearly labelled baseline for tasks created before audit logging.
# This records the current state only; it does not invent historical actors or timestamps.
with SessionLocal() as audit_seed_db:
    existing_tasks = list(audit_seed_db.scalars(select(InvestigationTask)).all())
    for existing_task in existing_tasks:
        has_history = audit_seed_db.scalar(
            select(InvestigationTaskAudit.id).where(
                InvestigationTaskAudit.task_id == existing_task.id
            ).limit(1)
        )
        if not has_history:
            audit_seed_db.add(InvestigationTaskAudit(
                case_id=existing_task.case_id,
                task_id=existing_task.id,
                action="legacy_state_snapshot",
                from_status=None,
                to_status=existing_task.status,
                officer_name="NYAYA ONE system (pre-audit baseline)",
                officer_note="Current task state captured when audit logging was introduced. Earlier actor and change time are unavailable; this is not a historical officer action.",
                related_evidence_ids=existing_task.trigger_evidence_ids or "[]",
            ))
    audit_seed_db.commit()

# Lightweight additive migration for existing SQLite prototype databases.
# Safe to run repeatedly; does not alter or delete existing evidence.
if DB_URL.startswith("sqlite"):
    with engine.begin() as conn:
        columns = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(evidence)").fetchall()}
        if "analysis_json" not in columns:
            conn.exec_driver_sql("ALTER TABLE evidence ADD COLUMN analysis_json TEXT")
        if "analyzed_at" not in columns:
            conn.exec_driver_sql("ALTER TABLE evidence ADD COLUMN analyzed_at DATETIME")
app = FastAPI(title="NYAYA ONE API", version="0.3.0", description="Synthetic-data development POC")
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_headers=["*"])

def db_session():
    db = SessionLocal()
    try: yield db
    finally: db.close()

class CaseCreate(BaseModel):
    case_number: str
    title: str
    case_type: str = "online_financial_fraud"

class CaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    case_number: str
    title: str
    case_type: str
    status: str

class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    case_id: int
    filename: str
    sha256: str
    size_bytes: int
    extracted_text: str | None
    status: str


class TaskStatusUpdate(BaseModel):
    status: str
    officer_name: str
    officer_note: str | None = None

class InvestigationTaskOut(BaseModel):
    id: int
    case_id: int
    gap_key: str
    title: str
    description: str
    priority: str
    status: str
    trigger_evidence_ids: list[int]
    officer_note: str | None
    created_at: datetime
    updated_at: datetime


@app.get("/health")
def health(): return {"status": "ok"}

@app.post("/api/cases", response_model=CaseOut, status_code=201)
def create_case(payload: CaseCreate, db: Session = Depends(db_session)):
    if db.scalar(select(Case).where(Case.case_number == payload.case_number)):
        raise HTTPException(409, "Case number already exists")
    obj = Case(**payload.model_dump()); db.add(obj); db.commit(); db.refresh(obj)
    return obj

@app.get("/api/cases", response_model=list[CaseOut])
def list_cases(db: Session = Depends(db_session)):
    return list(db.scalars(select(Case).order_by(Case.id.desc())).all())

@app.post("/api/cases/{case_id}/documents", response_model=EvidenceOut, status_code=201)
async def upload_document(case_id: int, file: UploadFile = File(...), db: Session = Depends(db_session)):
    case = db.get(Case, case_id)
    if not case: raise HTTPException(404, "Case not found")
    filename = Path(file.filename or "upload.bin").name
    suffix = Path(filename).suffix.lower()
    if suffix != ".pdf": raise HTTPException(415, "Milestone 1 accepts PDF files only")
    data = await file.read()
    if not data: raise HTTPException(400, "Empty file")
    if len(data) > MAX_BYTES: raise HTTPException(413, "Maximum upload size is 20 MB")
    stored = f"{uuid.uuid4().hex}.pdf"; path = STORAGE / stored; path.write_bytes(data)
    digest = hashlib.sha256(data).hexdigest()
    try:
        with fitz.open(path) as pdf:
            text = "\n\n".join(f"[PAGE {i+1}]\n{page.get_text('text').strip()}" for i, page in enumerate(pdf))
    except Exception:
        path.unlink(missing_ok=True); raise HTTPException(422, "Invalid or unreadable PDF")
    obj = Evidence(case_id=case_id, filename=filename, stored_name=stored, sha256=digest,
                   size_bytes=len(data), extracted_text=text or None,
                   status="text_extracted" if text.strip() else "scanned_pdf_ocr_pending")
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@app.get("/api/cases/{case_id}/documents", response_model=list[EvidenceOut])
def list_documents(case_id: int, db: Session = Depends(db_session)):
    if not db.get(Case, case_id): raise HTTPException(404, "Case not found")
    return list(db.scalars(select(Evidence).where(Evidence.case_id == case_id).order_by(Evidence.id.desc())).all())


@app.post("/api/cases/{case_id}/documents/{document_id}/analyze")
def analyze_case_document(case_id: int, document_id: int, db: Session = Depends(db_session)):
    """Run deterministic extraction and persist source-linked observations."""
    evidence = db.scalar(select(Evidence).where(Evidence.id == document_id, Evidence.case_id == case_id))
    if not evidence:
        raise HTTPException(404, "Document not found for this case")
    if not evidence.extracted_text:
        raise HTTPException(422, "No extracted text is available; OCR is not implemented yet")
    result = analyze_document(evidence.extracted_text)
    evidence.analysis_json = json.dumps(result, ensure_ascii=False)
    evidence.analyzed_at = datetime.now(timezone.utc)
    db.commit()
    return {"evidence_id": evidence.id, "case_id": case_id, "analyzed_at": evidence.analyzed_at,
            "analysis": result}


@app.get("/api/cases/{case_id}/documents/{document_id}/analysis")
def get_case_document_analysis(case_id: int, document_id: int, db: Session = Depends(db_session)):
    evidence = db.scalar(select(Evidence).where(Evidence.id == document_id, Evidence.case_id == case_id))
    if not evidence:
        raise HTTPException(404, "Document not found for this case")
    if not evidence.analysis_json:
        raise HTTPException(404, "Document has not been analyzed yet")
    return {"evidence_id": evidence.id, "case_id": case_id, "analyzed_at": evidence.analyzed_at,
            "analysis": json.loads(evidence.analysis_json)}


@app.get("/api/cases/{case_id}/money-trail")
def get_case_money_trail(case_id: int, db: Session = Depends(db_session)):
    """Aggregate candidate transactions across analyzed documents in one case.

    Only exact explicit transaction-reference matches are grouped. This endpoint
    does not establish that a payment occurred or infer downstream movement.
    """
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    documents = list(db.scalars(
        select(Evidence).where(Evidence.case_id == case_id).order_by(Evidence.id.asc())
    ).all())

    grouped: dict[str, dict] = {}
    analyzed_document_count = 0
    skipped_without_reference = 0

    for doc in documents:
        if not doc.analysis_json:
            continue
        analyzed_document_count += 1
        try:
            analysis = json.loads(doc.analysis_json)
        except (TypeError, json.JSONDecodeError):
            continue

        for tx in analysis.get("reconciled_transactions", []):
            raw_ref = tx.get("transaction_reference")
            if not raw_ref or not str(raw_ref).strip():
                skipped_without_reference += 1
                continue

            ref = str(raw_ref).strip()
            key = ref.upper()
            if key not in grouped:
                grouped[key] = {
                    "transaction_reference": ref,
                    "documents": [],
                    "amounts": [],
                    "date_times": [],
                    "channels": [],
                    "beneficiary_vpas": [],
                    "source_mentions": [],
                }

            group = grouped[key]
            group["documents"].append({
                "evidence_id": doc.id,
                "filename": doc.filename,
                "sha256": doc.sha256,
                "reconciliation_status": tx.get("reconciliation_status", "candidate_reconciled_unverified"),
                "verification": tx.get("verification", "unverified_source_statement"),
            })

            values = {
                "amounts": tx.get("all_observed_values", {}).get("amounts") or ([tx["amount"]] if tx.get("amount") is not None else []),
                "date_times": tx.get("all_observed_values", {}).get("date_times") or ([tx["date_time"]] if tx.get("date_time") else []),
                "channels": tx.get("all_observed_values", {}).get("channels") or ([tx["channel"]] if tx.get("channel") else []),
                "beneficiary_vpas": tx.get("all_observed_values", {}).get("beneficiary_vpas") or ([tx["beneficiary_vpa"]] if tx.get("beneficiary_vpa") else []),
            }
            for field, items in values.items():
                for item in items:
                    if item is not None and str(item).strip() and str(item) not in group[field]:
                        group[field].append(str(item))

            for mention in tx.get("source_mentions", []):
                group["source_mentions"].append({
                    "evidence_id": doc.id,
                    "filename": doc.filename,
                    "page": mention.get("page"),
                    "quote": mention.get("quote", ""),
                })

    results = []
    for group in grouped.values():
        unique_doc_ids = sorted({d["evidence_id"] for d in group["documents"]})
        conflicts = [
            field for field in ("amounts", "date_times", "channels", "beneficiary_vpas")
            if len(group[field]) > 1
        ]
        cross_doc = len(unique_doc_ids) > 1
        results.append({
            **group,
            "distinct_document_count": len(unique_doc_ids),
            "match_status": (
                "cross_document_candidate_match_with_conflicts" if cross_doc and conflicts
                else "cross_document_candidate_match" if cross_doc
                else "single_document_candidate"
            ),
            "match_basis": "same_explicit_transaction_reference",
            "conflicting_fields": conflicts,
            "verification": "unverified_candidate",
            "officer_review_required": True,
            "notice": (
                "Documents share an explicit transaction reference. This is a candidate match, "
                "not independent proof that a payment occurred, that the records are authentic, "
                "or that the named beneficiary controls an account."
            ),
        })

    results.sort(key=lambda item: item["transaction_reference"])
    return {
        "case_id": case_id,
        "case_number": case.case_number,
        "document_count": len(documents),
        "analyzed_document_count": analyzed_document_count,
        "candidate_transaction_count": len(results),
        "skipped_transactions_without_explicit_reference": skipped_without_reference,
        "matching_policy": "Exact explicit transaction-reference grouping only; no fuzzy matching.",
        "transactions": results,
    }


@app.get("/api/cases/{case_id}/evidence-gaps")
def get_case_evidence_gaps(case_id: int, db: Session = Depends(db_session)):
    """Compare source-reported evidence gaps with files currently uploaded in the case.

    Presence is not authenticity or sufficiency: received items remain unverified.
    Document classification uses explicit filename/text cues only.
    """
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    documents = list(db.scalars(
        select(Evidence).where(Evidence.case_id == case_id).order_by(Evidence.id.asc())
    ).all())

    gap_catalog = {
        "payment_confirmation_screenshot": "Payment confirmation screenshot",
        "bank_statement": "Bank statement",
        "beneficiary_bank_confirmation": "Beneficiary-bank confirmation",
    }

    # Only include gaps actually raised by a source analysis.
    source_gaps: dict[str, list[dict]] = {}
    for doc in documents:
        if not doc.analysis_json:
            continue
        try:
            analysis = json.loads(doc.analysis_json)
        except (TypeError, json.JSONDecodeError):
            continue
        for gap in analysis.get("evidence_gaps", []):
            key = gap.get("key")
            if key:
                source_gaps.setdefault(key, []).append({
                    "evidence_id": doc.id,
                    "filename": doc.filename,
                    "source_status": gap.get("status"),
                    "description": gap.get("description"),
                })

    def classify_received(doc: Evidence, gap_key: str) -> bool:
        filename = (doc.filename or "").lower().replace("-", " ").replace("_", " ")
        body = (doc.extracted_text or "").lower()
        if gap_key == "bank_statement":
            filename_match = "bank" in filename and "statement" in filename
            content_match = (
                "account statement" in body
                and ("transaction reference" in body or "transaction details" in body)
            )
            return filename_match or content_match
        if gap_key == "payment_confirmation_screenshot":
            return "payment" in filename and ("screenshot" in filename or "confirmation" in filename)
        if gap_key == "beneficiary_bank_confirmation":
            return (
                "beneficiary bank confirmation" in filename
                or "confirmation from beneficiary bank" in body
                or "beneficiary bank response" in body
            )
        return False

    gaps = []
    for key, source_records in source_gaps.items():
        matching_docs = [
            doc for doc in documents
            if classify_received(doc, key)
        ]
        gaps.append({
            "key": key,
            "label": gap_catalog.get(key, key.replace("_", " ").title()),
            "description": source_records[0].get("description") or gap_catalog.get(key, key),
            "status": "received_in_case_unverified" if matching_docs else (
                source_records[0].get("source_status") or "outstanding_in_source"
            ),
            "source_documents": [
                {"evidence_id": r["evidence_id"], "filename": r["filename"],
                 "status": r["source_status"]}
                for r in source_records
            ],
            "received_documents": [
                {"evidence_id": d.id, "filename": d.filename,
                 "sha256": d.sha256, "analyzed": bool(d.analysis_json)}
                for d in matching_docs
            ],
            "officer_review_required": True,
            "notice": (
                "A file matching the document-type cues is present in this case. "
                "Its authenticity, completeness, and evidentiary sufficiency have not been verified."
                if matching_docs else
                "The source reported this item as missing or outstanding, and no matching uploaded file was detected."
            ),
        })

    return {
        "case_id": case_id,
        "case_number": case.case_number,
        "document_count": len(documents),
        "gaps": gaps,
        "classification_policy": "Filename and explicit text cues only; file presence is not verification.",
    }



class CaseQuestion(BaseModel):
    question: str
    language: str = "auto"
    include_evidence_ids: list[int] | None = None
    history: list[dict[str, str]] = []


def _assistant_page_chunks(doc: Evidence) -> list[dict]:
    """Split extracted text into page-aware paragraphs for source retrieval."""
    chunks = []
    current_page = 1
    for block in re.split(r"(?=\[PAGE\s+\d+\])", doc.extracted_text or ""):
        page_match = re.match(r"\[PAGE\s+(\d+)\]\s*", block)
        if page_match:
            current_page = int(page_match.group(1))
            block = block[page_match.end():]
        for paragraph in re.split(r"\n\s*\n", block):
            paragraph = re.sub(r"\s+", " ", paragraph).strip()
            if len(paragraph) >= 25:
                chunks.append({
                    "evidence_id": doc.id,
                    "filename": doc.filename,
                    "page": current_page,
                    "text": paragraph[:1800],
                })
    return chunks


def _assistant_retrieve(question: str, documents: list[Evidence], limit: int = 6) -> list[dict]:
    """Case-scoped lexical retrieval with numeric normalization and page citations."""
    def normalize(value: str) -> str:
        value = re.sub(r"(?<=\d)[,，](?=\d)", "", value.lower())
        value = value.replace("₹", " rs ").replace("inr", " rs ")
        return value

    normalized_question = normalize(question)
    tokens = set(re.findall(r"[a-zA-Z0-9]+|[\u0900-\u097F]+", normalized_question))
    stop = {
        "what", "which", "when", "where", "who", "how", "does", "did", "the",
        "and", "for", "from", "with", "about", "this", "that", "are", "was",
        "है", "हैं", "क्या", "कब", "कहाँ", "कैसे", "कौन", "और", "के", "की",
        "का", "में", "से", "पर", "बताइए", "बताएं", "मुझे", "इस", "उस",
    }
    tokens = {t for t in tokens if len(t) > 1 and t not in stop}
    candidates = []
    for doc in documents:
        for chunk in _assistant_page_chunks(doc):
            normalized_text = normalize(chunk["text"])
            haystack = set(re.findall(r"[a-zA-Z0-9]+|[\u0900-\u097F]+", normalized_text))
            hits = tokens.intersection(haystack)
            if hits:
                # Slightly prioritize exact numeric references/amounts and longer terms.
                score = len(hits) + sum(0.35 for t in hits if len(t) >= 6)
                candidates.append({**chunk, "score": score})
    candidates.sort(key=lambda x: (-x["score"], x["evidence_id"], x["page"]))
    return candidates[:limit]



def _optional_groq_answer(
    question: str,
    passages: list[dict],
    language: str,
    history: list[dict[str, str]]
) -> str | None:
    """Generate a concise, source-grounded answer using Groq."""

    api_key = os.getenv("GROQ_API_KEY", "").strip()
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()

    if not api_key:
        print("[GROQ] API key is missing.")
        return None
    if not passages:
        print("[GROQ] No retrieved passages supplied.")
        return None

    try:
        from groq import Groq

        context = "\n\n".join(
            f"[Evidence {p['evidence_id']} | {p['filename']} | page {p['page']}]\n{p['text']}"
            for p in passages
        )
        lang_instruction = (
            "Answer in Hindi." if language == "hi"
            else "Answer in English." if language == "en"
            else "Answer in the same language as the user's question."
        )
        system_instruction = (
            "You are NYAYA ONE, a cautious financial cybercrime investigation assistant. "
            "Answer using ONLY the supplied case-document excerpts. Give a concise direct answer first. "
            "Cite factual statements with exact source labels such as [Evidence 2, page 1]. "
            "Do not invent facts, identities, account ownership, transactions, legal provisions, "
            "statutory deadlines, or onward fund movement. Treat document statements as unverified "
            "source-reported information. A matching transaction reference is not proof of payment "
            "or authenticity. If sources do not answer, say so. Do not provide legal interpretation; "
            "explain that a reviewed legal knowledge base is not connected when legal interpretation "
            "is requested. Never claim to have independently authenticated evidence. "
            + lang_instruction
        )

        messages = [{"role": "system", "content": system_instruction}]
        for turn in (history or [])[-6:]:
            role = "assistant" if turn.get("role") == "assistant" else "user"
            previous_text = str(turn.get("content", ""))[:1200]
            if previous_text.strip():
                messages.append({"role": role, "content": previous_text})

        messages.append({
            "role": "user",
            "content": f"CURRENT QUESTION:\n{question}\n\nCASE DOCUMENT EXCERPTS:\n{context}",
        })

        print(f"[GROQ] Sending request using model: {model}")
        client = Groq(api_key=api_key, timeout=45.0, max_retries=1)
        completion = client.chat.completions.create(
            messages=messages,
            model=model,
            temperature=0.15,
            max_completion_tokens=900,
        )
        answer = completion.choices[0].message.content
        if not isinstance(answer, str) or not answer.strip():
            print("[GROQ] Response contains no usable text.")
            return None

        answer = answer.strip()
        print("[GROQ] Generation successful.")
        print("[GROQ] Output characters:", len(answer))
        return answer

    except ImportError:
        print("[GROQ] Python SDK is not installed. Run: python -m pip install groq")
        return None
    except Exception as exc:
        print("[GROQ ERROR]")
        print("Type:", type(exc).__name__)
        print("Details:", str(exc)[:1200])
        return None

@app.get("/api/cases/{case_id}/assistant/context")
def get_case_assistant_context(case_id: int, db: Session = Depends(db_session)):
    """Return every document attached to this case for the chatbot's attachment tray."""
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    documents = list(db.scalars(
        select(Evidence).where(Evidence.case_id == case_id).order_by(Evidence.id.asc())
    ).all())
    return {
        "case_id": case_id,
        "case_number": case.case_number,
        "documents": [{
            "evidence_id": d.id,
            "filename": d.filename,
            "status": d.status,
            "analyzed": bool(d.extracted_text),
            "searchable": bool((d.extracted_text or "").strip()),
            "uploaded_at": d.uploaded_at,
        } for d in documents],
        "notice": "All listed files belong to this case. Only extracted text is searchable; file presence does not authenticate evidence.",
    }



@app.post("/api/cases/{case_id}/assistant")
def ask_case_assistant(case_id: int, payload: CaseQuestion, db: Session = Depends(db_session)):
    """Retrieve case evidence and generate cited answers using Groq."""

    question = payload.question.strip()

    if not question:
        raise HTTPException(400, "Please enter a question.")

    if len(question) > 2000:
        raise HTTPException(413, "Question is too long (maximum 2,000 characters).")

    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    query = select(Evidence).where(Evidence.case_id == case_id)

    if payload.include_evidence_ids is not None:
        allowed_ids = set(payload.include_evidence_ids)
        query = (
            query.where(Evidence.id.in_(allowed_ids))
            if allowed_ids
            else query.where(Evidence.id == -1)
        )

    documents = list(
        db.scalars(query.order_by(Evidence.id.asc())).all()
    )

    # 1. Handle simple greetings without searching case evidence.
    is_greeting = bool(re.fullmatch(
        r"\s*(hi|hello|hey|namaste|नमस्ते|नमस्कार|हाय)\s*[!.।]*\s*",
        question,
        re.IGNORECASE
    ))

    if is_greeting:
        is_hindi = bool(re.search(r"[\u0900-\u097F]", question))

        greeting = (
            "नमस्कार! मैं NYAYA ONE हूँ। "
            "आप इस केस के दस्तावेज़ों, लेन-देन, समयरेखा "
            "और उपलब्ध साक्ष्यों के बारे में हिंदी या अंग्रेज़ी में "
            "प्रश्न पूछ सकते हैं।"
            if is_hindi else
            "Hello! I'm NYAYA ONE, your case-aware investigation assistant. "
            "You can ask me about case documents, transactions, timelines, "
            "and available evidence in Hindi or English."
        )

        return {
            "case_id": case_id,
            "case_number": case.case_number,
            "question": question,
            "answer": greeting,
            "answer_mode": "greeting",
            "model_configured": bool(os.getenv("GROQ_API_KEY")),
            "attached_document_count": len(documents),
            "sources": [],
            "notice": "Greeting response. Case evidence has not been searched."
        }

    # 2. Retrieve relevant passages from selected case documents.
    passages = _assistant_retrieve(question, documents)
    print("[RETRIEVAL DEBUG] Question:", question)
    print("[RETRIEVAL DEBUG] Retrieved passages:", len(passages))

    # 3. Preserve the legal knowledge-base safeguard.
    legal_terms = re.search(
        r"\b(section|legal|law|bnss|bns|bsa|धारा|कानून|कानूनी|किस धारा)\b",
        question,
        re.IGNORECASE
    )

    used_model = False

    if legal_terms:
        answer = (
            "A reviewed legal knowledge base is not connected yet. "
            "I cannot provide or guess legal sections, statutory interpretations, "
            "or deadlines. Please verify legal questions against current authoritative sources."
        )

        if re.search(r"[\u0900-\u097F]", question):
            answer = (
                "समीक्षित कानूनी ज्ञान-आधार अभी जुड़ा नहीं है। "
                "मैं कानूनी धाराएँ, व्याख्या या समय-सीमाएँ अनुमान से नहीं बताऊँगा। "
                "कृपया आधिकारिक स्रोतों से पुष्टि करें।"
            )

    # 4. Handle questions with no supporting evidence.
    elif not passages:
        answer = (
            "I could not find supporting text in the selected, text-extracted documents "
            "for this case. Try a transaction reference, amount, date, beneficiary "
            "identifier, or document-specific question. Scanned PDFs without OCR "
            "are not searchable yet."
        )

        if re.search(r"[\u0900-\u097F]", question):
            answer = (
                "चुने गए टेक्स्ट-निकाले गए दस्तावेज़ों में इस प्रश्न का समर्थन करने वाला "
                "अंश नहीं मिला। लेन-देन संदर्भ, राशि, तारीख़ या दस्तावेज़ के बारे में पूछें। "
                "OCR के बिना स्कैन किए गए PDF खोजे नहीं जा सकते।"
            )

    # 5. Generate a source-grounded answer using Groq.
    else:
        language = (
            payload.language
            if payload.language in ("hi", "en")
            else "auto"
        )

        answer = _optional_groq_answer(
            question,
            passages,
            language,
            payload.history
        )

        used_model = bool(answer)

        # 6. Deterministic fallback if Groq is unavailable.
        if not answer:
            is_hindi = bool(re.search(r"[\u0900-\u097F]", question))

            lead = (
                "मुझे ये संबंधित स्रोत-अंश मिले, लेकिन AI उत्तर सेवा उपलब्ध नहीं है। "
                "इनकी स्वतंत्र पुष्टि नहीं हुई है:"
                if is_hindi else
                "I found these relevant source passages, but AI generation is unavailable. "
                "They are not independently verified:"
            )

            answer = lead + "\n" + "\n".join(
                f"- Evidence {p['evidence_id']}, page {p['page']}: "
                f"{p['text'][:360]}"
                for p in passages[:3]
            )

    # 7. Return answer with source references.
    return {
        "case_id": case_id,
        "case_number": case.case_number,
        "question": question,
        "answer": answer,
        "answer_mode": "groq_rag" if used_model else "retrieval_only",
        "model_configured": bool(os.getenv("GROQ_API_KEY")),
        "attached_document_count": len(documents),
        "sources": [
            {
                "evidence_id": p["evidence_id"],
                "filename": p["filename"],
                "page": p["page"],
                "excerpt": p["text"][:700],
            }
            for p in passages
        ],
        "notice": (
            "Prototype assistance using selected case documents. "
            "Citations identify retrieved text, not authenticated evidence. "
            "Groq hosted model processing is external; use synthetic demo data only. "
            "Officer review is required."
        ),
    }



TASK_CATALOG = {
    "payment_confirmation_screenshot": {
        "title": "Obtain and preserve payment confirmation",
        "description": "The source document mentions a payment confirmation screenshot that was not attached. Obtain the original file from the complainant through the approved process, preserve the received original, record its source, and have the investigating officer review it.",
        "priority": "high",
    },
    "bank_statement": {
        "title": "Obtain and review complainant bank statement",
        "description": "Obtain the relevant bank statement for the reported transaction period. A matching file is now present in the case; the officer should review its completeness, source, and relevant entries. File presence alone is not verification.",
        "priority": "high",
    },
    "beneficiary_bank_confirmation": {
        "title": "Seek beneficiary-bank confirmation",
        "description": "The source reports beneficiary-bank confirmation as outstanding. Prepare and route an appropriate request through the authorized officer and applicable procedure. Do not treat a complainant-side statement as beneficiary-bank confirmation.",
        "priority": "high",
    },
}

def _case_gaps_for_tasks(case_id: int, db: Session) -> list[dict]:
    """Reuse the case evidence-gap endpoint's source and upload classification."""
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    documents = list(db.scalars(
        select(Evidence).where(Evidence.case_id == case_id).order_by(Evidence.id.asc())
    ).all())

    source_gaps: dict[str, list[dict]] = {}
    for doc in documents:
        if not doc.analysis_json:
            continue
        try:
            analysis = json.loads(doc.analysis_json)
        except (TypeError, json.JSONDecodeError):
            continue
        for gap in analysis.get("evidence_gaps", []):
            key = gap.get("key")
            if key:
                source_gaps.setdefault(key, []).append(gap)

    def received_for(key: str, doc: Evidence) -> bool:
        filename = (doc.filename or "").lower().replace("-", " ").replace("_", " ")
        body = (doc.extracted_text or "").lower()
        if key == "bank_statement":
            return ("bank" in filename and "statement" in filename) or (
                "account statement" in body and ("transaction reference" in body or "transaction details" in body)
            )
        if key == "payment_confirmation_screenshot":
            return "payment" in filename and ("screenshot" in filename or "confirmation" in filename)
        if key == "beneficiary_bank_confirmation":
            return "beneficiary bank confirmation" in filename or "confirmation from beneficiary bank" in body or "beneficiary bank response" in body
        return False

    result = []
    for key, records in source_gaps.items():
        matching = [d for d in documents if received_for(key, d)]
        result.append({
            "key": key,
            "received": bool(matching),
            "received_evidence_ids": [d.id for d in matching],
            "source_descriptions": [g.get("description") for g in records if g.get("description")],
        })
    return result

def _task_out(task: InvestigationTask) -> dict:
    return {
        "id": task.id,
        "case_id": task.case_id,
        "gap_key": task.gap_key,
        "title": task.title,
        "description": task.description,
        "priority": task.priority,
        "status": task.status,
        "trigger_evidence_ids": json.loads(task.trigger_evidence_ids or "[]"),
        "officer_note": task.officer_note,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
    }

@app.post("/api/cases/{case_id}/tasks/sync")
def sync_investigation_tasks(case_id: int, db: Session = Depends(db_session)):
    """Create tasks from source gaps and flag tasks when matching files arrive.
    Never auto-completes a task; officer review/action is required.
    """
    if not db.get(Case, case_id):
        raise HTTPException(404, "Case not found")
    gaps = _case_gaps_for_tasks(case_id, db)
    existing = {
        task.gap_key: task
        for task in db.scalars(select(InvestigationTask).where(InvestigationTask.case_id == case_id)).all()
    }
    created = 0
    updated = 0
    for gap in gaps:
        key = gap["key"]
        spec = TASK_CATALOG.get(key)
        if not spec:
            continue
        task = existing.get(key)
        if task is None:
            task = InvestigationTask(
                case_id=case_id,
                gap_key=key,
                title=spec["title"],
                description=spec["description"],
                priority=spec["priority"],
                status="evidence_received_pending_review" if gap["received"] else "open",
                trigger_evidence_ids=json.dumps(gap["received_evidence_ids"]),
            )
            db.add(task)
            db.flush()
            db.add(InvestigationTaskAudit(
                case_id=case_id, task_id=task.id, action="task_suggested",
                from_status=None, to_status=task.status,
                officer_name="NYAYA ONE system (automated suggestion)",
                officer_note="Suggested from a source-reported evidence gap; requires officer review.",
                related_evidence_ids=json.dumps(gap["received_evidence_ids"]),
            ))
            created += 1
        else:
            new_ids = json.dumps(gap["received_evidence_ids"])
            if gap["received"] and task.status not in ("completed", "evidence_received_pending_review"):
                previous_status = task.status
                task.status = "evidence_received_pending_review"
                task.trigger_evidence_ids = new_ids
                task.updated_at = datetime.now(timezone.utc)
                db.add(InvestigationTaskAudit(
                    case_id=case_id, task_id=task.id, action="evidence_received_flagged",
                    from_status=previous_status, to_status=task.status,
                    officer_name="NYAYA ONE system (automated evidence flag)",
                    officer_note="A matching uploaded file was detected. This is not officer verification.",
                    related_evidence_ids=new_ids,
                ))
                updated += 1
            elif gap["received"] and task.status == "evidence_received_pending_review" and task.trigger_evidence_ids != new_ids:
                task.trigger_evidence_ids = new_ids
                task.updated_at = datetime.now(timezone.utc)
                updated += 1
    db.commit()
    tasks = list(db.scalars(
        select(InvestigationTask).where(InvestigationTask.case_id == case_id).order_by(InvestigationTask.id.asc())
    ).all())
    return {"case_id": case_id, "created": created, "updated": updated, "tasks": [_task_out(t) for t in tasks]}

@app.get("/api/cases/{case_id}/tasks")
def list_investigation_tasks(case_id: int, db: Session = Depends(db_session)):
    if not db.get(Case, case_id):
        raise HTTPException(404, "Case not found")
    tasks = list(db.scalars(
        select(InvestigationTask).where(InvestigationTask.case_id == case_id).order_by(InvestigationTask.id.asc())
    ).all())
    return {"case_id": case_id, "tasks": [_task_out(t) for t in tasks]}

@app.patch("/api/cases/{case_id}/tasks/{task_id}")
def update_investigation_task(case_id: int, task_id: int, payload: TaskStatusUpdate, db: Session = Depends(db_session)):
    allowed = {"open", "in_progress", "evidence_received_pending_review", "completed"}
    if payload.status not in allowed:
        raise HTTPException(400, f"Status must be one of: {', '.join(sorted(allowed))}")
    officer_name = payload.officer_name.strip()
    if not officer_name:
        raise HTTPException(400, "Officer name / identifier is required for an audited status change.")
    task = db.scalar(select(InvestigationTask).where(
        InvestigationTask.id == task_id, InvestigationTask.case_id == case_id
    ))
    if not task:
        raise HTTPException(404, "Task not found")
    previous_status = task.status
    task.status = payload.status
    if payload.officer_note is not None:
        task.officer_note = payload.officer_note
    task.updated_at = datetime.now(timezone.utc)
    db.add(InvestigationTaskAudit(
        case_id=case_id, task_id=task.id, action="status_changed",
        from_status=previous_status, to_status=payload.status,
        officer_name=officer_name,
        officer_note=payload.officer_note,
        related_evidence_ids=task.trigger_evidence_ids or "[]",
    ))
    db.commit()
    db.refresh(task)
    return _task_out(task)


@app.get("/api/cases/{case_id}/tasks/{task_id}/history")
def get_investigation_task_history(case_id: int, task_id: int, db: Session = Depends(db_session)):
    task = db.scalar(select(InvestigationTask).where(
        InvestigationTask.id == task_id, InvestigationTask.case_id == case_id
    ))
    if not task:
        raise HTTPException(404, "Task not found")
    events = list(db.scalars(
        select(InvestigationTaskAudit)
        .where(InvestigationTaskAudit.case_id == case_id, InvestigationTaskAudit.task_id == task_id)
        .order_by(InvestigationTaskAudit.created_at.asc(), InvestigationTaskAudit.id.asc())
    ).all())
    return {
        "case_id": case_id,
        "task_id": task_id,
        "events": [{
            "id": event.id,
            "action": event.action,
            "from_status": event.from_status,
            "to_status": event.to_status,
            "officer_name": event.officer_name,
            "officer_note": event.officer_note,
            "related_evidence_ids": json.loads(event.related_evidence_ids or "[]"),
            "created_at": event.created_at,
        } for event in events],
        "identity_notice": "Officer name is self-reported in this prototype and is not authenticated.",
    }
