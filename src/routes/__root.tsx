import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { CRMProvider } from "@/lib/crm-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An error occurred. You can try refreshing or go back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { title: "Occo Flow — All-in-One Business CRM & Sales Operating System | Heyocco" },
      {
        name: "description",
        content:
          "Occo Flow by Heyocco is a fast, intuitive universal CRM platform for growing businesses. Manage leads, track deals, delegate team tasks, automate WhatsApp & UPI payment reminders, and accelerate sales with Occo AI copilot.",
      },
      {
        name: "keywords",
        content:
          "Occo Flow, flow.heyocco.com, Heyocco, Business CRM, Sales Operating System, Lead Management, Deals Pipeline, WhatsApp Payment Reminders, UPI Payment CRM, Team Delegation, Occo AI Assistant, Small Business CRM, India CRM, SME CRM software, Best CRM software 2026, AI CRM copilot",
      },
      { name: "author", content: "Heyocco" },
      { name: "publisher", content: "https://flow.heyocco.com" },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { name: "theme-color", content: "#2563eb" },
      { name: "application-name", content: "Occo Flow" },
      { name: "apple-mobile-web-app-title", content: "Occo Flow" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "rating", content: "General" },
      { name: "distribution", content: "Global" },
      { name: "revisit-after", content: "2 days" },
      { name: "category", content: "Business Software, CRM, Sales Automation, AI Assistant" },
      { name: "coverage", content: "Worldwide" },
      // GEO & Local Signals
      { name: "geo.region", content: "IN" },
      { name: "geo.placename", content: "Bengaluru, India" },
      { name: "geo.position", content: "12.9716;77.5946" },
      { name: "ICBM", content: "12.9716, 77.5946" },
      // Dublin Core
      { name: "DC.title", content: "Occo Flow — Business CRM & Sales Operating System" },
      { name: "DC.creator", content: "Heyocco" },
      {
        name: "DC.description",
        content:
          "Occo Flow is an all-in-one CRM and sales operating system built by Heyocco with an integrated Occo AI robot assistant, automated WhatsApp and UPI payment collection, and visual Kanban deals.",
      },
      { name: "DC.publisher", content: "Heyocco" },
      { name: "DC.language", content: "en" },
      // OpenGraph
      { property: "og:site_name", content: "Occo Flow by Heyocco" },
      { property: "og:title", content: "Occo Flow — Modern Business CRM & Sales Operating System" },
      {
        property: "og:description",
        content:
          "Streamline sales, manage leads, automate payment reminders with UPI QR codes, and collaborate with your team using Occo AI copilot.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://flow.heyocco.com" },
      { property: "og:image", content: "https://flow.heyocco.com/logo.png" },
      { property: "og:image:secure_url", content: "https://flow.heyocco.com/logo.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "512" },
      { property: "og:image:height", content: "512" },
      { property: "og:image:alt", content: "Occo Flow CRM Logo by Heyocco" },
      { property: "og:locale", content: "en_US" },
      // Twitter Cards
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@heyocco" },
      { name: "twitter:creator", content: "@heyocco" },
      {
        name: "twitter:title",
        content: "Occo Flow — Modern Business CRM & Sales Operating System",
      },
      {
        name: "twitter:description",
        content:
          "Streamline sales, manage leads, automate payment reminders, and collaborate with Occo AI copilot.",
      },
      { name: "twitter:image", content: "https://flow.heyocco.com/logo.png" },
      { name: "twitter:image:alt", content: "Occo Flow Business CRM" },
    ],
    links: [
      { rel: "canonical", href: "https://flow.heyocco.com" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "shortcut icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/logo.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://flow.heyocco.com/#organization",
              name: "Heyocco",
              alternateName: "Heyocco Technologies",
              url: "https://flow.heyocco.com",
              logo: {
                "@type": "ImageObject",
                url: "https://flow.heyocco.com/logo.png",
                width: "512",
                height: "512",
              },
              sameAs: ["https://github.com/madyydam/occoflow", "https://flow.heyocco.com"],
              contactPoint: {
                "@type": "ContactPoint",
                email: "hello@heyocco.com",
                contactType: "Customer Support",
                availableLanguage: ["English", "Hindi"],
              },
              knowsAbout: [
                "Customer Relationship Management",
                "Sales Pipeline Automation",
                "WhatsApp Business Reminders",
                "UPI Payment Automation",
                "Lead Tracking",
                "AI CRM Copilot",
                "Team Delegation",
              ],
            },
            {
              "@type": "WebSite",
              "@id": "https://flow.heyocco.com/#website",
              url: "https://flow.heyocco.com",
              name: "Occo Flow",
              description: "Modern Business CRM & Sales Operating System by Heyocco",
              publisher: {
                "@id": "https://flow.heyocco.com/#organization",
              },
              potentialAction: {
                "@type": "SearchAction",
                target: "https://flow.heyocco.com/landing?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
            {
              "@type": "BreadcrumbList",
              "@id": "https://flow.heyocco.com/#breadcrumbs",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://flow.heyocco.com",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Features",
                  item: "https://flow.heyocco.com/#features",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "Pricing",
                  item: "https://flow.heyocco.com/#pricing",
                },
                {
                  "@type": "ListItem",
                  position: 4,
                  name: "Sign Up",
                  item: "https://flow.heyocco.com/auth/signup",
                },
              ],
            },
            {
              "@type": "SoftwareApplication",
              "@id": "https://flow.heyocco.com/#software",
              name: "Occo Flow",
              alternateName: ["OccoFlow", "Occo Flow CRM", "Heyocco Occo Flow"],
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web, iOS, Android (PWA), macOS, Windows",
              url: "https://flow.heyocco.com",
              softwareVersion: "2.4.0",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                reviewCount: "142",
                bestRating: "5",
                worstRating: "1",
              },
              offers: [
                {
                  "@type": "Offer",
                  name: "Occo Flow Monthly",
                  price: "999",
                  priceCurrency: "INR",
                  priceValidUntil: "2028-12-31",
                  availability: "https://schema.org/InStock",
                  url: "https://flow.heyocco.com/subscription",
                },
                {
                  "@type": "Offer",
                  name: "Occo Flow Yearly",
                  price: "9999",
                  priceCurrency: "INR",
                  priceValidUntil: "2028-12-31",
                  availability: "https://schema.org/InStock",
                  url: "https://flow.heyocco.com/subscription",
                },
                {
                  "@type": "Offer",
                  name: "Occo Flow Lifetime Access",
                  price: "14999",
                  priceCurrency: "INR",
                  priceValidUntil: "2028-12-31",
                  availability: "https://schema.org/InStock",
                  url: "https://flow.heyocco.com/subscription",
                },
              ],
              featureList: [
                "Lead Management & Bulk Excel Import/Export",
                "Occo AI Robot Copilot Assistant",
                "Visual Kanban Sales Deals Pipeline",
                "Payment Reminders & Instant UPI QR Codes",
                "Team Task Delegation & Workload Tracking",
                "Real-time Analytics & Business Metrics",
              ],
              creator: {
                "@id": "https://flow.heyocco.com/#organization",
              },
            },
            {
              "@type": "FAQPage",
              "@id": "https://flow.heyocco.com/#faq",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is Occo Flow?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Occo Flow is an all-in-one business CRM and sales operating system created by Heyocco. It helps businesses capture leads, manage sales pipelines, assign team tasks, automate WhatsApp payment reminders with UPI QR codes, and gain real-time visibility into revenue.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is Occo in Occo Flow?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Occo is the built-in AI robot assistant copilot in Occo Flow. Occo can automatically import leads, create deals, schedule follow-ups, summarize daily focus priorities, and answer natural language business queries.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Does Occo Flow offer a free trial?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, Occo Flow offers a full-featured 3-day free trial with zero credit card required upon workspace creation.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How does Occo Flow handle WhatsApp and UPI payments?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Occo Flow allows businesses to configure their UPI ID and automatically generates dynamic UPI QR codes and prefilled WhatsApp reminder messages. You can collect payments directly into your bank account with zero platform commission.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can I import leads from Excel or CSV files?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Occo Flow includes bulk CSV and Excel lead import and export with automatic column mapping, duplicate detection, and instant team member assignment.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Who develops and maintains Occo Flow?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Occo Flow is developed and operated by Heyocco (https://flow.heyocco.com).",
                  },
                },
              ],
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CRMProvider>
          <Outlet />
        </CRMProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
