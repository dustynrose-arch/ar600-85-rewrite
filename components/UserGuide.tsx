"use client";

import { GuideMarkdown } from "@/components/GuideMarkdown";
import { GUIDE_ANCHORS } from "@/lib/guide";
import { USER_GUIDE_MARKDOWN } from "@/lib/user-guide-copy";

export function UserGuide() {
  return (
    <article className="max-w-none font-doc text-army-cream">
      <nav className="mb-4" aria-label="User Guide contents">
        <ol className="flex flex-wrap gap-2 font-ui">
          {GUIDE_ANCHORS.map((anchor) => (
            <li key={anchor.id}>
              <a
                href={`#${anchor.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(anchor.id)?.scrollIntoView({ block: "start" });
                }}
                className="inline-flex border border-army-gold/40 bg-army-raised px-2.5 py-1.5 text-left text-[12px] font-semibold text-army-cream no-underline hover:border-army-gold"
              >
                {anchor.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <GuideMarkdown source={USER_GUIDE_MARKDOWN} />
    </article>
  );
}
