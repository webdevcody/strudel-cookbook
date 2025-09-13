import { Code, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { TagInput } from "~/components/ui/tag-input";
import { useTagSuggestions } from "~/hooks/useTags";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

export const soundFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  strudelCode: z
    .string()
    .min(1, "Strudel code is required")
    .max(5000, "Code must be less than 5000 characters"),
  tags: z.array(z.string()).optional().default([]),
});

export type SoundFormData = z.infer<typeof soundFormSchema>;

interface SoundFormProps {
  onSubmit: (data: SoundFormData) => Promise<void> | void;
  isSubmitting?: boolean;
  defaultValues?: Partial<SoundFormData>;
  submitButtonText?: string;
  showCancelButton?: boolean;
  onCancel?: () => void;
  cancelButtonText?: string;
}

export function SoundForm({
  onSubmit,
  isSubmitting = false,
  defaultValues = { title: "", strudelCode: "", tags: [] },
  submitButtonText = "Create Sound",
  showCancelButton = false,
  onCancel,
  cancelButtonText = "Cancel",
}: SoundFormProps) {
  const { loadSuggestions } = useTagSuggestions();
  
  const form = useForm<SoundFormData>({
    resolver: zodResolver(soundFormSchema),
    defaultValues,
  });

  const handleSubmit = async (data: SoundFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handling is passed down from parent components
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter a title for your sound..."
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Give your Strudel composition a descriptive title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="strudelCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strudel Code</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`// Enter your Strudel code here...
// Example:
"<c3 eb3 g3>".note()
  .s("piano")
  .lpf(800)
  .slow(2)`}
                  className="min-h-[300px] font-mono text-sm"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Write your Strudel composition code. You can use any valid Strudel syntax.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (Optional)</FormLabel>
              <FormControl>
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  onLoadSuggestions={loadSuggestions}
                  placeholder="Add tags to categorize your sound..."
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Add tags like "drums", "melody", "ambient" to help others discover your sound
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Code className="h-4 w-4" />
                {submitButtonText}
              </>
            )}
          </Button>

          {showCancelButton && (
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              {cancelButtonText}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}