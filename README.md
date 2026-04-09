# Frappify App

The main Frappify dashboard application — a Next.js PWA that provides the authenticated UI for interacting with Frappe/ERPNext instances through the Frappify API.

## Requirements

- Node.js 20+
- pnpm
- A running instance of the [Frappify API](../api/README.md)

## Setup

### 1. Navigate to the app directory

```bash
cd app
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env.local` file in the `app/` directory:

```env
# Internal URL used server-side to reach the Frappify API
API_URL=http://localhost:5000

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://app.frappify.localhost

# Public URLs (exposed to the browser)
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://app.frappify.localhost

# Used server-side for internal redirects
PUBLIC_APP_URL=http://app.frappify.localhost
```

### 4. Run the development server

```bash
pnpm dev
```

The app will be available at `http://app.frappify.localhost` (via [portless](https://github.com/nicholasgasior/portless)). If you are not using portless, run `next dev` directly and access the app at `http://localhost:3000`.

## Building for Production

```bash
pnpm build
pnpm start
```

## Project Structure

```
app/
├── (auth)/           # Login and unauthenticated routes
├── (protected)/      # Authenticated dashboard routes
│   └── app/          # Per-Frappe-site app views
└── api/              # Next.js API routes (auth, assets)
components/
├── frappe/           # Frappe-specific UI components (charts, etc.)
├── layout/           # Shell, navigation, theme provider
└── ui/               # Shared UI primitives
hooks/                # React hooks (account store, mobile detection)
lib/
├── auth-options.ts   # NextAuth configuration and credential provider
├── env.ts            # Type-safe environment variable validation
├── frappe-route.ts   # Frappe URL routing helpers
└── session.ts        # Session utilities
public/
├── sw.js             # Service worker (PWA)
└── robots.txt
```
