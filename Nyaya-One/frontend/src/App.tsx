
// import { useEffect, useState, type FormEvent } from "react";
// import axios from "axios";
// import {
//   ShieldCheck,
//   FolderOpen,
//   Upload,
//   FileText,
//   Plus,
//   RefreshCw,
//   Search,
//   AlertTriangle,
//   CheckCircle2,
//   Brain,
//   History,
//   LockKeyhole,
//   UserRound,
//   Users,
//   LayoutDashboard,
//   LogOut,
//   ArrowRight,
//   Shield,
//   Activity,
//   FileSearch,
//   Landmark,
//   Bot,
//   Sparkles,
//   Paperclip,
//   Send,
//   X,
//   MessageCircle,
// } from "lucide-react";

// const API = "http://localhost:8000";

// type CaseItem = {
//   id: number;
//   case_number: string;
//   title: string;
//   case_type: string;
//   status: string;
// };

// type Evidence = {
//   id: number;
//   case_id: number;
//   filename: string;
//   sha256: string;
//   size_bytes: number;
//   extracted_text: string | null;
//   status: string;
// };

// type Source = {
//   page: number;
//   quote: string;
// };

// type Entity = {
//   type: string;
//   value: string;
//   attribution: string;
//   verification: string;
//   source: Source;
// };

// type TransactionObservation = {
//   amount?: string;
//   currency?: string;
//   channel?: string | null;
//   date_time?: string;
//   attribution: string;
//   verification: string;
//   source: Source;
// };

// type EvidenceGap = {
//   key: string;
//   description: string;
//   status: string;
// };

// type ReconciledTransaction = {
//   transaction_reference: string;
//   amount: string | null;
//   currency: string | null;
//   date_time: string | null;
//   channel: string | null;
//   beneficiary_vpa: string | null;
//   all_observed_values: {
//     amounts: string[];
//     date_times: string[];
//     channels: string[];
//     beneficiary_vpas: string[];
//   };
//   match_basis: string;
//   reconciliation_status: string;
//   conflicting_fields: string[];
//   verification: string;
//   source_mentions: Source[];
//   notice: string;
// };


// type CaseMoneyTrailTransaction = {
//   transaction_reference: string;
//   documents: { evidence_id: number; filename: string; sha256: string; reconciliation_status: string; verification: string }[];
//   amounts: string[];
//   date_times: string[];
//   channels: string[];
//   beneficiary_vpas: string[];
//   source_mentions: { evidence_id: number; filename: string; page: number | null; quote: string }[];
//   distinct_document_count: number;
//   match_status: string;
//   match_basis: string;
//   conflicting_fields: string[];
//   verification: string;
//   officer_review_required: boolean;
//   notice: string;
// };
// type CaseMoneyTrail = {
//   case_id: number; case_number: string; document_count: number;
//   analyzed_document_count: number; candidate_transaction_count: number;
//   skipped_transactions_without_explicit_reference: number;
//   matching_policy: string; transactions: CaseMoneyTrailTransaction[];
// };


// type OfficerDashboardCase = {
//   caseItem: CaseItem;
//   evidence: Evidence[];
//   tasks: InvestigationTask[];
//   gaps: CaseEvidenceGaps | null;
//   trail: CaseMoneyTrail | null;
// };
// type OfficerActivity = {
//   caseId: number;
//   caseNumber: string;
//   taskTitle: string;
//   event: TaskAuditEvent;
// };

// type CaseEvidenceGap = {
//   key: string;
//   label: string;
//   description: string;
//   status: string;
//   source_documents: { evidence_id: number; filename: string; status: string | null }[];
//   received_documents: { evidence_id: number; filename: string; sha256: string; analyzed: boolean }[];
//   officer_review_required: boolean;
//   notice: string;
// };
// type CaseEvidenceGaps = {
//   case_id: number;
//   case_number: string;
//   document_count: number;
//   gaps: CaseEvidenceGap[];
//   classification_policy: string;
// };


// type InvestigationTask = {
//   id: number;
//   case_id: number;
//   gap_key: string;
//   title: string;
//   description: string;
//   priority: string;
//   status: "open" | "in_progress" | "evidence_received_pending_review" | "completed";
//   trigger_evidence_ids: number[];
//   officer_note: string | null;
//   created_at: string;
//   updated_at: string;
// };
// type InvestigationTasksResponse = {
//   case_id: number;
//   created?: number;
//   updated?: number;
//   tasks: InvestigationTask[];
// };
// type TaskAuditEvent = {
//   id: number;
//   action: string;
//   from_status: string | null;
//   to_status: string | null;
//   officer_name: string;
//   officer_note: string | null;
//   related_evidence_ids: number[];
//   created_at: string;
// };

// type AssistantSource = { evidence_id: number; filename: string; page: number; excerpt: string };
// type AssistantResponse = {
//   case_id: number;
//   case_number: string;
//   question: string;
//   answer: string;
//   answer_mode: string;
//   sources: AssistantSource[];
//   notice: string;
// };

// type AssistantContextDocument = {
//   evidence_id: number; filename: string; status: string; analyzed: boolean; searchable: boolean;
// };
// type AssistantChatMessage = {
//   role: "user" | "assistant"; content: string; sources?: AssistantSource[]; answerMode?: string; notice?: string;
// };

// type Analysis = {
//   analysis_version: string;
//   method: string;
//   notice: string;
//   entities: Entity[];
//   transaction_observations: TransactionObservation[];
//   reconciled_transactions: ReconciledTransaction[];
//   evidence_gaps: EvidenceGap[];
// };

// function OfficerWorkspace({ officerName, onLogout }: { officerName: string; onLogout: () => void }) {
//   const [dashboardCases, setDashboardCases] = useState<OfficerDashboardCase[]>([]);
//   const [dashboardLoading, setDashboardLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState<"dashboard" | "cases">("dashboard");
//   const [recentActivity, setRecentActivity] = useState<OfficerActivity[]>([]);
//   const [cases, setCases] = useState<CaseItem[]>([]);
//   const [selected, setSelected] = useState<CaseItem | null>(null);
//   const [docs, setDocs] = useState<Evidence[]>([]);
//   const [active, setActive] = useState<Evidence | null>(null);

//   const [analysis, setAnalysis] = useState<Analysis | null>(null);
//   const [assistantQuestion, setAssistantQuestion] = useState("");
//   const [assistantResponse, setAssistantResponse] = useState<AssistantResponse | null>(null);
//   const [assistantLoading, setAssistantLoading] = useState(false);
//   const [assistantOpen, setAssistantOpen] = useState(false);
//   const [assistantMessages, setAssistantMessages] = useState<AssistantChatMessage[]>([]);
//   const [assistantContextDocs, setAssistantContextDocs] = useState<AssistantContextDocument[]>([]);
//   const [assistantIncludedIds, setAssistantIncludedIds] = useState<number[]>([]);
//   const [assistantContextLoading, setAssistantContextLoading] = useState(false);
//   const [caseMoneyTrail, setCaseMoneyTrail] = useState<CaseMoneyTrail | null>(null);
//   const [trailLoading, setTrailLoading] = useState(false);
//   const [caseEvidenceGaps, setCaseEvidenceGaps] = useState<CaseEvidenceGaps | null>(null);
//   const [investigationTasks, setInvestigationTasks] = useState<InvestigationTask[]>([]);
//   const [tasksLoading, setTasksLoading] = useState(false);
//   const [taskNotes, setTaskNotes] = useState<Record<number, string>>({});
//   const [taskHistory, setTaskHistory] = useState<Record<number, TaskAuditEvent[]>>({});
//   const [historyOpen, setHistoryOpen] = useState<Record<number, boolean>>({});
//   const [historyLoading, setHistoryLoading] = useState<Record<number, boolean>>({});
//   const [number, setNumber] = useState("DEMO-CYB-001");
//   const [title, setTitle] = useState("Synthetic UPI financial fraud");

//   const [message, setMessage] = useState("");
//   const [busy, setBusy] = useState(false);
//   const [analyzing, setAnalyzing] = useState(false);

//   async function refresh() {
//     const r = await axios.get(`${API}/api/cases`);
//     const caseList: CaseItem[] = r.data;
//     setCases(caseList);
//     setDashboardLoading(true);
//     try {
//       const summaries = await Promise.all(caseList.map(async (caseItem) => {
//         const [docsResult, tasksResult, gapsResult, trailResult] = await Promise.allSettled([
//           axios.get(`${API}/api/cases/${caseItem.id}/documents`),
//           axios.get(`${API}/api/cases/${caseItem.id}/tasks`),
//           axios.get(`${API}/api/cases/${caseItem.id}/evidence-gaps`),
//           axios.get(`${API}/api/cases/${caseItem.id}/money-trail`),
//         ]);
//         const evidence = docsResult.status === "fulfilled" ? docsResult.value.data as Evidence[] : [];
//         const tasks = tasksResult.status === "fulfilled" ? (tasksResult.value.data.tasks || []) as InvestigationTask[] : [];
//         const gaps = gapsResult.status === "fulfilled" ? gapsResult.value.data as CaseEvidenceGaps : null;
//         const trail = trailResult.status === "fulfilled" ? trailResult.value.data as CaseMoneyTrail : null;
//         return { caseItem, evidence, tasks, gaps, trail };
//       }));
//       setDashboardCases(summaries);

//       const activityGroups = await Promise.all(summaries.flatMap(summary =>
//         summary.tasks.slice(0, 5).map(async task => {
//           try {
//             const history = await axios.get(`${API}/api/cases/${summary.caseItem.id}/tasks/${task.id}/history`);
//             return (history.data.events || []).map((event: TaskAuditEvent) => ({
//               caseId: summary.caseItem.id,
//               caseNumber: summary.caseItem.case_number,
//               taskTitle: task.title,
//               event,
//             })) as OfficerActivity[];
//           } catch {
//             return [] as OfficerActivity[];
//           }
//         })
//       ));
//       setRecentActivity(activityGroups.flat().sort((a, b) =>
//         new Date(b.event.created_at).getTime() - new Date(a.event.created_at).getTime()
//       ).slice(0, 6));
//     } finally {
//       setDashboardLoading(false);
//     }
//   }

//   async function loadDocs(id: number) {
//     const r = await axios.get(`${API}/api/cases/${id}/documents`);
//     setDocs(r.data);
//   }

//   async function loadMoneyTrail(id: number) {
//     setTrailLoading(true);
//     try {
//       const r = await axios.get(`${API}/api/cases/${id}/money-trail`);
//       setCaseMoneyTrail(r.data);
//     } catch (e: any) {
//       setCaseMoneyTrail(null);
//       setMessage(e.response?.data?.detail || "Could not load case-level money trail.");
//     } finally {
//       setTrailLoading(false);
//     }
//   }

//   async function loadCaseEvidenceGaps(id: number) {
//     try {
//       const r = await axios.get(`${API}/api/cases/${id}/evidence-gaps`);
//       setCaseEvidenceGaps(r.data);
//     } catch (e: any) {
//       setCaseEvidenceGaps(null);
//       setMessage(e.response?.data?.detail || "Could not load case-level evidence gaps.");
//     }
//   }

//   async function loadInvestigationTasks(id: number, sync = false) {
//     setTasksLoading(true);
//     try {
//       const r = sync
//         ? await axios.post(`${API}/api/cases/${id}/tasks/sync`)
//         : await axios.get(`${API}/api/cases/${id}/tasks`);
//       setInvestigationTasks(r.data.tasks || []);
//     } catch (e: any) {
//       setMessage(e.response?.data?.detail || "Could not load investigation tasks.");
//       setInvestigationTasks([]);
//     } finally {
//       setTasksLoading(false);
//     }
//   }

//   async function updateInvestigationTask(task: InvestigationTask, status: InvestigationTask["status"]) {
//     if (!selected) return;
//     try {
//       const r = await axios.patch(
//         `${API}/api/cases/${selected.id}/tasks/${task.id}`,
//         { status, officer_name: officerName.trim(), officer_note: taskNotes[task.id]?.trim() || null }
//       );
//       setInvestigationTasks(current => current.map(item => item.id === task.id ? r.data : item));
//       await loadTaskHistory(task.id);
//       await refresh();
//       setMessage(`Task action recorded in audit history: ${task.title}`);
//     } catch (e: any) {
//       setMessage(e.response?.data?.detail || "Could not update task.");
//     }
//   }

//   async function loadTaskHistory(taskId: number) {
//     if (!selected) return;
//     setHistoryLoading(current => ({ ...current, [taskId]: true }));
//     try {
//       const r = await axios.get(`${API}/api/cases/${selected.id}/tasks/${taskId}/history`);
//       setTaskHistory(current => ({ ...current, [taskId]: r.data.events || [] }));
//     } catch (e: any) {
//       setMessage(e.response?.data?.detail || "Could not load task audit history.");
//     } finally {
//       setHistoryLoading(current => ({ ...current, [taskId]: false }));
//     }
//   }

//   async function toggleTaskHistory(taskId: number) {
//     const next = !historyOpen[taskId];
//     setHistoryOpen(current => ({ ...current, [taskId]: next }));
//     if (next && !taskHistory[taskId]) await loadTaskHistory(taskId);
//   }


//   async function loadAssistantContext(caseId: number) {
//     setAssistantContextLoading(true);
//     try {
//       const r = await axios.get(`${API}/api/cases/${caseId}/assistant/context`);
//       const documents = (r.data.documents || []) as AssistantContextDocument[];
//       setAssistantContextDocs(documents);
//       setAssistantIncludedIds(documents.map(d => d.evidence_id));
//     } catch {
//       setAssistantContextDocs([]);
//       setAssistantIncludedIds([]);
//     } finally {
//       setAssistantContextLoading(false);
//     }
//   }

//   async function askCaseAssistant(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     if (!selected || !assistantQuestion.trim() || assistantIncludedIds.length === 0) return;
//     const question = assistantQuestion.trim();
//     const prior = assistantMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));
//     setAssistantMessages(current => [...current, { role: "user", content: question }]);
//     setAssistantQuestion("");
//     setAssistantLoading(true);
//     setMessage("");
//     try {
//       const r = await axios.post(`${API}/api/cases/${selected.id}/assistant`, {
//         question,
//         language: "auto",
//         include_evidence_ids: assistantIncludedIds,
//         history: prior,
//       });
//       const data = r.data as AssistantResponse;
//       setAssistantResponse(data);
//       setAssistantMessages(current => [...current, {
//         role: "assistant", content: data.answer, sources: data.sources,
//         answerMode: data.answer_mode, notice: data.notice,
//       }]);
//     } catch (e: any) {
//       setAssistantMessages(current => [...current, {
//         role: "assistant", content: e.response?.data?.detail || "Could not answer from this case's documents. Check the backend and try again."
//       }]);
//     } finally {
//       setAssistantLoading(false);
//     }
//   }


//   useEffect(() => {
//     refresh().catch(() =>
//       setMessage("Backend unavailable. Start the FastAPI backend.")
//     );
//   }, []);

//   async function create(e: React.FormEvent) {
//     e.preventDefault();
//     setBusy(true);

//     try {
//       const r = await axios.post(`${API}/api/cases`, {
//         case_number: number,
//         title,
//         case_type: "online_financial_fraud",
//       });

