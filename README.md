Vitrine — Museum CMS

Vitrine is a specialised, all-in-one Collection Management System (CMS) and public-facing platform designed for museums and heritage institutions of all sizes. Built to bridge the gap between complex archival needs and modern digital presentation, Vitrine allows curators to manage their objects, build a public website, and sell event tickets in one unified interface.
✨ Features
🗄️ Collection Management

    Rich Metadata: Comprehensive fields for objects, descriptions, acquisitions, and history.

    Status Tracking: Manage items by status (On Display, On Loan, Restoration, or Storage).

    Media Support: Upload and manage high-resolution images and documents for every record.

    Locations: Track where objects are physically held within your institution.

    Valuations: Record and manage object valuations over time.

    Wanted List: Flag missing or stolen objects and track recovery status.

🔬 Conservation & Risk

    Conservation Records: Log treatment history, condition reports, and damage assessments.

    Risk Register: Identify and track risks to individual objects or the collection as a whole.

    Insurance Policies: Attach policy documents and coverage details to your collection.

    Emergency Plans: Store and manage emergency response documentation.

📋 Collections Compliance

    Loans: Record incoming and outgoing loan agreements with full documentation.

    Disposal Records: Document deaccessions and disposals in line with policy.

    Collections Review & Use: Track how and why objects are accessed or used.

    SPECTRUM Compliance: Built to support the UK's SPECTRUM museum documentation standard.

🌐 Digital Presence

    Public Collection Browser: A high-performance, searchable website for visitors to explore your collection online.

    Site Builder: Customise your public site with your own logo, brand colours, and institutional story—all without writing code.

    Plan Your Visit: Publish opening hours, admission prices, accessibility info, and directions.

🎟️ Museum Operations

    Event Ticketing: Sell tickets online with capacity management, waiting lists, and automated confirmation emails. Free and paid events supported via Stripe Connect.

    Staff & Roles: Role-based access control (RBAC) to delegate tasks between curators, volunteers, and administrators.

    Analytics: Visual insights into collection growth, medium distribution, and visitor engagement.

🛠️ Tech Stack

    Framework: Next.js (App Router)

    Language: TypeScript

    Database & Auth: Supabase (Postgres, Auth, RLS)

    File Storage: Cloudflare R2 (object images, documents, and museum assets)

    Payments: Stripe (subscriptions + Stripe Connect for event ticketing)

    Email: Resend (transactional email)

    Rate Limiting: Upstash Redis

    Error Monitoring: Sentry

    Performance: Vercel Speed Insights

    Styling: Tailwind CSS

    Components: Radix UI / shadcn/ui

    Deployment: Vercel

📂 Project Structure
Plaintext

├── app/              # Next.js App Router (Pages, layouts, and API routes)
├── components/       # Reusable UI components (Site builder, CMS tables, etc.)
├── lib/              # Shared utilities, hooks, and database schemas
├── public/           # Static assets and icons
├── supabase/         # Database migrations and configuration
└── Spectrum_Compliance_Requirements.pdf  # SPECTRUM standard documentation reference

🏛️ Standards & Compliance

Vitrine is designed to support SPECTRUM, the UK's museum collection management standard produced by the Collections Trust. The `Spectrum_Compliance_Requirements.pdf` in the project root documents the specific procedures and fields covered.
