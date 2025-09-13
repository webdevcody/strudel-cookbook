import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Song } from "~/db/schema";
import type { SongWithUrls } from "~/data-access/songs";
import { authClient } from "~/lib/auth-client";
// Temporary imports for complex loading logic - to be refactored later
import { getLastPlaylistFn, getPlaylistByIdFn } from "~/fn/playlists";
import { getAudioUrlFn, getCoverImageUrlFn } from "~/fn/audio-storage";

export interface PlaylistSong extends Song {
  audioUrl?: string;
  coverImageUrl?: string | null;
  lastPlayedAt?: number; // Timestamp for shuffle smart selection
}

// Helper to convert SongWithUrls to PlaylistSong
export function toPlaylistSong(song: SongWithUrls): PlaylistSong {
  return {
    ...song,
    lastPlayedAt: undefined,
  };
}

type PlaylistProviderProps = {
  children: React.ReactNode;
};

type PlaylistState = {
  playlist: PlaylistSong[];
  currentSong: PlaylistSong | null;
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLooping: boolean;
  isShuffling: boolean;
  isPlayerVisible: boolean;
  hasEverUsedPlayer: boolean;
  currentPlaylistId: string | null; // ID of the saved playlist currently loaded
  currentPlaylistName: string | null; // Name of the saved playlist currently loaded
  selectedPlaylistId: string | null; // ID of the user's selected playlist for database operations
  isAuthenticated: boolean;
  // Actions
  addToPlaylist: (song: PlaylistSong) => void;
  setSelectedPlaylist: (playlistId: string | null, playlistName: string | null) => void;
  removeFromPlaylist: (songId: string) => void;
  clearPlaylist: () => void;
  playSong: (song: PlaylistSong, index?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  updateCurrentTime: (time: number) => void;
  updateDuration: (duration: number) => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  showPlayer: () => void;
  hidePlayer: () => void;
  loadSavedPlaylist: (playlistId: string, playlistName: string, songs: PlaylistSong[]) => void;
};

const PLAYLIST_SETTINGS_KEY = "music-playlist-settings";
const PLAYLIST_STATE_KEY = "music-playlist-state";

const initialState: PlaylistState = {
  playlist: [],
  currentSong: null,
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isLooping: false,
  isShuffling: false,
  isPlayerVisible: true,
  hasEverUsedPlayer: false,
  currentPlaylistId: null,
  currentPlaylistName: null,
  selectedPlaylistId: null,
  isAuthenticated: false,
  // Actions - these will be overridden by the provider
  addToPlaylist: () => null,
  setSelectedPlaylist: () => null,
  removeFromPlaylist: () => null,
  clearPlaylist: () => null,
  playSong: () => null,
  playNext: () => null,
  playPrevious: () => null,
  togglePlay: () => null,
  seekTo: () => null,
  setVolume: () => null,
  updateCurrentTime: () => null,
  updateDuration: () => null,
  toggleLoop: () => null,
  toggleShuffle: () => null,
  showPlayer: () => null,
  hidePlayer: () => null,
  loadSavedPlaylist: () => null,
};

const PlaylistContext = createContext<PlaylistState>(initialState);

export function PlaylistProvider({ children }: PlaylistProviderProps) {
  const [playlist, setPlaylist] = useState<PlaylistSong[]>([]);
  const [currentSong, setCurrentSong] = useState<PlaylistSong | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(true);
  const [hasEverUsedPlayer, setHasEverUsedPlayer] = useState(false);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
  const [currentPlaylistName, setCurrentPlaylistName] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Get authentication status
  const { data: session, error: sessionError } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  // Debug session errors
  useEffect(() => {
    if (sessionError) {
      console.error('PlaylistProvider useSession error:', sessionError);
    }
  }, [sessionError]);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(PLAYLIST_SETTINGS_KEY);
      
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setVolumeState(parsedSettings.volume || 1);
        setIsLooping(parsedSettings.isLooping || false);
        setIsShuffling(parsedSettings.isShuffling || false);
        setHasEverUsedPlayer(parsedSettings.hasEverUsedPlayer || false);
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
    }
  }, []);

  // Load playlist state from localStorage on mount (authenticated users only)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    try {
      const savedState = localStorage.getItem(PLAYLIST_STATE_KEY);
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (parsedState.selectedPlaylistId && parsedState.selectedPlaylistName) {
          setSelectedPlaylistId(parsedState.selectedPlaylistId);
          
          // Optionally restore current song info (we'll implement playlist loading separately)
          if (parsedState.currentSong) {
            setCurrentSong(parsedState.currentSong);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load playlist state from localStorage:", error);
    }
  }, [isAuthenticated]);

  // Note: Playlists are now fully server-side, no localStorage persistence

  // Save settings when they change
  useEffect(() => {
    try {
      localStorage.setItem(PLAYLIST_SETTINGS_KEY, JSON.stringify({
        volume,
        isLooping,
        isShuffling,
        hasEverUsedPlayer,
      }));
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error);
    }
  }, [volume, isLooping, isShuffling, hasEverUsedPlayer]);

  // Save playlist state to localStorage when it changes (authenticated users only)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    try {
      const playlistState = {
        selectedPlaylistId,
        currentSong,
        currentPlaylistId,
        currentPlaylistName,
      };
      
      localStorage.setItem(PLAYLIST_STATE_KEY, JSON.stringify(playlistState));
    } catch (error) {
      console.error("Failed to save playlist state to localStorage:", error);
    }
  }, [isAuthenticated, selectedPlaylistId, currentSong, currentPlaylistId, currentPlaylistName]);

  // Restore playlist on authentication (after localStorage state is loaded)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Only run restoration once per session to avoid constant reloading
    const sessionKey = `playlist-restored-${session?.user?.id}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const restorePlaylist = async () => {
      try {
        let playlistToRestore = null;
        
        // First, check if we have a saved playlist in localStorage
        const savedState = localStorage.getItem(PLAYLIST_STATE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          if (parsedState.selectedPlaylistId) {
            try {
              // Try to load the saved playlist
              const savedPlaylist = await getPlaylistByIdFn({ data: { id: parsedState.selectedPlaylistId } });
              playlistToRestore = savedPlaylist;
            } catch (error) {
              console.warn("Failed to load saved playlist, falling back to latest:", error);
              // Clear invalid playlist from localStorage
              localStorage.removeItem(PLAYLIST_STATE_KEY);
            }
          }
        }
        
        // If no saved playlist or failed to load, get the most recent playlist
        if (!playlistToRestore) {
          playlistToRestore = await getLastPlaylistFn();
        }
        
        // If we found a playlist to restore, load it
        if (playlistToRestore) {
          // Set as selected playlist for future song additions
          setSelectedPlaylistId(playlistToRestore.id);
          
          if (playlistToRestore.songs.length > 0) {
            // Convert songs to PlaylistSong format with URLs
            const playlistSongs = await Promise.all(
              playlistToRestore.songs.map(async (song) => {
                const [audioUrlResult, coverUrlResult] = await Promise.all([
                  song.audioKey ? getAudioUrlFn({ data: { audioKey: song.audioKey } }) : Promise.resolve(null),
                  song.coverImageKey ? getCoverImageUrlFn({ data: { coverKey: song.coverImageKey } }) : Promise.resolve(null),
                ]);

                return toPlaylistSong({
                  ...song,
                  audioUrl: audioUrlResult?.audioUrl || "",
                  coverImageUrl: coverUrlResult?.coverUrl || undefined,
                });
              })
            );

            // Load the playlist without auto-playing
            setPlaylist(playlistSongs);
            setCurrentPlaylistId(playlistToRestore.id);
            setCurrentPlaylistName(playlistToRestore.name);
            
            // Optionally restore the last playing song (don't auto-play)
            if (savedState) {
              const parsedState = JSON.parse(savedState);
              if (parsedState.currentSong) {
                const songToRestore = playlistSongs.find(s => s.id === parsedState.currentSong.id);
                if (songToRestore) {
                  const songIndex = playlistSongs.findIndex(s => s.id === songToRestore.id);
                  setCurrentSong(songToRestore);
                  setCurrentIndex(songIndex);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to restore playlist:", error);
      } finally {
        // Mark restoration as completed for this session
        sessionStorage.setItem(sessionKey, "true");
      }
    };

    restorePlaylist();
  }, [isAuthenticated, session?.user?.id]);

  const setSelectedPlaylist = useCallback((playlistId: string | null, playlistName: string | null) => {
    setSelectedPlaylistId(playlistId);
    // Note: We don't automatically load the playlist here - that's handled elsewhere
    // This just sets which playlist will receive new songs for authenticated users
  }, []);

  const addToPlaylist = useCallback((song: PlaylistSong) => {
    // Mark that user has used the player
    setHasEverUsedPlayer(true);
    
    // For authenticated users, handle database playlist logic elsewhere (in hook)
    // This provider method now just handles the in-memory queue for both auth states
    
    // Clear saved playlist context when adding individual songs to in-memory queue
    if (!isAuthenticated) {
      setCurrentPlaylistId(null);
      setCurrentPlaylistName(null);
    }
    
    setPlaylist(prev => {
      // Check if song already exists in playlist
      const existingIndex = prev.findIndex(s => s.id === song.id);
      if (existingIndex >= 0) {
        // Song already in playlist, play it instead
        const newIndex = existingIndex;
        setCurrentIndex(newIndex);
        setCurrentSong(prev[newIndex]);
        setIsPlaying(true);
        return prev;
      }
      
      // Add new song to playlist
      const newPlaylist = [...prev, song];
      
      // If this is the first song, make it current
      if (prev.length === 0) {
        setCurrentIndex(0);
        setCurrentSong(song);
        setIsPlaying(true);
      }
      
      return newPlaylist;
    });
  }, [isAuthenticated]);

  const removeFromPlaylist = useCallback((songId: string) => {
    setPlaylist(prev => {
      const songIndex = prev.findIndex(s => s.id === songId);
      if (songIndex === -1) return prev;
      
      const newPlaylist = prev.filter(s => s.id !== songId);
      
      // Adjust current index if needed
      if (songIndex === currentIndex) {
        // Removing current song
        if (newPlaylist.length === 0) {
          setCurrentSong(null);
          setCurrentIndex(-1);
          setIsPlaying(false);
        } else if (songIndex >= newPlaylist.length) {
          // Current was last song, play previous
          const newIndex = Math.max(0, songIndex - 1);
          setCurrentIndex(newIndex);
          setCurrentSong(newPlaylist[newIndex]);
        } else {
          // Play next song at same index
          setCurrentSong(newPlaylist[songIndex]);
        }
      } else if (songIndex < currentIndex) {
        // Adjust index since we removed a song before current
        setCurrentIndex(prev => prev - 1);
      }
      
      return newPlaylist;
    });
  }, [currentIndex]);

  const clearPlaylist = useCallback(() => {
    setPlaylist([]);
    setCurrentSong(null);
    setCurrentIndex(-1);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentPlaylistId(null);
    setCurrentPlaylistName(null);
    // Don't clear selectedPlaylistId - user's selected playlist remains for future additions
  }, []);

  const loadSavedPlaylist = useCallback((playlistId: string, playlistName: string, songs: PlaylistSong[], startIndex?: number) => {
    setHasEverUsedPlayer(true);
    setPlaylist(songs);
    setCurrentPlaylistId(playlistId);
    setCurrentPlaylistName(playlistName);
    
    if (songs.length > 0) {
      const validStartIndex = startIndex !== undefined && startIndex >= 0 && startIndex < songs.length ? startIndex : 0;
      setCurrentIndex(validStartIndex);
      setCurrentSong(songs[validStartIndex]);
      setIsPlaying(false); // Don't auto-play when loading a playlist
      setCurrentTime(0);
    } else {
      setCurrentIndex(-1);
      setCurrentSong(null);
      setIsPlaying(false);
    }
  }, []);

  // Smart shuffle: prioritize songs that haven't been played recently
  const getNextShuffleSong = useCallback(() => {
    if (playlist.length <= 1) return 0;
    
    const now = Date.now();
    const recentPlayThreshold = 10 * 60 * 1000; // 10 minutes
    
    // Create weights for each song based on when they were last played
    const songWeights = playlist.map((song, index) => {
      if (index === currentIndex) return null; // Don't repeat current song
      
      const lastPlayed = song.lastPlayedAt || 0;
      const timeSincePlay = now - lastPlayed;
      
      // Songs never played or played long ago get higher weight
      let weight = 1;
      if (!lastPlayed) {
        weight = 3; // Never played songs get 3x weight
      } else if (timeSincePlay > recentPlayThreshold) {
        weight = 2; // Songs not played recently get 2x weight
      } else {
        weight = 0.3; // Recently played songs get low weight
      }
      
      return { index, weight };
    }).filter((item): item is { index: number; weight: number } => item !== null && item.weight > 0);
    
    if (songWeights.length === 0) {
      // All songs played recently, just pick random
      return Math.floor(Math.random() * playlist.length);
    }
    
    // Weighted random selection
    const totalWeight = songWeights.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of songWeights) {
      random -= item.weight;
      if (random <= 0) {
        return item.index;
      }
    }
    
    return songWeights[0].index;
  }, [playlist, currentIndex]);

  const playSong = useCallback((song: PlaylistSong, index?: number) => {
    let songIndex = index;
    
    if (typeof songIndex === 'undefined') {
      // Find the song in the playlist
      songIndex = playlist.findIndex(s => s.id === song.id);
      if (songIndex === -1) {
        // Song not in playlist, add it and play
        addToPlaylist(song);
        return;
      }
    }
    
    // Update the song's last played timestamp
    setPlaylist(prev => prev.map((s, i) => 
      i === songIndex ? { ...s, lastPlayedAt: Date.now() } : s
    ));
    
    setCurrentSong(song);
    setCurrentIndex(songIndex);
    setIsPlaying(true);
    setCurrentTime(0);
  }, [playlist, addToPlaylist]);

  const playNext = useCallback(() => {
    if (playlist.length === 0) return;
    
    let nextIndex: number;
    
    if (isShuffling) {
      nextIndex = getNextShuffleSong();
    } else {
      nextIndex = currentIndex + 1;
      
      // Handle end of playlist
      if (nextIndex >= playlist.length) {
        if (isLooping) {
          nextIndex = 0; // Loop back to beginning
        } else {
          // End of playlist, stop playing
          setIsPlaying(false);
          return;
        }
      }
    }
    
    const nextSong = playlist[nextIndex];
    
    // Update the song's last played timestamp
    setPlaylist(prev => prev.map((s, i) => 
      i === nextIndex ? { ...s, lastPlayedAt: Date.now() } : s
    ));
    
    setCurrentIndex(nextIndex);
    setCurrentSong(nextSong);
    setCurrentTime(0);
    // Keep playing state
  }, [playlist, currentIndex, isLooping, isShuffling, getNextShuffleSong]);

  const playPrevious = useCallback(() => {
    if (playlist.length === 0) return;
    
    const prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1;
    const prevSong = playlist[prevIndex];
    
    setCurrentIndex(prevIndex);
    setCurrentSong(prevSong);
    setCurrentTime(0);
    // Keep playing state
  }, [playlist, currentIndex]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const seekTo = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }, []);

  const updateCurrentTime = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const updateDuration = useCallback((newDuration: number) => {
    setDuration(newDuration);
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping(prev => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffling(prev => !prev);
  }, []);

  const showPlayer = useCallback(() => {
    setIsPlayerVisible(true);
  }, []);

  const hidePlayer = useCallback(() => {
    setIsPlayerVisible(false);
  }, []);

  const value: PlaylistState = {
    playlist,
    currentSong,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLooping,
    isShuffling,
    isPlayerVisible,
    hasEverUsedPlayer,
    currentPlaylistId,
    currentPlaylistName,
    selectedPlaylistId,
    isAuthenticated,
    addToPlaylist,
    setSelectedPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    playSong,
    playNext,
    playPrevious,
    togglePlay,
    seekTo,
    setVolume,
    updateCurrentTime,
    updateDuration,
    toggleLoop,
    toggleShuffle,
    showPlayer,
    hidePlayer,
    loadSavedPlaylist,
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
}

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);

  if (context === undefined) {
    throw new Error("usePlaylist must be used within a PlaylistProvider");
  }

  return context;
};