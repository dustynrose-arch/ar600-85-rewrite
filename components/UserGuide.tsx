import { GuideMarkdown } from "@/components/GuideMarkdown";
import { GuideVideo } from "@/components/GuideVideo";
import { GuideWalkthrough } from "@/components/GuideWalkthrough";
import { USER_GUIDE_MARKDOWN } from "@/lib/user-guide-copy";

export function UserGuide() {
  return (
    <article className="prose prose-slate max-w-none font-doc text-army-cream">
      <p className="panel-heading mt-4">User Guide</p>
      <GuideVideo />
      <GuideWalkthrough />
      <GuideMarkdown source={USER_GUIDE_MARKDOWN} />
    </article>
  );
}
