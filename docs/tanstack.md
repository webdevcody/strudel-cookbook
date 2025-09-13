# TanStack Start Architecture Guide

This document explains how we structure and organize TanStack Start routes, server functions, data fetching, and frontend architecture patterns in this project.

## File-Based Routing System

### Route Definition Patterns

Routes are defined in the `src/routes/` directory using TanStack Start's file-based routing system. Each route file exports a `Route` object created with `createFileRoute` or `createRootRouteWithContext`.

#### Basic Route Structure

```typescript
// src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <div>Home page content</div>;
}
```

#### Root Route with Context

```typescript
// src/routes/__root.tsx
import { createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [...],
    links: [...],
  }),
  component: RootComponent,
});
```

### Naming Conventions

- **Root route**: `__root.tsx` - The top-level layout component
- **Index routes**: `index.tsx` - Default route for a directory (e.g., `/`)
- **Static routes**: `about.tsx` - Static path segments (e.g., `/about`)
- **Dynamic routes**: `$id.tsx` - Dynamic parameters (e.g., `/song/123`)
- **Nested routes**: Use folder structure:
  - `song/$id/index.tsx` - `/song/:id`
  - `song/$id/edit.tsx` - `/song/:id/edit`

### Nested Folder Structure Examples

```
src/routes/
├── __root.tsx              # Root layout
├── index.tsx               # Home page (/)
├── browse.tsx              # Browse page (/browse)
├── upload.tsx              # Upload page (/upload)
├── song/                   # Song-related routes
│   └── $id/                # Dynamic song ID
│       ├── index.tsx       # Song detail (/song/:id)
│       └── edit.tsx        # Song edit (/song/:id/edit)
├── sign-in.tsx             # Auth routes
└── sign-up.tsx
```

## Loaders and Data Preloading

### Basic Loader Pattern

Loaders preload data on the server before the route component renders:

```typescript
// src/routes/song/$id/index.tsx
export const Route = createFileRoute("/song/$id/")({
  loader: ({ context: { queryClient }, params: { id } }) => {
    // Preload data using TanStack Query
    queryClient.ensureQueryData(getSongByIdQuery(id));
  },
  component: SongDetail,
});
```

### Async Loader with Error Handling

```typescript
// src/routes/song/$id/edit.tsx
export const Route = createFileRoute("/song/$id/edit")({
  loader: async ({ context: { queryClient }, params: { id } }) => {
    // Ensure data is loaded before component renders
    await queryClient.ensureQueryData(getSongByIdQuery(id));
  },
  component: EditSong,
});
```

### Loader Benefits

1. **Server-side data fetching**: Data is loaded on the server, improving perceived performance
2. **Cache priming**: Populates TanStack Query cache before component renders
3. **Error boundaries**: Failed loaders can be caught by error boundaries
4. **Parallel loading**: Multiple queries can be loaded in parallel

## Server Functions Architecture

Server functions live in the `src/fn/` directory and handle backend logic, API calls, and authentication.

### Server Function Patterns

#### Basic Server Function

```typescript
// src/fn/songs.ts
import { createServerFn } from "@tanstack/react-start";

export const getRecentSongsFn = createServerFn().handler(async () => {
  return await findRecentSongsWithUrls(20);
});
```

#### Server Function with Validation

```typescript
export const createSongFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      title: z.string().min(2).max(100),
      artist: z.string().min(1).max(50),
      audioKey: z.string().min(1, "Audio key is required"),
      // ... more validation
    })
  )
  .handler(async ({ data }) => {
    const songData = {
      id: crypto.randomUUID(),
      ...data,
    };
    return await createSong(songData);
  });
```

### Authentication Middleware

#### Middleware Definition

```typescript
// src/fn/middleware.ts
import { createMiddleware } from "@tanstack/react-start";

export const authenticatedMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const request = getWebRequest();
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    throw new Error("No session");
  }

  return next({
    context: { userId: session.user.id },
  });
});
```

#### Using Authentication Middleware

```typescript
// Server function WITHOUT authentication
export const getPopularSongsFn = createServerFn().handler(async () => {
  return await findPopularSongsWithUrls(20);
});

// Server function WITH authentication
export const createSongFn = createServerFn({
  method: "POST",
})
  .validator(/* validation schema */)
  .middleware([authenticatedMiddleware])  // 👈 Authentication required
  .handler(async ({ data, context }) => {
    // context.userId is available from middleware
    const songData = {
      ...data,
      userId: context.userId,  // 👈 User ID from auth context
    };
    return await createSong(songData);
  });
```

