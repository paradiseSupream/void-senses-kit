import { Copy, Download, RotateCcw, Share2 } from "lucide-react";
import { toast } from "sonner";

import { useActionGate } from "@/components/monetization/ActionGate";
import { downloadCanvas, drawBrandedCard } from "@/lib/canvas-card";

export type SharePayload = {
  eyebrow: string;
  title: string;
  headline: string;
  lines: string[];
  footer?: string;
  fileName: string;
  /** Plain-text version used for copy + native share. */
  text: string;
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
  );
}
