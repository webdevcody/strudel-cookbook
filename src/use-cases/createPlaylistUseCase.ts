import {
  createPlaylist,
  countPlaylistsByUserId,
} from "~/data-access/playlists";
import { getUserPlan } from "~/data-access/users";
import { getPlaylistLimit, hasReachedPlaylistLimit } from "~/config/planLimits";
import type { CreatePlaylistData } from "~/db/schema";

export interface CreatePlaylistInput {
  userId: string;
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface CreatePlaylistOutput {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PlaylistLimitError extends Error {
  constructor(
    message: string,
    public readonly errorCode:
      | "PLAYLIST_LIMIT_FREE"
      | "PLAYLIST_LIMIT_BASIC"
      | "SUBSCRIPTION_EXPIRED"
  ) {
    super(message);
    this.name = "PlaylistLimitError";
  }
}

export async function createPlaylistUseCase(
  input: CreatePlaylistInput
): Promise<CreatePlaylistOutput> {
  const { userId, name, description, isPublic = false } = input;

  // Get current playlist count for the user
  const currentCount = await countPlaylistsByUserId(userId);

  // Get user's plan information
  const userPlan = await getUserPlan(userId);

  // Check if subscription is active
  if (!userPlan.isActive) {
    throw new PlaylistLimitError(
      "Your subscription has expired. Please renew to create playlists.",
      "SUBSCRIPTION_EXPIRED"
    );
  }

  // Check if user has reached their playlist limit based on their plan
  if (hasReachedPlaylistLimit(userPlan.plan, currentCount)) {
    const limit = getPlaylistLimit(userPlan.plan);
    if (userPlan.plan === "free") {
      throw new PlaylistLimitError(
        `Free users can only create ${limit} playlist. Upgrade to Basic for up to 5 playlists, or Pro for unlimited playlists.`,
        "PLAYLIST_LIMIT_FREE"
      );
    } else if (userPlan.plan === "basic") {
      throw new PlaylistLimitError(
        `Basic users can create up to ${limit} playlists. Upgrade to Pro for unlimited playlists.`,
        "PLAYLIST_LIMIT_BASIC"
      );
    }
  }

  // Create the playlist data
  const playlistData: CreatePlaylistData = {
    id: crypto.randomUUID(),
    name,
    description: description || null,
    isPublic,
    userId,
  };

  // Create the playlist in the database
  const newPlaylist = await createPlaylist(playlistData);

  if (!newPlaylist) {
    throw new Error("Failed to create playlist in database");
  }

  return newPlaylist;
}
