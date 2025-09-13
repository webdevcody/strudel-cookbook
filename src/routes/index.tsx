import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { Hero } from "~/components/Hero";
import { PricingSection } from "~/components/PricingSection";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      <main className="flex-1">
        <Hero />
        <ClientOnly>
          <PricingSection />
        </ClientOnly>
      </main>
    </div>
  );
}
