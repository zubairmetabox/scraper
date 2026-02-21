import { SiteSection } from "@/types";

export const BASE_URL = "https://supremecourt.govmu.org";

/**
 * Known sections of the Supreme Court of Mauritius website.
 * These are public legal pages — none are in the robots.txt disallow list.
 */
export const SITE_SECTIONS: SiteSection[] = [
  // Judgments
  {
    name: "Judgments",
    url: `${BASE_URL}/judgments`,
    category: "judgments",
  },
  {
    name: "Judgments Archive",
    url: `${BASE_URL}/judgments-archive`,
    category: "judgments",
  },
  // Legislation
  {
    name: "Legislation",
    url: `${BASE_URL}/legislation`,
    category: "legislation",
  },
  // Practice Directions
  {
    name: "Practice Directions",
    url: `${BASE_URL}/practice-directions`,
    category: "practice-directions",
  },
  // Court Rules
  {
    name: "Court Rules",
    url: `${BASE_URL}/court-rules`,
    category: "court-rules",
  },
  // Cause List
  {
    name: "Cause List",
    url: `${BASE_URL}/cause-list`,
    category: "cause-list",
  },
  // General info pages
  {
    name: "About",
    url: `${BASE_URL}/about`,
    category: "general",
  },
  {
    name: "Fees",
    url: `${BASE_URL}/fees`,
    category: "general",
  },
  {
    name: "Forms",
    url: `${BASE_URL}/forms`,
    category: "general",
  },
];

/**
 * URL patterns that should NOT be crawled further.
 * Respects robots.txt disallow list plus other non-content paths.
 */
export const BLOCKED_PATTERNS = [
  /\/admin\//,
  /\/comment\/reply\//,
  /\/filter\/tips/,
  /\/node\/add\//,
  /\/search\//,
  /\/user\/register\//,
  /\/user\/password\//,
  /\/user\/login\//,
  /\/user\/logout\//,
  /\/core\//,
  /\/profiles\//,
  /\.(css|js|png|jpg|jpeg|gif|svg|pdf|doc|docx|xls|xlsx|zip|xml|json|ico|woff|woff2|ttf)$/i,
  /\?.*page=/,  // Avoid infinite pagination — handle separately
];

export function isAllowed(url: string): boolean {
  return !BLOCKED_PATTERNS.some((p) => p.test(url));
}
