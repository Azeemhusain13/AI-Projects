Overview
Financial cybercrime investigations can involve multiple FIRs,
statements, bank records, screenshots and transaction details. Finding
the relevant information, understanding the money trail and tracking
what evidence is still missing can take significant time.

NYAYA ONE is a prototype investigation-support workspace designed to
help investigating officers bring these activities together. It combines
case and evidence management, document extraction, source-grounded AI
assistance, candidate transaction reconciliation and investigation task
tracking.

The assistant supports questions in Hindi and English using selected
documents from the current case. It is designed to show supporting
source references and to acknowledge when the available documents do not
contain an answer.

NYAYA ONE is intended to support---not replace---the judgement,
verification or decision-making authority of an investigating officer.
Prototype notice: This repository represents a development proof
of concept. Demonstrations use synthetic data. It is not an official
Uttar Pradesh Police system and is not approved for operational use or
confidential case information.

Key Features
- Case workspace: Register and view investigation cases in one
  place.
- PDF evidence ingestion: Upload PDF documents, extract available
  text and calculate a SHA-256 fingerprint.
- Document intelligence: Review extracted information and
  source-linked findings.
- Bilingual AI assistance: Ask case-related questions in Hindi or
  English using selected case documents.
- Evidence-aware responses: Show document/page references and
  avoid filling gaps with unsupported facts.
- Financial transaction intelligence: Group candidate transactions
  using exact transaction references and surface observed fields or
  conflicts.
- Evidence-gap tracking: Highlight information or records that
  remain outstanding.
- Investigation tasks: Review suggested tasks, record officer
  actions and inspect task history.
- Guided workflow: Show investigation stages and distinguish
  recorded progress from planned capabilities.
- Separate demo views: Administrator and investigating-officer
  interfaces.
  
Important interpretation safeguards
- A matching transaction reference is a candidate match, not proof
  that a payment occurred.
- Extracted text and AI-generated responses must be checked against
  the original evidence.
- A document being uploaded does not establish its authenticity.
- Legal interpretations should not be relied upon unless supported by
  a reviewed and maintained legal knowledge base.
- Final investigative decisions and approvals remain with authorized
  human officers.
  
Technology Stack
  Layer                               Technology
  Frontend                            React, TypeScript, Vite

  Backend API                         Python, FastAPI

  Data layer                          SQLAlchemy, SQLite (prototype)

  PDF text extraction                 PyMuPDF

  AI generation                       Groq API (optional, configured through environment variables)
Case-document retrieval             Case-scoped lexical retrieval over
extracted document text
The current prototype uses lexical retrieval over selected case
documents. It should not be described as a production vector database or
a fully validated legal RAG system.


Repository Structure
nyaya-one/
├── backend/
│   └── app/
│       ├── main.py
│       └── intelligence.py
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── style.css
│   ├── package.json
│   └── ...
├── assets/
│   └── nyaya-one-hero.png
├── .env.example
└── README.md
Your local repository may contain additional files, database files or
configuration. Keep secrets, real case records, uploaded evidence and
local environment files out of version control.
Getting Started
Prerequisites
- macOS, Linux or Windows
- Python 3.11 or later
- Node.js and npm (Node.js 22 is a suitable development environment)
- A Groq API key only if you want to enable AI-generated answers


Docker is not required for the local prototype.
1. Clone the repository
git clone https://github.com/<your-username>/<your-repository>.git
cd <your-repository>
Replace the URL with your GitHub repository URL.
2. Set up the backend
Open a terminal:
cd backend
python3 -m pip install --upgrade pip
python3 -m pip install fastapi uvicorn sqlalchemy pymupdf python-multipart groq
Start the API:
python3 -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
The backend should be available at:
- API: http://127.0.0.1:8000
- Interactive API documentation: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health
Keep this terminal running.
If your repository includes a maintained requirements.txt, use
python3 -m pip install -r requirements.txt instead of the individual
package command.

