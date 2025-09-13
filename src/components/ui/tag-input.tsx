import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

interface TagInputProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  onLoadSuggestions?: (searchTerm: string) => Promise<string[]>;
  disabled?: boolean;
  className?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Add tags...",
  suggestions = [],
  onLoadSuggestions,
  disabled = false,
  className,
}: TagInputProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [loadedSuggestions, setLoadedSuggestions] = React.useState<string[]>(suggestions);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const loadSuggestions = async () => {
      if (!onLoadSuggestions || !searchTerm.trim()) {
        setLoadedSuggestions(suggestions);
        return;
      }

      setIsLoading(true);
      try {
        const newSuggestions = await onLoadSuggestions(searchTerm);
        setLoadedSuggestions(newSuggestions);
      } catch (error) {
        console.error("Failed to load tag suggestions:", error);
        setLoadedSuggestions(suggestions);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(loadSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, onLoadSuggestions, suggestions]);

  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim().toLowerCase();
    if (!trimmedTag || value.includes(trimmedTag)) return;
    
    const newTags = [...value, trimmedTag];
    onChange?.(newTags);
    setSearchTerm("");
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = value.filter(tag => tag !== tagToRemove);
    onChange?.(newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      e.preventDefault();
      addTag(searchTerm);
      setOpen(false);
    } else if (e.key === "Backspace" && !searchTerm && value.length > 0) {
      e.preventDefault();
      removeTag(value[value.length - 1]);
    }
  };

  // Filter suggestions to exclude already selected tags
  const filteredSuggestions = loadedSuggestions.filter(
    suggestion => !value.includes(suggestion.toLowerCase())
  );

  // Add the current search term as a creatable option if it's not empty and not in suggestions
  const showCreateOption = searchTerm.trim() && 
    !filteredSuggestions.some(s => s.toLowerCase() === searchTerm.toLowerCase()) &&
    !value.includes(searchTerm.toLowerCase());

  return (
    <div className={cn("relative", className)}>
      {/* Selected Tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-sm">
              {tag}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => removeTag(tag)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tag} tag</span>
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Input Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-start text-left font-normal",
              !searchTerm && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or add tags..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              onKeyDown={handleKeyDown}
            />
            <CommandEmpty>
              {isLoading ? "Loading..." : "No tags found."}
            </CommandEmpty>
            <CommandGroup>
              {showCreateOption && (
                <CommandItem
                  onSelect={() => {
                    addTag(searchTerm);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">Create "{searchTerm}"</span>
                </CommandItem>
              )}
              {filteredSuggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion}
                  onSelect={() => {
                    addTag(suggestion);
                    setOpen(false);
                  }}
                >
                  {suggestion}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}