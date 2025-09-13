import {
  findPlaylistsByUserId,
  countPlaylistsByUserId,
  createPlaylist,
} from "~/data-access/playlists";
import { getUserPlan } from "~/data-access/users";
import { hasReachedPlaylistLimit } from "~/config/planLimits";
import type { CreatePlaylistData, Playlist } from "~/db/schema";
import { PlaylistLimitError } from "./createPlaylistUseCase";

export interface GetOrCreateDefaultPlaylistInput {
  userId: string;
}

export interface GetOrCreateDefaultPlaylistOutput {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getOrCreateDefaultPlaylistUseCase(
  input: GetOrCreateDefaultPlaylistInput
): Promise<GetOrCreateDefaultPlaylistOutput> {
  const { userId } = input;
  
  // First, try to find an existing playlist for the user
  const existingPlaylists = await findPlaylistsByUserId(userId);
  if (existingPlaylists.length > 0) {
    // Return the most recently created playlist
    return existingPlaylists[0];
  }
  
  // If no playlists exist, create a default one
  const userPlan = await getUserPlan(userId);
  
  // Check if subscription is active
  if (!userPlan.isActive) {
    throw new PlaylistLimitError(
      "Your subscription has expired. Please renew to create playlists.",
      "SUBSCRIPTION_EXPIRED"
    );
  }
  
  // Check if user has reached their playlist limit based on their plan
  const currentCount = await countPlaylistsByUserId(userId);
  if (hasReachedPlaylistLimit(userPlan.plan as any, currentCount)) {
    if (userPlan.plan === "free") {
      throw new PlaylistLimitError(
        `Free users can only create 1 playlist. Upgrade to Basic for up to 5 playlists, or Pro for unlimited playlists.`,
        "PLAYLIST_LIMIT_FREE"
      );
    } else if (userPlan.plan === "basic") {
      throw new PlaylistLimitError(
        `Basic users can create up to 5 playlists. Upgrade to Pro for unlimited playlists.`,
        "PLAYLIST_LIMIT_BASIC"
      );
    }
  }

  // Create the default playlist data
  const defaultPlaylistData: CreatePlaylistData = {
    id: crypto.randomUUID(),
    name: "My Playlist",
    description: "My first playlist",
    isPublic: false,
    userId,
  };

  // Create the playlist in the database
  const newPlaylist = await createPlaylist(defaultPlaylistData);
  
  if (!newPlaylist) {
    throw new Error("Failed to create default playlist in database");
  }

  return newPlaylist;
}