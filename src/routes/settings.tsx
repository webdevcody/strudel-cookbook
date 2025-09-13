import { createFileRoute } from "@tanstack/react-router";
import { Page } from "~/components/Page";
import { PageTitle } from "~/components/PageTitle";
import { SubscriptionStatus } from "~/components/SubscriptionStatus";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { PricingCard } from "~/components/PricingCard";
import { SUBSCRIPTION_PLANS } from "~/lib/plans";
import {
  useUserPlan,
  useCreateCheckoutSession,
  useCreatePortalSession,
  useCancelSubscription,
} from "~/hooks/useSubscription";
import { useUpdateUserProfile, useDeleteUserAccount } from "~/hooks/useProfile";
import { uploadImageWithPresignedUrl } from "~/utils/storage/helpers";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { authClient } from "~/lib/auth-client";
import { useUserAvatar } from "~/hooks/useUserAvatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Upload, User, Home, Trash2, AlertTriangle } from "lucide-react";
import { assertAuthenticatedFn } from "~/fn/guards";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  beforeLoad: async () => {
    await assertAuthenticatedFn();
  },
});

function AccountDeletionSettings() {
  const { data: session } = authClient.useSession();
  const [emailInput, setEmailInput] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const deleteAccountMutation = useDeleteUserAccount();

  const handleDeleteRequest = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput === session?.user?.email) {
      deleteAccountMutation.mutate({
        data: { email: emailInput },
      });
    }
  };

  const handleCancelDelete = () => {
    setIsDialogOpen(false);
    setEmailInput("");
  };

  return (
    <>
      <Card className="border-red-200 dark:border-red-800 bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">
              Delete Account
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Permanently delete your account and all associated data. This
              action cannot be undone. All your songs, playlists, and
              subscription data will be permanently removed.
            </p>
            <Button
              variant="destructive"
              onClick={handleDeleteRequest}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="text-left">
              This will permanently delete your account and all data associated
              with it.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                The following data will be permanently deleted:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                <li>All uploaded songs and audio files</li>
                <li>All created playlists</li>
                <li>All liked songs and hearts</li>
                <li>Your subscription and billing information</li>
                <li>Your profile and account settings</li>
              </ul>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <form onSubmit={handleConfirmDelete} className="space-y-4">
            <div>
              <Label
                htmlFor="confirmEmail"
                className="text-gray-700 dark:text-gray-300"
              >
                To confirm, type your email address:
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mb-2">
                {session?.user?.email}
              </p>
              <Input
                id="confirmEmail"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email to confirm"
                className="border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-400"
                disabled={deleteAccountMutation.isPending}
              />
            </div>

            <DialogFooter className="flex gap-3 sm:justify-start">
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  deleteAccountMutation.isPending ||
                  emailInput !== session?.user?.email
                }
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deleteAccountMutation.isPending
                  ? "Deleting..."
                  : "Delete My Account"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelDelete}
                disabled={deleteAccountMutation.isPending}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProfileSettings() {
  const { data: session } = authClient.useSession();
  const [displayName, setDisplayName] = useState(session?.user?.name || "");
  const [isUploading, setIsUploading] = useState(false);
  const { avatarUrl } = useUserAvatar();

  const updateProfileMutation = useUpdateUserProfile();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setIsUploading(true);

      try {
        // Generate image key
        const userId = session?.user?.id;
        if (!userId) {
          throw new Error("User not authenticated");
        }

        const fileExtension = file.name.split(".").pop() || "";
        const imageKey = `profile-images/${userId}/${Date.now()}.${fileExtension}`;

        // Upload using helper function
        await uploadImageWithPresignedUrl(imageKey, file);

        // Update user profile with new image key
        await updateProfileMutation.mutateAsync({
          data: { image: imageKey },
        });

        toast.success("Avatar uploaded successfully");
      } catch (error) {
        console.error("Avatar upload error:", error);
        toast.error("Failed to upload avatar");
      } finally {
        setIsUploading(false);
      }
    },
    [updateProfileMutation, session]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
  });

  const handleDisplayNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      updateProfileMutation.mutate({
        data: { name: displayName.trim() },
      });
    }
  };

  const currentAvatarUrl = avatarUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Settings Row */}
        <div className="flex items-start gap-6">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div
              {...getRootProps()}
              className={`relative cursor-pointer group w-20 h-20 ${
                isUploading ? "cursor-not-allowed" : ""
              }`}
            >
              <input {...getInputProps()} disabled={isUploading} />
              <Avatar className="h-20 w-20">
                <AvatarImage src={currentAvatarUrl || undefined} />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div
                className={`absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                  isUploading ? "opacity-100" : ""
                }`}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Upload className="h-5 w-5 text-white" />
                )}
              </div>
              {isDragActive && (
                <div className="absolute inset-0 border-2 border-dashed border-primary bg-primary/20 rounded-full flex items-center justify-center">
                  <Upload className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center">
              Click to upload
              <br />
              PNG, JPG, GIF up to 5MB
            </p>
          </div>

          {/* Display Name */}
          <div className="flex-1">
            <form onSubmit={handleDisplayNameSubmit} className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <div className="flex gap-2">
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  disabled={updateProfileMutation.isPending}
                />
                <Button
                  type="submit"
                  disabled={
                    updateProfileMutation.isPending ||
                    !displayName.trim() ||
                    displayName === session?.user?.name
                  }
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's current plan and subscription info
  const { data: userPlan, isLoading: planLoading } = useUserPlan();

  // Subscription mutation hooks
  const checkoutMutation = useCreateCheckoutSession();
  const portalMutation = useCreatePortalSession();
  const cancelMutation = useCancelSubscription();

  const handleUpgrade = (priceId: string) => {
    setIsLoading(true);
    checkoutMutation.mutate(
      { data: { priceId } },
      {
        onSettled: () => setIsLoading(false),
      }
    );
  };

  const handleManageBilling = () => {
    setIsLoading(true);
    portalMutation.mutate(
      { data: undefined },
      {
        onSettled: () => setIsLoading(false),
      }
    );
  };

  const handleCancelSubscription = () => {
    if (
      confirm(
        "Are you sure you want to cancel your subscription? You'll continue to have access until the end of your billing period."
      )
    ) {
      setIsLoading(true);
      cancelMutation.mutate(
        { data: undefined },
        {
          onSettled: () => setIsLoading(false),
        }
      );
    }
  };

  if (planLoading) {
    return (
      <Page>
        <PageTitle title="Settings" />
        <div className="space-y-6">
          {/* Subscription Status Skeleton */}
          <div className="bg-card rounded-lg border p-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 animate-pulse rounded w-1/3" />
              <div className="h-4 bg-gray-200 animate-pulse rounded w-2/3" />
              <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
            </div>
          </div>

          {/* Pricing Cards Skeleton */}
          <div>
            <div className="h-8 bg-gray-200 animate-pulse rounded w-1/4 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card rounded-lg border p-6">
                  <div className="space-y-4">
                    <div className="h-8 bg-gray-200 animate-pulse rounded w-2/3" />
                    <div className="h-12 bg-gray-200 animate-pulse rounded w-1/2" />
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div
                          key={j}
                          className="h-4 bg-gray-200 animate-pulse rounded"
                        />
                      ))}
                    </div>
                    <div className="h-10 bg-gray-200 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Page>
    );
  }

  const currentPlan = (userPlan?.data?.plan || "free") as
    | "free"
    | "basic"
    | "pro";
  const subscriptionStatus = userPlan?.data?.subscriptionStatus;
  const subscriptionExpiresAt = userPlan?.data?.subscriptionExpiresAt
    ? new Date(userPlan.data.subscriptionExpiresAt)
    : null;

  // Determine if sections should be shown
  const hasNoPlan = !currentPlan || currentPlan === "free";
  const isNotSubscribed = !subscriptionStatus;

  return (
    <Page>
      <div className="space-y-8">
        <AppBreadcrumb
          items={[
            { label: "Home", href: "/", icon: Home },
            { label: "Settings" },
          ]}
        />
        <PageTitle title="Settings" />
      </div>

      <div className="space-y-8 mt-8">
        {/* Profile Settings */}
        <section>
          <ProfileSettings />
        </section>

        {/* Current Subscription Status */}
        {!isNotSubscribed && (
          <section>
            <SubscriptionStatus
              plan={currentPlan}
              subscriptionStatus={subscriptionStatus as any}
              subscriptionExpiresAt={subscriptionExpiresAt}
              onManageBilling={handleManageBilling}
              onCancelSubscription={handleCancelSubscription}
              isLoading={isLoading}
            />
          </section>
        )}

        {/* Pricing Plans */}
        {hasNoPlan && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Choose Your Plan
              </h2>
              <p className="text-muted-foreground">
                Upgrade or change your subscription plan to unlock more
                features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PricingCard
                plan={SUBSCRIPTION_PLANS.FREE}
                currentPlan={currentPlan}
                isLoading={isLoading}
              />
              <PricingCard
                plan={SUBSCRIPTION_PLANS.BASIC}
                currentPlan={currentPlan}
                onUpgrade={handleUpgrade}
                isLoading={isLoading}
                isPopular={true}
              />
              <PricingCard
                plan={SUBSCRIPTION_PLANS.PRO}
                currentPlan={currentPlan}
                onUpgrade={handleUpgrade}
                isLoading={isLoading}
              />
            </div>
          </section>
        )}

        {/* Account Deletion */}
        <section>
          <AccountDeletionSettings />
        </section>
      </div>
    </Page>
  );
}
