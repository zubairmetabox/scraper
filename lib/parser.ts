import * as cheerio from "cheerio";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioEl = cheerio.Cheerio<any>;
import crypto from "crypto";
import { BASE } from "./http-client";

export interface ParsedPage {
  title: string;
  content: string;
  links: string[];
  metadata: Record<string, string>;
}

export function parsePage(html: string, pageUrl: string): ParsedPage {
  const $ = cheerio.load(html);

  // Remove navigation, footer, scripts, styles
  $("nav, footer, script, style, .toolbar, #toolbar-bar, .skip-link").remove();
  $(".region-header, .region-primary-menu, .region-secondary-menu").remove();
  $(".region-footer, .region-footer-first, .region-footer-second").remove();
  $("[aria-hidden='true']").remove();

  // Extract title
  const title =
    $("h1.page-title").text().trim() ||
    $("h1").first().text().trim() ||
    $("title").text().trim();

  // Extract main content
  const mainSelector = [
    "main",
    ".layout-main",
    ".layout-container",
    "article",
    "#main-content",
    ".block-system-main-block",
    ".region-content",
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let contentEl: CheerioEl = $("body") as any;
  for (const sel of mainSelector) {
    if ($(sel).length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contentEl = $(sel) as any;
      break;
    }
  }

  // Extract plain text content (preserve paragraph structure)
  const content = extractText($, contentEl);

  // Collect internal links for crawling
  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;

    let absolute = href;
    if (href.startsWith("/")) {
      absolute = BASE + href;
    } else if (!href.startsWith("http")) {
      // Relative URL
      const base = pageUrl.substring(0, pageUrl.lastIndexOf("/") + 1);
      absolute = base + href;
    }

    // Only keep internal links
    if (absolute.startsWith(BASE) && !links.includes(absolute)) {
      links.push(absolute);
    }
  });

  // Extract metadata from meta tags and structured fields
  const metadata: Record<string, string> = {};
  $("meta[name], meta[property]").each((_, el) => {
    const name =
      $(el).attr("name") || $(el).attr("property") || "";
    const content = $(el).attr("content") || "";
    if (name && content) metadata[name] = content;
  });

  // Drupal field values (common pattern)
  $(".field__label").each((_, el) => {
    const label = $(el).text().trim().replace(/:$/, "");
    const value = $(el).siblings(".field__item, .field__items").first().text().trim();
    if (label && value) metadata[label] = value;
  });

  return { title, content, links, metadata };
}

function extractText($: cheerio.CheerioAPI, el: CheerioEl): string {
  const parts: string[] = [];

  el.find("h1, h2, h3, h4, h5, h6, p, li, td, th, blockquote, pre").each((_, node) => {
    const text = $(node).text().replace(/\s+/g, " ").trim();
    if (text.length > 0) parts.push(text);
  });

  // Fallback to full text if no structured content found
  if (parts.length === 0) {
    const raw = el.text().replace(/\s+/g, " ").trim();
    if (raw) parts.push(raw);
  }

  return parts.join("\n");
}

export function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
}
