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

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "amid",
  "and",
  "are",
  "been",
  "being",
  "but",
  "can",
  "could",
  "from",
  "has",
  "have",
  "her",
  "him",
  "his",
  "how",
  "into",
  "its",
  "may",
  "more",
  "new",
  "not",
  "now",
  "over",
  "says",
  "she",
  "that",
  "the",
  "their",
  "them",
  "then",
  "they",
  "this",
  "those",
  "will",
  "with",
  "who",
  "why",
]);

const WORD_BANK = {
  appeal: ["上诉；呼吁", "控訴；訴え", "a formal request to review a decision"],
  board: ["董事会；委员会", "取締役会；委員会", "a group that makes decisions for an organization"],
  chairman: ["主席；董事长", "会長；議長", "the person who leads a board or meeting"],
  command: ["指挥部；命令", "司令部；命令", "authority to direct military or official action"],
  concern: ["担忧；关注点", "懸念；関心事", "a reason to worry or pay attention"],
  conduct: ["行为；举止", "行動；振る舞い", "the way a person behaves"],
  court: ["法院；法庭", "裁判所；法廷", "a place where legal cases are judged"],
  custody: ["拘留；监护", "拘留；保護監督", "legal control or detention"],
  economy: ["经济", "経済", "the system of money, trade, and work"],
  government: ["政府", "政府", "the group that governs a country or region"],
  infrastructure: ["基础设施", "インフラ", "basic systems such as roads, power, and communications"],
  investigation: ["调查", "調査", "a careful search for facts"],
  minister: ["部长；大臣", "大臣", "a senior government official"],
  official: ["官员；官方的", "当局者；公式の", "connected with an authority or organization"],
  policy: ["政策", "政策", "a plan or rule used by a government or organization"],
  reports: ["报道；报告", "報道；報告", "states information that has been found or announced"],
  security: ["安全；安保", "安全保障", "protection from danger or threats"],
  sentence: ["判决；句子", "判決；文", "a punishment given by a court, or a group of words"],
  strike: ["袭击；罢工", "攻撃；ストライキ", "an attack or a refusal to work as protest"],
  trial: ["审判；试验", "裁判；試験", "a legal process or a test"],
};

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

function getKeywordCandidates(title, summary) {
  const words = getWords(`${title} ${summary}`)
    .map((word) => word.replace(/'s$/, ""))
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
  const counts = new Map();
  words.forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([word]) => word);
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

function pickFocus(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  if (/\b(court|trial|judge|sentence|charged|appeal)\b/.test(text)) return "legal decision";
  if (/\b(war|strike|military|missile|drone|border)\b/.test(text)) return "security development";
  if (/\b(company|business|market|board|chairman|economy)\b/.test(text)) return "business decision";
  if (/\b(election|minister|government|policy|president)\b/.test(text)) return "political development";
  if (/\b(school|student|children|teacher|university)\b/.test(text)) return "public concern";
  if (/\b(health|hospital|doctor|disease|virus)\b/.test(text)) return "health issue";
  return "current event";
}

function makeVocabulary(title, summary) {
  const keywords = getKeywordCandidates(title, summary).slice(0, 7);
  return keywords.map((word) => {
    const entry = WORD_BANK[word] ?? [
      "结合新闻语境理解的关键词",
      "ニュース文脈で理解する重要語",
      "a useful word for understanding this news item",
    ];
    return {
      word,
      zh: entry[0],
      ja: entry[1],
      note: entry[2],
      example: `In this story, "${word}" helps you follow the main issue and its possible result.`,
    };
  });
}

function makeGrammar(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  const points = [
    {
      name: "新闻标题压缩",
      pattern: "Noun phrase + strong verb + key result",
      explanation: "英语新闻标题常省略冠词和部分助动词，用较短结构塞进人物、动作和结果。",
      task: "把标题扩写成完整句：The BBC report says that ...",
    },
  ];

  if (/\b(was|were|is|are|been|be)\b\s+\w+(ed|en)\b/.test(text) || /\bremoved|killed|spared|referred|charged|found\b/.test(text)) {
    points.push({
      name: "被动语态",
      pattern: "be + past participle",
      explanation: "被动语态把焦点放在受到影响的人或事，而不是动作执行者。",
      task: "用被动语态写一句：Someone or something was affected by ...",
    });
  }

  if (/\b(after|as|while|when|because|since)\b/.test(text)) {
    points.push({
      name: "状语从句",
      pattern: "After/When/Because + clause, main clause",
      explanation: "状语从句交代时间、原因或背景，主句给出核心结果。",
      task: "写一句包含 when / because / after 的解释句。",
    });
  }

  if (/\b(over|amid|during|following)\b/.test(text)) {
    points.push({
      name: "介词短语作背景",
      pattern: "over/amid/during/following + noun phrase",
      explanation: "新闻英语常用介词短语快速补充争议、背景或时间线。",
      task: "用 amid / following / during 写一句新闻背景句。",
    });
  }

  return points.slice(0, 3);
}

function makeLearningPack({ title, summary, level }) {
  const focus = pickFocus(title, summary);
  const vocabulary = makeVocabulary(title, summary);
  const keywordText = vocabulary.slice(0, 4).map((item) => item.word).join(", ") || "the main people, action, and result";
  const grammar = makeGrammar(title, summary);

  return {
    reading: [
      `This is a study version, not a copy of the BBC article. Use it as a longer training text before you open the original link. The news item is a ${focus}. Your first job is to find the actor, the action, and the result.`,
      `The headline gives you a compressed version of the story. Slow it down and turn it into a full sentence. Ask yourself: Who is doing something? Who is affected? What changed? Which detail tells me why the story matters today?`,
      `Next, read the short source summary as the factual anchor. Do not try to memorize every word. Instead, build a mental map: background, main event, response, and possible next step. This makes the article easier to understand when you read the full BBC report.`,
      `For language practice, focus on these words: ${keywordText}. Say them aloud, then use each one in your own sentence. Finally, write a three-sentence mini report: one sentence for the event, one for the context, and one for the possible consequence.`,
    ],
    vocabulary,
    grammar,
    comprehension: [
      "What is the main event in the headline?",
      "Who or what is most affected by this development?",
      "Which detail from the summary gives you useful context?",
      "What is one question you still need the full BBC article to answer?",
    ],
    drills: [
      "Rewrite the headline as a complete sentence beginning with: The report says that ...",
      "Write one sentence explaining why the story matters, using because.",
      "Write one neutral opinion sentence beginning with: This development may be important because ...",
      `Make a ${level}-level summary in 35-50 English words without copying the BBC wording.`,
    ],
    shadowing: [
      "The headline gives the main action, but the summary gives the context.",
      "I can understand this story better by asking who acted, who was affected, and what may happen next.",
      "After reading the original article, I will correct my summary with more precise facts.",
    ],
  };
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
          learning: makeLearningPack({ title, summary, level }),
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
