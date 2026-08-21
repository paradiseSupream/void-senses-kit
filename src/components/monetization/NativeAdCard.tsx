import { ExternalLink } from "lucide-react";

const SPONSORED = [
  {
    title: "Ship faster with edge-native hosting",
    body: "Deploy globally in seconds. Free tier for indie builders.",
  },
  {
    title: "Unlimited stock renders",
    body: "Royalty-free 8K textures and cinematic HDRIs for your scenes.",
  },
  {
    title: "Learn systems design in 30 days",
    body: "A daily email course written by senior infra engineers.",
  },
];

export function NativeAdCard({ index = 0 }: { index?: number }) {
  const ad = SPONSORED[index % SPONSORED.length]!;
  return (
    <a
      href="#sponsored-placeholder"
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="glass lift group flex flex-col justify-between rounded-xl p-5"
    >
      <div>
        <span className="label-mono rounded-full border border-secondary/40 bg-secondary/15 px-2 py-0.5 text-secondary-foreground">
          Sponsored
        </span>
        <h3 className="mt-4 text-base font-semibold text-foreground">{ad.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{ad.body}</p>
      </div>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        Learn more <ExternalLink className="size-3.5" aria-hidden="true" />
      </span>
    </a>
  );
}

/** Injects a sponsored card after every 4th item of a grid. */
export function withNativeAds<T>(items: T[], every = 4): Array<{ item: T } | { ad: number }> {
  const out: Array<{ item: T } | { ad: number }> = [];
  let adCount = 0;
  items.forEach((item, i) => {
    out.push({ item });
    if ((i + 1) % every === 0 && i + 1 < items.length) {
      out.push({ ad: adCount++ });
    }
  });
  return out;
}
