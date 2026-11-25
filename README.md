# Kaggadu Adventures

**LIVE WITH NATURE** — *Explore | Experience | Create Memories*

Official web platform for **Kaggadu Adventures**, built with Next.js (App Router, TypeScript), Tailwind CSS, and Supabase (PostgreSQL, Auth, Storage, Row Level Security).

## Features

- **Editorial Homepage (Sections 01–09)**: Full-width Western Ghats hero, introduction, 4 adventure category cards (Treks, Trips, Camping, For Kids), dynamic database-backed monthly Events Calendar, Volunteer Events, Trek Leaders (shown when published), Brand Values, CTA, and dynamic Footer.
- **Dedicated Public Routes**: `/treks`, `/trips`, `/camping`, `/kids`, `/collaborations`, `/volunteers`, `/events`, `/trek-leaders`, `/contact`, `/privacy-policy`, `/terms-and-conditions` plus `[slug]` detail pages.
- **Dual Registration System**:
  - **Online Registration**: Server-validated Zod forms (`/api/registrations`, `/api/volunteer-registrations`) with Indian mobile number validation, capacity & deadline checks, duplicate protection, unique reference codes (`KGD-YYYYMMDD-XXXX`), and optional email notifications.
  - **WhatsApp Click-to-Chat**: Prefilled `wa.me` enquiry links using the configured WhatsApp Business number, plus server-side WhatsApp Business Cloud API readiness.
- **Protected Admin Dashboard (`/admin/login`, `/admin/dashboard`)**:
  - Role-protected staff portal for managing Treks, Trips, Camping, Kids Programs, Event Calendar, Volunteer Drives, Trek Leaders, Registrations (with CSV export), Enquiries (with internal notes & CSV export), Media Library (Supabase Storage), and Website Settings.

## Local Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure environment variables**:
   Copy `.env.example` to `.env.local` and fill in your Supabase, WhatsApp, and optional Email/Analytics credentials.
3. **Run Supabase Migrations**:
   Execute the SQL files in `supabase/migrations/` in your Supabase SQL Editor in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_and_storage.sql`
4. **Provision an Admin User**:
   - Create a user in **Supabase Auth → Users**.
   - Insert a matching row into `public.profiles`:
     ```sql
     INSERT INTO public.profiles (id, email, full_name, role)
     VALUES ('<auth-user-uuid>', 'admin@yourdomain.com', 'Admin Name', 'admin');
     ```
5. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — Start local development server
- `npm run typecheck` — Run TypeScript type checking
- `npm run lint` — Run ESLint
- `npm run build` — Run production Next.js build
- `node --experimental-strip-types --test src/lib/validation/schemas.test.ts` — Run validation & helper unit tests

## Deployment on Vercel

1. Push this repository to GitHub.
2. Import the project in Vercel and add all environment variables from `.env.example`.
3. Set `NEXT_PUBLIC_SITE_URL` to your production domain.
4. Deploy.
