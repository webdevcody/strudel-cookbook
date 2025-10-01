import { createFileRoute } from "@tanstack/react-router";
import { AudioWaveform } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <AudioWaveform className="h-8 w-8" />
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
      </div>

      <p className="text-muted-foreground mb-8">
        Last Updated: {new Date().toLocaleDateString()}
      </p>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            StrudelCookbook ("we," "our," or "us") is committed to protecting
            your privacy. This Privacy Policy explains how we collect, use, and
            safeguard your information when you use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Information We Collect
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We collect only the information necessary to provide our services:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>Email address:</strong> Collected when you create an
              account or sign in with social authentication providers
            </li>
            <li>
              <strong>Name:</strong> Collected when you sign in with Google or
              other social sign-on providers
            </li>
            <li>
              <strong>Profile information:</strong> Any information you choose
              to add to your profile
            </li>
            <li>
              <strong>User-generated content:</strong> Sounds, samples, and
              other content you upload to our platform
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            How We Use Your Information
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We use your information solely to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Provide and maintain our services</li>
            <li>Authenticate your account and manage your sessions</li>
            <li>Display your profile and uploaded content</li>
            <li>Communicate with you about your account or our services</li>
            <li>Improve and optimize our platform</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Sharing</h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong>We do not sell your data.</strong> We do not share, sell,
            rent, or trade your personal information with third parties for
            their commercial purposes. Your data is yours, and we treat it with
            the utmost respect and confidentiality.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement industry-standard security measures to protect your
            personal information. However, no method of transmission over the
            internet or electronic storage is 100% secure, and we cannot
            guarantee absolute security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use cookies and similar tracking technologies to maintain your
            session and improve your experience on our platform. You can control
            cookie settings through your browser preferences.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Export your data in a portable format</li>
            <li>Opt-out of certain data collection practices</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your personal information only as long as necessary to
            provide our services and comply with legal obligations. When you
            delete your account, we will remove your personal information from
            our systems within a reasonable timeframe.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our service is not intended for children under the age of 13. We do
            not knowingly collect personal information from children under 13.
            If you are a parent or guardian and believe we have collected
            information from your child, please contact us immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Changes to This Privacy Policy
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to update or modify this Privacy Policy at any
            time without prior notice. Changes will be effective immediately
            upon posting to this page. Your continued use of our services after
            any changes constitutes acceptance of the updated Privacy Policy. We
            encourage you to review this policy periodically.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you use social sign-on providers (such as Google), those
            services may collect information according to their own privacy
            policies. We recommend reviewing the privacy policies of any
            third-party services you use in connection with our platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy or our data
            practices, please contact us through our support channels.
          </p>
        </section>
      </div>
    </div>
  );
}
