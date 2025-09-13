import {
  deletePlaylist,
  checkPlaylistOwnership,
  findPlaylistById,
} from "~/data-access/playlists";

export interface DeletePlaylistInput {
  playlistId: string;
  userId: string;
}

export interface DeletePlaylistOutput {
  success: boolean;
}

export class PlaylistNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlaylistNotFoundError";
  }
}

export class UnauthorizedPlaylistAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedPlaylistAccessError";
  }
}

export async function deletePlaylistUseCase(
  input: DeletePlaylistInput
): Promise<DeletePlaylistOutput> {
  const { playlistId, userId } = input;

  // Check if playlist exists
  const playlist = await findPlaylistById(playlistId);
  if (!playlist) {
    throw new PlaylistNotFoundError("Playlist not found");
  }

  // Check if user owns the playlist
  const isOwner = await checkPlaylistOwnership(playlistId, userId);
  if (!isOwner) {
    throw new UnauthorizedPlaylistAccessError(
      "Unauthorized: You can only delete your own playlists"
    );
  }

  // Delete the playlist
  const deleted = await deletePlaylist(playlistId);
  if (!deleted) {
    throw new Error("Failed to delete playlist");
  }

  return { success: true };
}