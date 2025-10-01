import { createFileRoute } from "@tanstack/react-router";
import { AudioWaveform } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsOfService,
});

function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <AudioWaveform className="h-8 w-8" />
        <h1 className="text-4xl font-bold">Terms of Service</h1>
      </div>

      <p className="text-muted-foreground mb-8">
        Last Updated: {new Date().toLocaleDateString()}
      </p>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Acceptance of Terms
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using StrudelCookbook ("the Service"), you agree to
            be bound by these Terms of Service ("Terms"). If you do not agree to
            these Terms, you may not access or use the Service. We reserve the
            right to update, modify, or replace these Terms at any time without
            prior notice. Changes will be effective immediately upon posting.
            Your continued use of the Service after any changes constitutes
            acceptance of the updated Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Account Terms</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            When you create an account with us, you agree to the following:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              You must provide accurate, current, and complete information
              during registration
            </li>
            <li>
              You are responsible for maintaining the security of your account
              and password
            </li>
            <li>
              You are responsible for all activities that occur under your
              account
            </li>
            <li>
              You must be at least 13 years old to use this Service
            </li>
            <li>
              You may not use the Service for any illegal or unauthorized
              purpose
            </li>
            <li>
              You must not create multiple accounts to abuse or circumvent our
              systems
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Account Termination and Suspension
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We reserve the right to suspend or terminate your account and access
            to the Service at our sole discretion, without notice or liability,
            for any reason, including but not limited to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Violation of these Terms of Service</li>
            <li>Abusive behavior toward other users or our staff</li>
            <li>Uploading illegal, harmful, or inappropriate content</li>
            <li>Attempting to exploit, hack, or abuse our systems</li>
            <li>Spamming or other disruptive activities</li>
            <li>Fraudulent activity or misrepresentation</li>
            <li>Violation of intellectual property rights</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Upon termination, your right to use the Service will immediately
            cease. We are not obligated to provide refunds for any paid services
            in the event of account termination for Terms violations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">User Content</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            By uploading content to the Service, you:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              Retain ownership of your content but grant us a worldwide,
              non-exclusive, royalty-free license to use, display, and
              distribute your content on the platform
            </li>
            <li>
              Represent and warrant that you have all necessary rights to the
              content you upload
            </li>
            <li>
              Agree not to upload content that infringes on intellectual
              property rights, contains malware, or violates any laws
            </li>
            <li>
              Acknowledge that we may remove any content that violates these
              Terms or is otherwise objectionable
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prohibited Activities</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            You agree not to engage in any of the following activities:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              Violating any local, state, national, or international law or
              regulation
            </li>
            <li>
              Infringing on the intellectual property rights of others
            </li>
            <li>
              Transmitting any harmful code, viruses, or malicious software
            </li>
            <li>
              Attempting to gain unauthorized access to our systems or other
              users' accounts
            </li>
            <li>
              Engaging in any form of automated data collection (scraping,
              crawling, etc.) without permission
            </li>
            <li>Impersonating another person or entity</li>
            <li>
              Harassing, threatening, or intimidating other users
            </li>
            <li>
              Using the Service to distribute spam or unsolicited communications
            </li>
            <li>
              Interfering with or disrupting the Service or servers
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Intellectual Property
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service and its original content, features, and functionality
            are owned by StrudelCookbook and are protected by international
            copyright, trademark, patent, trade secret, and other intellectual
            property laws. You may not copy, modify, distribute, sell, or lease
            any part of our Service without our express written permission.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Disclaimer of Warranties
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service is provided "AS IS" and "AS AVAILABLE" without
            warranties of any kind, either express or implied, including but not
            limited to warranties of merchantability, fitness for a particular
            purpose, or non-infringement. We do not warrant that the Service
            will be uninterrupted, secure, or error-free, or that any defects
            will be corrected.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Limitation of Liability
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, StrudelCookbook shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages, including but not limited to loss of profits,
            data, use, goodwill, or other intangible losses, resulting from your
            access to or use of or inability to access or use the Service. Our
            total liability shall not exceed the amount you paid us in the past
            twelve months, or $100, whichever is greater.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
          <p className="text-muted-foreground leading-relaxed">
            You agree to defend, indemnify, and hold harmless StrudelCookbook
            and its officers, directors, employees, and agents from and against
            any claims, liabilities, damages, losses, and expenses, including
            reasonable attorney's fees, arising out of or in any way connected
            with your access to or use of the Service, your violation of these
            Terms, or your violation of any rights of another party.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to modify, suspend, or discontinue the Service
            (or any part thereof) at any time, with or without notice, for any
            reason. We shall not be liable to you or any third party for any
            modification, suspension, or discontinuance of the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            These Terms shall be governed by and construed in accordance with
            the laws of the jurisdiction in which we operate, without regard to
            its conflict of law provisions. Any disputes arising from these
            Terms or your use of the Service shall be subject to the exclusive
            jurisdiction of the courts in that jurisdiction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Severability</h2>
          <p className="text-muted-foreground leading-relaxed">
            If any provision of these Terms is found to be invalid or
            unenforceable by a court of competent jurisdiction, the remaining
            provisions shall remain in full force and effect. The invalid or
            unenforceable provision shall be replaced with a valid provision
            that most closely matches the intent of the original provision.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Entire Agreement</h2>
          <p className="text-muted-foreground leading-relaxed">
            These Terms, together with our Privacy Policy, constitute the entire
            agreement between you and StrudelCookbook regarding your use of the
            Service and supersede all prior agreements and understandings,
            whether written or oral.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about these Terms of Service, please
            contact us through our support channels.
          </p>
        </section>
      </div>
    </div>
  );
}
