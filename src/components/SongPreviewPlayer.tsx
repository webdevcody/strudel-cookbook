import { useEffect, useRef, useState } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX 
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { formatDuration } from "~/utils/song";

interface SongPreviewPlayerProps {
  audioUrl: string;
  title: string;
  artist: string;
  coverUrl?: string;
}

export function SongPreviewPlayer({ 
  audioUrl, 
  title, 
  artist, 
  coverUrl 
}: SongPreviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize audio element
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.volume = volume;
      audioRef.current.load();
    }
  }, [audioUrl, volume]);

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
    }
  };

  // Handle time updates
  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Handle progress bar interaction
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!progressRef.current || !audioRef.current) return;

      const rect = progressRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Volume control
  const toggleMute = () => {
    const newVolume = volume > 0 ? 0 : 0.7;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-muted rounded-md overflow-hidden flex-shrink-0">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`${title} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Play className="h-3 w-3 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">Preview: {title}</h4>
          <p className="text-xs text-muted-foreground truncate">by {artist}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div
          ref={progressRef}
          className="w-full h-2 bg-muted rounded-full cursor-pointer hover:h-3 transition-all"
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
        >
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Play/Pause button */}
        <Button
          variant="outline"
          size="sm"
          onClick={togglePlay}
          disabled={!audioUrl}
          className="h-8 px-3"
        >
          {isPlaying ? (
            <>
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-3 w-3 mr-1" />
              Play
            </>
          )}
        </Button>

        {/* Volume control */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="h-8 w-8 p-0"
          >
            {volume > 0 ? (
              <Volume2 className="h-3 w-3" />
            ) : (
              <VolumeX className="h-3 w-3" />
            )}
          </Button>
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={1}
            min={0}
            step={0.1}
            className="w-16"
          />
        </div>
      </div>
    </div>
  );
}