3. Set up the frontend
Open a second terminal from the repository root:
cd frontend
npm install
npm run dev
Open the local Vite URL printed in the terminal, typically:
http://localhost:5173
Keep the frontend and backend terminals running while using the
application.
4. Configure Groq (optional)
The case assistant can use Groq for answer generation. Without a valid
API key, the application may use its retrieval-only fallback where
supported.

Set the variables in the environment used to start the backend:
export GROQ_API_KEY="your_groq_api_key"
export GROQ_MODEL="openai/gpt-oss-120b"
Then start or restart the backend in that same terminal.

Alternatively, create a local .env file only if your application setup
explicitly loads it. Do not assume .env is loaded automatically.

Never commit your API key. Keep .env out of Git, and provide only
placeholder values in .env.example.

Example .env.example:
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
Demo Workflow
The repository's demonstration flow uses a fictional case and synthetic
documents.
1. Sign in through the demonstration interface as an investigating
   officer.
2. Open the sample case, if it is present in your local demo database.
3. Review the uploaded synthetic FIR and bank statement.
4. Inspect extracted document text and source-linked findings.
5. Review candidate transaction information and its source references.
6. Open AI Help and ask a question in English or Hindi.
7. Review evidence gaps, suggested tasks and the officer-action
   history.
8. Open the administrator view to see the available case overview.
Example questions for the case assistant
English
What is reported about the ₹50,000 transaction?
Is beneficiary bank confirmation available in the uploaded documents?
What information is missing from the current case records?
हिन्दी
शिकायतकर्ता के खाते से कितनी राशि गई और लेन-देन कब हुआ?
क्या अपलोड किए गए दस्तावेज़ों में लाभार्थी बैंक की पुष्टि उपलब्ध है?
मामले में अभी कौन-से साक्ष्य या जानकारी उपलब्ध नहीं हैं?
The assistant's answer depends on the documents selected for that
question. Verify every answer against the cited source and original
document.
Current Scope and Roadmap
Demonstrated in the prototype
- Case registration and case workspace
- PDF upload, text extraction and SHA-256 fingerprinting
- Case-scoped document retrieval
- Groq-assisted question answering with source references
- Hindi and English question handling
- Candidate transaction grouping using exact references
- Evidence-gap display and investigation task tracking
- Officer action history
- Administrator and officer demonstration interfaces
- Guided investigation workflow

Planned improvements
- OCR for scanned, image-based and handwritten documents, including
  Hindi
- Reviewed, versioned legal knowledge base for BNS, BNSS and BSA with
  precise citations
- Drafting workflows for bank, telecom and platform requests, with
  officer review
- More comprehensive money-trail analysis and related-case discovery
- Deadline and response tracking
- Expanded supervisor dashboards and reporting
- Stronger automated tests, monitoring and deployment hardening
- Security-reviewed deployment on approved India-based infrastructure
- Carefully governed integration with existing police systems such as
  CCTNS
  
Planned items are not represented as completed features.
Security, Privacy and Responsible Use
This is a development prototype, not a certified government application.
- Use synthetic or otherwise explicitly authorized test data only.
- Do not upload real FIRs, personal information, bank records, CDRs,
  credentials or confidential government data to this prototype.
- The optional Groq integration sends prompts and retrieved document
  excerpts to the configured external AI service. Do not use it with
  confidential or personal case data.
- Do not commit API keys, .env files, local databases, uploaded
  evidence or personal data.
- A production deployment would require an approved India-based
  hosting and inference arrangement, access control, encryption,
  secure key management, audit and retention policies, security
  testing and formal authorization.
- AI output is an aid for review, not legal advice, evidence
  authentication or an investigative finding.
  
Contributing
Suggestions, bug reports and improvements are welcome. For substantial
changes, please open an issue first to discuss the proposed approach.
Contributions should preserve source traceability, privacy safeguards
and human review.
