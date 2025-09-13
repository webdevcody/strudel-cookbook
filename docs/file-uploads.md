# File Upload System with Cloudflare R2

This document explains how the application handles file uploads using Cloudflare R2 (S3-compatible storage) with presigned URLs for both upload and download operations.

## Architecture Overview

The file upload system uses a two-phase approach:
1. **Upload Phase**: Client requests presigned upload URL from server, then uploads directly to R2
2. **Access Phase**: Client requests presigned download URL from server to access stored files

This approach provides several benefits:
- Files are uploaded directly to R2, reducing server bandwidth
- Upload progress can be tracked on the client
- Server maintains control over access permissions
- Scalable architecture that handles large files efficiently

## Key Components

### 1. R2 Storage Client (`src/utils/storage/r2.ts`)

The `R2Storage` class implements the `IStorage` interface and provides:

- **Upload Methods**: Direct upload and presigned upload URL generation
- **Download Methods**: Presigned download URL generation (streaming not supported)
- **Management**: File existence checks and deletion
- **Configuration**: Connects to Cloudflare R2 using S3-compatible AWS SDK

```typescript
class R2Storage implements IStorage {
  // Generates presigned URL for direct uploads (1 hour expiry)
  async getPresignedUploadUrl(key: string, contentType: string): Promise<string>
  
  // Generates presigned URL for downloads (1 hour expiry)  
  async getPresignedUrl(key: string): Promise<string>
}
```

### 2. Server Functions

#### Audio Upload Functions (`src/fn/audio-storage.ts`)

- `getPresignedAudioUploadUrlFn`: Creates presigned upload URL for audio files
  - Generates unique song ID and structured storage path: `music/{userId}/{songId}/audio.{ext}`
  - Requires authentication
  
- `getPresignedCoverImageUploadUrlFn`: Creates presigned upload URL for cover images
  - Uses path: `music/{userId}/{songId}/cover.{ext}`
  - Requires authentication

#### Download Functions

- `getAudioUrlFn`: Returns presigned download URL for audio files
- `getCoverImageUrlFn`: Returns presigned download URL for cover images

#### Generic Storage Functions (`src/fn/storage.ts`)

- `getProfileImageUploadUrlFn`: Profile image uploads (`profile-images/{userId}/{timestamp}.{ext}`)
- `getPresignedUploadUrlFn`: Generic file uploads
- `getImageUrlFn`: Generic image downloads

### 3. Client-Side Upload Logic (`src/utils/storage/audio-helpers.ts`)

The client handles the actual upload process:

```typescript
export async function uploadAudioWithPresignedUrl(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<AudioUploadResult>
```

**Upload Process:**
1. Calculate audio duration from file
2. Request presigned upload URL from server
3. Upload file directly to R2 using XMLHttpRequest (for progress tracking)
4. Return metadata including storage key and duration

### 4. File Upload UI (`src/components/ui/file-upload.tsx`)

Provides drag-and-drop interface with:
- File type validation
- Size limits (configurable)
- Progress indication
- Error handling
- Preview for image files

## Storage Structure

Files are organized in R2 with the following structure:

```
bucket/
├── music/
│   └── {userId}/
│       └── {songId}/
│           ├── audio.{ext}        # Audio file
│           └── cover.{ext}        # Cover image (optional)
├── profile-images/
│   └── {userId}/
│       └── {timestamp}.{ext}      # Profile pictures
└── {other-content}/
```

## Current Access Control

**Public Access**: All uploaded files are currently publicly accessible through presigned URLs. The security is:
- **Upload**: Requires user authentication to get presigned upload URLs
- **Download**: No authentication required once you have the storage key
- **URL Expiry**: Presigned URLs expire after 1 hour

## How It Works: Upload Flow

1. **User selects file** in upload UI (`src/routes/upload.tsx`)
2. **Client requests presigned URL** from server function
3. **Server generates presigned URL** using R2 client and returns with metadata
4. **Client uploads directly to R2** using presigned URL with progress tracking
5. **Client saves metadata** to database via separate API call

## How It Works: Download Flow

1. **Client needs to access file** (e.g., play audio, show cover image)
2. **Client requests presigned download URL** from server function with storage key
3. **Server generates presigned URL** for the specific file
4. **Client uses URL** to fetch/stream the file directly from R2

## Future Enhancement: Private File Access

To implement secure, private file access, you would modify the download server functions:

```typescript
export const getAudioUrlFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware]) // Add authentication
  .validator(z.object({
    audioKey: z.string(),
    songId: z.string().optional(), // Add song context
  }))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    
    // Check if user has access to this file
    const song = await database.query.song.findFirst({
      where: eq(song.audioKey, data.audioKey)
    });
    
    if (!song) {
      throw new Error("Song not found");
    }
    
    // Implement access control logic
    if (song.status === 'private' && song.userId !== userId) {
      throw new Error("Access denied");
    }
    
    const { storage } = getStorage();
    const audioUrl = await storage.getPresignedUrl(data.audioKey);
    
    return { audioUrl };
  });
```

This would enable:
- **Private files**: Only accessible to authorized users
- **Subscription-gated content**: Check user subscription level
- **Time-limited access**: Generate URLs with custom expiry times
- **Usage tracking**: Log access for analytics
- **Access control lists**: Fine-grained permissions per file

## Configuration

Required environment variables:

```bash
# R2 Configuration
R2_ENDPOINT=https://{account-id}.r2.cloudflarestorage.com
R2_BUCKET=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
```

The R2 storage is configured to work with any S3-compatible storage service by changing the endpoint URL.