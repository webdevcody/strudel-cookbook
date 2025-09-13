# Data Access Layer Documentation

## Purpose

The `src/data-access/` folder contains the data access layer for our application. This layer provides a clean abstraction between the database and business logic, following a layered architecture pattern. The data access layer is responsible for:

- Direct database operations (CRUD operations)
- Type-safe database queries using Drizzle ORM
- Data transformation and formatting
- Complex queries with joins and aggregations
- Database-specific logic and optimizations

## Database Setup

### Database Connection (`src/db/index.ts`)

```typescript
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { privateEnv } from "~/config/privateEnv";

const pool = new pg.Pool({ connectionString: privateEnv.DATABASE_URL });
const database = drizzle(pool, { schema, logger: true });

export { database, pool };
```

### Schema Definition (`src/db/schema.ts`)

The schema defines all database tables, relations, and TypeScript types:

```typescript
// Table definition example
export const song = pgTable("song", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Relations definition
export const songRelations = relations(song, ({ one, many }) => ({
  user: one(user, {
    fields: [song.userId],
    references: [user.id],
  }),
  hearts: many(heart),
}));

// Type exports for type safety
export type Song = typeof song.$inferSelect;
export type CreateSongData = typeof song.$inferInsert;
export type UpdateSongData = Partial<Omit<CreateSongData, "id" | "createdAt">>;
```

## Data Access Patterns

### Standard Imports

All data access files follow this import pattern:

```typescript
import { eq, desc, and, count } from "drizzle-orm";
import { database } from "~/db";
import {
  tableName,
  type TableType,
  type CreateTableData,
  type UpdateTableData
} from "~/db/schema";
```

### Basic CRUD Operations

#### Create Operation
```typescript
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

#### Read Operations
```typescript
// Find by ID
export async function findSongById(id: string): Promise<Song | null> {
  const [result] = await database
    .select()
    .from(song)
    .where(eq(song.id, id))
    .limit(1);

  return result || null;
}

// Find multiple with filters
export async function findRecentSongs(limit: number = 10): Promise<Song[]> {
  return await database
    .select()
    .from(song)
    .orderBy(desc(song.createdAt))
    .limit(limit);
}

