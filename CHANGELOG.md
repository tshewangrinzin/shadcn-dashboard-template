<!-- Available h3 headings: Added, Fixed, Updated, Removed, Deprecated -->

# Changelog

All notable changes to this template will be documented in this file

## v1.1.0 (2026-07-10)

### Changed

#### Migrated from Next.js to React + Vite

- Replaced Next.js App Router with React Router v7 (`react-router-dom`), including the `(pages)` and `(blank)` layouts, redirects, and the 404 route
- Replaced `next/link`, `next/navigation`, `next/font/google`, `next/server` and Next.js metadata with Vite/React equivalents
- Added Vite 8 scaffolding (`vite.config.ts`, `index.html`, `src/main.tsx`) with the `@/` path alias preserved
- Moved route pages from `src/app/**/page.tsx` to `src/pages/**`; `globals.css` now lives in `src/styles/`
- Switched the nuqs adapter from `nuqs/adapters/next/app` to `nuqs/adapters/react`
- Self-hosted the Geist fonts via `@fontsource-variable/geist` and `@fontsource-variable/geist-mono`
- Removed the `/api/nav-apps` route handler; `getNavApps` now fetches the CDN JSON directly
- Kept all framework-agnostic packages unchanged (`next-themes`, `nuqs`, `@base-ui/react`, `@tanstack/react-table`, `recharts`, `react-hook-form`, `sonner`, `tailwindcss` v4, etc.)

## v1.0.0 (2026-07-10)

### Added

#### Initial release

- Dashboard
  - Orders Dashboard
- Apps
  - Mail
  - Calendar
  - Users
- Pages
  - User Settings
  - User Profile
  - Login Page
  - Register Page
  - Forgot Password Page
  - Verify Email Page
  - Reset Password Page
  - Two Steps Verification Page
  - Error Page
- Forms & Tables
  - Form Layouts
  - Form Validation
  - Data Table