//       await refresh();
//       setSelected(r.data);
//       setDocs([]);
//       setActive(null);
//       setAnalysis(null);
//       setAssistantResponse(null);
//       setAssistantQuestion("");
//       setAssistantMessages([]);
//       setAssistantContextDocs([]);
//       setAssistantIncludedIds([]);
//       await loadAssistantContext(r.data.id);
//       setCaseMoneyTrail(null);
//       setCaseEvidenceGaps(null);
//       await loadMoneyTrail(r.data.id);
//       await loadCaseEvidenceGaps(r.data.id);
//       await loadInvestigationTasks(r.data.id, true);
//       setMessage("Case created successfully.");
//     } catch (e: any) {
//       setMessage(e.response?.data?.detail || "Could not create case");
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function upload(e: React.ChangeEvent<HTMLInputElement>) {
//     const f = e.target.files?.[0];

//     if (!f || !selected) return;

//     const fd = new FormData();
//     fd.append("file", f);

//     setBusy(true);

//     try {
//       await axios.post(
//         `${API}/api/cases/${selected.id}/documents`,
//         fd
//       );

//       await loadDocs(selected.id);
//       await loadAssistantContext(selected.id);
//       await loadMoneyTrail(selected.id);
//       await loadCaseEvidenceGaps(selected.id);
//       await loadInvestigationTasks(selected.id, true);
//       setActive(null);
//       setAnalysis(null);
//       setMessage("Document uploaded and processed.");
//     } catch (e: any) {
//       setMessage(e.response?.data?.detail || "Upload failed");
//     } finally {
//       setBusy(false);
//       e.target.value = "";
//     }
//   }

//   async function choose(c: CaseItem) {
//     setSelected(c);
//     setActive(null);
//     setAnalysis(null);
//     setAssistantResponse(null);
//     setAssistantQuestion("");
//     setAssistantMessages([]);
//     setAssistantContextDocs([]);
//     setAssistantIncludedIds([]);
//     setAssistantOpen(false);
//     setCaseMoneyTrail(null);
//     setCaseEvidenceGaps(null);
//     setMessage("");

//     try {
//       await loadDocs(c.id);
//       await loadAssistantContext(c.id);
//       await loadMoneyTrail(c.id);
//       await loadCaseEvidenceGaps(c.id);
//       await loadInvestigationTasks(c.id, true);
//     } catch {
//       setMessage("Could not load case documents.");
//     }
//   }

//   async function chooseDocument(d: Evidence) {
//     setActive(d);
//     setAnalysis(null);
//     setMessage("");

//     if (!selected) return;

//     try {
//       const r = await axios.get(
//         `${API}/api/cases/${selected.id}/documents/${d.id}/analysis`
//       );

//       setAnalysis(r.data.analysis);
//     } catch (e: any) {
//       if (e.response?.status !== 404) {
//         setMessage("Could not retrieve saved analysis.");
//       }
//     }
//   }

//   async function runAnalysis() {
//     if (!selected || !active) return;

//     setAnalyzing(true);
//     setMessage("");

//     try {
//       const r = await axios.post(
//         `${API}/api/cases/${selected.id}/documents/${active.id}/analyze`
//       );

//       setAnalysis(r.data.analysis);
//       await loadMoneyTrail(selected.id);
//       await loadCaseEvidenceGaps(selected.id);
//       await loadInvestigationTasks(selected.id, true);
//       setMessage("Analysis complete; money trail, evidence gaps and tasks refreshed.");
//     } catch (e: any) {
//       setMessage(
//         e.response?.data?.detail || "Document analysis failed."
//       );
//     } finally {
//       setAnalyzing(false);
//     }
//   }

//   return (
//     <div className="layout">
//       <aside>
//         <div className="brand">
//           <ShieldCheck />
//           <div>
//             <b>NYAYA ONE</b>
//             <small>INVESTIGATION COPILOT</small>
//           </div>
//         </div>

//         <p className="muted">WORKSPACE</p>

//         <nav className="officer-sidebar-nav" aria-label="Main navigation">
//           <button
//             type="button"
//             className={`officer-nav-tab ${activeTab === "dashboard" ? "active" : ""}`}
//             onClick={() => setActiveTab("dashboard")}
//           >
//             <LayoutDashboard size={17} /> Dashboard
//           </button>
//           <button
//             type="button"
//             className={`officer-nav-tab ${activeTab === "cases" ? "active" : ""}`}
//             onClick={() => setActiveTab("cases")}
//           >
//             <FolderOpen size={17} /> Cases
//           </button>
//         </nav>

//         <div className="sidebarNote">
//           Synthetic demo environment
//           <br />
//           Development POC · v0.2
//         </div>
//       </aside>

//       <main>
//         <header className="officer-page-header">
//           <div>
//             <small>UP AI MISSION · HACKATHON POC</small>
//             <h1>Investigation workspace</h1>
//             <p className="officer-welcome">Signed in as <b>{officerName}</b> · Police Officer</p>
//           </div>
//           <div className="officer-header-actions">
//             <span className="pill">
//               <ShieldCheck size={15} /> Local demo workspace
//             </span>
//             <button type="button" className="ny-logout" onClick={onLogout}>
//               <LogOut size={16} /> Sign out
//             </button>
//           </div>
//         </header>

//         {message && <div className="message">{message}</div>}

//         {activeTab === "dashboard" && <section className="officer-dashboard">
//           <div className="officer-dashboard-heading">
//             <div>
//               <small>YOUR INVESTIGATION OVERVIEW</small>
//               <h2>Good to see you, {officerName.split(/[._\s-]/)[0] || "Officer"}</h2>
//               <p>Monitor active cases, evidence review and investigation follow-ups from one place.</p>
//             </div>
//             <button className="ghost officer-refresh" onClick={() => refresh()} disabled={dashboardLoading} title="Refresh overview">
//               <RefreshCw size={16} className={dashboardLoading ? "spin" : ""} /> Refresh
//             </button>
//           </div>

//           <div className="officer-stat-grid">
//             <button className="officer-stat" onClick={() => document.getElementById("officer-case-register")?.scrollIntoView({ behavior: "smooth" })}>
//               <span><FolderOpen size={18}/> My active investigations</span>
//               <b>{dashboardCases.filter(x => x.caseItem.status?.toLowerCase() !== "closed" && x.caseItem.status?.toLowerCase() !== "completed").length}</b>
//               <small>Cases currently in the workspace</small>
//             </button>
//             <button className="officer-stat" onClick={() => document.getElementById("officer-case-register")?.scrollIntoView({ behavior: "smooth" })}>
//               <span><Brain size={18}/> Pending investigation tasks</span>
//               <b>{dashboardCases.reduce((n, x) => n + x.tasks.filter(t => t.status !== "completed").length, 0)}</b>
//               <small>Open, in progress or awaiting review</small>
//             </button>
//             <button className="officer-stat" onClick={() => document.getElementById("officer-case-register")?.scrollIntoView({ behavior: "smooth" })}>
//               <span><FileSearch size={18}/> Evidence awaiting review</span>
//               <b>{dashboardCases.reduce((n, x) => n + x.evidence.filter(d => d.status?.toLowerCase().includes("uploaded") || d.status?.toLowerCase().includes("pending")).length, 0)}</b>
//               <small>Uploaded files not yet analyzed</small>
//             </button>
//             <button className="officer-stat" onClick={() => document.getElementById("officer-case-register")?.scrollIntoView({ behavior: "smooth" })}>
//               <span><Activity size={18}/> Financial transaction alerts</span>
//               <b>{dashboardCases.reduce((n, x) => n + (x.trail?.transactions.filter(t => t.conflicting_fields.length > 0 || t.match_status.includes("conflict")).length || 0), 0)}</b>
//               <small>Candidate matches with extracted conflicts</small>
//             </button>
//           </div>

//           <div className="officer-overview-grid">
//             <section className="officer-overview-card">
//               <div className="officer-card-title"><div><h3>My active investigations</h3><p>Select a case to open its full workspace.</p></div><span>{dashboardCases.length} total</span></div>
//               {dashboardLoading ? <p className="notice">Loading case overview…</p> : dashboardCases.length === 0 ? <p className="notice">No cases are registered yet. Create a synthetic demo case below.</p> : dashboardCases.map(item => (
//                 <button className="officer-case-row" key={item.caseItem.id} onClick={() => { setActiveTab("cases"); choose(item.caseItem); }}>
//                   <span className="officer-case-icon"><FolderOpen size={17}/></span>
//                   <span className="officer-case-main"><b>{item.caseItem.case_number}</b><small>{item.caseItem.title}</small></span>
//                   <span className="officer-case-meta"><b>{item.tasks.filter(t => t.status !== "completed").length} tasks</b><small>{item.evidence.length} evidence files</small></span>
//                   <ArrowRight size={17}/>
//                 </button>
//               ))}
//             </section>

//             <section className="officer-overview-card">
//               <div className="officer-card-title"><div><h3>Pending investigation tasks</h3><p>Officer-reviewed follow-ups across your cases.</p></div><Brain size={19}/></div>
//               {dashboardCases.flatMap(item => item.tasks.filter(t => t.status !== "completed").map(task => ({...task, caseNumber:item.caseItem.case_number, caseId:item.caseItem.id}))).slice(0,5).map(task => (
//                 <button className="officer-task-row" key={`${task.caseId}-${task.id}`} onClick={() => { setActiveTab("cases"); choose(dashboardCases.find(x => x.caseItem.id === task.caseId)!.caseItem); }}>
//                   <span className={`task-dot task-${task.status}`}/>
//                   <span><b>{task.title}</b><small>{task.caseNumber} · {task.status.split("_").join(" ")}</small></span>
//                 </button>
//               ))}
//               {!dashboardLoading && dashboardCases.every(x => x.tasks.filter(t => t.status !== "completed").length === 0) && <p className="notice">No pending tasks found.</p>}
//             </section>

//             <section className="officer-overview-card">
//               <div className="officer-card-title"><div><h3>Evidence awaiting review</h3><p>New uploads that may need analysis or officer review.</p></div><FileSearch size={19}/></div>
//               {dashboardCases.flatMap(item => item.evidence.filter(d => d.status?.toLowerCase().includes("uploaded") || d.status?.toLowerCase().includes("pending")).map(doc => ({...doc, caseNumber:item.caseItem.case_number, caseId:item.caseItem.id}))).slice(0,5).map(doc => (
//                 <button className="officer-task-row" key={`${doc.caseId}-${doc.id}`} onClick={() => choose(dashboardCases.find(x => x.caseItem.id === doc.caseId)!.caseItem)}>
//                   <FileText size={17}/><span><b>{doc.filename}</b><small>{doc.caseNumber} · {doc.status}</small></span>
//                 </button>
//               ))}
//               {!dashboardLoading && dashboardCases.every(x => !x.evidence.some(d => d.status?.toLowerCase().includes("uploaded") || d.status?.toLowerCase().includes("pending"))) && <p className="notice">No uploaded evidence awaiting analysis was found.</p>}
//             </section>

//             <section className="officer-overview-card">
//               <div className="officer-card-title"><div><h3>Financial transaction alerts</h3><p>Exact-reference matches and conflicts surfaced from analyzed documents.</p></div><Activity size={19}/></div>
//               {dashboardCases.flatMap(item => (item.trail?.transactions || []).map(tx => ({...tx, caseNumber:item.caseItem.case_number, caseId:item.caseItem.id}))).slice(0,5).map(tx => (
//                 <button className="officer-task-row" key={`${tx.caseId}-${tx.transaction_reference}`} onClick={() => choose(dashboardCases.find(x => x.caseItem.id === tx.caseId)!.caseItem)}>
//                   <span className={`task-dot ${tx.conflicting_fields.length ? "task-conflict" : "task-open"}`}/>
//                   <span><b>{tx.transaction_reference}</b><small>{tx.caseNumber} · {tx.distinct_document_count} document(s) · {tx.conflicting_fields.length ? "Conflict flagged" : "Candidate match; unverified"}</small></span>
//                 </button>
//               ))}
//               {!dashboardLoading && dashboardCases.every(x => !x.trail?.transactions.length) && <p className="notice">No transaction candidates have been extracted yet.</p>}
//             </section>

//             <section className="officer-overview-card officer-activity-card">
//               <div className="officer-card-title"><div><h3>Recent case activity</h3><p>Latest recorded task actions in the audit history.</p></div><History size={19}/></div>
//               {recentActivity.map((item, index) => <div className="officer-activity-row" key={`${item.event.id}-${index}`}><span className="activity-marker"/><span><b>{item.event.action.split("_").join(" ")}</b><small>{item.caseNumber} · {item.taskTitle}</small><small>{item.event.officer_name} · {new Date(item.event.created_at).toLocaleString()}</small></span></div>)}
//               {!dashboardLoading && recentActivity.length === 0 && <p className="notice">No task activity has been recorded yet.</p>}
//             </section>
//           </div>
//         </section>}

//         {activeTab === "cases" && <div className="columns" id="officer-case-register">
//           <section className="panel">
//             <div className="heading">
//               <div>
//                 <h2>Cases</h2>
//                 <small>Manage synthetic investigation cases</small>
//               </div>

//               <button
//                 className="ghost"
//                 onClick={() => refresh()}
//                 title="Refresh cases"
//               >
//                 <RefreshCw size={16} />
//               </button>
//             </div>

//             <form onSubmit={create}>
//               <label>
//                 Case reference
//                 <input
//                   value={number}
//                   onChange={(e) => setNumber(e.target.value)}
//                   required
//                 />
//               </label>

//               <label>
//                 Case title
//                 <input
//                   value={title}
//                   onChange={(e) => setTitle(e.target.value)}
//                   required
//                 />
//               </label>

//               <button className="primary" disabled={busy}>
//                 <Plus size={16} /> Create case
//               </button>
//             </form>

//             <div className="list">
//               {cases.map((c) => (
//                 <button
//                   className={`case ${
//                     selected?.id === c.id ? "chosen" : ""
//                   }`}
//                   key={c.id}
//                   onClick={() => choose(c)}
//                 >
//                   <FolderOpen size={17} />

//                   <span>
//                     <b>{c.case_number}</b>
//                     <small>{c.title}</small>
//                   </span>

//                   <em>{c.status}</em>
//                 </button>
//               ))}

//               {!cases.length && (
//                 <p className="empty">
//                   No cases yet. Create your first synthetic case.
//                 </p>
//               )}
//             </div>
//           </section>

//           <section className="panel detail">
//             {!selected ? (
//               <div className="emptyState">
//                 <FolderOpen size={40} />
//                 <h2>Select or create a case</h2>
//                 <p>Documents and extracted text appear here.</p>
//               </div>
//             ) : (
//               <>
//                 <div className="heading">
//                   <div>
//                     <small>CASE WORKSPACE</small>
//                     <h2>{selected.case_number}</h2>
//                     <p>{selected.title}</p>
//                   </div>

//                   <em className="active">Active</em>
//                 </div>

//                 <div className="meta">
//                   <span>Case type</span>
//                   <b>Online financial fraud</b>
//                   <span>Evidence files</span>
//                   <b>{docs.length}</b>
//                 </div>

//                 <label className="upload">
//                   <Upload />
//                   <b>Upload evidence PDF</b>
//                   <small>PDF · Maximum 20 MB</small>
//                   <input
//                     type="file"
//                     accept=".pdf,application/pdf"
//                     onChange={upload}
//                     disabled={busy}
//                   />
//                 </label>

//                 <h3>Evidence inventory</h3>

//                 {docs.map((d) => (
//                   <button
//                     className={`doc ${
//                       active?.id === d.id ? "chosen" : ""
//                     }`}
//                     key={d.id}
//                     onClick={() => chooseDocument(d)}
//                   >
//                     <FileText size={17} />

//                     <span>
//                       <b>{d.filename}</b>
//                       <small>
//                         {(d.size_bytes / 1024).toFixed(1)} KB · {d.status}
//                       </small>
//                     </span>
//                   </button>
//                 ))}

//                 {active && (
//                   <div className="extract">
//                     <b>SHA-256 fingerprint</b>
//                     <code>{active.sha256}</code>

//                     <h3>Extracted text</h3>
//                     <pre>
//                       {active.extracted_text ||
//                         "No embedded text found. OCR is planned."}
//                     </pre>

//                     <div className="analysisAction">
//                       <h3>
//                         <Brain size={19} /> Case intelligence
//                       </h3>

//                       <p>
//                         Run deterministic, source-linked extraction on
//                         this document.
//                       </p>

//                       <button
//                         className="primary"
//                         onClick={runAnalysis}
//                         disabled={analyzing || !active.extracted_text}
//                       >
//                         <Search size={16} />
//                         {analyzing
//                           ? "Analyzing document..."
//                           : analysis
//                           ? "Run analysis again"
//                           : "Analyze document"}
//                       </button>
//                     </div>

//                     {analysis && (
//                       <div className="analysisResults">
//                         <h3>Preliminary analysis results</h3>

//                         <p className="notice">{analysis.notice}</p>

//                         <div className="analysisMeta">
//                           Method: {analysis.method} · Version:{" "}
//                           {analysis.analysis_version}
//                         </div>

//                         <h3>Extracted entities</h3>

//                         {analysis.entities.length === 0 && (
//                           <p>No matching entities detected.</p>
//                         )}

//                         {analysis.entities.map((entity, i) => (
//                           <div className="finding" key={i}>
//                             <b>{entity.type.split("_").join(" ")}</b>
//                             <p>{entity.value}</p>
//                             <small>
//                               Attribution: {entity.attribution}
//                             </small>
//                             <small>
//                               Verification: {entity.verification}
//                             </small>
//                             <div className="source">
//                               Page {entity.source.page}: "
//                               {entity.source.quote}"
//                             </div>
//                           </div>
//                         ))}

//                         <h3>Transaction observations</h3>

//                         {analysis.transaction_observations.length === 0 && (
//                           <p>No transaction observations detected.</p>
//                         )}

//                         {analysis.transaction_observations.map((tx, i) => (
//                           <div className="finding" key={i}>
//                             {tx.amount && (
//                               <p>
//                                 <b>Reported amount:</b> {tx.currency}{" "}
//                                 {tx.amount}
//                               </p>
//                             )}

//                             {tx.channel && (
//                               <p>
//                                 <b>Channel:</b> {tx.channel}
//                               </p>
//                             )}

//                             {tx.date_time && (
//                               <p>
//                                 <b>Date/time:</b> {tx.date_time}
//                               </p>
//                             )}

//                             <small>{tx.verification}</small>

//                             <div className="source">
//                               Page {tx.source.page}: "{tx.source.quote}"
//                             </div>
//                           </div>
//                         ))}

//                         <section className="transactionPanel">
//                           <div className="transactionHeader">
//                             <div>
//                               <h3>Financial Transaction Intelligence</h3>
//                               <p>
//                                 Candidate transactions grouped using an
//                                 explicit transaction reference.
//                               </p>
//                             </div>
//                             <span className="transactionStatus">
//                               Source data · Unverified
//                             </span>
//                           </div>

//                           {!analysis.reconciled_transactions ||
//                           analysis.reconciled_transactions.length === 0 ? (
//                             <p>
//                               No candidate transactions could be grouped by
//                               an explicit transaction reference in this
//                               document.
//                             </p>
//                           ) : (
//                             analysis.reconciled_transactions.map((tx, i) => (
//                               <article className="transactionCard" key={`${tx.transaction_reference}-${i}`}>
//                                 <div className="transactionAmountRow">
//                                   <div>
//                                     <small>Candidate transaction amount</small>
//                                     <div className="transactionAmount">
//                                       {tx.currency === "INR" ? "₹" : ""}
//                                       {tx.amount
//                                         ? Number(tx.amount).toLocaleString("en-IN")
//                                         : "Not available"}
//                                     </div>
//                                   </div>
//                                   <span
//                                     className={`transactionStatus ${
//                                       tx.reconciliation_status ===
//                                       "candidate_reconciled_unverified"
//                                         ? "candidate"
//                                         : "conflict"
//                                     }`}
//                                   >
//                                     {tx.reconciliation_status.split("_").join(" ")}
//                                   </span>
//                                 </div>

//                                 <div className="transactionGrid">
//                                   <div className="transactionField">
//                                     <small>Transaction reference</small>
//                                     <code>{tx.transaction_reference}</code>
//                                   </div>
//                                   <div className="transactionField">
//                                     <small>Payment channel</small>
//                                     <b>{tx.channel || "Not identified"}</b>
//                                   </div>
//                                   <div className="transactionField">
//                                     <small>Date and time</small>
//                                     <b>{tx.date_time || "Not identified"}</b>
//                                   </div>
//                                   <div className="transactionField">
//                                     <small>Beneficiary VPA</small>
//                                     <code>{tx.beneficiary_vpa || "Not identified"}</code>
//                                   </div>
//                                   <div className="transactionField">
//                                     <small>Source mentions</small>
//                                     <b>{tx.source_mentions?.length ?? 0}</b>
//                                   </div>
//                                   <div className="transactionField">
//                                     <small>Conflicting fields</small>
//                                     <b>
//                                       {tx.conflicting_fields?.length
//                                         ? tx.conflicting_fields.join(", ")
//                                         : "None detected"}
//                                     </b>
//                                   </div>
//                                 </div>

//                                 <div className="transactionNotice">
//                                   {tx.notice ||
//                                     "Candidate grouping only. This does not establish that a payment occurred."}
//                                   {" "}Verification: {tx.verification}.
//                                 </div>

//                                 {tx.source_mentions?.length > 0 && (
//                                   <div className="transactionSources">
//                                     <b>Source references</b>
//                                     {tx.source_mentions.map((source, sourceIndex) => (
//                                       <div className="source" key={sourceIndex}>
//                                         Page {source.page}: "{source.quote}"
//                                       </div>
//                                     ))}
//                                   </div>
//                                 )}
//                               </article>
//                             ))
//                           )}
//                         </section>

//                         <section className="moneyTrailPanel">
//                           <div className="moneyTrailHeader">
//                             <div>
//                               <h3>Case-wide Money Trail Explorer</h3>
//                               <p>
//                                 Transactions aggregated across analyzed evidence documents.
//                                 Only exact explicit transaction-reference matches are grouped.
//                               </p>
//                             </div>
//                             <button
//                               type="button"
//                               className={`moneyTrailRefreshButton${trailLoading ? " isLoading" : ""}`}
//                               onClick={() => selected && loadMoneyTrail(selected.id)}
//                               disabled={trailLoading || !selected}
//                               title={trailLoading ? "Refreshing case money trail" : "Refresh case money trail"}
//                               aria-label={trailLoading ? "Refreshing case money trail" : "Refresh case money trail"}
//                             >
//                               <RefreshCw size={18} />
//                             </button>
//                           </div>

//                           {trailLoading && <p className="notice">Loading case-wide transaction matches...</p>}
//                           {!trailLoading && caseMoneyTrail && (
//                             <>
//                               <div className="moneyTrailSummary">
//                                 <div><small>Evidence files</small><b>{caseMoneyTrail.document_count}</b></div>
//                                 <div><small>Analyzed files</small><b>{caseMoneyTrail.analyzed_document_count}</b></div>
//                                 <div><small>Candidate transactions</small><b>{caseMoneyTrail.candidate_transaction_count}</b></div>
//                               </div>
//                               <p className="moneyTrailPolicy">Matching policy: {caseMoneyTrail.matching_policy}</p>

//                               {caseMoneyTrail.transactions.length === 0 ? (
//                                 <p className="notice">No candidate transactions with explicit references found in analyzed documents.</p>
//                               ) : caseMoneyTrail.transactions.map((tx, i) => (
//                                 <article className="moneyTrailCard" key={`case-trail-${tx.transaction_reference}-${i}`}>
//                                   <div className="moneyTrailTransactionTop">
//                                     <div><small>TRANSACTION REFERENCE</small><code>{tx.transaction_reference}</code></div>
//                                     <span className={`moneyTrailStatus ${tx.match_status.includes("conflicts") ? "conflict" : tx.distinct_document_count > 1 ? "matched" : "single"}`}>
//                                       {tx.match_status.split("_").join(" ")}
//                                     </span>
//                                   </div>
//                                   <div className="moneyTrailLegend">
//                                     <span><i className="legendDot reported" /> Source-reported value</span>
//                                     <span><i className="legendDot missing" /> Not independently verified</span>
//                                   </div>
//                                   <div className="moneyTrailComparison">
//                                     <div><small>AMOUNT(S)</small><b>{tx.amounts.length ? tx.amounts.map(v => `₹${Number(v).toLocaleString("en-IN")}`).join(" · ") : "Not extracted"}</b></div>
//                                     <div><small>DATE / TIME</small><b>{tx.date_times.length ? tx.date_times.join(" · ") : "Not extracted"}</b></div>
//                                     <div><small>CHANNEL(S)</small><b>{tx.channels.length ? tx.channels.join(" · ") : "Not extracted"}</b></div>
//                                     <div><small>BENEFICIARY VPA(S)</small><b>{tx.beneficiary_vpas.length ? tx.beneficiary_vpas.join(" · ") : "Not extracted"}</b></div>
//                                   </div>
//                                   <div className="moneyTrailDocumentList">
//                                     <b>Documents contributing to this candidate ({tx.distinct_document_count})</b>
//                                     {tx.documents.map(document => (
//                                       <div className="moneyTrailDocument" key={document.evidence_id}>
//                                         <FileText size={16} />
//                                         <div><b>{document.filename}</b><small>Evidence ID {document.evidence_id} · {document.reconciliation_status.split("_").join(" ")}</small></div>
//                                       </div>
//                                     ))}
//                                   </div>
//                                   {tx.conflicting_fields.length > 0 ? (
//                                     <div className="moneyTrailUnknown conflictNotice">
//                                       <AlertTriangle size={18} /><div><b>Field discrepancies detected</b><p>Review: {tx.conflicting_fields.map(v => v.split("_").join(" ")).join(", ")}. Values are preserved separately; the system has not chosen a winner.</p></div>
//                                     </div>
//                                   ) : tx.distinct_document_count > 1 ? (
//                                     <div className="moneyTrailUnknown">
//                                       <CheckCircle2 size={18} /><div><b>Cross-document candidate match</b><p>The same explicit transaction reference appears in {tx.distinct_document_count} documents. Extracted values show no conflicts. This does not authenticate either document or independently establish that payment occurred.</p></div>
//                                     </div>
//                                   ) : (
//                                     <div className="moneyTrailUnknown">
//                                       <AlertTriangle size={18} /><div><b>Single-document candidate</b><p>This reference currently appears in only one analyzed document.</p></div>
//                                     </div>
//                                   )}
//                                   <div className="transactionSources">
//                                     <b>Source quotations by document</b>
//                                     {tx.source_mentions.map((source, sourceIndex) => (
//                                       <div className="source" key={`${source.evidence_id}-${sourceIndex}`}>
//                                         <b>{source.filename}</b> · Evidence {source.evidence_id} · Page {source.page ?? "—"}
//                                         <p>"{source.quote}"</p>
//                                       </div>
//                                     ))}
//                                   </div>
//                                   <div className="moneyTrailFootnote">{tx.notice} Officer review required: {tx.officer_review_required ? "Yes" : "No"}. Verification: {tx.verification}.</div>
//                                 </article>
//                               ))}
//                             </>
//                           )}
//                         </section>

//                         <h3>
//                           <AlertTriangle size={18} /> Case-wide evidence gaps
//                         </h3>

//                         {!caseEvidenceGaps ? (
//                           <p className="notice">Case-wide evidence gap status is unavailable. Refresh the case data.</p>
//                         ) : caseEvidenceGaps.gaps.length === 0 ? (
//                           <p>
//                             No evidence gaps were identified in analyzed source documents.
//                             This does not establish that the investigation is complete.
//                           </p>
//                         ) : (
//                           <div className="caseEvidenceGapList">
//                             {caseEvidenceGaps.gaps.map((gap) => {
//                               const received = gap.status === "received_in_case_unverified";
//                               return (
//                                 <div className={`caseEvidenceGap ${received ? "received" : "outstanding"}`} key={gap.key}>
//                                   <div className="caseEvidenceGapIcon">
//                                     {received ? <CheckCircle2 size={19} /> : <AlertTriangle size={19} />}
//                                   </div>
//                                   <div className="caseEvidenceGapBody">
//                                     <div className="caseEvidenceGapTop">
//                                       <b>{gap.label}</b>
//                                       <span className={`caseEvidenceGapStatus ${received ? "received" : "outstanding"}`}>
//                                         {received ? "Received · unverified" : "Still outstanding"}
//                                       </span>
//                                     </div>
//                                     <p>{gap.description}</p>
//                                     {received ? (
//                                       <div className="caseEvidenceGapDocs">
//                                         {gap.received_documents.map((doc) => (
//                                           <small key={doc.evidence_id}>
//                                             <FileText size={13} /> {doc.filename} · Evidence ID {doc.evidence_id}
//                                             {doc.analyzed ? " · analyzed" : " · not yet analyzed"}
//                                           </small>
//                                         ))}
//                                       </div>
//                                     ) : (
//                                       <small>
//                                         Source: {gap.source_documents.map((doc) => `${doc.filename} (Evidence ${doc.evidence_id})`).join("; ")}
//                                       </small>
//                                     )}
//                                     <small className="caseEvidenceGapNotice">{gap.notice}</small>
//                                   </div>
//                                 </div>
//                               );
//                             })}
//                           </div>
//                         )}

//                         <p className="notice">
//                           <CheckCircle2 size={16} />
//                           Case-level status is inferred from uploaded filename and text cues only.
//                           File presence does not establish authenticity, completeness, or evidentiary sufficiency.
//                           Officer review is required.
//                         </p>

//                       </div>
//                     )}
//                   </div>
//                 )}


//                 <section className="investigationTasksPanel">
//                   <div className="investigationTasksHeader">
//                     <div>
//                       <h3><Brain size={18} /> Suggested investigation tasks</h3>
//                       <p>Tasks are generated from source-reported evidence gaps. New uploads can flag a task for officer review; no task is automatically completed.</p>
//                     </div>
//                     <button
//                       type="button"
//                       className="tasksRefreshButton"
//                       onClick={() => selected && loadInvestigationTasks(selected.id, true)}
//                       disabled={tasksLoading || !selected}
//                       title="Refresh suggested investigation tasks"
//                       aria-label="Refresh suggested investigation tasks"
//                     >
//                       <RefreshCw size={17} />
//                     </button>
//                   </div>

//                   <div className="auditOfficerIdentity auditOfficerIdentitySignedIn">
//                     <span className="auditActorIcon"><UserRound size={17} /></span>
//                     <div>
//                       <b>Audit actor: {officerName}</b>
//                       <small>Task actions will be recorded under the signed-in demo account. Production deployment must connect this identity to an authenticated officer directory.</small>
//                     </div>
//                   </div>

//                   {tasksLoading ? (
//                     <p className="notice">Updating investigation tasks...</p>
//                   ) : investigationTasks.length === 0 ? (
//                     <p className="notice">No suggested tasks yet. Analyze source documents to identify evidence gaps.</p>
//                   ) : (
//                     <div className="investigationTaskList">
//                       {investigationTasks.map(task => (
//                         <article className={`investigationTask ${task.status}`} key={task.id}>
//                           <div className="investigationTaskTop">
//                             <div>
//                               <span className="taskPriority">{task.priority} priority</span>
//                               <h4>{task.title}</h4>
//                             </div>
//                             <span className={`taskStatus ${task.status}`}>
//                               {task.status.split("_").join(" ")}
//                             </span>
//                           </div>
//                           <p>{task.description}</p>
//                           {task.trigger_evidence_ids.length > 0 && (
//                             <small className="taskEvidence">
//                               Related uploaded evidence: {task.trigger_evidence_ids.map(id => `Evidence ${id}`).join(", ")}
//                             </small>
//                           )}
//                           {task.officer_note && <small className="taskEvidence">Officer note: {task.officer_note}</small>}
//                           <label className="taskNoteLabel">
//                             Officer action note (optional)
//                             <textarea
//                               value={taskNotes[task.id] ?? ""}
//                               onChange={e => setTaskNotes(current => ({ ...current, [task.id]: e.target.value }))}
//                               placeholder="Record a brief reason or review note..."
//                               rows={2}
//                               maxLength={2000}
//                             />
//                           </label>
//                           <div className="taskActions">
//                             {task.status !== "completed" && (
//                               <>
//                                 {task.status !== "in_progress" && (
//                                   <button type="button" className="taskActionSecondary" disabled={!officerName.trim()}
//                                     onClick={() => updateInvestigationTask(task, "in_progress")}>
//                                     Mark in progress
//                                   </button>
//                                 )}
//                                 <button type="button" className="taskActionPrimary" disabled={!officerName.trim()}
//                                   onClick={() => updateInvestigationTask(task, "completed")}>
//                                   {task.status === "evidence_received_pending_review" ? "Officer reviewed · complete task" : "Officer confirms completed"}
//                                 </button>
//                                 {task.status === "in_progress" && (
//                                   <button type="button" className="taskActionSecondary" disabled={!officerName.trim()}
//                                     onClick={() => updateInvestigationTask(task, "open")}>
//                                     Return to open
//                                   </button>
//                                 )}
//                               </>
//                             )}
//                             {task.status === "completed" && <span className="taskCompletedNote"><CheckCircle2 size={15}/> Marked completed by officer</span>}
//                             <button type="button" className="taskActionSecondary" onClick={() => toggleTaskHistory(task.id)}>
//                               <History size={14} /> {historyOpen[task.id] ? "Hide activity history" : "View activity history"}
//                             </button>
//                           </div>
//                           {historyOpen[task.id] && (
//                             <div className="taskAuditTimeline">
//                               <b>Task activity history</b>
//                               {historyLoading[task.id] ? (
//                                 <small>Loading audit events...</small>
//                               ) : (taskHistory[task.id] || []).length === 0 ? (
//                                 <small>No audit events recorded yet.</small>
//                               ) : (
//                                 (taskHistory[task.id] || []).map(event => (
//                                   <div className="taskAuditEvent" key={event.id}>
//                                     <span className="taskAuditDot" />
//                                     <div>
//                                       <b>{event.action.split("_").join(" ")}</b>
//                                       <small>{new Date(event.created_at).toLocaleString()}</small>
//                                       <small>Actor: {event.officer_name}</small>
//                                       {event.from_status && <small>Status: {event.from_status.split("_").join(" ")} → {event.to_status?.split("_").join(" ")}</small>}
//                                       {event.related_evidence_ids.length > 0 && <small>Related evidence: {event.related_evidence_ids.map(id => `Evidence ${id}`).join(", ")}</small>}
//                                       {event.officer_note && <p>{event.officer_note}</p>}
//                                     </div>
//                                   </div>
//                                 ))
//                               )}
//                             </div>
//                           )}
//                         </article>
//                       ))}
//                     </div>
//                   )}
//                   <p className="taskSafetyNote">
//                     Suggested workflow only. These tasks do not create legal deadlines, issue notices, contact banks,
//                     or replace the investigating officer's judgment. Completion requires an explicit officer action. Officer names are self-reported in this prototype; authentication is not yet integrated.
//                   </p>
//                 </section>
//               </>
//             )}
//           </section>
//         </div>}

//         {selected && (
//           <>
//             <button type="button" className={`ny-ai-fab ${assistantOpen ? "is-open" : ""}`} onClick={() => { setAssistantOpen(v => !v); if (!assistantContextDocs.length) loadAssistantContext(selected.id); }} aria-label="Open AI Help">
//               {assistantOpen ? <X size={21}/> : <Sparkles size={21}/>}
//               <span>{assistantOpen ? "Close" : "AI Help"}</span>
//             </button>
//             {assistantOpen && (
//               <section className="ny-ai-chat" aria-label="NYAYA ONE AI Help chatbot">
//                 <header className="ny-ai-chat-head">
//                   <div className="ny-ai-chat-brand"><span><Bot size={19}/></span><div><b>NYAYA ONE AI Help</b><small>{selected.case_number} · Case-aware assistant</small></div></div>
//                   <button type="button" onClick={() => setAssistantOpen(false)} aria-label="Close chatbot"><X size={18}/></button>
//                 </header>
//                 <div className="ny-ai-attachments">
//                   <div className="ny-ai-attachments-title"><Paperclip size={14}/><b>Case documents attached</b><small>{assistantIncludedIds.length}/{assistantContextDocs.length}</small></div>
//                   {assistantContextLoading ? <small>Loading case documents…</small> : assistantContextDocs.length === 0 ? <small>No uploaded documents in this case yet.</small> : (
//                     <div className="ny-ai-doc-list">
//                       {assistantContextDocs.map(doc => (
//                         <label key={doc.evidence_id} className="ny-ai-doc-item">
//                           <input type="checkbox" checked={assistantIncludedIds.includes(doc.evidence_id)} onChange={e => setAssistantIncludedIds(ids => e.target.checked ? [...ids, doc.evidence_id] : ids.filter(id => id !== doc.evidence_id))}/>
//                           <FileText size={14}/><span><b>{doc.filename}</b><small>Evidence {doc.evidence_id} · {doc.searchable ? "Text searchable" : "Text unavailable / OCR needed"}</small></span>
//                         </label>
//                       ))}
//                     </div>
//                   )}
//                   <small className="ny-ai-context-note">All uploaded case files are listed. Only selected, text-extracted documents are searched for each question.</small>
//                 </div>
//                 <div className="ny-ai-messages">
//                   {assistantMessages.length === 0 && (
//                     <div className="ny-ai-welcome"><span><Sparkles size={20}/></span><b>Ask about this investigation</b><p>Ask in English or Hindi. I will retrieve relevant passages from the selected case documents and show their source pages.</p><div className="ny-ai-suggestions"><button type="button" onClick={() => setAssistantQuestion("What is reported about the ₹50,000 transaction?")}>Summarize the reported transaction</button><button type="button" onClick={() => setAssistantQuestion("Which information is still missing from this case?")}>What evidence is missing?</button></div></div>
//                   )}
//                   {assistantMessages.map((msg, index) => (
//                     <article key={index} className={`ny-ai-message ${msg.role}`}>
//                       <div className="ny-ai-message-role">{msg.role === "assistant" ? "NYAYA ONE" : "You"}</div>
//                       <p>{msg.content}</p>
//                       {msg.sources && msg.sources.length > 0 && <div className="ny-ai-citations"><b>Retrieved sources</b>{msg.sources.map((source, i) => <details key={`${source.evidence_id}-${source.page}-${i}`}><summary>Evidence {source.evidence_id} · {source.filename} · Page {source.page}</summary><blockquote>{source.excerpt}</blockquote></details>)}</div>}
                      
//                         {msg.answerMode && (
//                         <small className="ny-ai-answer-mode">
//                             {msg.answerMode === "groq_rag"
//                             ? "Groq-assisted · retrieved case sources"
//                             : msg.answerMode === "retrieval_only"
//                             ? "Retrieval-only · AI generation unavailable"
//                             : msg.answerMode === "greeting"
//                             ? "Conversational response"
//                             : "Case assistant"}
//                         </small>
//                         )}

//                       {msg.notice && <small className="ny-ai-message-notice">{msg.notice}</small>}
//                     </article>
//                   ))}
//                   {assistantLoading && <div className="ny-ai-typing"><span></span><span></span><span></span> Reviewing selected case sources…</div>}
//                 </div>
//                 <form className="ny-ai-composer" onSubmit={askCaseAssistant}>
//                   <textarea value={assistantQuestion} onChange={e => setAssistantQuestion(e.target.value)} placeholder="Ask about this case in Hindi or English…" rows={2} maxLength={2000} disabled={assistantLoading}/>
//                   <button type="submit" disabled={assistantLoading || !assistantQuestion.trim() || assistantIncludedIds.length === 0}><Send size={17}/><span>Send</span></button>
//                 </form>
//                 <div className="ny-ai-footer-note">Synthetic demo data only · Answers require officer review · Legal advice is not enabled</div>
//               </section>
//             )}
//           </>
//         )}

//         <footer>
//           Development prototype only · Use fictional data · Not for
//           operational investigations
//         </footer>
//       </main>
//     </div>
//   );
// }


// type DemoRole = "officer" | "admin";

// const DEMO_USERS: Record<DemoRole, { username: string; password: string; label: string }> = {
//   officer: { username: "officer.demo", password: "NYAYA-OFFICER-26", label: "Police Officer" },
//   admin: { username: "admin.demo", password: "NYAYA-ADMIN-26", label: "Administrator" },
// };

// function AdminDashboard({ onLogout }: { onLogout: () => void }) {
//   const [cases, setCases] = useState<CaseItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     axios.get(`${API}/api/cases`)
//       .then(r => setCases(r.data || []))
//       .catch(() => setError("Could not connect to the NYAYA ONE backend. Check that the API is running."))
//       .finally(() => setLoading(false));
//   }, []);

//   const active = cases.filter(c => !["closed", "completed", "disposed"].includes((c.status || "").toLowerCase())).length;
//   const closed = cases.length - active;

//   return (
//     <div className="ny-admin-shell">
//       <header className="ny-topbar">
//         <div className="ny-brand-small"><span className="ny-brand-mark"><ShieldCheck size={21}/></span><span>NYAYA <b>ONE</b><small>ADMIN CONSOLE</small></span></div>
//         <div className="ny-topbar-right"><span className="ny-role-chip"><Shield size={14}/> Administrator</span><button className="ny-logout" onClick={onLogout}><LogOut size={16}/> Sign out</button></div>
//       </header>
//       <main className="ny-admin-content">
//         <div className="ny-page-heading"><div><span className="ny-eyebrow">SUPERVISION & OVERSIGHT</span><h1>Administrator dashboard</h1><p>Case visibility and operational overview across the demonstration workspace.</p></div><span className="ny-demo-pill">DEMO ENVIRONMENT</span></div>
//         {error && <div className="ny-error">{error}</div>}
//         <div className="ny-metric-grid">
//           <div className="ny-metric"><span><FolderOpen size={18}/> Total cases</span><strong>{loading ? "—" : cases.length}</strong><small>Cases currently registered</small></div>
//           <div className="ny-metric"><span><Activity size={18}/> Active cases</span><strong>{loading ? "—" : active}</strong><small>Not marked closed or disposed</small></div>
//           <div className="ny-metric"><span><CheckCircle2 size={18}/> Closed / completed</span><strong>{loading ? "—" : closed}</strong><small>Based on recorded case status</small></div>
//           <div className="ny-metric"><span><Users size={18}/> Officer accounts</span><strong>1</strong><small>Demo account configured · not a live directory</small></div>
//         </div>
//         <section className="ny-admin-panel">
//           <div className="ny-panel-heading"><div><h2>Case register</h2><p>Read-only overview from the existing case API.</p></div><span className="ny-readonly">READ ONLY</span></div>
//           {loading ? <p className="ny-muted">Loading cases…</p> : cases.length === 0 ? <div className="ny-empty"><FolderOpen size={28}/><b>No cases registered yet</b><span>Create a case from the Police Officer workspace.</span></div> : (
//             <div className="ny-case-table-wrap"><table className="ny-case-table"><thead><tr><th>Case number</th><th>Case title</th><th>Type</th><th>Status</th></tr></thead><tbody>{cases.map(c => <tr key={c.id}><td><b>{c.case_number}</b></td><td>{c.title}</td><td>{c.case_type || "—"}</td><td><span className="ny-status">{c.status || "Open"}</span></td></tr>)}</tbody></table></div>
//           )}
//         </section>
//         <div className="ny-admin-notice"><LockKeyhole size={18}/><span><b>Administrative demo view.</b> This console currently provides read-only case visibility. User management, authenticated permissions and real officer workload reporting are not connected.</span></div>
//       </main>
//     </div>
//   );
// }

// export default function App() {
//   const [role, setRole] = useState<DemoRole>("officer");
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [signedInRole, setSignedInRole] = useState<DemoRole | null>(null);
//   const [loginError, setLoginError] = useState("");

//   function signIn(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     const expected = DEMO_USERS[role];
//     if (username.trim() === expected.username && password === expected.password) {
//       setSignedInRole(role);
//       setLoginError("");
//     } else {
//       setLoginError("Username or password is incorrect for the selected demo role.");
//     }
//   }

//   function signOut() {
//     setSignedInRole(null);
//     setUsername("");
//     setPassword("");
//     setLoginError("");
//   }

//   if (signedInRole === "officer") return <div className="ny-officer-app"><OfficerWorkspace officerName={username.trim()} onLogout={signOut} /></div>;
//   if (signedInRole === "admin") return <AdminDashboard onLogout={signOut} />;

//   return (
//     <div className="ny-login-page">
//       <section className="ny-brand-side">
//         <div className="ny-brand-lockup"><span className="ny-brand-mark"><ShieldCheck size={27}/></span><span>NYAYA <b>ONE</b><small>FINANCIAL CYBERCRIME INVESTIGATION COPILOT</small></span></div>
//         <div className="ny-brand-copy">
//           <span className="ny-eyebrow ny-gold">INTELLIGENCE • EVIDENCE • ACCOUNTABILITY</span>
//           <h1>One case.<br/><em>One intelligent</em><br/>workspace.</h1>
//           <p>A Hindi-first investigation copilot designed to help law enforcement organize digital evidence, connect reported financial transactions and plan investigative actions.</p>
//           <div className="ny-feature-list">
//             <div><span><FileSearch size={19}/></span><div><b>Evidence intelligence</b><small>Turn documents into structured, source-linked information.</small></div></div>
//             <div><span><Activity size={19}/></span><div><b>Financial trail analysis</b><small>Compare transaction references across case documents.</small></div></div>
//             <div><span><Landmark size={19}/></span><div><b>Officer-led investigation</b><small>Surface evidence gaps and suggested next steps for review.</small></div></div>
//           </div>
//         </div>
//         <div className="ny-brand-footer"><span>BUILT FOR RESPONSIBLE DIGITAL INVESTIGATION</span><span>Human oversight · Traceable evidence · Officer review</span></div>
//         <div className="ny-orbit ny-orbit-one"></div><div className="ny-orbit ny-orbit-two"></div>
//       </section>

//       <section className="ny-login-side">
//         <div className="ny-login-card">
//           <div className="ny-login-heading"><span className="ny-login-icon"><LockKeyhole size={21}/></span><span className="ny-eyebrow">SECURE PORTAL ACCESS</span><h2>Welcome back</h2><p>Sign in to continue to your workspace.</p></div>
//           <div className="ny-role-select" role="tablist" aria-label="Choose demo role">
//             <button type="button" className={role === "officer" ? "selected" : ""} onClick={() => {setRole("officer");setLoginError("");}}><Shield size={18}/><span><b>Police Officer</b><small>Investigation workspace</small></span></button>
//             <button type="button" className={role === "admin" ? "selected" : ""} onClick={() => {setRole("admin");setLoginError("");}}><LayoutDashboard size={18}/><span><b>Administrator</b><small>Supervision & oversight</small></span></button>
//           </div>
//           <form onSubmit={signIn} className="ny-login-form">
//             <label htmlFor="ny-username">Username</label><div className="ny-input-wrap"><UserRound size={17}/><input id="ny-username" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your username" required/></div>
//             <label htmlFor="ny-password">Password</label><div className="ny-input-wrap"><LockKeyhole size={17}/><input id="ny-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required/></div>
//             {loginError && <div className="ny-error" role="alert">{loginError}</div>}
//             <button className="ny-signin" type="submit">Sign in to NYAYA ONE <ArrowRight size={17}/></button>
//           </form>
//           <div className="ny-demo-credentials"><div><span className="ny-demo-dot"/> HACKATHON DEMO ACCOUNTS</div><p><b>Officer:</b> officer.demo / NYAYA-OFFICER-26</p><p><b>Admin:</b> admin.demo / NYAYA-ADMIN-26</p><small>These are demonstration credentials only. Do not use real personal or case data.</small></div>
//           <p className="ny-legal-note">NYAYA ONE supports investigation workflows. It does not determine guilt, authenticate evidence or replace an investigating officer's judgment.</p>
//           <div className="ny-login-bottom"><span><LockKeyhole size={13}/> Demonstration portal</span><span>English interface</span></div>
//         </div>
//       </section>
//     </div>
//   );
// }









import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import {
  ShieldCheck,
  FolderOpen,
  Upload,
  FileText,
  Plus,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Brain,
  History,
  LockKeyhole,
  UserRound,
  Users,
  LayoutDashboard,
  LogOut,
  ArrowRight,
  Shield,
  Activity,
  FileSearch,
  Landmark,
  Bot,
  Sparkles,
  Paperclip,
  Send,
  X,
  MessageCircle,
} from "lucide-react";

const API = "http://localhost:8000";

type CaseItem = {
  id: number;
  case_number: string;
  title: string;
  case_type: string;
  status: string;
};

type Evidence = {
  id: number;
  case_id: number;
  filename: string;
  sha256: string;
  size_bytes: number;
  extracted_text: string | null;
  status: string;
};

type Source = {
  page: number;
  quote: string;
};

type Entity = {
  type: string;
  value: string;
  attribution: string;
  verification: string;
  source: Source;
};

type TransactionObservation = {
  amount?: string;
  currency?: string;
  channel?: string | null;
  date_time?: string;
  attribution: string;
  verification: string;
  source: Source;
};

type EvidenceGap = {
  key: string;
  description: string;
  status: string;
};

type ReconciledTransaction = {
  transaction_reference: string;
  amount: string | null;
  currency: string | null;
  date_time: string | null;
  channel: string | null;
  beneficiary_vpa: string | null;
  all_observed_values: {
    amounts: string[];
    date_times: string[];
    channels: string[];
    beneficiary_vpas: string[];
  };
  match_basis: string;
  reconciliation_status: string;
  conflicting_fields: string[];
  verification: string;
  source_mentions: Source[];
  notice: string;
};


type CaseMoneyTrailTransaction = {
  transaction_reference: string;
  documents: { evidence_id: number; filename: string; sha256: string; reconciliation_status: string; verification: string }[];
  amounts: string[];
  date_times: string[];
  channels: string[];
  beneficiary_vpas: string[];
  source_mentions: { evidence_id: number; filename: string; page: number | null; quote: string }[];
  distinct_document_count: number;
  match_status: string;
  match_basis: string;
  conflicting_fields: string[];
  verification: string;
  officer_review_required: boolean;
  notice: string;
};
type CaseMoneyTrail = {
  case_id: number; case_number: string; document_count: number;
  analyzed_document_count: number; candidate_transaction_count: number;
  skipped_transactions_without_explicit_reference: number;
  matching_policy: string; transactions: CaseMoneyTrailTransaction[];
};


type OfficerDashboardCase = {
  caseItem: CaseItem;
  evidence: Evidence[];
  tasks: InvestigationTask[];
  gaps: CaseEvidenceGaps | null;
  trail: CaseMoneyTrail | null;
};
type OfficerActivity = {
  caseId: number;
  caseNumber: string;
  taskTitle: string;
  event: TaskAuditEvent;
};

type CaseEvidenceGap = {
  key: string;
  label: string;
  description: string;
  status: string;
  source_documents: { evidence_id: number; filename: string; status: string | null }[];
  received_documents: { evidence_id: number; filename: string; sha256: string; analyzed: boolean }[];
  officer_review_required: boolean;
  notice: string;
};
type CaseEvidenceGaps = {
  case_id: number;
  case_number: string;
  document_count: number;
  gaps: CaseEvidenceGap[];
  classification_policy: string;
};


type InvestigationTask = {
  id: number;
  case_id: number;
  gap_key: string;
  title: string;
  description: string;
  priority: string;
  status: "open" | "in_progress" | "evidence_received_pending_review" | "completed";
  trigger_evidence_ids: number[];
  officer_note: string | null;
  created_at: string;
  updated_at: string;
};
type InvestigationTasksResponse = {
  case_id: number;
  created?: number;
  updated?: number;
  tasks: InvestigationTask[];
};
type TaskAuditEvent = {
  id: number;
  action: string;
  from_status: string | null;
  to_status: string | null;
  officer_name: string;
  officer_note: string | null;
  related_evidence_ids: number[];
  created_at: string;
};

type AssistantSource = { evidence_id: number; filename: string; page: number; excerpt: string };
type AssistantResponse = {
  case_id: number;
  case_number: string;
  question: string;
  answer: string;
  answer_mode: string;
  sources: AssistantSource[];
  notice: string;
};

type AssistantContextDocument = {
  evidence_id: number; filename: string; status: string; analyzed: boolean; searchable: boolean;
};
type AssistantChatMessage = {
  role: "user" | "assistant"; content: string; sources?: AssistantSource[]; answerMode?: string; notice?: string;
};

type Analysis = {
  analysis_version: string;
  method: string;
  notice: string;
  entities: Entity[];
  transaction_observations: TransactionObservation[];
  reconciled_transactions: ReconciledTransaction[];
  evidence_gaps: EvidenceGap[];
};

function OfficerWorkspace({ officerName, onLogout }: { officerName: string; onLogout: () => void }) {
  const [dashboardCases, setDashboardCases] = useState<OfficerDashboardCase[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "cases">("dashboard");
  const [recentActivity, setRecentActivity] = useState<OfficerActivity[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selected, setSelected] = useState<CaseItem | null>(null);
  const [docs, setDocs] = useState<Evidence[]>([]);
  const [active, setActive] = useState<Evidence | null>(null);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantResponse, setAssistantResponse] = useState<AssistantResponse | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantChatMessage[]>([]);
  const [assistantContextDocs, setAssistantContextDocs] = useState<AssistantContextDocument[]>([]);
  const [assistantIncludedIds, setAssistantIncludedIds] = useState<number[]>([]);
  const [assistantContextLoading, setAssistantContextLoading] = useState(false);
  const [caseMoneyTrail, setCaseMoneyTrail] = useState<CaseMoneyTrail | null>(null);
  const [trailLoading, setTrailLoading] = useState(false);
  const [caseEvidenceGaps, setCaseEvidenceGaps] = useState<CaseEvidenceGaps | null>(null);
  const [investigationTasks, setInvestigationTasks] = useState<InvestigationTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskNotes, setTaskNotes] = useState<Record<number, string>>({});
  const [taskHistory, setTaskHistory] = useState<Record<number, TaskAuditEvent[]>>({});
  const [historyOpen, setHistoryOpen] = useState<Record<number, boolean>>({});
  const [historyLoading, setHistoryLoading] = useState<Record<number, boolean>>({});
  const [number, setNumber] = useState("DEMO-CYB-001");
  const [title, setTitle] = useState("Synthetic UPI financial fraud");

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  async function refresh() {
    const r = await axios.get(`${API}/api/cases`);
    const caseList: CaseItem[] = r.data;
    setCases(caseList);
    setDashboardLoading(true);
    try {
      const summaries = await Promise.all(caseList.map(async (caseItem) => {
        const [docsResult, tasksResult, gapsResult, trailResult] = await Promise.allSettled([
          axios.get(`${API}/api/cases/${caseItem.id}/documents`),
          axios.get(`${API}/api/cases/${caseItem.id}/tasks`),
          axios.get(`${API}/api/cases/${caseItem.id}/evidence-gaps`),
          axios.get(`${API}/api/cases/${caseItem.id}/money-trail`),
        ]);
        const evidence = docsResult.status === "fulfilled" ? docsResult.value.data as Evidence[] : [];
        const tasks = tasksResult.status === "fulfilled" ? (tasksResult.value.data.tasks || []) as InvestigationTask[] : [];
        const gaps = gapsResult.status === "fulfilled" ? gapsResult.value.data as CaseEvidenceGaps : null;
        const trail = trailResult.status === "fulfilled" ? trailResult.value.data as CaseMoneyTrail : null;
        return { caseItem, evidence, tasks, gaps, trail };
      }));
      setDashboardCases(summaries);

      const activityGroups = await Promise.all(summaries.flatMap(summary =>
        summary.tasks.slice(0, 5).map(async task => {
          try {
            const history = await axios.get(`${API}/api/cases/${summary.caseItem.id}/tasks/${task.id}/history`);
            return (history.data.events || []).map((event: TaskAuditEvent) => ({
              caseId: summary.caseItem.id,
              caseNumber: summary.caseItem.case_number,
              taskTitle: task.title,
              event,
            })) as OfficerActivity[];
          } catch {
            return [] as OfficerActivity[];
          }
        })
      ));
      setRecentActivity(activityGroups.flat().sort((a, b) =>
        new Date(b.event.created_at).getTime() - new Date(a.event.created_at).getTime()
      ).slice(0, 6));
    } finally {
      setDashboardLoading(false);
    }
  }

  async function loadDocs(id: number) {
    const r = await axios.get(`${API}/api/cases/${id}/documents`);
    setDocs(r.data);
  }

  async function loadMoneyTrail(id: number) {
    setTrailLoading(true);
    try {
      const r = await axios.get(`${API}/api/cases/${id}/money-trail`);
      setCaseMoneyTrail(r.data);
    } catch (e: any) {
      setCaseMoneyTrail(null);
      setMessage(e.response?.data?.detail || "Could not load case-level money trail.");
    } finally {
      setTrailLoading(false);
    }
  }

  async function loadCaseEvidenceGaps(id: number) {
    try {
      const r = await axios.get(`${API}/api/cases/${id}/evidence-gaps`);
      setCaseEvidenceGaps(r.data);
    } catch (e: any) {
      setCaseEvidenceGaps(null);
      setMessage(e.response?.data?.detail || "Could not load case-level evidence gaps.");
    }
  }

  async function loadInvestigationTasks(id: number, sync = false) {
    setTasksLoading(true);
    try {
      const r = sync
        ? await axios.post(`${API}/api/cases/${id}/tasks/sync`)
        : await axios.get(`${API}/api/cases/${id}/tasks`);
      setInvestigationTasks(r.data.tasks || []);
    } catch (e: any) {
      setMessage(e.response?.data?.detail || "Could not load investigation tasks.");
      setInvestigationTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }

  async function updateInvestigationTask(task: InvestigationTask, status: InvestigationTask["status"]) {
    if (!selected) return;
    try {
      const r = await axios.patch(
        `${API}/api/cases/${selected.id}/tasks/${task.id}`,
        { status, officer_name: officerName.trim(), officer_note: taskNotes[task.id]?.trim() || null }
      );
      setInvestigationTasks(current => current.map(item => item.id === task.id ? r.data : item));
      await loadTaskHistory(task.id);
      await refresh();
      setMessage(`Task action recorded in audit history: ${task.title}`);
    } catch (e: any) {
      setMessage(e.response?.data?.detail || "Could not update task.");
    }
  }

  async function loadTaskHistory(taskId: number) {
    if (!selected) return;
    setHistoryLoading(current => ({ ...current, [taskId]: true }));
    try {
      const r = await axios.get(`${API}/api/cases/${selected.id}/tasks/${taskId}/history`);
      setTaskHistory(current => ({ ...current, [taskId]: r.data.events || [] }));
    } catch (e: any) {
      setMessage(e.response?.data?.detail || "Could not load task audit history.");
    } finally {
      setHistoryLoading(current => ({ ...current, [taskId]: false }));
    }
  }

  async function toggleTaskHistory(taskId: number) {
    const next = !historyOpen[taskId];
    setHistoryOpen(current => ({ ...current, [taskId]: next }));
    if (next && !taskHistory[taskId]) await loadTaskHistory(taskId);
  }


  async function loadAssistantContext(caseId: number) {
    setAssistantContextLoading(true);
    try {
      const r = await axios.get(`${API}/api/cases/${caseId}/assistant/context`);
      const documents = (r.data.documents || []) as AssistantContextDocument[];
      setAssistantContextDocs(documents);
      setAssistantIncludedIds(documents.map(d => d.evidence_id));
    } catch {
      setAssistantContextDocs([]);
      setAssistantIncludedIds([]);
    } finally {
      setAssistantContextLoading(false);
    }
  }

  async function askCaseAssistant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || !assistantQuestion.trim() || assistantIncludedIds.length === 0) return;
    const question = assistantQuestion.trim();
    const prior = assistantMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));
    setAssistantMessages(current => [...current, { role: "user", content: question }]);
    setAssistantQuestion("");
    setAssistantLoading(true);
    setMessage("");
    try {
      const r = await axios.post(`${API}/api/cases/${selected.id}/assistant`, {
        question,
        language: "auto",
        include_evidence_ids: assistantIncludedIds,
        history: prior,
      });
      const data = r.data as AssistantResponse;
      setAssistantResponse(data);
      setAssistantMessages(current => [...current, {
        role: "assistant", content: data.answer, sources: data.sources,
        answerMode: data.answer_mode, notice: data.notice,
      }]);
    } catch (e: any) {
      setAssistantMessages(current => [...current, {
        role: "assistant", content: e.response?.data?.detail || "Could not answer from this case's documents. Check the backend and try again."
      }]);
    } finally {
      setAssistantLoading(false);
    }
  }


  useEffect(() => {
    refresh().catch(() =>
      setMessage("Backend unavailable. Start the FastAPI backend.")
    );
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    try {
      const r = await axios.post(`${API}/api/cases`, {
        case_number: number,
        title,
        case_type: "online_financial_fraud",
      });

      await refresh();
      setSelected(r.data);
      setDocs([]);
      setActive(null);
      setAnalysis(null);
      setAssistantResponse(null);
      setAssistantQuestion("");
      setAssistantMessages([]);
      setAssistantContextDocs([]);
      setAssistantIncludedIds([]);
      await loadAssistantContext(r.data.id);
      setCaseMoneyTrail(null);
      setCaseEvidenceGaps(null);
      await loadMoneyTrail(r.data.id);
      await loadCaseEvidenceGaps(r.data.id);
      await loadInvestigationTasks(r.data.id, true);
      setMessage("Case created successfully.");
    } catch (e: any) {
      setMessage(e.response?.data?.detail || "Could not create case");
    } finally {
      setBusy(false);
    }
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];

    if (!f || !selected) return;

    const fd = new FormData();
    fd.append("file", f);

    setBusy(true);

    try {
      await axios.post(
        `${API}/api/cases/${selected.id}/documents`,
        fd
      );

      await loadDocs(selected.id);
      await loadAssistantContext(selected.id);
      await loadMoneyTrail(selected.id);
      await loadCaseEvidenceGaps(selected.id);
      await loadInvestigationTasks(selected.id, true);
      setActive(null);
      setAnalysis(null);
      setMessage("Document uploaded and processed.");
    } catch (e: any) {
      setMessage(e.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function choose(c: CaseItem) {
    setSelected(c);
    setActive(null);
    setAnalysis(null);
    setAssistantResponse(null);
    setAssistantQuestion("");
    setAssistantMessages([]);
    setAssistantContextDocs([]);
    setAssistantIncludedIds([]);
    setAssistantOpen(false);
    setCaseMoneyTrail(null);
    setCaseEvidenceGaps(null);
    setMessage("");

    try {
      await loadDocs(c.id);
      await loadAssistantContext(c.id);
      await loadMoneyTrail(c.id);
      await loadCaseEvidenceGaps(c.id);
      await loadInvestigationTasks(c.id, true);
    } catch {
      setMessage("Could not load case documents.");
    }
  }

  async function chooseDocument(d: Evidence) {
    setActive(d);
    setAnalysis(null);
    setMessage("");

    if (!selected) return;

    try {
      const r = await axios.get(
        `${API}/api/cases/${selected.id}/documents/${d.id}/analysis`
      );

      setAnalysis(r.data.analysis);
    } catch (e: any) {
      if (e.response?.status !== 404) {
        setMessage("Could not retrieve saved analysis.");
      }
    }
  }

  async function runAnalysis() {
    if (!selected || !active) return;

    setAnalyzing(true);
    setMessage("");

    try {
      const r = await axios.post(
        `${API}/api/cases/${selected.id}/documents/${active.id}/analyze`
      );

      setAnalysis(r.data.analysis);
      await loadMoneyTrail(selected.id);
      await loadCaseEvidenceGaps(selected.id);
      await loadInvestigationTasks(selected.id, true);
      setMessage("Analysis complete; money trail, evidence gaps and tasks refreshed.");
    } catch (e: any) {
      setMessage(
        e.response?.data?.detail || "Document analysis failed."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="layout">
      <aside>
        <div className="brand">
          <ShieldCheck />
          <div>
            <b>NYAYA ONE</b>
            <small>INVESTIGATION COPILOT</small>
          </div>
        </div>

        <p className="muted">WORKSPACE</p>

        <nav className="officer-sidebar-nav" aria-label="Main navigation">
          <button
            type="button"
            className={`officer-nav-tab ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={17} /> Dashboard
          </button>
          <button
            type="button"
            className={`officer-nav-tab ${activeTab === "cases" ? "active" : ""}`}
            onClick={() => setActiveTab("cases")}
          >
            <FolderOpen size={17} /> Cases
          </button>
        </nav>

        <div className="sidebarNote">
          Synthetic demo environment
          <br />
          Development POC · v0.2
        </div>
      </aside>

      <main>
        <header className="officer-page-header">
          <div>
            <small>UP AI MISSION · HACKATHON POC</small>
            <h1>Investigation workspace</h1>
            <p className="officer-welcome">Signed in as <b>{officerName}</b> · Police Officer</p>
          </div>
          <div className="officer-header-actions">
            <span className="pill">
              <ShieldCheck size={15} /> Local demo workspace
            </span>
            <button type="button" className="ny-logout" onClick={onLogout}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </header>

        {message && <div className="message">{message}</div>}

        {activeTab === "dashboard" && <section className="officer-dashboard">
          <div className="officer-dashboard-heading">
            <div>
              <small>YOUR INVESTIGATION OVERVIEW</small>
              <h2>Good to see you, {officerName.split(/[._\s-]/)[0] || "Officer"}</h2>
              <p>Monitor active cases, evidence review and investigation follow-ups from one place.</p>
            </div>
            <button className="ghost officer-refresh" onClick={() => refresh()} disabled={dashboardLoading} title="Refresh overview">
              <RefreshCw size={16} className={dashboardLoading ? "spin" : ""} /> Refresh
            </button>
          </div>

          {(() => {
            const totalEvidence = dashboardCases.reduce((n, item) => n + item.evidence.length, 0);
            const analyzedEvidence = dashboardCases.reduce((n, item) =>
              n + item.evidence.filter(doc => doc.status?.toLowerCase().includes("analy")).length, 0);
            const analyzedDocs = dashboardCases.reduce((n, item) => n + (item.trail?.analyzed_document_count || 0), 0);
            const totalTasks = dashboardCases.reduce((n, item) => n + item.tasks.length, 0);
            const pendingTasks = dashboardCases.reduce((n, item) =>
              n + item.tasks.filter(task => task.status !== "completed").length, 0);
            const hasCases = dashboardCases.length > 0;
            const hasEvidence = totalEvidence > 0;
            const hasAnalysis = analyzedEvidence > 0 || analyzedDocs > 0;
            const hasPlan = totalTasks > 0 || dashboardCases.some(item => (item.gaps?.gaps.length || 0) > 0);
            const stages = [
              { title: "Register the case", detail: "Create the case and record complaint details.", done: hasCases, available: true, metric: `${dashboardCases.length} case(s)` },
              { title: "Upload evidence", detail: "Add FIRs, statements, bank records and screenshots.", done: hasEvidence, available: hasCases, metric: `${totalEvidence} file(s)` },
              { title: "Review extracted information", detail: "Analyze documents and verify source-linked facts.", done: hasAnalysis, available: hasEvidence, metric: `${analyzedDocs} analyzed document(s)` },
              { title: "Review financial transactions", detail: "Examine candidate matches, references and conflicts.", done: dashboardCases.some(item => (item.trail?.candidate_transaction_count || 0) > 0), available: hasAnalysis, metric: `${dashboardCases.reduce((n, item) => n + (item.trail?.candidate_transaction_count || 0), 0)} candidate(s)` },
              { title: "Identify gaps and plan actions", detail: "Review outstanding evidence and officer-assigned tasks.", done: totalTasks > 0 && pendingTasks === 0, available: hasAnalysis || hasPlan, metric: `${pendingTasks} pending task(s)` },
              { title: "Prepare requests and reports", detail: "Prepare drafts for officer review and approval.", done: false, available: false, metric: "Planned capability" },
              { title: "Monitor follow-ups", detail: "Track responses, task history and case progress.", done: false, available: false, metric: "Guided next phase" },
            ];
            const currentIndex = stages.findIndex(stage => stage.available && !stage.done);
            const completedCount = stages.filter(stage => stage.done).length;
            const openCase = () => {
              if (dashboardCases[0]) {
                setActiveTab("cases");
                choose(dashboardCases[0].caseItem);
                window.setTimeout(() => document.getElementById("officer-case-register")?.scrollIntoView({ behavior: "smooth" }), 80);
              } else {
                setActiveTab("cases");
              }
            };
            return (
              <section className="ny-workflow-panel" aria-label="Guided investigation workflow">
                <div className="ny-workflow-heading">
                  <div>
                    <small>YOUR STEP-BY-STEP GUIDE</small>
                    <h3>Investigation workflow</h3>
                    <p>Follow the stages below. Progress reflects information currently recorded in this demo workspace.</p>
                  </div>
                  <div className="ny-workflow-progress">
                    <b>{completedCount} / 7</b>
                    <small>stages recorded</small>
                  </div>
                </div>
                <div className="ny-workflow-track">
                  {stages.map((stage, index) => {
                    const state = stage.done ? "completed" : !stage.available ? "upcoming" : index === currentIndex ? "current" : "pending";
                    const label = state === "completed" ? "Recorded" : state === "current" ? "Next step" : state === "upcoming" ? "Coming soon" : "Pending";
                    return (
                      <button type="button" key={stage.title}
                        className={`ny-workflow-step ${state}`}
                        onClick={openCase}
                        disabled={!stage.available}
                        title={stage.available ? "Open a case to continue this workflow" : "This capability is planned and is not active in this prototype"}>
                        <span className="ny-workflow-step-top">
                          <span className="ny-workflow-number">{stage.done ? <CheckCircle2 size={17}/> : index + 1}</span>
                          <span className="ny-workflow-state">{label}</span>
                        </span>
                        <b>{stage.title}</b>
                        <small>{stage.detail}</small>
                        <span className="ny-workflow-metric">{stage.metric}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="ny-workflow-footnote">
                  <span><CheckCircle2 size={14}/> Recorded from case data</span>
                  <span><Activity size={14}/> Next action is officer-led</span>
                  <span>Future capabilities are clearly marked</span>
                </div>
              </section>
            );
          })()}

          <div className="officer-stat-grid">
            <button className="officer-stat" onClick={() => document.getElementById("officer-case-register")?.scrollIntoView({ behavior: "smooth" })}>
              <span><FolderOpen size={18}/> My active investigations</span>
              <b>{dashboardCases.filter(x => x.caseItem.status?.toLowerCase() !== "closed" && x.caseItem.status?.toLowerCase() !== "completed").length}</b>
              <small>Cases currently in the workspace</small>
            </button>
            <button className="officer-stat" onClick={() => document.getElementById("officer-case-register")?.scrollIntoView({ behavior: "smooth" })}>
              <span><Brain size={18}/> Pending investigation tasks</span>
              <b>{dashboardCases.reduce((n, x) => n + x.tasks.filter(t => t.status !== "completed").length, 0)}</b>
              <small>Open, in progress or awaiting review</small>
            </button>
            <button className="officer-stat" onClick={() => document.getElementById("officer-case-register")?.scrollIntoView({ behavior: "smooth" })}>
              <span><FileSearch size={18}/> Evidence awaiting review</span>
              <b>{dashboardCases.reduce((n, x) => n + x.evidence.filter(d => d.status?.toLowerCase().includes("uploaded") || d.status?.toLowerCase().includes("pending")).length, 0)}</b>
              <small>Uploaded files not yet analyzed</small>
            </button>
            <button className="officer-stat" onClick={() => document.getElementById("officer-case-register")?.scrollIntoView({ behavior: "smooth" })}>
              <span><Activity size={18}/> Financial transaction alerts</span>
              <b>{dashboardCases.reduce((n, x) => n + (x.trail?.transactions.filter(t => t.conflicting_fields.length > 0 || t.match_status.includes("conflict")).length || 0), 0)}</b>
              <small>Candidate matches with extracted conflicts</small>
            </button>
          </div>

          <div className="officer-overview-grid">
            <section className="officer-overview-card">
              <div className="officer-card-title"><div><h3>My active investigations</h3><p>Select a case to open its full workspace.</p></div><span>{dashboardCases.length} total</span></div>
              {dashboardLoading ? <p className="notice">Loading case overview…</p> : dashboardCases.length === 0 ? <p className="notice">No cases are registered yet. Create a synthetic demo case below.</p> : dashboardCases.map(item => (
                <button className="officer-case-row" key={item.caseItem.id} onClick={() => { setActiveTab("cases"); choose(item.caseItem); }}>
                  <span className="officer-case-icon"><FolderOpen size={17}/></span>
                  <span className="officer-case-main"><b>{item.caseItem.case_number}</b><small>{item.caseItem.title}</small></span>
                  <span className="officer-case-meta"><b>{item.tasks.filter(t => t.status !== "completed").length} tasks</b><small>{item.evidence.length} evidence files</small></span>
                  <ArrowRight size={17}/>
                </button>
              ))}
            </section>

            <section className="officer-overview-card">
              <div className="officer-card-title"><div><h3>Pending investigation tasks</h3><p>Officer-reviewed follow-ups across your cases.</p></div><Brain size={19}/></div>
              {dashboardCases.flatMap(item => item.tasks.filter(t => t.status !== "completed").map(task => ({...task, caseNumber:item.caseItem.case_number, caseId:item.caseItem.id}))).slice(0,5).map(task => (
                <button className="officer-task-row" key={`${task.caseId}-${task.id}`} onClick={() => { setActiveTab("cases"); choose(dashboardCases.find(x => x.caseItem.id === task.caseId)!.caseItem); }}>
                  <span className={`task-dot task-${task.status}`}/>
                  <span><b>{task.title}</b><small>{task.caseNumber} · {task.status.split("_").join(" ")}</small></span>
                </button>
              ))}
              {!dashboardLoading && dashboardCases.every(x => x.tasks.filter(t => t.status !== "completed").length === 0) && <p className="notice">No pending tasks found.</p>}
            </section>

            <section className="officer-overview-card">
              <div className="officer-card-title"><div><h3>Evidence awaiting review</h3><p>New uploads that may need analysis or officer review.</p></div><FileSearch size={19}/></div>
              {dashboardCases.flatMap(item => item.evidence.filter(d => d.status?.toLowerCase().includes("uploaded") || d.status?.toLowerCase().includes("pending")).map(doc => ({...doc, caseNumber:item.caseItem.case_number, caseId:item.caseItem.id}))).slice(0,5).map(doc => (
                <button className="officer-task-row" key={`${doc.caseId}-${doc.id}`} onClick={() => choose(dashboardCases.find(x => x.caseItem.id === doc.caseId)!.caseItem)}>
                  <FileText size={17}/><span><b>{doc.filename}</b><small>{doc.caseNumber} · {doc.status}</small></span>
                </button>
              ))}
              {!dashboardLoading && dashboardCases.every(x => !x.evidence.some(d => d.status?.toLowerCase().includes("uploaded") || d.status?.toLowerCase().includes("pending"))) && <p className="notice">No uploaded evidence awaiting analysis was found.</p>}
            </section>

            <section className="officer-overview-card">
              <div className="officer-card-title"><div><h3>Financial transaction alerts</h3><p>Exact-reference matches and conflicts surfaced from analyzed documents.</p></div><Activity size={19}/></div>
              {dashboardCases.flatMap(item => (item.trail?.transactions || []).map(tx => ({...tx, caseNumber:item.caseItem.case_number, caseId:item.caseItem.id}))).slice(0,5).map(tx => (
                <button className="officer-task-row" key={`${tx.caseId}-${tx.transaction_reference}`} onClick={() => choose(dashboardCases.find(x => x.caseItem.id === tx.caseId)!.caseItem)}>
                  <span className={`task-dot ${tx.conflicting_fields.length ? "task-conflict" : "task-open"}`}/>
                  <span><b>{tx.transaction_reference}</b><small>{tx.caseNumber} · {tx.distinct_document_count} document(s) · {tx.conflicting_fields.length ? "Conflict flagged" : "Candidate match; unverified"}</small></span>
                </button>
              ))}
              {!dashboardLoading && dashboardCases.every(x => !x.trail?.transactions.length) && <p className="notice">No transaction candidates have been extracted yet.</p>}
            </section>

            <section className="officer-overview-card officer-activity-card">
              <div className="officer-card-title"><div><h3>Recent case activity</h3><p>Latest recorded task actions in the audit history.</p></div><History size={19}/></div>
              {recentActivity.map((item, index) => <div className="officer-activity-row" key={`${item.event.id}-${index}`}><span className="activity-marker"/><span><b>{item.event.action.split("_").join(" ")}</b><small>{item.caseNumber} · {item.taskTitle}</small><small>{item.event.officer_name} · {new Date(item.event.created_at).toLocaleString()}</small></span></div>)}
              {!dashboardLoading && recentActivity.length === 0 && <p className="notice">No task activity has been recorded yet.</p>}
            </section>
          </div>
        </section>}

        {activeTab === "cases" && <div className="columns" id="officer-case-register">
          <section className="panel">
            <div className="heading">
              <div>
                <h2>Cases</h2>
                <small>Manage synthetic investigation cases</small>
              </div>

              <button
                className="ghost"
                onClick={() => refresh()}
                title="Refresh cases"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <form onSubmit={create}>
              <label>
                Case reference
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                />
              </label>

              <label>
                Case title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>

              <button className="primary" disabled={busy}>
                <Plus size={16} /> Create case
              </button>
            </form>

            <div className="list">
              {cases.map((c) => (
                <button
                  className={`case ${
                    selected?.id === c.id ? "chosen" : ""
                  }`}
                  key={c.id}
                  onClick={() => choose(c)}
                >
                  <FolderOpen size={17} />

                  <span>
                    <b>{c.case_number}</b>
                    <small>{c.title}</small>
                  </span>

                  <em>{c.status}</em>
                </button>
              ))}

              {!cases.length && (
                <p className="empty">
                  No cases yet. Create your first synthetic case.
                </p>
              )}
            </div>
          </section>

          <section className="panel detail">
            {!selected ? (
              <div className="emptyState">
                <FolderOpen size={40} />
                <h2>Select or create a case</h2>
                <p>Documents and extracted text appear here.</p>
              </div>
            ) : (
              <>
                <div className="heading">
                  <div>
                    <small>CASE WORKSPACE</small>
                    <h2>{selected.case_number}</h2>
                    <p>{selected.title}</p>
                  </div>

                  <em className="active">Active</em>
                </div>

                <div className="meta">
                  <span>Case type</span>
                  <b>Online financial fraud</b>
                  <span>Evidence files</span>
                  <b>{docs.length}</b>
                </div>

                <label className="upload">
                  <Upload />
                  <b>Upload evidence PDF</b>
                  <small>PDF · Maximum 20 MB</small>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={upload}
                    disabled={busy}
                  />
                </label>

                <h3>Evidence inventory</h3>

                {docs.map((d) => (
                  <button
                    className={`doc ${
                      active?.id === d.id ? "chosen" : ""
                    }`}
                    key={d.id}
                    onClick={() => chooseDocument(d)}
                  >
                    <FileText size={17} />

                    <span>
                      <b>{d.filename}</b>
                      <small>
                        {(d.size_bytes / 1024).toFixed(1)} KB · {d.status}
                      </small>
                    </span>
                  </button>
                ))}

                {active && (
                  <div className="extract">
                    <b>SHA-256 fingerprint</b>
                    <code>{active.sha256}</code>

                    <h3>Extracted text</h3>
                    <pre>
                      {active.extracted_text ||
                        "No embedded text found. OCR is planned."}
                    </pre>

                    <div className="analysisAction">
                      <h3>
                        <Brain size={19} /> Case intelligence
                      </h3>

                      <p>
                        Run deterministic, source-linked extraction on
                        this document.
                      </p>

                      <button
                        className="primary"
                        onClick={runAnalysis}
                        disabled={analyzing || !active.extracted_text}
                      >
                        <Search size={16} />
                        {analyzing
                          ? "Analyzing document..."
                          : analysis
                          ? "Run analysis again"
                          : "Analyze document"}
                      </button>
                    </div>

                    {analysis && (
                      <div className="analysisResults">
                        <h3>Preliminary analysis results</h3>

                        <p className="notice">{analysis.notice}</p>

                        <div className="analysisMeta">
                          Method: {analysis.method} · Version:{" "}
                          {analysis.analysis_version}
                        </div>

                        <h3>Extracted entities</h3>

                        {analysis.entities.length === 0 && (
                          <p>No matching entities detected.</p>
                        )}

                        {analysis.entities.map((entity, i) => (
                          <div className="finding" key={i}>
                            <b>{entity.type.split("_").join(" ")}</b>
                            <p>{entity.value}</p>
                            <small>
                              Attribution: {entity.attribution}
                            </small>
                            <small>
                              Verification: {entity.verification}
                            </small>
                            <div className="source">
                              Page {entity.source.page}: "
                              {entity.source.quote}"
                            </div>
                          </div>
                        ))}

                        <h3>Transaction observations</h3>

                        {analysis.transaction_observations.length === 0 && (
                          <p>No transaction observations detected.</p>
                        )}

                        {analysis.transaction_observations.map((tx, i) => (
                          <div className="finding" key={i}>
                            {tx.amount && (
                              <p>
                                <b>Reported amount:</b> {tx.currency}{" "}
                                {tx.amount}
                              </p>
                            )}

                            {tx.channel && (
                              <p>
                                <b>Channel:</b> {tx.channel}
                              </p>
                            )}

                            {tx.date_time && (
                              <p>
                                <b>Date/time:</b> {tx.date_time}
                              </p>
                            )}

                            <small>{tx.verification}</small>

                            <div className="source">
                              Page {tx.source.page}: "{tx.source.quote}"
                            </div>
                          </div>
                        ))}

                        <section className="transactionPanel">
                          <div className="transactionHeader">
                            <div>
                              <h3>Financial Transaction Intelligence</h3>
                              <p>
                                Candidate transactions grouped using an
                                explicit transaction reference.
                              </p>
                            </div>
                            <span className="transactionStatus">
                              Source data · Unverified
                            </span>
                          </div>

                          {!analysis.reconciled_transactions ||
                          analysis.reconciled_transactions.length === 0 ? (
                            <p>
                              No candidate transactions could be grouped by
                              an explicit transaction reference in this
                              document.
                            </p>
                          ) : (
                            analysis.reconciled_transactions.map((tx, i) => (
                              <article className="transactionCard" key={`${tx.transaction_reference}-${i}`}>
                                <div className="transactionAmountRow">
                                  <div>
                                    <small>Candidate transaction amount</small>
                                    <div className="transactionAmount">
                                      {tx.currency === "INR" ? "₹" : ""}
                                      {tx.amount
                                        ? Number(tx.amount).toLocaleString("en-IN")
                                        : "Not available"}
                                    </div>
                                  </div>
                                  <span
                                    className={`transactionStatus ${
                                      tx.reconciliation_status ===
                                      "candidate_reconciled_unverified"
                                        ? "candidate"
                                        : "conflict"
                                    }`}
                                  >
                                    {tx.reconciliation_status.split("_").join(" ")}
                                  </span>
                                </div>

                                <div className="transactionGrid">
                                  <div className="transactionField">
                                    <small>Transaction reference</small>
                                    <code>{tx.transaction_reference}</code>
                                  </div>
                                  <div className="transactionField">
                                    <small>Payment channel</small>
                                    <b>{tx.channel || "Not identified"}</b>
                                  </div>
                                  <div className="transactionField">
                                    <small>Date and time</small>
                                    <b>{tx.date_time || "Not identified"}</b>
                                  </div>
                                  <div className="transactionField">
                                    <small>Beneficiary VPA</small>
                                    <code>{tx.beneficiary_vpa || "Not identified"}</code>
                                  </div>
                                  <div className="transactionField">
                                    <small>Source mentions</small>
                                    <b>{tx.source_mentions?.length ?? 0}</b>
                                  </div>
                                  <div className="transactionField">
                                    <small>Conflicting fields</small>
                                    <b>
                                      {tx.conflicting_fields?.length
                                        ? tx.conflicting_fields.join(", ")
                                        : "None detected"}
                                    </b>
                                  </div>
                                </div>

                                <div className="transactionNotice">
                                  {tx.notice ||
                                    "Candidate grouping only. This does not establish that a payment occurred."}
                                  {" "}Verification: {tx.verification}.
                                </div>

                                {tx.source_mentions?.length > 0 && (
                                  <div className="transactionSources">
                                    <b>Source references</b>
                                    {tx.source_mentions.map((source, sourceIndex) => (
                                      <div className="source" key={sourceIndex}>
                                        Page {source.page}: "{source.quote}"
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </article>
                            ))
                          )}
                        </section>

                        <section className="moneyTrailPanel">
                          <div className="moneyTrailHeader">
                            <div>
                              <h3>Case-wide Money Trail Explorer</h3>
                              <p>
                                Transactions aggregated across analyzed evidence documents.
                                Only exact explicit transaction-reference matches are grouped.
                              </p>
                            </div>
                            <button
                              type="button"
                              className={`moneyTrailRefreshButton${trailLoading ? " isLoading" : ""}`}
                              onClick={() => selected && loadMoneyTrail(selected.id)}
                              disabled={trailLoading || !selected}
                              title={trailLoading ? "Refreshing case money trail" : "Refresh case money trail"}
                              aria-label={trailLoading ? "Refreshing case money trail" : "Refresh case money trail"}
                            >
                              <RefreshCw size={18} />
                            </button>
                          </div>

                          {trailLoading && <p className="notice">Loading case-wide transaction matches...</p>}
                          {!trailLoading && caseMoneyTrail && (
                            <>
                              <div className="moneyTrailSummary">
                                <div><small>Evidence files</small><b>{caseMoneyTrail.document_count}</b></div>
                                <div><small>Analyzed files</small><b>{caseMoneyTrail.analyzed_document_count}</b></div>
                                <div><small>Candidate transactions</small><b>{caseMoneyTrail.candidate_transaction_count}</b></div>
                              </div>
                              <p className="moneyTrailPolicy">Matching policy: {caseMoneyTrail.matching_policy}</p>

                              {caseMoneyTrail.transactions.length === 0 ? (
                                <p className="notice">No candidate transactions with explicit references found in analyzed documents.</p>
                              ) : caseMoneyTrail.transactions.map((tx, i) => (
                                <article className="moneyTrailCard" key={`case-trail-${tx.transaction_reference}-${i}`}>
                                  <div className="moneyTrailTransactionTop">
                                    <div><small>TRANSACTION REFERENCE</small><code>{tx.transaction_reference}</code></div>
                                    <span className={`moneyTrailStatus ${tx.match_status.includes("conflicts") ? "conflict" : tx.distinct_document_count > 1 ? "matched" : "single"}`}>
                                      {tx.match_status.split("_").join(" ")}
                                    </span>
                                  </div>
                                  <div className="moneyTrailLegend">
                                    <span><i className="legendDot reported" /> Source-reported value</span>
                                    <span><i className="legendDot missing" /> Not independently verified</span>
                                  </div>
                                  <div className="moneyTrailComparison">
                                    <div><small>AMOUNT(S)</small><b>{tx.amounts.length ? tx.amounts.map(v => `₹${Number(v).toLocaleString("en-IN")}`).join(" · ") : "Not extracted"}</b></div>
                                    <div><small>DATE / TIME</small><b>{tx.date_times.length ? tx.date_times.join(" · ") : "Not extracted"}</b></div>
                                    <div><small>CHANNEL(S)</small><b>{tx.channels.length ? tx.channels.join(" · ") : "Not extracted"}</b></div>
                                    <div><small>BENEFICIARY VPA(S)</small><b>{tx.beneficiary_vpas.length ? tx.beneficiary_vpas.join(" · ") : "Not extracted"}</b></div>
                                  </div>
                                  <div className="moneyTrailDocumentList">
                                    <b>Documents contributing to this candidate ({tx.distinct_document_count})</b>
                                    {tx.documents.map(document => (
                                      <div className="moneyTrailDocument" key={document.evidence_id}>
                                        <FileText size={16} />
                                        <div><b>{document.filename}</b><small>Evidence ID {document.evidence_id} · {document.reconciliation_status.split("_").join(" ")}</small></div>
                                      </div>
                                    ))}
                                  </div>
                                  {tx.conflicting_fields.length > 0 ? (
                                    <div className="moneyTrailUnknown conflictNotice">
                                      <AlertTriangle size={18} /><div><b>Field discrepancies detected</b><p>Review: {tx.conflicting_fields.map(v => v.split("_").join(" ")).join(", ")}. Values are preserved separately; the system has not chosen a winner.</p></div>
                                    </div>
                                  ) : tx.distinct_document_count > 1 ? (
                                    <div className="moneyTrailUnknown">
                                      <CheckCircle2 size={18} /><div><b>Cross-document candidate match</b><p>The same explicit transaction reference appears in {tx.distinct_document_count} documents. Extracted values show no conflicts. This does not authenticate either document or independently establish that payment occurred.</p></div>
                                    </div>
                                  ) : (
                                    <div className="moneyTrailUnknown">
                                      <AlertTriangle size={18} /><div><b>Single-document candidate</b><p>This reference currently appears in only one analyzed document.</p></div>
                                    </div>
                                  )}
                                  <div className="transactionSources">
                                    <b>Source quotations by document</b>
                                    {tx.source_mentions.map((source, sourceIndex) => (
                                      <div className="source" key={`${source.evidence_id}-${sourceIndex}`}>
                                        <b>{source.filename}</b> · Evidence {source.evidence_id} · Page {source.page ?? "—"}
                                        <p>"{source.quote}"</p>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="moneyTrailFootnote">{tx.notice} Officer review required: {tx.officer_review_required ? "Yes" : "No"}. Verification: {tx.verification}.</div>
                                </article>
                              ))}
                            </>
                          )}
                        </section>

                        <h3>
                          <AlertTriangle size={18} /> Case-wide evidence gaps
                        </h3>

                        {!caseEvidenceGaps ? (
                          <p className="notice">Case-wide evidence gap status is unavailable. Refresh the case data.</p>
                        ) : caseEvidenceGaps.gaps.length === 0 ? (
                          <p>
                            No evidence gaps were identified in analyzed source documents.
                            This does not establish that the investigation is complete.
                          </p>
                        ) : (
                          <div className="caseEvidenceGapList">
                            {caseEvidenceGaps.gaps.map((gap) => {
                              const received = gap.status === "received_in_case_unverified";
                              return (
                                <div className={`caseEvidenceGap ${received ? "received" : "outstanding"}`} key={gap.key}>
                                  <div className="caseEvidenceGapIcon">
                                    {received ? <CheckCircle2 size={19} /> : <AlertTriangle size={19} />}
                                  </div>
                                  <div className="caseEvidenceGapBody">
                                    <div className="caseEvidenceGapTop">
                                      <b>{gap.label}</b>
                                      <span className={`caseEvidenceGapStatus ${received ? "received" : "outstanding"}`}>
                                        {received ? "Received · unverified" : "Still outstanding"}
                                      </span>
                                    </div>
                                    <p>{gap.description}</p>
                                    {received ? (
                                      <div className="caseEvidenceGapDocs">
                                        {gap.received_documents.map((doc) => (
                                          <small key={doc.evidence_id}>
                                            <FileText size={13} /> {doc.filename} · Evidence ID {doc.evidence_id}
                                            {doc.analyzed ? " · analyzed" : " · not yet analyzed"}
                                          </small>
                                        ))}
                                      </div>
                                    ) : (
                                      <small>
                                        Source: {gap.source_documents.map((doc) => `${doc.filename} (Evidence ${doc.evidence_id})`).join("; ")}
                                      </small>
                                    )}
                                    <small className="caseEvidenceGapNotice">{gap.notice}</small>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <p className="notice">
                          <CheckCircle2 size={16} />
                          Case-level status is inferred from uploaded filename and text cues only.
                          File presence does not establish authenticity, completeness, or evidentiary sufficiency.
                          Officer review is required.
                        </p>

                      </div>
                    )}
                  </div>
                )}


                <section className="investigationTasksPanel">
                  <div className="investigationTasksHeader">
                    <div>
                      <h3><Brain size={18} /> Suggested investigation tasks</h3>
                      <p>Tasks are generated from source-reported evidence gaps. New uploads can flag a task for officer review; no task is automatically completed.</p>
                    </div>
                    <button
                      type="button"
                      className="tasksRefreshButton"
                      onClick={() => selected && loadInvestigationTasks(selected.id, true)}
                      disabled={tasksLoading || !selected}
                      title="Refresh suggested investigation tasks"
                      aria-label="Refresh suggested investigation tasks"
                    >
                      <RefreshCw size={17} />
                    </button>
                  </div>

                  <div className="auditOfficerIdentity auditOfficerIdentitySignedIn">
                    <span className="auditActorIcon"><UserRound size={17} /></span>
                    <div>
                      <b>Audit actor: {officerName}</b>
                      <small>Task actions will be recorded under the signed-in demo account. Production deployment must connect this identity to an authenticated officer directory.</small>
                    </div>
                  </div>

                  {tasksLoading ? (
                    <p className="notice">Updating investigation tasks...</p>
                  ) : investigationTasks.length === 0 ? (
                    <p className="notice">No suggested tasks yet. Analyze source documents to identify evidence gaps.</p>
                  ) : (
                    <div className="investigationTaskList">
                      {investigationTasks.map(task => (
                        <article className={`investigationTask ${task.status}`} key={task.id}>
                          <div className="investigationTaskTop">
                            <div>
                              <span className="taskPriority">{task.priority} priority</span>
                              <h4>{task.title}</h4>
                            </div>
                            <span className={`taskStatus ${task.status}`}>
                              {task.status.split("_").join(" ")}
                            </span>
                          </div>
                          <p>{task.description}</p>
                          {task.trigger_evidence_ids.length > 0 && (
                            <small className="taskEvidence">
                              Related uploaded evidence: {task.trigger_evidence_ids.map(id => `Evidence ${id}`).join(", ")}
                            </small>
                          )}
                          {task.officer_note && <small className="taskEvidence">Officer note: {task.officer_note}</small>}
                          <label className="taskNoteLabel">
                            Officer action note (optional)
                            <textarea
                              value={taskNotes[task.id] ?? ""}
                              onChange={e => setTaskNotes(current => ({ ...current, [task.id]: e.target.value }))}
                              placeholder="Record a brief reason or review note..."
                              rows={2}
                              maxLength={2000}
                            />
                          </label>
                          <div className="taskActions">
                            {task.status !== "completed" && (
                              <>
                                {task.status !== "in_progress" && (
                                  <button type="button" className="taskActionSecondary" disabled={!officerName.trim()}
                                    onClick={() => updateInvestigationTask(task, "in_progress")}>
                                    Mark in progress
                                  </button>
                                )}
                                <button type="button" className="taskActionPrimary" disabled={!officerName.trim()}
                                  onClick={() => updateInvestigationTask(task, "completed")}>
                                  {task.status === "evidence_received_pending_review" ? "Officer reviewed · complete task" : "Officer confirms completed"}
                                </button>
                                {task.status === "in_progress" && (
                                  <button type="button" className="taskActionSecondary" disabled={!officerName.trim()}
                                    onClick={() => updateInvestigationTask(task, "open")}>
                                    Return to open
                                  </button>
                                )}
                              </>
                            )}
                            {task.status === "completed" && <span className="taskCompletedNote"><CheckCircle2 size={15}/> Marked completed by officer</span>}
                            <button type="button" className="taskActionSecondary" onClick={() => toggleTaskHistory(task.id)}>
                              <History size={14} /> {historyOpen[task.id] ? "Hide activity history" : "View activity history"}
                            </button>
                          </div>
                          {historyOpen[task.id] && (
                            <div className="taskAuditTimeline">
                              <b>Task activity history</b>
                              {historyLoading[task.id] ? (
                                <small>Loading audit events...</small>
                              ) : (taskHistory[task.id] || []).length === 0 ? (
                                <small>No audit events recorded yet.</small>
                              ) : (
                                (taskHistory[task.id] || []).map(event => (
                                  <div className="taskAuditEvent" key={event.id}>
                                    <span className="taskAuditDot" />
                                    <div>
                                      <b>{event.action.split("_").join(" ")}</b>
                                      <small>{new Date(event.created_at).toLocaleString()}</small>
                                      <small>Actor: {event.officer_name}</small>
                                      {event.from_status && <small>Status: {event.from_status.split("_").join(" ")} → {event.to_status?.split("_").join(" ")}</small>}
                                      {event.related_evidence_ids.length > 0 && <small>Related evidence: {event.related_evidence_ids.map(id => `Evidence ${id}`).join(", ")}</small>}
                                      {event.officer_note && <p>{event.officer_note}</p>}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                  <p className="taskSafetyNote">
                    Suggested workflow only. These tasks do not create legal deadlines, issue notices, contact banks,
                    or replace the investigating officer's judgment. Completion requires an explicit officer action. Officer names are self-reported in this prototype; authentication is not yet integrated.
                  </p>
                </section>
              </>
            )}
          </section>
        </div>}

        {selected && (
          <>
            <button type="button" className={`ny-ai-fab ${assistantOpen ? "is-open" : ""}`} onClick={() => { setAssistantOpen(v => !v); if (!assistantContextDocs.length) loadAssistantContext(selected.id); }} aria-label="Open AI Help">
              {assistantOpen ? <X size={21}/> : <Sparkles size={21}/>}
              <span>{assistantOpen ? "Close" : "AI Help"}</span>
            </button>
            {assistantOpen && (
              <section className="ny-ai-chat" aria-label="NYAYA ONE AI Help chatbot">
                <header className="ny-ai-chat-head">
                  <div className="ny-ai-chat-brand"><span><Bot size={19}/></span><div><b>NYAYA ONE AI Help</b><small>{selected.case_number} · Case-aware assistant</small></div></div>
                  <button type="button" onClick={() => setAssistantOpen(false)} aria-label="Close chatbot"><X size={18}/></button>
                </header>
                <div className="ny-ai-attachments">
                  <div className="ny-ai-attachments-title"><Paperclip size={14}/><b>Case documents attached</b><small>{assistantIncludedIds.length}/{assistantContextDocs.length}</small></div>
                  {assistantContextLoading ? <small>Loading case documents…</small> : assistantContextDocs.length === 0 ? <small>No uploaded documents in this case yet.</small> : (
                    <div className="ny-ai-doc-list">
                      {assistantContextDocs.map(doc => (
                        <label key={doc.evidence_id} className="ny-ai-doc-item">
                          <input type="checkbox" checked={assistantIncludedIds.includes(doc.evidence_id)} onChange={e => setAssistantIncludedIds(ids => e.target.checked ? [...ids, doc.evidence_id] : ids.filter(id => id !== doc.evidence_id))}/>
                          <FileText size={14}/><span><b>{doc.filename}</b><small>Evidence {doc.evidence_id} · {doc.searchable ? "Text searchable" : "Text unavailable / OCR needed"}</small></span>
                        </label>
                      ))}
                    </div>
                  )}
                  <small className="ny-ai-context-note">All uploaded case files are listed. Only selected, text-extracted documents are searched for each question.</small>
                </div>
                <div className="ny-ai-messages">
                  {assistantMessages.length === 0 && (
                    <div className="ny-ai-welcome"><span><Sparkles size={20}/></span><b>Ask about this investigation</b><p>Ask in English or Hindi. I will retrieve relevant passages from the selected case documents and show their source pages.</p><div className="ny-ai-suggestions"><button type="button" onClick={() => setAssistantQuestion("What is reported about the ₹50,000 transaction?")}>Summarize the reported transaction</button><button type="button" onClick={() => setAssistantQuestion("Which information is still missing from this case?")}>What evidence is missing?</button></div></div>
                  )}
                  {assistantMessages.map((msg, index) => (
                    <article key={index} className={`ny-ai-message ${msg.role}`}>
                      <div className="ny-ai-message-role">{msg.role === "assistant" ? "NYAYA ONE" : "You"}</div>
                      <p>{msg.content}</p>
                      {msg.sources && msg.sources.length > 0 && <div className="ny-ai-citations"><b>Retrieved sources</b>{msg.sources.map((source, i) => <details key={`${source.evidence_id}-${source.page}-${i}`}><summary>Evidence {source.evidence_id} · {source.filename} · Page {source.page}</summary><blockquote>{source.excerpt}</blockquote></details>)}</div>}
                      
                        {msg.answerMode && (
                        <small className="ny-ai-answer-mode">
                            {msg.answerMode === "groq_rag"
                            ? "Groq-assisted · retrieved case sources"
                            : msg.answerMode === "retrieval_only"
                            ? "Retrieval-only · AI generation unavailable"
                            : msg.answerMode === "greeting"
                            ? "Conversational response"
                            : "Case assistant"}
                        </small>
                        )}

                      {msg.notice && <small className="ny-ai-message-notice">{msg.notice}</small>}
                    </article>
                  ))}
                  {assistantLoading && <div className="ny-ai-typing"><span></span><span></span><span></span> Reviewing selected case sources…</div>}
                </div>
                <form className="ny-ai-composer" onSubmit={askCaseAssistant}>
                  <textarea value={assistantQuestion} onChange={e => setAssistantQuestion(e.target.value)} placeholder="Ask about this case in Hindi or English…" rows={2} maxLength={2000} disabled={assistantLoading}/>
                  <button type="submit" disabled={assistantLoading || !assistantQuestion.trim() || assistantIncludedIds.length === 0}><Send size={17}/><span>Send</span></button>
                </form>
                <div className="ny-ai-footer-note">Synthetic demo data only · Answers require officer review · Legal advice is not enabled</div>
              </section>
            )}
          </>
        )}

        <footer>
          Development prototype only · Use fictional data · Not for
          operational investigations
        </footer>
      </main>
    </div>
  );
}


type DemoRole = "officer" | "admin";

const DEMO_USERS: Record<DemoRole, { username: string; password: string; label: string }> = {
  officer: { username: "officer.demo", password: "NYAYA-OFFICER-26", label: "Police Officer" },
  admin: { username: "admin.demo", password: "NYAYA-ADMIN-26", label: "Administrator" },
};

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${API}/api/cases`)
      .then(r => setCases(r.data || []))
      .catch(() => setError("Could not connect to the NYAYA ONE backend. Check that the API is running."))
      .finally(() => setLoading(false));
  }, []);

  const active = cases.filter(c => !["closed", "completed", "disposed"].includes((c.status || "").toLowerCase())).length;
  const closed = cases.length - active;

  return (
    <div className="ny-admin-shell">
      <header className="ny-topbar">
        <div className="ny-brand-small"><span className="ny-brand-mark"><ShieldCheck size={21}/></span><span>NYAYA <b>ONE</b><small>ADMIN CONSOLE</small></span></div>
        <div className="ny-topbar-right"><span className="ny-role-chip"><Shield size={14}/> Administrator</span><button className="ny-logout" onClick={onLogout}><LogOut size={16}/> Sign out</button></div>
      </header>
      <main className="ny-admin-content">
        <div className="ny-page-heading"><div><span className="ny-eyebrow">SUPERVISION & OVERSIGHT</span><h1>Administrator dashboard</h1><p>Case visibility and operational overview across the demonstration workspace.</p></div><span className="ny-demo-pill">DEMO ENVIRONMENT</span></div>
        {error && <div className="ny-error">{error}</div>}
        <div className="ny-metric-grid">
          <div className="ny-metric"><span><FolderOpen size={18}/> Total cases</span><strong>{loading ? "—" : cases.length}</strong><small>Cases currently registered</small></div>
          <div className="ny-metric"><span><Activity size={18}/> Active cases</span><strong>{loading ? "—" : active}</strong><small>Not marked closed or disposed</small></div>
          <div className="ny-metric"><span><CheckCircle2 size={18}/> Closed / completed</span><strong>{loading ? "—" : closed}</strong><small>Based on recorded case status</small></div>
          <div className="ny-metric"><span><Users size={18}/> Officer accounts</span><strong>1</strong><small>Demo account configured · not a live directory</small></div>
        </div>
        <section className="ny-admin-panel">
          <div className="ny-panel-heading"><div><h2>Case register</h2><p>Read-only overview from the existing case API.</p></div><span className="ny-readonly">READ ONLY</span></div>
          {loading ? <p className="ny-muted">Loading cases…</p> : cases.length === 0 ? <div className="ny-empty"><FolderOpen size={28}/><b>No cases registered yet</b><span>Create a case from the Police Officer workspace.</span></div> : (
            <div className="ny-case-table-wrap"><table className="ny-case-table"><thead><tr><th>Case number</th><th>Case title</th><th>Type</th><th>Status</th></tr></thead><tbody>{cases.map(c => <tr key={c.id}><td><b>{c.case_number}</b></td><td>{c.title}</td><td>{c.case_type || "—"}</td><td><span className="ny-status">{c.status || "Open"}</span></td></tr>)}</tbody></table></div>
          )}
        </section>
        <div className="ny-admin-notice"><LockKeyhole size={18}/><span><b>Administrative demo view.</b> This console currently provides read-only case visibility. User management, authenticated permissions and real officer workload reporting are not connected.</span></div>
      </main>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState<DemoRole>("officer");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signedInRole, setSignedInRole] = useState<DemoRole | null>(null);
  const [loginError, setLoginError] = useState("");

  function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const expected = DEMO_USERS[role];
    if (username.trim() === expected.username && password === expected.password) {
      setSignedInRole(role);
      setLoginError("");
    } else {
      setLoginError("Username or password is incorrect for the selected demo role.");
    }
  }

  function signOut() {
    setSignedInRole(null);
    setUsername("");
    setPassword("");
    setLoginError("");
  }

  if (signedInRole === "officer") return <div className="ny-officer-app"><OfficerWorkspace officerName={username.trim()} onLogout={signOut} /></div>;
  if (signedInRole === "admin") return <AdminDashboard onLogout={signOut} />;

  return (
    <div className="ny-login-page">
      <section className="ny-brand-side">
        <div className="ny-brand-lockup"><span className="ny-brand-mark"><ShieldCheck size={27}/></span><span>NYAYA <b>ONE</b><small>FINANCIAL CYBERCRIME INVESTIGATION COPILOT</small></span></div>
        <div className="ny-brand-copy">
          <span className="ny-eyebrow ny-gold">INTELLIGENCE • EVIDENCE • ACCOUNTABILITY</span>
          <h1>One case.<br/><em>One intelligent</em><br/>workspace.</h1>
          <p>A Hindi-first investigation copilot designed to help law enforcement organize digital evidence, connect reported financial transactions and plan investigative actions.</p>
          <div className="ny-feature-list">
            <div><span><FileSearch size={19}/></span><div><b>Evidence intelligence</b><small>Turn documents into structured, source-linked information.</small></div></div>
            <div><span><Activity size={19}/></span><div><b>Financial trail analysis</b><small>Compare transaction references across case documents.</small></div></div>
            <div><span><Landmark size={19}/></span><div><b>Officer-led investigation</b><small>Surface evidence gaps and suggested next steps for review.</small></div></div>
          </div>
        </div>
        <div className="ny-brand-footer"><span>BUILT FOR RESPONSIBLE DIGITAL INVESTIGATION</span><span>Human oversight · Traceable evidence · Officer review</span></div>
        <div className="ny-orbit ny-orbit-one"></div><div className="ny-orbit ny-orbit-two"></div>
      </section>

      <section className="ny-login-side">
        <div className="ny-login-card">
          <div className="ny-login-heading"><span className="ny-login-icon"><LockKeyhole size={21}/></span><span className="ny-eyebrow">SECURE PORTAL ACCESS</span><h2>Welcome back</h2><p>Sign in to continue to your workspace.</p></div>
          <div className="ny-role-select" role="tablist" aria-label="Choose demo role">
            <button type="button" className={role === "officer" ? "selected" : ""} onClick={() => {setRole("officer");setLoginError("");}}><Shield size={18}/><span><b>Police Officer</b><small>Investigation workspace</small></span></button>
            <button type="button" className={role === "admin" ? "selected" : ""} onClick={() => {setRole("admin");setLoginError("");}}><LayoutDashboard size={18}/><span><b>Administrator</b><small>Supervision & oversight</small></span></button>
          </div>
          <form onSubmit={signIn} className="ny-login-form">
            <label htmlFor="ny-username">Username</label><div className="ny-input-wrap"><UserRound size={17}/><input id="ny-username" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your username" required/></div>
            <label htmlFor="ny-password">Password</label><div className="ny-input-wrap"><LockKeyhole size={17}/><input id="ny-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required/></div>
            {loginError && <div className="ny-error" role="alert">{loginError}</div>}
            <button className="ny-signin" type="submit">Sign in to NYAYA ONE <ArrowRight size={17}/></button>
          </form>
          <div className="ny-demo-credentials"><div><span className="ny-demo-dot"/> HACKATHON DEMO ACCOUNTS</div><p><b>Officer:</b> officer.demo / NYAYA-OFFICER-26</p><p><b>Admin:</b> admin.demo / NYAYA-ADMIN-26</p><small>These are demonstration credentials only. Do not use real personal or case data.</small></div>
          <p className="ny-legal-note">NYAYA ONE supports investigation workflows. It does not determine guilt, authenticate evidence or replace an investigating officer's judgment.</p>
          <div className="ny-login-bottom"><span><LockKeyhole size={13}/> Demonstration portal</span><span>English interface</span></div>
        </div>
      </section>
    </div>
  );
}