#### Authorization Patterns

```typescript
// Check resource ownership in server functions
export const updateSongFn = createServerFn({
  method: "POST",
})
  .validator(/* schema */)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { id, ...updateData } = data;
    
    // Verify ownership before allowing update
    const existingSong = await findSongById(id);
    if (existingSong.userId !== context.userId) {
      throw new Error("Unauthorized: You can only edit your own songs");
    }

    return await updateSong(id, updateData);
  });
```

## Frontend Architecture: Queries, Hooks, and Functions

The frontend is organized into three main layers to decouple components from server logic:

### 1. Server Functions (`src/fn/`)

Business logic and API endpoints that run on the server:

```typescript
// src/fn/songs.ts - Server-side logic
export const createSongFn = createServerFn({...});
export const updateSongFn = createServerFn({...});
export const deleteSongFn = createServerFn({...});
```

### 2. Query Definitions (`src/queries/`)

TanStack Query configurations that define how data is fetched and cached:

```typescript
// src/queries/songs.ts - Query configurations
import { queryOptions } from "@tanstack/react-query";
import { getPopularSongsFn, getRecentSongsFn, getSongByIdFn } from "~/fn/songs";

export const getRecentSongsQuery = () =>
  queryOptions({
    queryKey: ["recent-songs"],
    queryFn: () => getRecentSongsFn(),
  });

export const getSongByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["song", id],
    queryFn: () => getSongByIdFn({ data: { id } }),
  });
```

### 3. Custom Hooks (`src/hooks/`)

React hooks that combine queries and mutations with UI logic:

```typescript
// src/hooks/useSongs.ts - Component-friendly hooks
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSongFn, deleteSongFn, updateSongFn } from "~/fn/songs";

export function useCreateSong() {
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof createSongFn>[0]['data']) => 
      createSongFn({ data }),
    onSuccess: (song) => {
      toast.success("Song created successfully!");
      navigate({ to: `/song/${song.id}` });
    },
    onError: (error) => {
      toast.error("Failed to create song");
    },
  });
}

export function useDeleteSong() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteSongFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Song deleted successfully");
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["user-songs"] });
      queryClient.invalidateQueries({ queryKey: ["popular-songs"] });
    },
  });
}
```

### Component Usage Pattern

Components use the custom hooks, staying decoupled from server implementation:

```typescript
// src/routes/upload.tsx - Component using hooks
import { useCreateSong } from "~/hooks/useSongs";

function Upload() {
  const createSongMutation = useCreateSong();
  
  const onSubmit = async (data) => {
    // Hook handles navigation, error handling, etc.
    createSongMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form UI */}
    </form>
  );
}
```

## Architecture Benefits

### Separation of Concerns

1. **Server functions** (`src/fn/`): Business logic, validation, database operations
2. **Queries** (`src/queries/`): Data fetching configuration and caching strategy  
3. **Hooks** (`src/hooks/`): UI state management, navigation, toast notifications
4. **Components**: Pure UI logic, form handling, user interactions

### Type Safety

The entire stack is fully type-safe:
- Server functions use Zod validation schemas
- Queries infer return types from server functions
- Hooks maintain type safety through the chain
- Components get proper TypeScript intellisense

### Testability

Each layer can be tested independently:
- Server functions can be unit tested
- Queries can be tested with mock data
- Hooks can be tested with React Testing Library
- Components are decoupled from server logic

### Cache Management

TanStack Query handles sophisticated caching:
- Automatic background refetching
- Optimistic updates
- Cache invalidation strategies
- Offline support

### Authentication Integration

Authentication is handled at multiple layers:
- **Middleware**: Server-side session validation
- **Hooks**: Client-side session checks and redirects
- **Components**: Conditional rendering based on auth state

## Examples from the Codebase

### Complete Data Flow Example

1. **Server Function**: `getUserSongsFn` (authenticated)
2. **Query**: `getUserSongsQuery` (cache configuration)
3. **Hook**: `useSongs` hook (UI integration)
4. **Component**: `my-songs.tsx` (user interface)

### Authentication Flow Example

1. **Middleware**: `authenticatedMiddleware` validates session
2. **Server Function**: `createSongFn` requires authentication
3. **Hook**: `useCreateSong` handles auth errors
4. **Component**: Redirects to login if unauthorized

This architecture provides a scalable, type-safe, and maintainable foundation for the TanStack Start application, with clear separation between server logic, data management, and UI components.