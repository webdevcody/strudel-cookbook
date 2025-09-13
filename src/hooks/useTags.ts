import { useQuery } from "@tanstack/react-query";
import { getAllTagsQuery, searchTagsQuery, getTagsBySoundIdQuery } from "~/queries/tags";

export function useAllTags() {
  return useQuery(getAllTagsQuery());
}

export function useSearchTags(searchTerm: string) {
  return useQuery(searchTagsQuery(searchTerm));
}

export function useTagsBySoundId(soundId: string) {
  return useQuery(getTagsBySoundIdQuery(soundId));
}

// Hook to get tag suggestions for the TagInput component
export function useTagSuggestions() {
  const { data: allTags = [] } = useAllTags();
  
  const loadSuggestions = async (searchTerm: string): Promise<string[]> => {
    if (!searchTerm.trim()) {
      return allTags.map(tag => tag.name);
    }
    
    // Filter existing tags based on search term
    const filteredTags = allTags
      .filter(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(tag => tag.name);
    
    return filteredTags;
  };

  return { loadSuggestions };
}