import { useEffect, useRef, useState } from "react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  List,
  X,
  Repeat,
  Shuffle
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { Slider } from "~/components/ui/slider";
import { usePlaylist } from "~/components/playlist-provider";
import { formatDuration } from "~/utils/song";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Temporary import for complex loading logic - to be refactored later
import { getCoverImageUrlFn } from "~/fn/audio-storage";
import { incrementPlayCountFn } from "~/fn/songs";

interface MusicPlayerProps {
  onOpenPlaylist: () => void;
}

export function MusicPlayer({ onOpenPlaylist }: MusicPlayerProps) {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLooping,
    isShuffling,
    isPlayerVisible,
    playNext,
    playPrevious,
    togglePlay,
    seekTo,
    setVolume,
    updateCurrentTime,
    updateDuration,
    clearPlaylist,
    toggleLoop,
    toggleShuffle,
    showPlayer,
    hidePlayer,
    playlist,
    currentIndex
  } = usePlaylist();

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const queryClient = useQueryClient();

  const incrementPlayMutation = useMutation({
    mutationFn: incrementPlayCountFn,
    onSuccess: () => {
      // Invalidate song-related queries to refetch updated play counts
      queryClient.invalidateQueries({ queryKey: ['recent-songs'] });
      queryClient.invalidateQueries({ queryKey: ['popular-songs'] });
      queryClient.invalidateQueries({ queryKey: ['user-songs'] });
      if (currentSong) {
        queryClient.invalidateQueries({ queryKey: ['song', currentSong.id] });
      }
    },
  });

  // Determine when buttons should be disabled
  const isAtFirstSong = currentIndex === 0;
  const isAtLastSong = currentIndex === playlist.length - 1;
  const canGoNext = isLooping || isShuffling || !isAtLastSong;
  const canGoPrevious = isLooping || !isAtFirstSong;

  // Update audio element when current song changes
  useEffect(() => {
    if (audioRef.current && currentSong?.audioUrl) {
      audioRef.current.src = currentSong.audioUrl;
      audioRef.current.load();
      setHasStartedPlaying(false); // Reset play tracking for new song
    }
  }, [currentSong]);

  // Handle play/pause state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle seeking - only when explicitly seeking, not during normal playback
  useEffect(() => {
    if (audioRef.current && !isDragging && Math.abs(audioRef.current.currentTime - currentTime) > 1) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, isDragging]);

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      updateCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      // Ensure audio is properly configured
      audioRef.current.playbackRate = 1.0;
      updateDuration(audioRef.current.duration);
    }
  };

  const handleCanPlay = () => {
    if (audioRef.current) {
      // Double-check playback rate when audio is ready to play
      audioRef.current.playbackRate = 1.0;
    }
  };

  const handlePlay = () => {
    // Only increment play count once per song when it actually starts playing
    if (currentSong && !hasStartedPlaying) {
      setHasStartedPlaying(true);
      incrementPlayMutation.mutate({ data: { songId: currentSong.id } });
    }
  };

  const handleEnded = () => {
    playNext();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    seekTo(newTime);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!progressRef.current) return;

      const rect = progressRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      
      seekTo(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleMute = () => {
    setVolume(volume > 0 ? 0 : 1);
  };

  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0]);
  };

  const handleClose = () => {
    // Just pause the music and hide the player, don't clear playlist
    if (isPlaying) {
      togglePlay();
    }
    hidePlayer();
  };

  // Get the cover image URL from the coverImageKey - must be called before early return
  const { data: coverUrlData } = useQuery({
    queryKey: ['cover-url', currentSong?.coverImageKey || 'no-key'],
    queryFn: () => {
      if (!currentSong?.coverImageKey) return Promise.resolve(null);
      return getCoverImageUrlFn({ data: { coverKey: currentSong.coverImageKey } });
    },
  });

  // Auto-show player when a new song starts playing
  useEffect(() => {
    if (currentSong && isPlaying && !isPlayerVisible) {
      showPlayer();
    }
  }, [currentSong, isPlaying, isPlayerVisible, showPlayer]);

  // Don't render if no current song or manually hidden
  if (!currentSong || !isPlayerVisible) {
    return null;
  }

  const displayCoverUrl = coverUrlData?.coverUrl;
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onPlay={handlePlay}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Fixed bottom player */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border z-50">
        <div className="px-4 py-3">
          {/* Progress bar */}
          <div className="mb-3">
            <div
              ref={progressRef}
              className="w-full h-1 bg-muted rounded-full cursor-pointer hover:h-2 transition-all"
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
            >
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Main player controls */}
          <div className="flex items-center justify-between">
            {/* Song info */}
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                {displayCoverUrl ? (
                  <img
                    src={displayCoverUrl}
                    alt={`${currentSong.title} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <Play className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{currentSong.title}</p>
                <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center space-x-1 mx-4">
              {/* Shuffle button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleShuffle}
                className={`${isShuffling ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Shuffle className="h-4 w-4" />
              </Button>

              <Tooltip
                content={!canGoPrevious ? "Cannot go to previous song - you're at the first song and loop is disabled" : ""}
                disabled={canGoPrevious}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={playPrevious}
                  disabled={playlist.length <= 1 || !canGoPrevious}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
              </Tooltip>

              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="w-10 h-10"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>

              <Tooltip
                content={!canGoNext ? "Cannot go to next song - you're at the last song and loop is disabled" : ""}
                disabled={canGoNext}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={playNext}
                  disabled={playlist.length <= 1 || !canGoNext}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </Tooltip>

              {/* Loop button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLoop}
                className={`${isLooping ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Repeat className="h-4 w-4" />
              </Button>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-2">
              {/* Volume control */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                >
                  {volume > 0 ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-20"
                />
              </div>

              {/* Playlist button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenPlaylist}
              >
                <List className="h-4 w-4" />
              </Button>

              {/* Close player button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                title="Hide player"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}