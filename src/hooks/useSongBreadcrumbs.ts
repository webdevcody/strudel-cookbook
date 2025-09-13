import { useRouter } from "@tanstack/react-router";
import { Home, Music } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
}

export function useSongBreadcrumbs(songTitle?: string, currentPage?: string) {
  const router = useRouter();

  // Check if user came from my-songs route
  const cameFromMySongs = (router.state.location.state as any)?.from === '/my-songs' || 
    (typeof window !== 'undefined' && document.referrer.includes('/my-songs'));

  // Extract song ID from current path
  const songId = router.state.location.pathname.split('/')[2];

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (cameFromMySongs) {
      // Breadcrumb path from My Songs
      const items: BreadcrumbItem[] = [
        { label: "My Songs", href: "/my-songs", icon: Music }
      ];

      // Add song title if provided
      if (songTitle) {
        items.push({ 
          label: songTitle, 
          href: currentPage === 'edit' && songId ? `/song/${songId}` : undefined 
        });
      }

      // Add current page if it's edit
      if (currentPage === 'edit') {
        items.push({ label: "Edit" });
      }

      return items;
    } else {
      // Default breadcrumb path from Home/Browse
      const items: BreadcrumbItem[] = [
        { label: "Home", href: "/", icon: Home },
        { label: "Browse", href: "/browse", icon: Music }
      ];

      // Add song title if provided
      if (songTitle) {
        items.push({ 
          label: songTitle, 
          href: currentPage === 'edit' && songId ? `/song/${songId}` : undefined 
        });
      }

      // Add current page if it's edit
      if (currentPage === 'edit') {
        items.push({ label: "Edit" });
      }

      return items;
    }
  };

  return generateBreadcrumbs();
}