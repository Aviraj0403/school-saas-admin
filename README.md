# School SaaS Admin Dashboard

This is the central administrative frontend for the Multi-Tenant School SaaS Platform, built with **Next.js 14**, **React**, **TypeScript**, and **Tailwind CSS**. It serves both global superadmins (managing the platform) and school-specific administrators, teachers, and accountants (managing daily school operations).

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (with custom themes & dark mode)
- **UI Components:** PrimeReact
- **State Management (Client):** Zustand
- **Server State & Data Fetching:** React Query (`@tanstack/react-query`) + Axios
- **Icons:** PrimeIcons (`pi`)

## Architecture & Tenancy
This frontend application is designed to be multi-tenant aware.
- **`TenantCtx`**: Uses global state (Zustand) and API interceptors to securely attach the current workspace's `X-Tenant-Id` to every backend request.
- **Module Toggling**: Navigation and features are dynamically rendered based on the active modules enabled for the current school's subscription plan.

## Integrated Modules & Services

### Superadmin Control Plane
Global visibility into the entire SaaS ecosystem.
- **Directory**: View all onboarded schools, filter by tier, and manage tenant lifecycles.
- **Billing & Subscriptions**: Modify school subscription plans, view auto-generated SaaS invoices, and toggle specific module access per school.
- **Telemetry & Auditing**: Monitor system-wide activity logs, webhook health (e.g., Biometrics), and active third-party integration statuses (e.g., Jitsi).

### Core School Modules (Synced with Live Backend)
The following school modules are fully integrated with the robust NestJS backend API:

- **Dashboard**: Real-time analytics, charts, and trends for fee collections, attendance, and student enrollment (Powered by Recharts).
- **Users**: Staff, Parent, and Student registries with detailed profiles and financial ledgers.
- **Academics**: Homework, assignments, syllabus tracking, and library/book issue management.
- **Attendance**: Biometric-compatible attendance logs and daily attendance trends.
- **Operations & Facilities**: Real-time Hostel (Boarders, Wardens) and Transport (Routes, Telemetry) tracking.
- **HR**: Leave applications and staff management workflows.

## Project Structure
```bash
src/
├── app/                  # Next.js App Router Pages
│   ├── dashboard/        # Tenant Dashboards
│   ├── superadmin/       # Superadmin Control Plane
│   └── (modules)/        # Feature modules (hostel, library, leave, etc.)
├── components/           # Reusable UI components & layouts
├── hooks/                # React Query data fetching hooks (e.g. useFeeCollectionTrend)
├── store/                # Zustand stores (useAuthStore)
├── services/             # Axios API services and interceptors
├── modules/              # Domain-driven features (Superadmin hooks/services)
└── types/                # Shared TypeScript interfaces (api.types.ts)
```

## Getting Started

First, install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. Ensure the backend API (`School-Backend-Phase1`) is also running on the correct port mapped in your local environment variables.
