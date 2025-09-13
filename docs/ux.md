# UX Patterns & Guidelines

This document outlines the consistent UX patterns used throughout the SoundStation application. Follow these guidelines when adding new features or pages.

## Table of Contents

1. [Form Validation](#form-validation)
2. [Button States & Toast Notifications](#button-states--toast-notifications)
3. [Deletion Dialogs](#deletion-dialogs)
4. [Action Button Placement](#action-button-placement)
5. [Button Tooltips & Hover States](#button-tooltips--hover-states)
6. [Breadcrumb Navigation](#breadcrumb-navigation)
7. [General Principles](#general-principles)

## Form Validation

### Pattern: Client-Side Validation with Real-Time Feedback

**Key Principles:**

- **Never disable buttons** - Always allow form submission attempts
- Use `react-hook-form` with `zod` schema validation
- Show field-specific error messages below inputs
- Display loading states during submission
- Show toast notifications for success/error feedback

### Implementation Example:

```tsx
const form = useForm<FormData>({
  resolver: zodResolver(validationSchema),
  defaultValues: {
    /* defaults */
  },
});

const onSubmit = async (data: FormData) => {
  mutation.mutate(data, {
    onSuccess: () => {
      toast.success("Success message");
      form.reset(); // Reset form after success
    },
    onError: (error) => {
      // Let the hook handle error toasts
      // Or handle specific errors here
    },
  });
};

// Button remains enabled but shows loading state
<Button type="submit" disabled={mutation.isPending}>
  {mutation.isPending ? "Saving..." : "Save"}
</Button>;
```

### Form Field Pattern:

```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Field Label *</FormLabel>
      <FormControl>
        <Input
          placeholder="Placeholder text"
          disabled={mutation.isPending}
          {...field}
        />
      </FormControl>
      <FormMessage /> {/* Shows validation errors */}
    </FormItem>
  )}
/>
```

### Form Validation Examples:

- **Upload Form** (`src/routes/upload.tsx:36-61`): Comprehensive validation with file upload
- **Sign-in Form** (`src/routes/sign-in.tsx:27-30`): Basic email/password validation
- **Playlist Creation** (`src/components/CreatePlaylistDialog.tsx:123-133`): Inline validation with character limits

## Button States & Toast Notifications

### Pattern: Never Disable Buttons, Show Loading States

**Key Principles:**

- Buttons show loading state but remain clickable
- Use `isPending` or `isLoading` to show loading text/spinner
- Toast notifications provide user feedback
- Loading states prevent multiple submissions

### Button State Implementation:

```tsx
const mutation = useMutation({
  /* ... */
});

<Button type="submit" disabled={mutation.isPending} className="w-full">
  {mutation.isPending ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Processing...
    </>
  ) : (
    <>
      <Icon className="h-4 w-4 mr-2" />
      Submit
    </>
  )}
</Button>;
```

### Toast Notification Patterns:

```tsx
import { toast } from "sonner";

// Success notifications
toast.success("Song uploaded successfully");

// Error notifications
toast.error("Failed to upload file");

// Info notifications
toast.info("This playlist is empty");
```

### Examples:

- **File Upload** (`src/routes/upload.tsx:525-542`): Loading states with progress
- **Form Submissions** (`src/components/CreatePlaylistDialog.tsx:182-190`): Disabled state with loading text
- **Authentication** (`src/routes/sign-in.tsx:308-317`): Loading spinner with text change

## Deletion Dialogs

### Pattern: Confirmation Dialog with Descriptive Warning

**Key Principles:**

- Always use `Dialog` component for delete confirmations
- Include item name in confirmation message
- Warn about irreversible nature of action
- Show loading state on delete button
- Use `variant="destructive"` for delete buttons

### Deletion Dialog Implementation:

```tsx
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);

const deleteMutation = useDeleteItem();

const handleDelete = () => {
  if (selectedItem) {
    deleteMutation.mutate(selectedItem.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedItem(null);
      },
    });
  }
};

<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete {itemType}</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete "{selectedItem?.name}"? This action
        cannot be undone and will permanently remove the {itemType} and all its
        data.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setDeleteDialogOpen(false)}
        disabled={deleteMutation.isPending}
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={deleteMutation.isPending}
      >
        {deleteMutation.isPending ? "Deleting..." : "Delete"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

### Examples:

- **Playlist Deletion** (`src/routes/playlists.tsx:445-473`): Full dialog implementation
- **Song Deletion** (`src/routes/my-songs.tsx:40-51`): Simple confirm() for basic cases
- **Inline Confirmations**: Use `window.confirm()` only for simple single-item deletions

## Action Button Placement

### Pattern: Right-Aligned Actions in Headers

**Key Principles:**

- Primary actions (Create/Add) go in the top-right of page headers
- Secondary actions (Edit/Delete) appear on hover in item cards
- Action buttons use consistent icons from `lucide-react`
- Group related actions together with proper spacing

### Page Header Pattern:

```tsx
<div className="flex items-center justify-between">
  <div>
    <PageTitle title="Page Title" description="Description" />
  </div>
  <Button asChild>
    <Link to="/create" className="flex items-center gap-2">
      <Plus className="h-4 w-4" />
      Create New
    </Link>
  </Button>
</div>
```

### Card Actions Pattern:

```tsx
<div className="group relative">
  {/* Card content */}

  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <div className="flex items-center gap-1">
      <Button size="sm" variant="ghost">
        <Edit className="h-3 w-3" />
      </Button>
      <Button size="sm" variant="ghost">
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  </div>
</div>
```

### Examples:

- **My Songs Page** (`src/routes/my-songs.tsx:100-111`): Create button in header
- **Playlists Page** (`src/routes/playlists.tsx:148-155`): Add button in sidebar header
- **Song Cards**: Hover actions with edit/delete options
- **Settings Page** (`src/routes/settings.tsx:168-178`): Action buttons next to form fields

## Button Tooltips & Hover States

### Pattern: Contextual Tooltips for Disabled or Complex Actions

**Key Principles:**

- Use tooltips to explain why buttons are disabled
- Provide helpful context for icon-only buttons
- Use `title` attribute for simple tooltips
- Use custom `Tooltip` component for complex explanations

### Tooltip Implementation:

```tsx
import { Tooltip } from "~/components/ui/tooltip";

// For disabled buttons with explanation
<Tooltip
  content="Cannot go to next song - you're at the last song and loop is disabled"
  disabled={canPerformAction}
>
  <Button
    disabled={!canPerformAction}
    onClick={handleAction}
  >
    <Icon className="h-4 w-4" />
  </Button>
</Tooltip>

// For simple descriptions
<Button title="Hide player">
  <X className="h-4 w-4" />
</Button>
```

### Hover State Pattern:

```tsx
// Opacity-based hover for secondary actions
<Button className="opacity-0 group-hover:opacity-100 transition-opacity">
  <Icon className="h-4 w-4" />
</Button>

// Color change hover for interactive elements
<button className="hover:bg-muted/50 transition-colors">
  Content
</button>
```

### Examples:

- **Music Player** (`src/components/MusicPlayer.tsx:291-303`): Tooltips explaining disabled states
- **Playlist Sheet** (`src/components/PlaylistSheet.tsx:370-380`): Hover-revealed actions
- **Close Buttons**: Simple title attributes for accessibility

## Breadcrumb Navigation

### Pattern: Contextual Navigation with Icons

**Key Principles:**

- All pages should include breadcrumbs (except root pages)
- Use `AppBreadcrumb` component for consistency
- Include relevant icons from `lucide-react`
- Show user's navigation path dynamically
- Last item is not clickable (current page)

### Breadcrumb Implementation:

```tsx
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { Home, Music } from "lucide-react";

<AppBreadcrumb
  items={[
    { label: "Home", href: "/", icon: Home },
    { label: "Browse", href: "/browse", icon: Music },
    { label: "Current Page" }, // No href = current page
  ]}
/>;
```

### Smart Breadcrumbs:

Use `useSongBreadcrumbs` hook for dynamic navigation:

```tsx
const breadcrumbItems = useSongBreadcrumbs(songTitle, "edit");

<AppBreadcrumb items={breadcrumbItems} />;
```

### Examples:

- **Upload Page** (`src/routes/upload.tsx:225-230`): Simple parent-child navigation
- **Settings Page** (`src/routes/settings.tsx:292-297`): Home → Settings
- **Song Pages** (`src/hooks/useSongBreadcrumbs.ts`): Dynamic breadcrumbs based on entry point
- **Browse Page** (`src/routes/browse.tsx:34-39`): Multi-level navigation

## General Principles

### 1. Consistency

- Use the same patterns across similar functionality
- Maintain consistent spacing, colors, and typography
- Reuse existing components before creating new ones

### 2. Accessibility

- Always provide meaningful button labels and tooltips
- Use proper ARIA labels where needed
- Ensure keyboard navigation works properly
- Maintain sufficient color contrast

### 3. Feedback

- Provide immediate feedback for user actions
- Show loading states for async operations
- Use appropriate toast notifications
- Display helpful error messages

### 4. Progressive Enhancement

- Start with basic functionality
- Add advanced features that enhance the experience
- Gracefully handle loading and error states
- Provide fallbacks for failed operations

### 5. Mobile Responsiveness

- Test all patterns on mobile devices
- Use appropriate button sizes for touch
- Stack elements appropriately on small screens
- Maintain usability across all viewport sizes

---

## Component Reference

### Key Components to Use:

- `Button` - All interactive elements
- `Dialog` - Modal confirmations and forms
- `AppBreadcrumb` - Page navigation
- `PageTitle` - Consistent page headers
- `FormField` - Form inputs with validation
- `toast` from `sonner` - User notifications
- `Tooltip` - Contextual help

### Icon Usage:

Import icons from `lucide-react` and use consistently:

- `Plus` - Create/Add actions
- `Edit`/`Pencil` - Edit actions
- `Trash2` - Delete actions
- `Play` - Play/View actions
- `Home` - Home navigation
- `Music` - Music-related pages
- `X` - Close/Cancel actions

Follow these patterns to maintain consistency and provide an excellent user experience across the application.
