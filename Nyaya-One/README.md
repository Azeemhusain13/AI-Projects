# NYAYA ONE starter — Milestone 1

Development POC only. Use synthetic data only; never upload real case records.

## Run
1. `docker compose up --build`
2. In another terminal: `cd frontend && npm install && npm run dev`
3. Open http://localhost:5173
4. API docs: http://localhost:8000/docs

This starter supports case creation, PDF upload, SHA-256 fingerprinting and embedded PDF text extraction.
Scanned-PDF/image OCR, authentication, legal rules and production security are not yet implemented.
