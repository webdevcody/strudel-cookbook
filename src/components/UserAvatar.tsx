import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { User } from "lucide-react";
import { getUserInitials } from "~/utils/avatar";
import { cn } from "~/lib/utils";

interface UserAvatarProps {
  imageUrl?: string | null;
  userName?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({ 
  imageUrl, 
  userName, 
  className, 
  fallbackClassName 
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const handleImageLoad = () => {
    setImageError(false);
    setImageLoaded(true);
  };

  const initials = getUserInitials(userName);
  const shouldShowImage = imageUrl && !imageError;

  return (
    <Avatar className={className}>
      {shouldShowImage && (
        <AvatarImage 
          src={imageUrl} 
          alt={userName || "User avatar"}
          onError={handleImageError}
          onLoad={handleImageLoad}
          className={cn(
            "transition-opacity duration-200",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      <AvatarFallback 
        className={cn(
          "bg-primary/10 transition-opacity duration-200", 
          fallbackClassName,
          shouldShowImage && imageLoaded ? "opacity-0" : "opacity-100"
        )}
      >
        {initials || <User className="h-1/2 w-1/2" />}
      </AvatarFallback>
    </Avatar>
  );
}