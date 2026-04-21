# Expense Tracker

A full-stack personal finance application built to handle real-world edge cases like network latency, retries, and accurate currency management.

## Key Design Decisions
* **Idempotency via UUIDs**: The frontend generates a unique `Idempotency-Key` for every new form render. If the user clicks submit multiple times, or the network retries the request, the backend safely ignores duplicates and returns the existing record.
* **Integer Currency Handling**: Floating point math is notoriously dangerous for money. The API accepts standard decimals, but immediately converts and stores amounts as integers (paise/cents). It is converted back to decimals only on the UI layer.
* **SQLite Persistence**: Chosen for zero-configuration, file-based persistence that easily mimics a production relational database structure.

## Trade-offs Made (Timebox Constraints)
* **Vanilla React State vs. Global Store**: Avoided Redux or Zustand since the application state is completely isolated to a single page and form.
* **Basic CSS**: Opted for a simple, single-file CSS implementation over setting up Tailwind or Material-UI to maximize focus on the core JavaScript logic and API resilience.

## Intentionally Excluded
* User authentication and multi-tenant data isolation.
* Automated testing suites (focus was placed entirely on manual verification of network edge-cases).
* Pagination on the GET endpoints.

## How to Run
1. Start backend: `cd backend && node server.js`
2. Start frontend: `cd frontend && npm run dev`