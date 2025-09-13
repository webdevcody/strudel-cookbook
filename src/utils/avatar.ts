/**
 * Generates initials from a user's name for avatar fallback
 * @param name - Full name of the user
 * @returns Two-letter initials (e.g., "John Doe" -> "JD", "Alice" -> "AL")
 */
export function getUserInitials(name: string | null | undefined): string {
  if (!name || name.trim().length === 0) {
    return '';
  }

  const cleanName = name.trim();
  const nameParts = cleanName
    .split(' ')
    .filter(part => part.length > 0)
    .map(part => part.charAt(0).toUpperCase());

  if (nameParts.length === 0) {
    return '';
  }

  if (nameParts.length === 1) {
    // Single name: use first two characters if available, otherwise just first
    return cleanName.length >= 2 
      ? cleanName.substring(0, 2).toUpperCase()
      : cleanName.charAt(0).toUpperCase();
  }

  // Multiple names: use first letter of first and last name
  return nameParts[0] + nameParts[nameParts.length - 1];
}