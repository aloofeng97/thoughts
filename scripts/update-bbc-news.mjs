import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BBC_RSS_URL = "https://feeds.bbci.co.uk/news/rss.xml";
const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const OUTPUT_PATH = join(ROOT_DIR, "data", "bbc-news.json");

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const ADVANCED_WORDS = new Set([
  "administration",
  "allegation",
  "ceasefire",
  "coalition",
  "constitutional",
  "controversial",
  "diplomatic",
  "displacement",
  "economic",
  "election",
  "evacuation",
  "federal",
  "humanitarian",
  "infrastructure",
  "investigation",
  "legislation",
  "military",
  "negotiation",
  "parliament",
  "prosecution",
  "sanction",
  "security",
]);

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'");
}

function stripHtml(value) {
  return decodeEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function readTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return "";
  return stripHtml(match[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, ""));
}

function getWords(text) {
  return text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
}

function estimateLevel(title, summary) {
  const words = getWords(`${title} ${summary}`);
  if (!words.length) return "B1";
  const longWords = words.filter((word) => word.length >= 10).length;
  const advancedWords = words.filter((word) => ADVANCED_WORDS.has(word)).length;
  const score = words.length / 18 + longWords * 0.8 + advancedWords * 1.15;
  if (score < 1.5) return "A2";
  if (score < 3.2) return "B1";
  if (score < 5.2) return "B2";
  return "C1";
}

function detectTags(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  const tags = ["BBC Top Stories"];
  const addIf = (label, pattern) => {
    if (pattern.test(text)) tags.push(label);
  };
  addIf("政治", /\b(election|government|minister|president|parliament|policy|vote)\b/);
  addIf("国际", /\b(world|global|war|ceasefire|border|country|countries|foreign)\b/);
  addIf("经济", /\b(economy|market|business|trade|price|tax|company|bank)\b/);
  addIf("科技", /\b(ai|technology|tech|space|computer|data|robot|software)\b/);
  addIf("健康", /\b(health|doctor|hospital|disease|medical|vaccine|virus)\b/);
  addIf("法律", /\b(court|judge|trial|police|law|legal|crime|charged)\b/);
  return tags.slice(0, 4);
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.link || item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  const response = await fetch(BBC_RSS_URL, {
    headers: {
      "user-agent": "English learning page updater (GitHub Actions)",
    },
  });

  if (!response.ok) {
    throw new Error(`BBC RSS request failed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const itemBlocks = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  const items = uniqueItems(
    itemBlocks
      .map((block) => {
        const title = readTag(block, "title");
        const summary = readTag(block, "description");
        const link = readTag(block, "link");
        const pubDate = readTag(block, "pubDate");
        const level = estimateLevel(title, summary);
        return {
          title,
          summary,
          link,
          pubDate,
          level,
          tags: detectTags(title, summary),
        };
      })
      .filter((item) => item.title && item.summary && item.link),
  ).slice(0, 18);

  if (!items.length) {
    throw new Error("No BBC RSS items parsed.");
  }

  const payload = {
    meta: {
      source: "BBC News Top Stories",
      sourceUrl: BBC_RSS_URL,
      updatedAt: new Date().toISOString(),
      itemCount: items.length,
    },
    items,
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${items.length} BBC headlines to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
