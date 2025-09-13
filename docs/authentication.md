# Authentication System Documentation

This document explains how authentication works in this TanStack Start application using Better Auth.

## Overview

The project uses **Better Auth** for authentication, which provides a comprehensive, type-safe authentication solution with email/password authentication, session management, and database integration through Drizzle ORM.

## Architecture Components

### 1. Better Auth Configuration (`src/utils/auth.ts`)

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { database } from "../db";

export const auth = betterAuth({
  database: drizzleAdapter(database, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
});
```

**Key Features:**
- Uses Drizzle ORM adapter with PostgreSQL
- Email and password authentication enabled
- Automatic session management
- Type-safe API endpoints

### 2. Client-Side Auth (`src/lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
});
```

**Usage:**
- Provides React hooks for authentication state
- Handles sign-in/sign-up operations
- Manages client-side session state

### 3. Database Schema

The authentication system uses several database tables:

#### User Table (`user`)
```typescript
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  // ... subscription fields
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});
```

#### Session Table (`session`)
```typescript
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  userId: text("user_id").notNull().references(() => user.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  // ... timestamps
});
```

#### Account Table (`account`)
```typescript
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
  password: text("password"), // For email/password auth
  // ... OAuth tokens and timestamps
});
```

#### Verification Table (`verification`)
```typescript
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  // ... timestamps
});
```

## Authentication Flow

### 1. Email Registration (`src/routes/sign-up.tsx`)

```typescript
const onSubmit = async (data: SignUpForm) => {
  const result = await authClient.signUp.email({
    email: data.email,
    password: data.password,
    name: data.name,
  });

  if (result.error) {
    setAuthError(result.error.message);
  } else {
    // Redirect to home or specified URL
    router.navigate({ to: "/" });
  }
};
```

**Process:**
1. User submits registration form with email, password, and name
2. `authClient.signUp.email()` creates user account and session
3. Better Auth automatically handles password hashing and user creation
4. Session is established and user is redirected

### 2. Email Sign-In (`src/routes/sign-in.tsx`)

```typescript
const onSubmit = async (data: SignInForm) => {
  await authClient.signIn.email(
    {
      email: data.email,
      password: data.password,
    },
    {
      onSuccess: () => {
        router.navigate({ to: "/" });
      },
      onError: (error) => {
        setAuthError(error.error.message);
      },
    }
  );
};
```

**Process:**
1. User submits credentials
2. Better Auth validates email/password against database
3. Creates new session on successful authentication
4. Session cookie is set automatically

### 3. API Routes (`src/routes/api/auth/$.ts`)

```typescript
export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
  GET: ({ request }) => {
    return auth.handler(request);
  },
  POST: ({ request }) => {
    return auth.handler(request);
  },
});
```

**Purpose:**
- Catch-all route for Better Auth API endpoints
- Handles authentication requests like `/api/auth/sign-in`, `/api/auth/sign-up`, etc.
- Better Auth automatically generates these endpoints

## Server-Side Authentication

### 1. Authentication Middleware (`src/fn/middleware.ts`)

```typescript
export const authenticatedMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const request = getWebRequest();

  if (!request?.headers) {
    throw new Error("No headers");
  }
  
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    throw new Error("No session");
  }

  return next({
    context: { userId: session.user.id },
  });
});
```

**Key Features:**
- Validates session from request headers
- Throws error if no valid session
- Provides `userId` in context for authenticated operations
- Used across all protected server functions

### 2. Protected Server Functions

Example from `src/fn/songs.ts`:

```typescript
export const createSongFn = createServerFn({ method: "POST" })
  .validator(z.object({
    title: z.string().min(1),
    artist: z.string().min(1),
    // ... other fields
  }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { userId } = context; // Available from middleware
    
    const songData = {
      ...data,
      userId, // Associate song with authenticated user
      id: crypto.randomUUID(),
    };
    
    return await createSong(songData);
  });
