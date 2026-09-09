import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { captureShareLanding } from "@/lib/share-link";
import { captureReferral } from "@/lib/referral";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { SocialBar } from "@/components/monetization/SocialBar";
import { StickyBottomAd } from "@/components/monetization/StickyBottomAd";
import { DesktopStickyAd } from "@/components/monetization/DesktopStickyAd";
import { VipModal } from "@/components/monetization/VipModal";
import { ExitIntentOffer } from "@/components/monetization/ExitIntentOffer";
import { AdErrorBoundary } from "@/components/monetization/AdErrorBoundary";
import { ActionGateProvider } from "@/components/monetization/ActionGate";
import { VipProvider } from "@/lib/vip";
import { SiteConfigProvider } from "@/lib/site-config";
import { BOOT_META_PIXEL_ID, metaBootSnippet } from "@/lib/pixel-boot";
import { getBootGeo } from "@/lib/geo-boot.functions";



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
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
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
  loader: async () => {
    try {
      return await getBootGeo();
    } catch {
      return { country: null, consentRequired: true };
    }
  },
  head: ({ loaderData }) => ({

    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Senses of Void — Free Tools for the Curious Mind" },
      {
        name: "description",
        content:
          "Fast, dark, free tools: trauma reflection, quick IQ, dark personality, vibe matching, AI roasts, prompt building, and a free asset vault.",
      },
      { name: "author", content: "Senses of Void" },
      { property: "og:title", content: "Senses of Void — Free Tools for the Curious Mind" },
      {
        property: "og:description",
        content:
          "Fast, private tools for self-reflection, cognition and creativity, plus a free Drive vault of design and developer assets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "monetag", content: "d7498800db613e1e682b5c72b66a050b" },
      {
        name: "google-site-verification",
        content: "Q3TYMcgVRb2lOjEP_MQyDRFzIqq7hBFhjxElwjdkqxU",
      },
    ],

    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Work+Sans:wght@400;500;600;700&family=Sora:wght@500;600;700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],

    // Static Meta base code so Meta's crawler detects the pixel. It starts in
    // `consent: revoke`, so nothing is sent until the app grants consent.
    scripts: BOOT_META_PIXEL_ID
      ? [{ children: metaBootSnippet(BOOT_META_PIXEL_ID, loaderData?.consentRequired !== false) }]
      : [],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
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
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  // Attribute inbound share deeplinks (utm_* + sid) once per session, plus the
  // referral code (?ref=) that powers the friend-challenge loop.
  useEffect(() => {
    captureShareLanding();
    captureReferral();
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <VipProvider>
        <SiteConfigProvider>
          <ActionGateProvider>
            <div className="flex min-h-screen flex-col pb-32 sm:pb-0">
              <Header />
              <main className="flex-1">
                {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                <Outlet />
              </main>
              <Footer />
            </div>
            <MobileTabBar />
            {!isAdmin ? (
              <AdErrorBoundary>
                <StickyBottomAd />
                <DesktopStickyAd />
                <SocialBar />
              </AdErrorBoundary>
            ) : null}
            <CookieBanner />
            <VipModal />
            {!isAdmin ? <ExitIntentOffer /> : null}
            <Toaster theme="dark" position="top-center" richColors />
          </ActionGateProvider>
        </SiteConfigProvider>
      </VipProvider>

    </QueryClientProvider>
  );
}

