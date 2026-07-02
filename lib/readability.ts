import { Readability, isProbablyReaderable } from '@mozilla/readability';
import { MAX_CONTENT_CHARS } from './storage.ts';

export type ExtractedPageContent = {
  title: string;
  content: string;
  url: string;
  selection: string; // current text selection, or '' if none
};

/**
 * Extract readable article content from the current page.
 *
 * Uses Mozilla Readability on a cloned document so the live DOM is not mutated.
 * Falls back to the raw body text when the page is not readerable (e.g. SPAs,
 * dashboards, search results) so PageMind still works on non-article pages.
 * Returns null only when there is truly no content.
 */
export function extractPageContent(): ExtractedPageContent | null {
  // Capture the user's current text selection once, at the start, so every
  // return path returns a consistent value. Guarded for non-browser test envs.
  const selection = typeof window !== 'undefined' ? (window.getSelection()?.toString() ?? '') : '';

  const doc = document.cloneNode(true) as Document;

  if (!isProbablyReaderable(doc)) {
    // Fix 8: Fall back to body text for non-readerable pages (SPAs, dashboards, etc.)
    const fallbackContent = document.body?.innerText?.slice(0, MAX_CONTENT_CHARS) ?? '';
    if (!fallbackContent.trim()) {
      return null;
    }
    return {
      title: document.title || 'Untitled',
      content: fallbackContent,
      url: location.href,
      selection,
    };
  }

  const article = new Readability(doc).parse();
  if (!article) {
    // Even if readerable, Readability failed to parse — fall back to body text.
    const fallbackContent = document.body?.innerText?.slice(0, MAX_CONTENT_CHARS) ?? '';
    if (!fallbackContent.trim()) {
      return null;
    }
    return {
      title: document.title || 'Untitled',
      content: fallbackContent,
      url: location.href,
      selection,
    };
  }

  return {
    title: article.title ?? document.title ?? 'Untitled',
    content: article.textContent ?? '',
    url: location.href,
    selection,
  };
}
