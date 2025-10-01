import { Link } from "@tanstack/react-router";
import { AudioWaveform } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2">
            <AudioWaveform className="h-5 w-5" />
            <span className="font-semibold">StrudelCookbook</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              to="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 StrudelCookbook. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
