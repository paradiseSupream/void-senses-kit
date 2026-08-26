import { useEffect } from "react";
import { Copy, Download, ImageDown, RotateCcw, Share2, Smartphone, Swords } from "lucide-react";
import { toast } from "sonner";

import { useActionGate } from "@/components/monetization/ActionGate";
import {
  accentFor,
  downloadCanvas,
  drawBrandedCard,
  drawStoryCard,
  shareCanvasImage,
  type CardMetric,
} from "@/lib/canvas-card";
import { compareUrl } from "@/lib/compare-link";
import { ShareRow } from "@/components/tools/ShareRow";
import { track } from "@/lib/monetization";
import { trackShare, withUtm } from "@/lib/share-link";

export type SharePayload = {
  eyebrow: string;
  title: string;
  headline: string;
  lines: string[];
  footer?: string;
  fileName: string;
  /** Plain-text version used for copy + native share. */
  text: string;
  /** Display name of the tool, used for the friend-compare link. */
  toolName?: string;
  /** Route back to the tool, e.g. "/tools/iq". */
  toolPath?: string;
  /** Personalisation seed — archetype / verdict name drives the card accent. */
  accentSeed?: string;
  /** Rarity, band or verdict pill on the card. */
  badge?: string;
  /** Participant name or pair label. */
  subject?: string;
  /** Up to 4 axis bars (0–100) rendered on the card. */
  metrics?: CardMetric[];
};



/**
 * Standard result footer: HD card download (behind the export gate for free
 * users), copy-to-clipboard, native share and retake.
 */
export function ResultActions({
  payload,
  toolSlug,
  onRetake,
}: {
  payload: SharePayload;
  toolSlug: string;
  onRetake?: () => void;
}) {
  const runGated = useActionGate();

  // Record the finished tool so the home page "3-test run" shows progress.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("sov.completed");
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(toolSlug)) {
        window.localStorage.setItem("sov.completed", JSON.stringify([...list, toolSlug]));
      }
    } catch {
      /* storage unavailable */
    }
  }, [toolSlug]);

  const shareUrl =
    typeof window === "undefined" ? "https://sensesofvoid.app" : window.location.href;

  /** Personalised card options — accent, badge, subject and axis bars. */
  const cardOptions = () => ({
    eyebrow: payload.eyebrow,
    title: payload.title,
    headline: payload.headline,
    lines: payload.lines,
    accent: accentFor(payload.accentSeed ?? payload.headline || payload.title),
    ...(payload.footer ? { footer: payload.footer } : {}),
    ...(payload.badge ? { badge: payload.badge } : {}),
    ...(payload.subject ? { subject: payload.subject } : {}),
    ...(payload.metrics?.length ? { metrics: payload.metrics } : {}),
  });

  const download = async () => {
    await runGated({ toolSlug });
    downloadCanvas(drawBrandedCard(cardOptions()), payload.fileName);
    toast.success("HD card downloaded.");
  };

  const downloadStory = async () => {
    await runGated({ toolSlug });
    downloadCanvas(
      drawStoryCard(cardOptions()),
      payload.fileName.replace(/\.png$/, "") + "-story.png",
    );
    toast.success("Vertical story card downloaded — 1080×1920, ready for TikTok.");
  };

  /**
   * Viral loop primitive: shares the rendered card *image* through the native
   * sheet so the result is visible in the feed. Ungated on purpose — every
   * share is free acquisition. Falls back to a download when the browser has
   * no file-share support.
   */
  const shareImage = async () => {
    const canvas = drawBrandedCard(cardOptions());
    const text = `${payload.text}\n${challengeLink("native_image", "share_image")}`;
    track({ event_type: "conversion", slot: "share_image", tool_slug: toolSlug });
    trackShare({ source: "native_image", campaign: toolSlug, content: "share_image", toolSlug });
    const shared = await shareCanvasImage(canvas, {
      filename: payload.fileName,
      title: payload.title,
      text,
    });
    if (shared) return;
    downloadCanvas(canvas, payload.fileName);
    toast.success("Card saved — post it and tag the link.");
  };

  /** Compare deeplink, always UTM-tagged so inbound sessions are attributable. */
  const challengeLink = (source: string, content: string) =>
    withUtm(
      compareUrl({
        t: toolSlug,
        n: payload.toolName ?? payload.title,
        h: payload.headline,
        l: payload.lines,
        p: payload.toolPath ?? `/tools/${toolSlug}`,
      }),
      { source, campaign: toolSlug, content },
    );

  const challenge = async () => {
    const url = challengeLink("native_challenge", "challenge_button");
    const text = `I scored ${payload.headline} on ${payload.toolName ?? payload.title}. Beat me:`;
    trackShare({
      source: "native_challenge",
      campaign: toolSlug,
      content: "challenge_button",
      toolSlug,
    });
    if (navigator.share) {
      try {
        await navigator.share({ title: payload.title, text, url });
        return;
      } catch {
        /* user dismissed → fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Challenge link copied — send it to a friend.");
    } catch {
      toast.error("Clipboard blocked by your browser.");
    }
  };


  const copy = async () => {
    const url = withUtm(shareUrl, {
      source: "copy_link",
      campaign: toolSlug,
      content: "result_copy",
    });
    try {
      await navigator.clipboard.writeText(`${payload.text}\n${url}`);
      trackShare({ source: "copy_link", campaign: toolSlug, content: "result_copy", toolSlug });
      toast.success("Copied — paste it anywhere.");
    } catch {
      toast.error("Clipboard blocked by your browser.");
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return copy();
    const url = withUtm(shareUrl, {
      source: "native_link",
      campaign: toolSlug,
      content: "result_share",
    });
    trackShare({ source: "native_link", campaign: toolSlug, content: "result_share", toolSlug });
    try {
      await navigator.share({ title: payload.title, text: payload.text, url });
    } catch {
      /* user dismissed */
    }
  };


  return (
    <>
    <div className="mt-7 flex flex-wrap gap-2.5">
      <button
        type="button"
        onClick={download}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:flex-none"
      >
        <Download className="size-4" aria-hidden="true" /> Download HD card
      </button>
      <button
        type="button"
        onClick={shareImage}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 sm:flex-none"
      >
        <ImageDown className="size-4" aria-hidden="true" /> Share image
      </button>
      <button
        type="button"
        onClick={challenge}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 sm:flex-none"
      >
        <Swords className="size-4" aria-hidden="true" /> Challenge a friend
      </button>
      <button
        type="button"
        onClick={downloadStory}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-hairline px-4 text-sm font-medium transition-colors hover:bg-surface-2"
      >
        <Smartphone className="size-4" aria-hidden="true" /> Story card
      </button>
      <button
        type="button"
        onClick={nativeShare}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-hairline px-4 text-sm font-medium transition-colors hover:bg-surface-2"
      >

        <Share2 className="size-4" aria-hidden="true" /> Share
      </button>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-hairline px-4 text-sm font-medium transition-colors hover:bg-surface-2"
      >
        <Copy className="size-4" aria-hidden="true" /> Copy
      </button>
      {onRetake ? (
        <button
          type="button"
          onClick={onRetake}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-hairline px-4 text-sm font-medium transition-colors hover:bg-surface-2"
        >
          <RotateCcw className="size-4" aria-hidden="true" /> New set
        </button>
      ) : null}
    </div>
    <ShareRow
      className="mt-4 justify-center"
      toolSlug={toolSlug}
      url={challengeLink()}
      text={`I scored ${payload.headline} on ${payload.toolName ?? payload.title}. Beat me:`}
    />
    </>
  );
}
