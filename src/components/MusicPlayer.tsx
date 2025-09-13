import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { formatDuration } from "~/utils/song";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCoverImageUrlFn } from "~/fn/audio-storage";
import { incrementPlayCountFn } from "~/fn/songs";
import type { Song } from "~/db/schema";

interface MusicPlayerProps {
  song: Song | null;
  isVisible: boolean;
  onClose: () => void;
}

export function MusicPlayer({ song, isVisible, onClose }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const incrementPlayMutation = useMutation({
    mutationFn: incrementPlayCountFn,
    onSuccess: () => {
      // Invalidate song-related queries to refetch updated play counts
      queryClient.invalidateQueries({ queryKey: ['recent-songs'] });
      queryClient.invalidateQueries({ queryKey: ['popular-songs'] });
      queryClient.invalidateQueries({ queryKey: ['user-songs'] });
      if (song) {
        queryClient.invalidateQueries({ queryKey: ['song', song.id] });
      }
    },
  });

  // Update audio element when song changes
  useEffect(() => {
    if (audioRef.current && song?.audioUrl) {
      audioRef.current.src = song.audioUrl;
      audioRef.current.load();
      setHasStartedPlaying(false);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [song]);

  // Handle play/pause state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle seeking
  useEffect(() => {
    if (audioRef.current && !isDragging && Math.abs(audioRef.current.currentTime - currentTime) > 1) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, isDragging]);

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      audioRef.current.playbackRate = 1.0;
      setDuration(audioRef.current.duration);
    }
  };

  const handleCanPlay = () => {
    if (audioRef.current) {
      audioRef.current.playbackRate = 1.0;
    }
  };

  const handlePlay = () => {
    // Only increment play count once per song when it actually starts playing
    if (song && !hasStartedPlaying) {
      setHasStartedPlaying(true);
      incrementPlayMutation.mutate({ data: { songId: song.id } });
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time: number) => {
    setCurrentTime(time);
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
    setIsPlaying(false);
    onClose();
  };

  // Get the cover image URL from the coverImageKey
  const { data: coverUrlData } = useQuery({
    queryKey: ['cover-url', song?.coverImageKey || 'no-key'],
    queryFn: () => {
      if (!song?.coverImageKey) return Promise.resolve(null);
      return getCoverImageUrlFn({ data: { coverKey: song.coverImageKey } });
    },
  });

  // Don't render if no song or not visible
  if (!song || !isVisible) {
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
                    alt={`${song.title} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <Play className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{song.title}</p>
                <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center space-x-1 mx-4">
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