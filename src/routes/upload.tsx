import { createFileRoute } from "@tanstack/react-router";
import { Code } from "lucide-react";
import { useCreateSound } from "~/hooks/useSounds";
import { Page } from "~/components/Page";
import { PageTitle } from "~/components/PageTitle";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { SoundForm, SoundFormData } from "~/components/SoundForm";

export const Route = createFileRoute("/upload")({
  component: Upload,
});

function Upload() {
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
            { label: "Submit Sound" },
          ]}
        />

        <PageTitle
          title="Submit Sound"
          description="Share your Strudel compositions with the community"
        />

        <div className="max-w-2xl">
          <SoundForm
            onSubmit={handleSubmit}
            isSubmitting={createSoundMutation.isPending}
            submitButtonText="Submit Sound"
          />
        </div>
      </div>
    </Page>
  );
}
