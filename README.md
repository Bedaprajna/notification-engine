<img width="1349" height="604" alt="Screenshot (123)" src="https://github.com/user-attachments/assets/a63003ab-1b8a-42e8-a368-c53232a53596" />
<img width="1352" height="602" alt="Screenshot (122)" src="https://github.com/user-attachments/assets/2892d089-9c46-4554-8566-64156b14b53a" />
# 🚀 Multi-Channel Event Notification Engine

An event-driven, fault-tolerant asynchronous notification engine built with Node.js, SQLite, and React. Engineered to handle background processing, transient failure recovery with automatic retries, Dead Letter Queue (DLQ) isolation, and real-time dashboard telemetry.

---

## 🏗️ System Architecture

```text
[ Client / Producer ] ──► POST /api/events ──► [ SQLite Queue (PENDING) ]
                                                        │
                                                        ▼
                                             [ Background Queue Worker ]
                                                        │
                         ┌──────────────────────────────┼──────────────────────────────┐
                         ▼                              ▼                              ▼
                 [ Email Adapter ]              [ SMS Adapter ]               [ Webhook Adapter ]
                         │                              │                              │
                 (Max 3 Attempts)               (Max 3 Attempts)               (Max 3 Attempts)
                         │                              │                              │
                         └──────────────────────────────┴──────────────────────────────┘
                                                        │
                                     ┌──────────────────┴──────────────────┐
                                     ▼                                     ▼
                             [ Status: COMPLETED ]                 [ Status: FAILED_DLQ ]
                                                                           │
                                                                           ▼
                                                                  [ Manual Re-queue UI ]<img width="1349" height="604" alt="Screenshot (123)" src="https://github.com/user-attachments/assets/87917321-6d37-4706-b286-7ef1902f4569" />
<img width="1352" height="602" alt="Screenshot (122)" src="https://github.com/user-attachments/assets/b6265b68-f5f9-41cb-bd97-633f1b9fc504" />
