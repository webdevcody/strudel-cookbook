import { Link } from "@tanstack/react-router";
import { authClient } from "~/lib/auth-client";
import { ModeToggle } from "./mode-toggle";
import { Button, buttonVariants } from "./ui/button";
import {
  LogOut,
  User,
  Menu,
  Settings,
  AudioWaveform,
  Music,
  Upload,
  Code,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useUserAvatar } from "~/hooks/useUserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import * as React from "react";

const navigationLinks = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Browse",
    href: "/browse",
  },
];

interface HeaderProps {}

export function Header({}: HeaderProps = {}) {
  const { data: session, isPending, error } = authClient.useSession();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { avatarUrl } = useUserAvatar();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-screen-2xl mx-auto px-8 flex h-14 items-center">
        <div className="mr-4 flex gap-16">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <AudioWaveform />{" "}
            <span className="hidden font-bold sm:inline-block">
              SoundStation
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {link.title}
              </Link>
            ))}
            {session && (
              <Link
                to="/upload"
                className="flex items-center gap-2 transition-colors hover:text-foreground/80 text-foreground/60"
              >
                <Code className="h-4 w-4" />
                Submit Sound
              </Link>
            )}
          </nav>
        </div>

        {/* Mobile menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <div className="px-7">
              <Link
                to="/"
                className="flex items-center space-x-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <AudioWaveform className="h-6 w-6" />
                <span className="font-bold">SoundStation</span>
              </Link>
              <nav className="flex flex-col gap-3 mt-6">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block px-2 py-1 text-lg transition-colors hover:text-foreground/80 text-foreground/60"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.title}
                  </Link>
                ))}
                {session && (
                  <>
                    <Link
                      to="/upload"
                      className="flex items-center gap-2 px-2 py-1 text-lg transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Code className="h-5 w-5" />
                      Submit Sound
                    </Link>
                    <Link
                      to="/my-songs"
                      className="block px-2 py-1 text-lg transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Songs
                    </Link>
                    <Link
                      to="/my-sounds"
                      className="block px-2 py-1 text-lg transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Sounds
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none"></div>
          <nav className="flex items-center gap-4">
            {isPending ? (
              <div className="flex h-9 w-9 items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : session ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10">
                          {session?.user?.name?.charAt(0)?.toUpperCase() || (
                            <User className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Account
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/my-songs">
                        <Music className="mr-2 h-4 w-4" />
                        <span>My Songs</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-sounds">
                        <Code className="mr-2 h-4 w-4" />
                        <span>My Sounds</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => authClient.signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  to="/sign-in"
                  search={{ redirect: undefined }}
                >
                  Sign In
                </Link>
                <Link
                  className={buttonVariants({ variant: "default" })}
                  to="/sign-up"
                  search={{ redirect: undefined }}
                >
                  Sign Up
                </Link>
              </>
            )}
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
