import { createFileRoute, Link } from "@tanstack/react-router";
import { Code, ArrowLeft } from "lucide-react";
import { useCreateSound } from "~/hooks/useSounds";
import { Page } from "~/components/Page";
import { PageTitle } from "~/components/PageTitle";
import { Button } from "~/components/ui/button";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { SoundForm, SoundFormData } from "~/components/SoundForm";

export const Route = createFileRoute("/sounds/create")({
  component: CreateSound,
});

function CreateSound() {
  const createSoundMutation = useCreateSound();

  const handleSubmit = async (data: SoundFormData) => {
    await createSoundMutation.mutateAsync(data);
  };

  return (
    <Page>
      <div className="space-y-8">
        <AppBreadcrumb
          items={[
            { label: "My Sounds", href: "/my-sounds", icon: Code },
            { label: "Create Sound" }
          ]}
        />

        <div className="flex items-center justify-between">
          <PageTitle
            title="Create New Sound"
            description="Create a new Strudel composition with code"
          />
          <Button variant="outline" asChild>
            <Link to="/my-sounds" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to My Sounds
            </Link>
          </Button>
        </div>

        <div className="max-w-2xl">
          <SoundForm
            onSubmit={handleSubmit}
            isSubmitting={createSoundMutation.isPending}
            submitButtonText="Create Sound"
            showCancelButton={true}
            onCancel={() => window.history.back()}
            cancelButtonText="Cancel"
          />
        </div>
      </div>
    </Page>
  );
}