```

**Pattern:**
1. Apply `authenticatedMiddleware` to server functions
2. Access `userId` from context
3. Use `userId` for authorization and data association

## Client-Side Authentication State

### 1. Session Hook

```typescript
import { authClient } from "~/lib/auth-client";

function MyComponent() {
  const { data: session, isPending } = authClient.useSession();
  
  if (isPending) return <div>Loading...</div>;
  
  if (!session) {
    return <div>Please sign in</div>;
  }
  
  return <div>Welcome {session.user.name}!</div>;
}
```

### 2. Profile Management (`src/hooks/useProfile.ts`)

```typescript
export function useUpdateUserProfile() {
  const { refetch: refetchSession } = authClient.useSession();
  
  return useMutation({
    mutationFn: updateUserProfileFn,
    onSuccess: () => {
      toast.success("Profile updated successfully");
      refetchSession(); // Refresh session after profile update
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });
}
```

## User Data Access (`src/data-access/users.ts`)

```typescript
export async function findUserById(id: string): Promise<User | null> {
  const [result] = await database
    .select()
    .from(user)
    .where(eq(user.id, id))
    .limit(1);

  return result || null;
}

export async function getUserPlan(userId: string): Promise<{
  plan: SubscriptionPlan;
  isActive: boolean;
  expiresAt: Date | null;
}> {
  const userData = await findUserById(userId);
  
  // ... plan logic
  
  return { plan, isActive, expiresAt };
}
```

## Authentication Utilities

### 1. Session Validation
- Better Auth automatically validates sessions via cookies
- Sessions include user ID and expiration time
- Session tokens are stored securely in database

### 2. Password Security
- Passwords are automatically hashed by Better Auth
- Uses industry-standard bcrypt hashing
- Salt rounds and security handled internally

### 3. CSRF Protection
- Better Auth includes CSRF protection by default
- Validates requests using secure headers
- Protects against cross-site request forgery

## Environment Variables

Required environment variables for authentication:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Better Auth (auto-generated)
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
```

## Common Patterns

### 1. Protecting Routes
```typescript
// In route component
const { data: session } = authClient.useSession();

if (!session) {
  return <Navigate to="/sign-in" />;
}
```

### 2. Conditional Rendering
```typescript
const { data: session } = authClient.useSession();

return (
  <div>
    {session ? (
      <UserDashboard user={session.user} />
    ) : (
      <LoginPrompt />
    )}
  </div>
);
```

### 3. Server Function Authorization
```typescript
export const protectedFunction = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;
    // Function logic with authenticated user
  });
```

## Security Considerations

1. **Session Management**: Sessions automatically expire and are securely stored
2. **Password Hashing**: Better Auth handles secure password hashing
3. **CSRF Protection**: Built-in protection against CSRF attacks
4. **SQL Injection**: Drizzle ORM provides protection against SQL injection
5. **Input Validation**: Zod schemas validate all authentication inputs

## Troubleshooting

### Common Issues

1. **"No session" errors**: Ensure `authenticatedMiddleware` is applied to protected functions
2. **Authentication loops**: Check redirect logic in sign-in/sign-up flows  
3. **Session not persisting**: Verify cookie settings and database connection
4. **Type errors**: Ensure Better Auth types are properly imported

### Debug Tools

```typescript
// Check current session server-side
const session = await auth.api.getSession({ headers: request.headers });
console.log('Current session:', session);

// Check session client-side
const { data: session } = authClient.useSession();
console.log('Client session:', session);
```

## Migration and Setup

When setting up authentication:

1. Run database migrations to create auth tables
2. Set environment variables
3. Configure Better Auth in `src/utils/auth.ts`
4. Set up auth client in `src/lib/auth-client.ts`
5. Create sign-in/sign-up routes
6. Apply middleware to protected server functions

This authentication system provides a robust, secure foundation for user management with type safety throughout the application.