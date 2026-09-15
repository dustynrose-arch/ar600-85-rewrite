import { type ReactNode } from "react";
import { parseGuideMarkdown, type GuideBlock, type GuideListItem } from "@/lib/guide-markdown";

const tableClass = "mt-3 w-full border-collapse text-sm font-ui";
const thClass = "border border-army-gold/25 bg-army-olive text-army-cream px-3 py-1.5 text-left font-semibold";
const tdClass = "border border-army-gold/20 bg-army-raised px-3 py-1.5 align-top";

function GuideInline({ text }: { text: string }) {
  const normalized = text.replace(/  \n/g, "\u0000");
  const parts = normalized.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\u0000)/);
  const nodes: ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (!part) continue;
    if (part === "\u0000") {
      nodes.push(<br key={i} />);
      continue;
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      nodes.push(<strong key={i}>{part.slice(2, -2)}</strong>);
      continue;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      nodes.push(
        <code key={i} className="rounded bg-army-raised px-1 text-[0.9em] text-army-goldDark">
          {part.slice(1, -1)}
        </code>,
      );
      continue;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2 && !part.startsWith("**")) {
      nodes.push(<em key={i}>{part.slice(1, -1)}</em>);
      continue;
    }
    nodes.push(<span key={i}>{part}</span>);
  }
  return <>{nodes}</>;
}

function OrderedItem({ item }: { item: GuideListItem }) {
  return (
    <li>
      <GuideInline text={item.text} />
      {item.nested && item.nested.length > 0 ? (
        <ul className="list-disc pl-6 space-y-1 mt-1">
          {item.nested.map((nested, index) => (
            <li key={index}>
              <GuideInline text={nested} />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function GuideBlockView({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "h1":
      return <h1 className="text-3xl font-bold mt-1">{block.text}</h1>;
    case "h2":
      return (
        <h2 id={block.id} className="text-xl font-bold mt-10 scroll-mt-4">
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 id={block.id} className="text-lg font-semibold mt-8 scroll-mt-4">
          {block.text}
        </h3>
      );
    case "hr":
      return <hr className="mt-8 border-army-gold/20" />;
    case "p":
      return (
        <p className="mt-3">
          <GuideInline text={block.text} />
        </p>
      );
    case "ul":
      return (
        <ul className="list-disc pl-6 space-y-1 mt-2">
          {block.items.map((item, index) => (
            <li key={index}>
              <GuideInline text={item} />
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal pl-6 space-y-1 mt-2">
          {block.items.map((item, index) => (
            <OrderedItem key={index} item={item} />
          ))}
        </ol>
      );
    case "table":
      return (
        <table className={tableClass}>
          <thead>
            <tr>
              {block.headers.map((header) => (
                <th key={header} className={thClass}>
                  <GuideInline text={header} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={tdClass}>
                    <GuideInline text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}

export function GuideMarkdown({ source }: { source: string }) {
  const blocks = parseGuideMarkdown(source);
  return (
    <div className="guide-markdown">
      {blocks.map((block, index) => (
        <GuideBlockView key={index} block={block} />
      ))}
    </div>
  );
}
