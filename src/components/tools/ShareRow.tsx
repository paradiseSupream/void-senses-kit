import { Facebook, Link2, MessageCircle, Send, Share2 } from "lucide-react";
import { toast } from "sonner";

import { track } from "@/lib/monetization";

/**
 * One-tap social share row. Every network opens a pre-filled composer with the
 * result text plus the challenge link — the cheapest viral loop on the site.
 */
export function ShareRow({
  url,
  text,
  toolSlug,
  className = "",
}: {
  url: string;
  text: string;
  toolSlug?: string;
  className?: string;
}) {
  const enc = encodeURIComponent;
  const message = `${text} ${url}`;

  const targets = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      Icon: MessageCircle,
      href: `https://wa.me/?text=${enc(message)}`,
    },
    {
      key: "telegram",
      label: "Telegram",
      Icon: Send,
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
    },
    {
      key: "x",
      label: "X",
      Icon: Share2,
      href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
    },
    {
      key: "facebook",
      label: "Facebook",
      Icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    },
  ] as const;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Link copied — paste it anywhere.");
      track({ event_type: "conversion", slot: "share_copy", tool_slug: toolSlug ?? null });
    } catch {
      toast.error("Clipboard blocked by your browser.");
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="label-mono mr-1">Share</span>
      {targets.map(({ key, label, Icon, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          onClick={() =>
            track({ event_type: "click", slot: `share_${key}`, tool_slug: toolSlug ?? null })
          }
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-hairline px-3.5 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/10"
        >
          <Icon className="size-3.5 text-primary" aria-hidden="true" /> {label}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy share link"
        className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-hairline px-3.5 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/10"
      >
        <Link2 className="size-3.5 text-primary" aria-hidden="true" /> Copy link
      </button>
    </div>
  );
}
