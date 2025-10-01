import { Button } from "~/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Play, Heart, Code, Share2 } from "lucide-react";

export function Hero() {
  return (
    <section className="container mx-auto px-4 py-16 sm:py-24">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16 items-center">
        <div className="flex flex-col justify-center space-y-6">
          <div className="space-y-4">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
              100% Free • Community Driven
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              A Free Community for{" "}
              <span className="text-primary">Strudel Musicians</span>
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl">
              Share your Strudel songs and sounds with the world. Discover creations from fellow musicians, listen to their work, and remix them into something new. Completely free, forever.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="text-base" asChild>
              <Link to="/browse">
                <Play className="mr-2 h-4 w-4" />
                Explore Community Songs
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-6 pt-4">
            <div className="text-center">
              <Share2 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Share Freely</p>
            </div>
            <div className="text-center">
              <Heart className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Community Powered</p>
            </div>
            <div className="text-center">
              <Code className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Remix & Create</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            <div className="h-80 w-80 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-border overflow-hidden">
              <div className="text-center p-8">
                <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Play className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Built by the Community</h3>
                <p className="text-sm text-muted-foreground">
                  A free platform where Strudel creators share, discover, and remix each other's music
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