// Find with user relation
export async function findSongsByUserId(userId: string): Promise<Song[]> {
  return await database
    .select()
    .from(song)
    .where(eq(song.userId, userId))
    .orderBy(desc(song.createdAt));
}
```

#### Update Operation
```typescript
export async function updateSong(id: string, songData: UpdateSongData): Promise<Song | null> {
  const [updatedSong] = await database
    .update(song)
    .set({
      ...songData,
      updatedAt: new Date(),
    })
    .where(eq(song.id, id))
    .returning();

  return updatedSong || null;
}
```

#### Delete Operation
```typescript
export async function deleteSong(id: string): Promise<boolean> {
  const result = await database
    .delete(song)
    .where(eq(song.id, id))
    .returning();

  return result.length > 0;
}
```

### Advanced Patterns

#### Complex Queries with Joins
```typescript
// From sound-comments.ts - joining with user table
export async function findCommentsBySoundId(soundId: string) {
  return await database
    .select({
      id: soundComment.id,
      content: soundComment.content,
      soundId: soundComment.soundId,
      userId: soundComment.userId,
      createdAt: soundComment.createdAt,
      updatedAt: soundComment.updatedAt,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(soundComment)
    .leftJoin(user, eq(soundComment.userId, user.id))
    .where(eq(soundComment.soundId, soundId))
    .orderBy(desc(soundComment.createdAt));
}
```

#### Aggregate Functions
```typescript
// From hearts.ts - counting hearts for a song
export async function getHeartCountForSong(songId: string) {
  const [result] = await database
    .select({ count: count() })
    .from(heart)
    .where(eq(heart.songId, songId));
  return result?.count || 0;
}
```

#### SQL Expressions for Updates
```typescript
// From songs.ts - increment play count
export async function incrementPlayCount(id: string): Promise<Song | null> {
  const [updatedSong] = await database
    .update(song)
    .set({
      playCount: sql`${song.playCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(song.id, id))
    .returning();

  return updatedSong || null;
}
```

#### Multiple Conditions
```typescript
// From hearts.ts - compound where conditions
export async function findHeartByUserAndSong(userId: string, songId: string) {
  const [existingHeart] = await database
    .select()
    .from(heart)
    .where(and(eq(heart.userId, userId), eq(heart.songId, songId)))
    .limit(1);
  return existingHeart;
}
```

### Data Transformation Patterns

#### Adding External URLs
```typescript
// From songs.ts - adding presigned URLs for file storage
export type SongWithUrls = Song & {
  audioUrl: string;
  coverImageUrl?: string;
};

async function generatePresignedUrls(song: Song): Promise<SongWithUrls> {
  const { storage } = getStorage();

  const audioUrl = song.audioKey
    ? await storage.getPresignedUrl(song.audioKey)
    : '';

  const coverImageUrl = song.coverImageKey
    ? await storage.getPresignedUrl(song.coverImageKey)
    : undefined;

  return {
    ...song,
    audioUrl,
    coverImageUrl,
  };
}

export async function findSongByIdWithUrls(id: string): Promise<SongWithUrls | null> {
  const songData = await findSongById(id);
  if (!songData) return null;
  return await generatePresignedUrls(songData);
}
```

#### Business Logic in Data Access
```typescript
// From users.ts - subscription plan validation
export async function getUserPlan(userId: string): Promise<{
  plan: SubscriptionPlan;
  isActive: boolean;
  expiresAt: Date | null;
}> {
  const userData = await findUserById(userId);

  if (!userData) {
    return {
      plan: "free",
      isActive: false,
      expiresAt: null
    };
  }

  const plan = (userData.plan || "free") as SubscriptionPlan;
  const now = new Date();
  const expiresAt = userData.subscriptionExpiresAt;

  const isActive = plan === "free" ||
    (userData.subscriptionStatus === "active" &&
     (!expiresAt || expiresAt > now));

  return {
    plan,
    isActive,
    expiresAt
  };
}
```

## File Naming Conventions

- Files are named after the primary table they interact with (plural form)
- Examples: `songs.ts`, `users.ts`, `hearts.ts`, `sound-comments.ts`
- Use kebab-case for multi-word table names

## Function Naming Conventions

- `find{Entity}By{Criteria}` - for read operations
- `create{Entity}` - for insert operations
- `update{Entity}` - for update operations
- `delete{Entity}` - for delete operations
- `get{EntityProperty}` - for computed/derived values

## Type Safety Best Practices

1. **Always import and use the generated types from schema**:
   ```typescript
   import { song, type Song, type CreateSongData, type UpdateSongData } from "~/db/schema";
   ```

2. **Use proper return types** for all functions:
   ```typescript
   export async function findSongById(id: string): Promise<Song | null>
   ```

3. **Use type-safe insert/update data**:
   ```typescript
   export async function createSong(songData: CreateSongData): Promise<Song>
   ```

## Error Handling

- Functions return `null` when entities are not found (rather than throwing)
- Boolean returns for delete operations indicate success/failure
- Use `.returning()` to get back updated/created entities

## Performance Considerations

- Always use `.limit()` for single entity queries
- Use appropriate indexes (defined in migrations)
- Consider pagination for list operations
- Use joins instead of multiple queries when needed

## Integration with External Services

When integrating with external services (like file storage), create transformation functions:

```typescript
// Transform database entities to include external URLs
export async function findSongsWithUrls(limit: number = 10): Promise<SongWithUrls[]> {
  const songs = await findRecentSongs(limit);
  return await Promise.all(songs.map(generatePresignedUrls));
}
```

This pattern keeps the data access layer focused on database operations while providing necessary transformations for the application layer.