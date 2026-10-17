# EduNexus — School SaaS Admin

The administrative frontend for the multi-tenant School SaaS platform. It serves platform super admins and each school's admins, teachers, accountants, librarians, students and parents.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript, React 19
- **Styling:** Tailwind CSS v4 with the "Aurora" design tokens in `src/app/globals.css` (light + dark)
- **UI:** shadcn-style components in `src/components/ui`, Lucide and PrimeIcons icons
- **Charts:** Recharts (`src/components/dashboard/charts.tsx`)
- **State:** Zustand (`src/store`), server state via TanStack Query + Axios
- **Fonts:** Outfit (display) and Inter (body) via `next/font`

## Design system

- Brand colour follows each school's theme (`--primary-color`); `blue-*`/`indigo-*` utilities are remapped to it, and `zinc`/`slate`/`gray` share one neutral scale, so a school's colour applies across every module.
- Shared building blocks: `PageHeader`, `StatCard`, and the dashboard kit (`HeroCard`, `Panel`, `QuickActions`, `GlanceRow`, `EmptyState`).
- `Ctrl/⌘ + K` opens page search.

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

Copy the environment variables (all optional — defaults point at the hosted API):

```bash
NEXT_PUBLIC_API_URL=https://apischool.jdinfotechsolutions.in/api/v1
NEXT_PUBLIC_DEMO_DOMAINS=localhost,127.0.0.1,schooldemo.jdinfotechsolutions.in
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
```

Demo-account shortcuts on the sign-in page only appear on the demo domains above.

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. Ensure the backend API (`School-Backend-Phase1`) is also running on the correct port mapped in your local environment variables.
