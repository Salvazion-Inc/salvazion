'use client';

interface Props {
  text: string;
  ranges: [number, number][];
  className?: string;
}

/** Renders text with neon highlight spans for match ranges. */
export default function HighlightedText({ text, ranges, className = '' }: Props) {
  if (!ranges.length) {
    return <span className={className}>{text}</span>;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], i) => {
    if (start > cursor) {
      parts.push(<span key={`t-${i}-${cursor}`}>{text.slice(cursor, start)}</span>);
    }
    parts.push(
      <mark
        key={`h-${i}`}
        className="bg-[#00F511]/25 text-[#00F511] rounded px-0.5 not-italic"
      >
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  });
  if (cursor < text.length) {
    parts.push(<span key="tail">{text.slice(cursor)}</span>);
  }
  return <span className={className}>{parts}</span>;
}
