import { isValidElement, memo, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MarkdownProps = {
  content: string;
  className?: string;
};

/**
 * Recursively collapses a React node tree to its plain-text representation.
 * react-markdown passes a rendered `<code>` element as the children of `pre`
 * for fenced code blocks, so we unwrap one level to grab the source text.
 */
function nodeToText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join('');
  if (isValidElement(node)) {
    const inner = (node.props as { children?: ReactNode }).children;
    return nodeToText(inner);
  }
  return '';
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="font-display font-semibold text-pm-text text-[15px] mt-3 mb-1.5">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display font-semibold text-pm-text text-[14px] mt-2.5 mb-1">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display font-semibold text-pm-text text-[13px] mt-2 mb-1">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="leading-relaxed my-1.5 first:mt-0 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-pm-primary underline underline-offset-2 hover:text-pm-primary-hover"
    >
      {children}
    </a>
  ),
  // Inline code only — block code lives inside `<pre>` and is rendered as raw text below.
  code: ({ children }) => (
    <code className="bg-pm-surface rounded px-1 py-0.5 font-mono text-[12px] text-pm-accent">
      {children}
    </code>
  ),
  pre: ({ children }) => {
    // react-markdown wraps fenced code in <pre><code>…</code></pre>. We render
    // the raw text once on the <pre> element to avoid double-styling the
    // inline-code background on top of the block background.
    const text = nodeToText(children);
    return (
      <pre className="bg-pm-bg border border-pm-border rounded-md p-3 overflow-x-auto font-mono text-[12px] text-pm-text">
        {text}
      </pre>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-pm-border pl-3 italic text-pm-muted my-2">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <table className="w-full border-collapse text-[12px] my-2">{children}</table>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  th: ({ children }) => (
    <th className="border border-pm-border bg-pm-surface px-2 py-1 text-left font-semibold text-pm-text">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-pm-border px-2 py-1 text-pm-text">{children}</td>
  ),
  tr: ({ children }) => <tr>{children}</tr>,
  strong: ({ children }) => <strong className="font-semibold text-pm-text">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="border-pm-border-subtle my-3" />,
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt ?? ''} className="max-w-full rounded-md my-2" loading="lazy" />
  ),
};

export const Markdown = memo(function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={`pm-prose ${className ?? ''}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
