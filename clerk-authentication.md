# Clerk Authentication Integration

This document explains how Clerk authentication integrates with the Atlas application deployed on Vercel.

## Overview

Atlas uses [Clerk](https://clerk.com) for authentication, providing secure email-based sign-in restricted to `@hyperfinity.ai` domain users. The integration follows Clerk's recommended patterns for Next.js App Router applications.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel Edge                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     middleware.ts                          │  │
│  │  - Intercepts all requests (except static files)          │  │
│  │  - Validates Clerk session token                          │  │
│  │  - Redirects unauthenticated users to /sign-in            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App Router                         │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │  ClerkProvider  │───▶│  Application Components             │ │
│  │  (layout.tsx)   │    │  - UserButton (Sidebar.tsx)         │ │
│  │                 │    │  - Protected pages                  │ │
│  └─────────────────┘    └─────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     API Routes                              ││
│  │  - auth() validates user session                           ││
│  │  - userId links data to Clerk user                         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Clerk Dashboard                            │
│  - Manages user accounts                                        │
│  - Enforces @hyperfinity.ai domain restriction                  │
│  - Stores session tokens                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Middleware (`src/middleware.ts`)

The middleware runs on Vercel's Edge Runtime before every request, providing route protection:

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();  // Redirects to sign-in if not authenticated
  }
});
```

**How it works:**
- All routes except `/sign-in` and `/sign-up` require authentication
- Unauthenticated requests are automatically redirected to Clerk's sign-in page
- The matcher excludes static files and Next.js internals for performance

### 2. ClerkProvider (`src/app/layout.tsx`)

Wraps the entire application to provide authentication context:

```typescript
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

<ClerkProvider
  appearance={{
    baseTheme: dark,
    variables: {
      colorPrimary: "#F85AA4",
      colorBackground: "#0a0a0f",
      // ... theme customization
    },
  }}
>
  {children}
</ClerkProvider>
```

**Features:**
- Provides authentication state to all components
- Customizes Clerk UI to match Atlas branding (dark theme, Hyperfinity pink accent)
- Enables client-side auth hooks like `useUser()` and `useAuth()`

### 3. API Route Protection (`src/app/api/conversations/route.ts`)

Server-side authentication for API routes:

```typescript
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // userId is the Clerk user ID - use it to fetch user-specific data
  const userConversations = await db
    .select()
    .from(conversations)
    .where(eq(conversations.clerkUserId, userId));
}
```

### 4. User Interface (`src/components/Sidebar.tsx`)

The `UserButton` component provides account management:

```typescript
import { UserButton } from "@clerk/nextjs";

<UserButton
  appearance={{
    elements: {
      avatarBox: "w-9 h-9",
    },
  }}
/>
```

**Provides:**
- User avatar display
- Sign out functionality
- Profile management
- Session switching (if multiple accounts)

## Database Integration

Clerk's `userId` is stored in the database to associate data with users:

```typescript
// src/lib/db/schema.ts
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),  // Links to Clerk user
  title: text("title"),
  // ...
});
```

## Environment Variables

Required variables for Vercel deployment:

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public key for client-side auth | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Secret key for server-side auth | Clerk Dashboard → API Keys |

**Vercel Setup:**
1. Go to your Vercel project → Settings → Environment Variables
2. Add both keys for Production, Preview, and Development environments
3. Redeploy after adding variables

## Clerk Dashboard Configuration

### Domain Restriction

To restrict sign-ups to `@hyperfinity.ai`:

1. Go to Clerk Dashboard → User & Authentication → Restrictions
2. Enable "Allowlist"
3. Add `@hyperfinity.ai` as allowed email domain
4. Block all other sign-up methods

### Sign-in Methods

1. Go to Clerk Dashboard → User & Authentication → Email, Phone, Username
2. Enable "Email address" as identifier
3. Configure authentication methods (e.g., email link, password)

## Authentication Flow

```
User visits app
       │
       ▼
┌──────────────────┐
│   Middleware     │
│   checks auth    │
└────────┬─────────┘
         │
    ┌────┴────┐
    │ Authed? │
    └────┬────┘
         │
    No ──┼── Yes
         │    │
         ▼    ▼
   ┌─────────┐ ┌─────────────┐
   │ Redirect │ │ Allow access │
   │ to /sign-in │ │ to route     │
   └─────────┘ └─────────────┘
         │
         ▼
   ┌───────────────┐
   │ Clerk Sign-In │
   │ (hosted UI)   │
   └───────┬───────┘
           │
           ▼
   ┌───────────────┐
   │ Email domain  │
   │ validation    │
   └───────┬───────┘
           │
      @hyperfinity.ai?
           │
    Yes ───┴─── No
     │          │
     ▼          ▼
┌─────────┐ ┌──────────┐
│ Success │ │ Rejected │
│ Redirect│ │ (domain  │
│ to app  │ │ blocked) │
└─────────┘ └──────────┘
```

## Troubleshooting

### "Unauthorized" errors in API routes
- Check that `CLERK_SECRET_KEY` is set in Vercel environment variables
- Ensure the middleware is running (check `matcher` config)

### Sign-in redirect loop
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set correctly
- Check that `/sign-in` is in the `isPublicRoute` matcher

### Domain restriction not working
- Ensure allowlist is enabled in Clerk Dashboard
- Clear browser cookies and try again
- Check Clerk Dashboard → Users to see if user was created before restriction

## References

- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Middleware Documentation](https://clerk.com/docs/references/nextjs/clerk-middleware)
- [Clerk + Vercel Integration](https://clerk.com/docs/deployments/clerk-vercel)
