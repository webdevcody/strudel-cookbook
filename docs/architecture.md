# Layered Architecture Guide

This document explains the layered architecture pattern used in this TanStack Start application. Each layer has a specific responsibility and depends only on the layers below it, creating a clean separation of concerns and maintainable codebase.

## Architecture Overview

The application follows a strict layered architecture with the following flow:

```
Routes → Components → Hooks → Queries → Fn → Use Cases → Data Access
```

Each layer builds upon the previous one, creating a clear dependency chain and separation of concerns.

## Layer Definitions

### 1. Routes Layer (`src/routes/`)

**Purpose**: Handles URL routing, route parameters, and page-level data loading.

**Responsibilities**:
- Define route structure and parameters
- Handle route loaders for data prefetching
- Compose page components
- Manage route-level state and navigation

**Example**: `src/routes/song/$id/index.tsx`
```typescript
export const Route = createFileRoute("/song/$id/")({
  loader: ({ context: { queryClient }, params: { id } }) => {
    queryClient.ensureQueryData(getSongByIdQuery(id));
  },
  component: SongDetail,
});

function SongDetail() {
  const { id } = Route.useParams();
  const { data: song } = useQuery(getSongByIdQuery(id));
  // Uses hooks and components to render the page
}
```

### 2. Components Layer (`src/components/`)

**Purpose**: Reusable UI components that handle presentation and user interactions.

**Responsibilities**:
- Render UI elements
- Handle user interactions
- Manage local component state
- Delegate data operations to hooks

**Example**: `src/components/SongCard.tsx`
```typescript
export function SongCard({ song }: SongCardProps) {
  const { handleAddToPlaylist, isInPlaylist } = useAddToPlaylist();
  
  const handleAddToPlaylistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    addToPlaylist(playlistSong);
  };
  
  return (
    <article className="bg-card rounded-xl">
      {/* UI rendering logic */}
    </article>
  );
}
```

### 3. Hooks Layer (`src/hooks/`)

**Purpose**: Custom React hooks that manage component state and provide reusable logic.

**Responsibilities**:
- Wrap TanStack Query operations
- Handle complex state logic
- Provide reusable stateful behavior
- Bridge components to queries

**Example**: `src/hooks/useSongs.ts`
```typescript
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
```

### 4. Queries Layer (`src/queries/`)

**Purpose**: TanStack Query definitions that define how data is fetched and cached.

**Responsibilities**:
- Define query keys for caching
- Configure query options
- Connect to server functions
- Handle query invalidation patterns

**Example**: `src/queries/songs.ts`
```typescript
export const getSongByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["song", id],
    queryFn: () => getSongByIdFn({ data: { id } }),
  });

export const getUserSongsQuery = () =>
  queryOptions({
    queryKey: ["user-songs"],
    queryFn: () => getUserSongsFn(),
  });
```

### 5. Fn Layer (`src/fn/`)

**Purpose**: Server functions that handle HTTP endpoints, validation, and authentication.

**Responsibilities**:
- Define API endpoints
- Handle input validation with Zod
- Apply middleware (authentication, authorization)
- Coordinate between use cases and direct data access
- Transform data for client consumption

**Example**: `src/fn/songs.ts`
```typescript
export const createSongFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      title: z.string().min(2).max(100),
      artist: z.string().min(1).max(50),
      audioKey: z.string().min(1),
      // ... other validations
    })
  )
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const songData = {
      id: crypto.randomUUID(),
      ...data,
      userId: context.userId,
    };

    const newSong = await createSong(songData);
    return newSong;
  });
```

### 6. Use Cases Layer (`src/use-cases/`)

**Purpose**: Complex business logic that orchestrates multiple data access operations.

**Responsibilities**:
- Implement business rules and policies
- Coordinate multiple data operations
- Handle complex validation logic
- Enforce business constraints (limits, permissions)
- Provide error handling with business context

**Example**: `src/use-cases/createPlaylistUseCase.ts`
```typescript
export async function createPlaylistUseCase(
  input: CreatePlaylistInput
): Promise<CreatePlaylistOutput> {
  const { userId, name, description, isPublic = false } = input;

  // Get current playlist count for the user
  const currentCount = await countPlaylistsByUserId(userId);

  // Get user's plan information
  const userPlan = await getUserPlan(userId);

  // Check business rules
  if (!userPlan.isActive) {
    throw new PlaylistLimitError(
      "Your subscription has expired.",
      "SUBSCRIPTION_EXPIRED"
    );
  }

  if (hasReachedPlaylistLimit(userPlan.plan, currentCount)) {
    // Handle limit enforcement logic
  }

  // Create the playlist
  const newPlaylist = await createPlaylist(playlistData);
  return newPlaylist;
}
```

### 7. Data Access Layer (`src/data-access/`)

**Purpose**: Direct database operations using Drizzle ORM.

**Responsibilities**:
- Execute database queries
- Handle database transactions
- Perform CRUD operations
- Apply basic data transformations
- Generate presigned URLs for file storage

**Example**: `src/data-access/songs.ts`
```typescript
export async function findSongById(id: string): Promise<Song | null> {
  const [result] = await database
    .select()
    .from(song)
    .where(eq(song.id, id))
    .limit(1);

  return result || null;
}

export async function createSong(songData: CreateSongData): Promise<Song> {
  const [newSong] = await database
    .insert(song)
    .values({
      ...songData,
      updatedAt: new Date(),
    })
    .returning();

  return newSong;
}
```

## Dependency Flow

### Data Flow (Top to Bottom)
1. **Route** defines loader and renders component
2. **Component** uses hooks for data and interactions
3. **Hook** calls queries for server state management
4. **Query** invokes server functions
5. **Server Function** applies validation and calls use cases or data access
6. **Use Case** implements business logic using data access functions
7. **Data Access** executes database operations

### Example: Creating a Song
```typescript
// 1. Route handles the form submission
function UploadPage() {
  const createSong = useCreateSong(); // Hook
  
  const handleSubmit = (data) => {
    createSong.mutate(data);
  };
}

// 2. Hook wraps the server operation
function useCreateSong() {
  return useMutation({
    mutationFn: createSongFn, // Query to server function
  });
}

// 3. Server function validates and processes
export const createSongFn = createServerFn()
  .validator(songSchema)
  .handler(async ({ data, context }) => {
    return await createSong(songData); // Direct to data access
  });

// 4. Data access performs database operation
export async function createSong(songData: CreateSongData): Promise<Song> {
  return await database.insert(song).values(songData).returning();
}
```

## Best Practices

### When to Use Each Layer

- **Routes**: Only for routing logic and page composition
- **Components**: For all UI rendering and local interactions
- **Hooks**: For reusable state logic and server state management
- **Queries**: For all TanStack Query configurations
- **Server Functions**: For API endpoints, validation, and middleware
- **Use Cases**: For complex business logic involving multiple entities
- **Data Access**: For all direct database operations

### Layer Communication Rules

1. **Never skip layers**: Each layer should only depend on the layer immediately below it
2. **No circular dependencies**: Lower layers should never import from higher layers
3. **Single responsibility**: Each layer should have one clear purpose
4. **Error handling**: Each layer should handle errors appropriate to its level

### Common Patterns

- **CRUD Operations**: Route → Component → Hook → Query → Fn → Data Access
- **Complex Business Logic**: Route → Component → Hook → Query → Fn → Use Case → Data Access
- **Simple Queries**: Route → Component → Hook → Query → Fn → Data Access

This layered architecture ensures maintainable, testable code with clear separation of concerns. Each layer has a specific role, making it easy to understand where to implement new features or fix bugs.