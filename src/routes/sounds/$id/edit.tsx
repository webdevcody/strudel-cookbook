import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Code, Loader2, Save, ArrowLeft, Home } from "lucide-react";
import { z } from "zod";
import { Page } from "~/components/Page";
import { PageTitle } from "~/components/PageTitle";
import { Button } from "~/components/ui/button";
import { SoundForm, SoundFormData } from "~/components/SoundForm";
import { getSoundByIdQuery } from "~/queries/sounds";
import { getTagsBySoundIdQuery } from "~/queries/tags";
import { useUpdateSound } from "~/hooks/useSounds";
import { authClient } from "~/lib/auth-client";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";

export const Route = createFileRoute("/sounds/$id/edit")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  loader: ({ context: { queryClient }, params: { id } }) => {
    return queryClient.ensureQueryData(getSoundByIdQuery(id));
  },
  component: EditSound,
});


function EditSound() {
  const { id } = Route.useParams();
  const { data: sound, isLoading, error } = useQuery(getSoundByIdQuery(id));
  const { data: soundTags, isLoading: isTagsLoading } = useQuery(getTagsBySoundIdQuery(id));
  const updateSoundMutation = useUpdateSound();

  const { data: session } = authClient.useSession();

  const onSubmit = async (data: SoundFormData) => {
    if (!sound) return;

    try {
      await updateSoundMutation.mutateAsync({
        id: sound.id,
        ...data,
      });
      // Navigation is handled in the hook
    } catch (error) {
      // Error handling is done in the hook
    }
  };


  if (isLoading || isTagsLoading) {
    return (
      <Page>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Page>
    );
  }

  if (error || !sound) {
    return (
      <Page>
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            Sound Not Found
          </h1>
          <p className="text-muted-foreground">
            The sound you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/my-sounds">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Sounds
            </Link>
          </Button>
        </div>
      </Page>
    );
  }

  // Check if current user can edit this sound
  const canEdit = session?.user?.id === sound.userId;

  if (!canEdit) {
    return (
      <Page>
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to edit this sound.
          </p>
          <Button asChild>
            <Link to="/sounds/$id" params={{ id: sound.id }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sound
            </Link>
          </Button>
        </div>
      </Page>
    );
  }

  const breadcrumbItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "My Sounds", href: "/my-sounds", icon: Code },
    { label: sound.title },
    { label: "Edit" },
  ];

  const isSubmitting = updateSoundMutation.isPending;

  // Prepare default values for the form
  const defaultValues: SoundFormData = {
    title: sound?.title || "",
    strudelCode: sound?.strudelCode || "",
    tags: soundTags?.map(tag => tag.name) || [],
  };

  return (
    <Page>
      <div className="space-y-8">
        <AppBreadcrumb items={breadcrumbItems} />

        <PageTitle
          title="Edit Sound"
          description="Update your Strudel composition"
        />

        <div className="max-w-2xl">
          <SoundForm
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            defaultValues={defaultValues}
            submitButtonText="Save Changes"
            showCancelButton={true}
            onCancel={() => window.history.back()}
            cancelButtonText="Cancel"
          />
        </div>
      </div>
    </Page>
  );
}
