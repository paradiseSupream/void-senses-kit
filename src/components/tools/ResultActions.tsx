import { useEffect } from "react";
import { Copy, Download, RotateCcw, Share2, Smartphone, Swords } from "lucide-react";
import { toast } from "sonner";

import { useActionGate } from "@/components/monetization/ActionGate";
import { downloadCanvas, drawBrandedCard, drawStoryCard } from "@/lib/canvas-card";
import { compareUrl } from "@/lib/compare-link";
import { ShareRow } from "@/components/tools/ShareRow";

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

  const download = async () => {
    await runGated({ toolSlug });
    const canvas = drawBrandedCard({
      eyebrow: payload.eyebrow,
      title: payload.title,
      headline: payload.headline,
      lines: payload.lines,
      ...(payload.footer ? { footer: payload.footer } : {}),
    });
    downloadCanvas(canvas, payload.fileName);
    toast.success("HD card downloaded.");
  };

  const downloadStory = async () => {
    await runGated({ toolSlug });
    const canvas = drawStoryCard({
      eyebrow: payload.eyebrow,
      title: payload.title,
      headline: payload.headline,
      lines: payload.lines,
      ...(payload.footer ? { footer: payload.footer } : {}),
    });
    downloadCanvas(canvas, payload.fileName.replace(/\.png$/, "") + "-story.png");
    toast.success("Vertical story card downloaded — 1080×1920, ready for TikTok.");
  };

  const challengeLink = () =>
    compareUrl({
      t: toolSlug,
      n: payload.toolName ?? payload.title,
      h: payload.headline,
      l: payload.lines,
      p: payload.toolPath ?? `/tools/${toolSlug}`,
    });

  const challenge = async () => {
    const url = challengeLink();
    const text = `I scored ${payload.headline} on ${payload.toolName ?? payload.title}. Beat me:`;
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
    try {
      await navigator.clipboard.writeText(`${payload.text}\n${shareUrl}`);
      toast.success("Copied — paste it anywhere.");
    } catch {
      toast.error("Clipboard blocked by your browser.");
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title: payload.title, text: payload.text, url: shareUrl });
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
