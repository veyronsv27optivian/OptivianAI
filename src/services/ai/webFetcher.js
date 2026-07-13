/**
 * Web Fetcher — Client-side URL fetching for Website & YouTube analyzers.
 *
 * Uses free/public APIs so no API keys are required to start.
 * Users can replace endpoints with their own CORS proxy or API keys later.
 */
import { AI_TOOL_TYPES } from './config';

// ─── CORS proxy endpoints (free, no auth required) ─────────────
// Users can replace these with their own CORS proxy or backend endpoint.
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const YOUTUBE_OEMBED = 'https://noembed.com/embed?url=';

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Extract YouTube video ID from various URL formats.
 */
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Truncate text to a reasonable length for AI analysis.
 */
function truncate(text, maxLen = 30000) {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen) +
    `\n\n[... content truncated at ${maxLen.toLocaleString()} characters. ${(text.length - maxLen).toLocaleString()} more chars omitted.]`;
}

// ─── Fetch website content ────────────────────────────────────────

/**
 * Fetch and extract readable text from a website URL.
 *
 * @param {string} url - The website URL to fetch.
 * @returns {Promise<{content: string, title: string, url: string, error?: string}>}
 */
export async function fetchWebsiteContent(url) {
  if (!url?.trim()) {
    return { content: '', title: '', url: '', error: 'URL is required' };
  }

  try { new URL(url); }
  catch {
    return { content: '', title: '', url, error: 'Invalid URL format. Please enter a valid URL (e.g., https://example.com)' };
  }

  const proxyUrl = import.meta.env.VITE_CORS_PROXY_URL || CORS_PROXY;
  const encodedUrl = encodeURIComponent(url);

  const proxies = [
    `${proxyUrl}${encodedUrl}`,
    `https://api.allorigins.win/get?url=${encodedUrl}`,
  ];

  let lastError = '';

  for (const proxyEndpoint of proxies) {
    try {
      const response = await fetch(proxyEndpoint, {
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        lastError = `HTTP ${response.status}: ${response.statusText}`;
        continue;
      }

      let text;
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const json = await response.json();
        text = json.contents || json.body || JSON.stringify(json);
      } else {
        text = await response.text();
      }

      const readable = extractReadableText(text);
      const title = extractTitle(text);

      return {
        content: truncate(readable),
        title: title || url,
        url,
      };
    } catch (err) {
      lastError = err.message || 'Unknown error';
    }
  }

  return {
    content: '',
    title: '',
    url,
    error: `Failed to fetch website content: ${lastError}. Try a different URL or paste the content manually.`,
  };
}

// ─── Fetch YouTube metadata ───────────────────────────────────────

/**
 * Fetch YouTube video metadata using oEmbed (no API key needed).
 *
 * @param {string} url - YouTube video URL.
 * @returns {Promise<{content: string, title: string, videoId: string, metadata: object, error?: string}>}
 */
export async function fetchYouTubeMetadata(url) {
  if (!url?.trim()) {
    return { content: '', title: '', videoId: '', metadata: {}, error: 'YouTube URL is required' };
  }

  const videoId = extractYouTubeId(url.trim());
  if (!videoId) {
    return {
      content: '', title: '', videoId: '', metadata: {},
      error: 'Could not extract video ID from URL. Use formats like: https://youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID',
    };
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const response = await fetch(`${YOUTUBE_OEMBED}${encodeURIComponent(canonicalUrl)}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        content: '', title: '', videoId, metadata: {},
        error: `Failed to fetch video metadata. You can paste the video description/transcript manually.`,
      };
    }

    const metadata = await response.json();

    const content = [
      `Title: ${metadata.title || 'Unknown'}`,
      `Author: ${metadata.author_name || 'Unknown'}`,
      `URL: ${canonicalUrl}`,
      metadata.thumbnail_url ? `Thumbnail: ${metadata.thumbnail_url}` : '',
      metadata.html ? `Embed HTML available` : '',
      '',
      'Note: For a full transcript, you need a YouTube Data API v3 key.',
      'You can paste the transcript manually if available.',
    ].filter(Boolean).join('\n');

    return { content, title: metadata.title || 'YouTube Video', videoId, metadata };
  } catch (err) {
    return {
      content: '', title: '', videoId, metadata: {},
      error: `Failed to fetch video metadata: ${err.message}. You can paste the video description/transcript manually.`,
    };
  }
}

// ─── HTML text extraction ─────────────────────────────────────────

/**
 * Extract readable text from HTML content.
 *
 * Strategy: Insert newlines at block-level tags BEFORE stripping HTML,
 * so the resulting text has proper paragraph breaks.
 */
function extractReadableText(html) {
  if (!html) return '';

  let text = html;

  // 1. Insert newlines after block-level closing tags
  //    This preserves paragraph/section structure before tag removal
  text = text.replace(/<\/(?:p|div|h[1-6]|li|section|article|blockquote|header|footer|nav|aside|figure|figcaption|details|summary|pre|table|tr|td|th|dd|dt)>/gi, '\n');

  // 2. Insert newlines before block-level opening tags
  text = text.replace(/<(?:p|div|h[1-6]|li|br|hr|section|article|blockquote|header|footer|nav|aside|tr|th|td|dd|dt)[^>]*>/gi, '\n');

  // 3. Remove script and style tags entirely
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // 4. Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // 5. Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(d))
    .replace(/&[a-zA-Z]+;/g, ' ');

  // 6. Collapse multiple newlines into double-newline (paragraph breaks)
  text = text.replace(/\n{3,}/g, '\n\n');

  // 7. Collapse horizontal whitespace (but keep paragraph breaks)
  const lines = text.split('\n').map(l => l.replace(/\s+/g, ' ').trim());

  // 8. Remove empty/short lines, keep max 200 paragraphs
  const meaningfulLines = lines
    .filter(l => l.length > 15)
    .slice(0, 200);

  return meaningfulLines.join('\n\n');
}

/**
 * Extract page title from HTML.
 */
function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : '';
}

// ─── URL Analyzer tool type detection ─────────────────────────────

export const URL_ANALYZER_TOOLS = {
  [AI_TOOL_TYPES.WEBSITE_ANALYZER]: {
    label: 'Website URL',
    placeholder: 'https://example.com',
    fetchFn: 'fetchWebsiteContent',
    promptPrefix: 'I want you to analyze the following website. Here is the content I extracted:\n\n',
  },
  [AI_TOOL_TYPES.YOUTUBE_ANALYZER]: {
    label: 'YouTube URL',
    placeholder: 'https://youtube.com/watch?v=...',
    fetchFn: 'fetchYouTubeMetadata',
    promptPrefix: 'I want you to analyze the following YouTube video. Here is the metadata and content I extracted:\n\n',
  },
};

export function getUrlInputConfig(toolType) {
  const config = URL_ANALYZER_TOOLS[toolType];
  return config ? { supported: true, config } : { supported: false };
}
