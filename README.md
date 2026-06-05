# Yaqza Kids

Islamic EdTech platform for Muslim children ages 5–16. A subscription-based learning platform built with React, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Supabase (auth + database)
- Stripe (payments — configure separately)

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and add your Supabase credentials:

   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Set up Supabase database**

   Run the SQL schema documented in `src/lib/supabase.ts` in your Supabase SQL editor.

4. **Start dev server**

   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── pages/          # Route pages (Welcome, Explorer, Dashboard, etc.)
├── components/     # Reusable UI components
│   ├── layout/     # Navbar, Footer
│   ├── home/       # Landing page sections
│   ├── article/    # Article reader components
│   └── dashboard/  # Parent/child dashboard components
└── lib/            # Supabase client, types, constants
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects based on age group in localStorage |
| `/welcome` | Age group selection |
| `/explorer` | Ages 5–8 landing page |
| `/discoverer` | Ages 9–12 landing page |
| `/thinker` | Ages 13–16 landing page |
| `/login` | Parent login |
| `/signup` | Parent registration |
| `/dashboard` | Parent dashboard (protected) |
| `/child-dashboard` | Child progress view (protected) |
| `/article/:id` | Article reader |

## Design System

CSS variables in `src/globals.css`:
- `--color-bg`, `--color-navy`, `--color-teal`, `--color-gold`, `--color-purple`, `--color-coral`

Fonts: Playfair Display (headings), Nunito (body)
