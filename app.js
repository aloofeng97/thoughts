"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const nodes = {
  input: $("#englishInput"),
  level: $("#levelSelect"),
  analyze: $("#analyzeBtn"),
  sample: $("#sampleBtn"),
  clear: $("#clearBtn"),
  stats: $("#textStats"),
  state: $("#analysisState"),
  count: $("#sentenceCount"),
  tabs: $("#sentenceTabs"),
  syntax: $("#syntaxView"),
  favGrammar: $("#favoriteGrammarBtn"),
  newPractice: $("#newPracticeBtn"),
  practiceFrame: $("#practiceFrame"),
  practiceList: $("#practiceList"),
  favStats: $("#favoriteStats"),
  favList: $("#favoriteList"),
  favTabs: $$(".segment"),
  clearFavorites: $("#clearFavoritesBtn"),
  readingHint: $("#readingHint"),
  readingList: $("#readingList"),
  refreshReading: $("#refreshReadingBtn"),
  speakAll: $("#speakAllBtn"),
  stopSpeak: $("#stopSpeakBtn"),
  popover: $("#wordPopover"),
  toast: $("#toast"),
};

const STORAGE_KEY = "english_analyzer_favorites_v1";
const NEWS_DATA_URL = "data/bbc-news.json";
let currentAnalysis = [];
let activeSentenceIndex = 0;
let activePractice = [];
let activeFavTab = "words";
let readingOffset = 0;
let bbcNewsItems = [];
let bbcNewsMeta = null;
let bbcNewsLoading = true;
let popoverWord = null;
let popoverTimer = null;
let toastTimer = null;

const samples = [
  "Although the city was crowded, Mia found a quiet cafe where she could review her notes before the interview. She had prepared carefully, but she still felt nervous when the manager asked her to explain her project.",
  "People who learn a language every day often make steady progress because small habits are easier to repeat than dramatic plans. If you read a little beyond your comfort zone, new words begin to feel familiar.",
  "The report was written by a small team after they interviewed more than fifty students. Their findings suggest that clear goals and immediate feedback can make online learning more effective.",
  "When I moved to Tokyo, I realized that listening was not a passive skill. I started to notice how native speakers connect ideas, soften opinions, and ask questions politely.",
];

const levels = ["A1", "A2", "B1", "B2", "C1"];

const dictionary = {
  a: ["冠词", "一个；某个", "ひとつの；ある"],
  about: ["介词/副词", "关于；大约", "について；およそ"],
  above: ["介词", "在……上方", "の上に"],
  across: ["介词", "穿过；横跨", "を横切って"],
  action: ["名词", "行动；动作", "行動；動作"],
  active: ["形容词", "主动的；活跃的", "能動的；活発な"],
  actually: ["副词", "实际上", "実際に"],
  after: ["介词/连词", "在……之后", "の後で"],
  again: ["副词", "再次", "再び"],
  all: ["限定词", "全部", "すべて"],
  almost: ["副词", "几乎", "ほとんど"],
  although: ["连词", "虽然；尽管", "けれども；にもかかわらず"],
  always: ["副词", "总是", "いつも"],
  an: ["冠词", "一个；某个", "ひとつの；ある"],
  and: ["连词", "和；并且", "そして"],
  another: ["限定词", "另一个", "もう一つの"],
  answer: ["名词/动词", "回答；答案", "答え；答える"],
  any: ["限定词", "任何；一些", "どんな；いくつかの"],
  are: ["动词", "是；存在", "である；いる"],
  around: ["介词/副词", "在周围；大约", "周りに；およそ"],
  article: ["名词", "文章；冠词", "記事；冠詞"],
  ask: ["动词", "询问；请求", "尋ねる；頼む"],
  asked: ["动词", "询问了；要求了", "尋ねた；頼んだ"],
  at: ["介词", "在；向", "で；に"],
  because: ["连词", "因为", "なぜなら"],
  become: ["动词", "变成；成为", "なる"],
  before: ["介词/连词", "在……之前", "の前に"],
  begin: ["动词", "开始", "始める"],
  better: ["形容词/副词", "更好的；更好地", "より良い；より上手に"],
  beyond: ["介词", "超出；在……之外", "を越えて"],
  book: ["名词", "书", "本"],
  but: ["连词", "但是", "しかし"],
  by: ["介词", "被；通过；在旁边", "によって；そばに"],
  cafe: ["名词", "咖啡馆", "カフェ"],
  can: ["情态动词", "能够；可以", "できる"],
  carefully: ["副词", "仔细地", "注意深く"],
  change: ["动词/名词", "改变；变化", "変える；変化"],
  city: ["名词", "城市", "都市"],
  clear: ["形容词", "清楚的；明确的", "明確な"],
  communicate: ["动词", "沟通；交流", "伝える；交流する"],
  comfort: ["名词", "舒适；安慰", "快適さ；慰め"],
  connect: ["动词", "连接；联系", "つなぐ"],
  could: ["情态动词", "能够；可能", "できた；かもしれない"],
  crowded: ["形容词", "拥挤的", "混雑した"],
  day: ["名词", "一天；白天", "日；昼"],
  different: ["形容词", "不同的", "違う"],
  dramatic: ["形容词", "戏剧性的；巨大的", "劇的な"],
  easier: ["形容词", "更容易的", "より簡単な"],
  effective: ["形容词", "有效的", "効果的な"],
  english: ["名词/形容词", "英语；英国的", "英語；英国の"],
  every: ["限定词", "每个", "すべての"],
  explain: ["动词", "解释", "説明する"],
  familiar: ["形容词", "熟悉的", "なじみのある"],
  feedback: ["名词", "反馈", "フィードバック"],
  feel: ["动词", "感觉", "感じる"],
  felt: ["动词", "感觉到", "感じた"],
  fifty: ["数词", "五十", "五十"],
  findings: ["名词", "调查结果；发现", "調査結果；発見"],
  found: ["动词", "找到；发现", "見つけた"],
  friend: ["名词", "朋友", "友人"],
  from: ["介词", "来自；从", "から"],
  goals: ["名词", "目标", "目標"],
  grammar: ["名词", "语法", "文法"],
  habit: ["名词", "习惯", "習慣"],
  habits: ["名词", "习惯", "習慣"],
  had: ["助动词/动词", "已经；拥有过", "すでに；持っていた"],
  have: ["动词/助动词", "有；已经", "持つ；している"],
  he: ["代词", "他", "彼"],
  her: ["代词/限定词", "她的；她", "彼女の；彼女を"],
  how: ["副词", "怎样；如何", "どのように"],
  i: ["代词", "我", "私"],
  idea: ["名词", "想法", "考え"],
  if: ["连词", "如果", "もし"],
  immediate: ["形容词", "立即的；直接的", "即時の"],
  improve: ["动词", "改善；提高", "改善する"],
  in: ["介词", "在……里", "の中に"],
  interview: ["名词/动词", "面试；采访", "面接；インタビュー"],
  interviewed: ["动词", "采访了；面试了", "面接した；取材した"],
  is: ["动词", "是；存在", "である；いる"],
  it: ["代词", "它；这件事", "それ"],
  language: ["名词", "语言", "言語"],
  learn: ["动词", "学习", "学ぶ"],
  learning: ["名词/动名词", "学习", "学習"],
  little: ["形容词", "少量的；小的", "少しの；小さい"],
  make: ["动词", "制作；使得", "作る；させる"],
  manager: ["名词", "经理", "管理者"],
  many: ["限定词", "许多", "多くの"],
  more: ["限定词/副词", "更多；更", "もっと"],
  moved: ["动词", "搬到；移动了", "引っ越した；動いた"],
  native: ["形容词", "母语的；本地的", "母語の；地元の"],
  nervous: ["形容词", "紧张的", "緊張した"],
  new: ["形容词", "新的", "新しい"],
  not: ["副词", "不", "ない"],
  notice: ["动词/名词", "注意到；通知", "気づく；通知"],
  often: ["副词", "经常", "よく"],
  online: ["形容词/副词", "在线的；在线地", "オンラインの"],
  opinions: ["名词", "观点；意见", "意見"],
  passive: ["形容词", "被动的", "受動的"],
  people: ["名词", "人们", "人々"],
  plan: ["名词/动词", "计划", "計画"],
  plans: ["名词", "计划", "計画"],
  politely: ["副词", "礼貌地", "丁寧に"],
  prepared: ["动词/形容词", "准备了；准备好的", "準備した；準備できた"],
  progress: ["名词/动词", "进步；前进", "進歩；進む"],
  project: ["名词", "项目", "プロジェクト"],
  questions: ["名词", "问题", "質問"],
  quiet: ["形容词", "安静的", "静かな"],
  read: ["动词", "阅读", "読む"],
  realized: ["动词", "意识到", "気づいた"],
  repeat: ["动词", "重复", "繰り返す"],
  report: ["名词", "报告", "報告書"],
  review: ["动词/名词", "复习；回顾", "復習する；見直し"],
  skill: ["名词", "技能", "技能"],
  small: ["形容词", "小的", "小さい"],
  soften: ["动词", "缓和；使柔和", "和らげる"],
  speakers: ["名词", "说话者；讲某语言的人", "話者"],
  started: ["动词", "开始了", "始めた"],
  steady: ["形容词", "稳定的", "安定した"],
  still: ["副词", "仍然", "まだ"],
  students: ["名词", "学生", "学生"],
  suggest: ["动词", "表明；建议", "示す；提案する"],
  team: ["名词", "团队", "チーム"],
  than: ["连词/介词", "比", "より"],
  that: ["连词/代词", "那；引导从句", "それ；ということ"],
  the: ["冠词", "这个；那个", "その"],
  their: ["限定词", "他们的", "彼らの"],
  they: ["代词", "他们", "彼ら"],
  to: ["介词/不定式标记", "到；去；为了", "へ；するために"],
  tokyo: ["名词", "东京", "東京"],
  two: ["数词", "二", "二"],
  understand: ["动词", "理解", "理解する"],
  use: ["动词/名词", "使用；用途", "使う；使用"],
  was: ["动词/助动词", "是；被", "だった；された"],
  when: ["连词/副词", "当……时；什么时候", "いつ；とき"],
  where: ["副词/连词", "哪里；在……的地方", "どこ；ところ"],
  who: ["代词", "谁；引导定语从句", "誰；する人"],
  with: ["介词", "和；带有", "と；を持って"],
  words: ["名词", "单词；话语", "単語；言葉"],
  written: ["动词/分词", "写成的；被写", "書かれた"],
  you: ["代词", "你；你们", "あなた"],
  zone: ["名词", "区域；范围", "区域；範囲"],
};

const pronouns = new Set([
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "this",
  "that",
  "these",
  "those",
]);

const determiners = new Set([
  "a",
  "an",
  "the",
  "this",
  "that",
  "these",
  "those",
  "my",
  "your",
  "his",
  "her",
  "its",
  "our",
  "their",
  "some",
  "any",
  "many",
  "much",
  "each",
  "every",
  "another",
  "few",
  "little",
]);

const prepositions = new Set([
  "in",
  "on",
  "at",
  "by",
  "with",
  "for",
  "from",
  "to",
  "of",
  "about",
  "after",
  "before",
  "under",
  "over",
  "between",
  "through",
  "during",
  "without",
  "within",
  "beyond",
  "across",
  "around",
  "into",
]);

const conjunctions = new Set([
  "and",
  "but",
  "or",
  "so",
  "because",
  "although",
  "when",
  "while",
  "if",
  "unless",
  "where",
  "that",
  "who",
  "which",
  "whose",
]);

const beVerbs = new Set(["am", "is", "are", "was", "were", "be", "been", "being"]);
const haveVerbs = new Set(["have", "has", "had"]);
const doVerbs = new Set(["do", "does", "did"]);
const modals = new Set(["can", "could", "may", "might", "must", "should", "would", "will", "shall"]);
const linkingVerbs = new Set([
  "am",
  "is",
  "are",
  "was",
  "were",
  "be",
  "become",
  "becomes",
  "became",
  "feel",
  "feels",
  "felt",
  "seem",
  "seems",
  "look",
  "looks",
  "sound",
  "sounds",
  "remain",
  "remains",
]);

const commonVerbs = new Set([
  "ask",
  "asks",
  "asked",
  "begin",
  "begins",
  "began",
  "become",
  "becomes",
  "became",
  "communicate",
  "connect",
  "explain",
  "feel",
  "feels",
  "felt",
  "find",
  "finds",
  "found",
  "give",
  "gives",
  "gave",
  "go",
  "goes",
  "went",
  "had",
  "has",
  "have",
  "improve",
  "interview",
  "interviewed",
  "learn",
  "learns",
  "listening",
  "make",
  "makes",
  "made",
  "move",
  "moved",
  "notice",
  "noticed",
  "prepare",
  "prepared",
  "read",
  "reads",
  "realize",
  "realized",
  "repeat",
  "review",
  "reviews",
  "started",
  "starts",
  "suggest",
  "suggests",
  "use",
  "uses",
  "was",
  "were",
  "written",
  "write",
  "writes",
  "wrote",
]);

const intransitiveVerbs = new Set([
  "arrive",
  "arrived",
  "come",
  "comes",
  "die",
  "dies",
  "exist",
  "exists",
  "go",
  "goes",
  "happen",
  "happens",
  "improve",
  "improves",
  "live",
  "lives",
  "progress",
  "rise",
  "rises",
  "sleep",
  "sleeps",
  "travel",
  "travels",
  "wait",
  "waits",
  "work",
  "works",
]);

const irregularPastParticiples = new Set([
  "been",
  "begun",
  "broken",
  "built",
  "chosen",
  "done",
  "driven",
  "eaten",
  "found",
  "given",
  "gone",
  "known",
  "made",
  "read",
  "seen",
  "shown",
  "spoken",
  "taken",
  "thought",
  "written",
]);

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { words: [], grammar: [] };
    const parsed = JSON.parse(raw);
    return {
      words: Array.isArray(parsed.words) ? parsed.words : [],
      grammar: Array.isArray(parsed.grammar) ? parsed.grammar : [],
    };
  } catch {
    return { words: [], grammar: [] };
  }
}

let favorites = loadFavorites();

function saveFavorites() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  renderFavorites();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  nodes.toast.textContent = message;
  nodes.toast.classList.add("show");
  toastTimer = window.setTimeout(() => nodes.toast.classList.remove("show"), 1800);
}

function normalizeWord(word) {
  return word.toLowerCase().replace(/^['"]+|['".,!?;:]+$/g, "");
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim())
    .filter(Boolean) ?? [];
}

function tokenize(sentence) {
  return sentence.match(/[A-Za-z]+(?:'[A-Za-z]+)?|\d+(?:\.\d+)?|[^\sA-Za-z0-9]/g) ?? [];
}

function isWord(token) {
  return /^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(token);
}

function isPastParticiple(word) {
  return irregularPastParticiples.has(word) || word.endsWith("ed") || word.endsWith("en");
}

function isVerb(word, index, tokens) {
  if (beVerbs.has(word) || haveVerbs.has(word) || doVerbs.has(word) || modals.has(word)) return true;
  if (commonVerbs.has(word)) return true;
  if (word.endsWith("ing") && index > 0 && beVerbs.has(tokens[index - 1]?.norm)) return true;
  if (word.endsWith("ed")) return true;
  if (word.endsWith("s") && index > 0 && !determiners.has(tokens[index - 1]?.norm)) return true;
  return false;
}

function lookupWord(word) {
  const norm = normalizeWord(word);
  if (dictionary[norm]) {
    const [pos, zh, ja] = dictionary[norm];
    return { word, norm, pos, zh, ja };
  }
  if (norm.endsWith("ing")) {
    return {
      word,
      norm,
      pos: "动名词/现在分词",
      zh: `“${norm.replace(/ing$/, "")}” 的 -ing 形式，常表示正在进行或名词化动作`,
      ja: `「${norm.replace(/ing$/, "")}」の -ing 形。進行中の動作や名詞化を表す`,
    };
  }
  if (norm.endsWith("ed")) {
    return {
      word,
      norm,
      pos: "过去式/过去分词",
      zh: `“${norm.replace(/ed$/, "")}” 的过去式或过去分词形式`,
      ja: `「${norm.replace(/ed$/, "")}」の過去形または過去分詞`,
    };
  }
  if (norm.endsWith("ly")) {
    return {
      word,
      norm,
      pos: "副词",
      zh: "以 -ly 结尾，通常修饰动作、形容词或整句",
      ja: "-ly で終わる副詞。動詞・形容詞・文全体を修飾することが多い",
    };
  }
  if (norm.endsWith("tion") || norm.endsWith("ment") || norm.endsWith("ness")) {
    return {
      word,
      norm,
      pos: "名词",
      zh: "常见抽象名词后缀，表示行为、状态或性质",
      ja: "抽象名詞によくある接尾辞。行為・状態・性質を表す",
    };
  }
  return {
    word,
    norm,
    pos: guessPartOfSpeech(norm),
    zh: "词库未收录，可结合上下文理解",
    ja: "辞書には未収録。文脈から意味を確認",
  };
}

function guessPartOfSpeech(word) {
  if (pronouns.has(word)) return "代词";
  if (determiners.has(word)) return "限定词";
  if (prepositions.has(word)) return "介词";
  if (conjunctions.has(word)) return "连词";
  if (modals.has(word)) return "情态动词";
  if (beVerbs.has(word) || haveVerbs.has(word) || commonVerbs.has(word)) return "动词";
  if (word.endsWith("ly")) return "副词";
  if (word.endsWith("ous") || word.endsWith("ful") || word.endsWith("ive") || word.endsWith("able")) return "形容词";
  return "词";
}

function classifyToken(token, index, words) {
  const norm = normalizeWord(token);
  let pos = guessPartOfSpeech(norm);
  if (isVerb(norm, index, words)) pos = modals.has(norm) ? "情态动词" : "动词";
  return { raw: token, norm, pos, index };
}

function extendPredicateEnd(words, firstVerb) {
  let end = firstVerb;
  for (let i = firstVerb + 1; i < words.length; i += 1) {
    const norm = words[i].norm;
    const prev = words[i - 1]?.norm;
    if (norm === "not" || norm === "n't") {
      end = i;
      continue;
    }
    if (isVerb(norm, i, words) || (prev === "to" && commonVerbs.has(norm))) {
      end = i;
      continue;
    }
    if (norm === "to" && i + 1 < words.length && commonVerbs.has(words[i + 1].norm)) {
      end = i + 1;
      i += 1;
      continue;
    }
    break;
  }
  return end;
}

function findPredicate(words, fromIndex = 0) {
  const candidates = [];
  for (let i = fromIndex; i < words.length; i += 1) {
    if (isVerb(words[i].norm, i, words)) candidates.push(i);
  }
  if (!candidates.length) return { start: -1, end: -1, main: -1 };

  let firstVerb = candidates[0];
  const relativeIndex = words.findIndex(
    (token, index) => index >= fromIndex && ["who", "which", "that", "where"].includes(token.norm),
  );
  if (relativeIndex > fromIndex && relativeIndex < firstVerb) {
    const relativePredicateEnd = extendPredicateEnd(words, firstVerb);
    const mainCandidate = candidates.find((index) => index > relativePredicateEnd);
    if (mainCandidate) firstVerb = mainCandidate;
  }

  let start = firstVerb;
  while (start > fromIndex && ["often", "still", "also", "always", "usually", "sometimes", "never", "not"].includes(words[start - 1]?.norm)) {
    start -= 1;
  }

  const end = extendPredicateEnd(words, firstVerb);
  let main = end;
  for (let i = end; i >= start; i -= 1) {
    if (!modals.has(words[i].norm) && !haveVerbs.has(words[i].norm) && !doVerbs.has(words[i].norm)) {
      main = i;
      break;
    }
  }
  return { start, end, main };
}

function trimRoleTokens(tokens) {
  return tokens.filter((t) => !/^[,;:]$/.test(t.raw));
}

function roleText(tokens) {
  return trimRoleTokens(tokens).map((t) => t.raw).join(" ") || "未明显出现";
}

function detectAdverbialStart(words) {
  const commaIndex = words.findIndex((token) => token.raw === ",");
  if (commaIndex > 0) {
    const first = words[0]?.norm;
    if (["although", "when", "if", "because", "while", "after", "before", "as"].includes(first)) {
      return commaIndex + 1;
    }
  }
  return 0;
}

function collectPrepositionalPhrases(words, start) {
  const phrases = [];
  for (let i = start; i < words.length; i += 1) {
    if (!prepositions.has(words[i].norm)) continue;
    const phrase = [words[i]];
    let j = i + 1;
    while (j < words.length && !prepositions.has(words[j].norm) && !conjunctions.has(words[j].norm)) {
      phrase.push(words[j]);
      j += 1;
    }
    phrases.push(roleText(phrase));
    i = j - 1;
  }
  return phrases;
}

function detectGrammar(words, sentence) {
  const norms = words.map((w) => w.norm);
  const grammar = [];
  const add = (name, tip) => {
    if (!grammar.some((item) => item.name === name)) grammar.push({ name, tip });
  };

  norms.forEach((word, index) => {
    if (word === "if") add("条件状语从句", "if 引导条件，主句说明结果或建议。");
    if (["although", "though", "even"].includes(word)) add("让步状语从句", "承认背景，再表达主句重点。");
    if (["because", "since", "as"].includes(word)) add("原因状语从句", "用原因从句解释主句为什么成立。");
    if (["when", "while", "after", "before"].includes(word)) add("时间状语从句", "说明动作发生的时间条件。");
    if (["who", "which", "that", "where"].includes(word) && index > 0) {
      add("定语从句", "用从句修饰前面的名词，让信息更具体。");
    }
    if (modals.has(word)) add("情态动词", "情态动词后接动词原形，表达能力、可能、建议或义务。");
    if (word === "to" && commonVerbs.has(norms[index + 1])) add("不定式结构", "to + 动词原形，可表示目的、计划或补充说明。");
    if (word === "than" || (word === "more" && norms[index + 1])) add("比较结构", "通过比较级或 more ... than 表示差异。");
  });

  for (let i = 0; i < norms.length - 1; i += 1) {
    if (haveVerbs.has(norms[i]) && isPastParticiple(norms[i + 1])) {
      add("完成时", "have/has/had + 过去分词，强调已完成或到某时为止的经验。");
    }
    if (beVerbs.has(norms[i]) && norms[i + 1]?.endsWith("ing")) {
      add("进行时", "be + -ing，突出动作正在发生或持续。");
    }
    if (beVerbs.has(norms[i]) && isPastParticiple(norms[i + 1])) {
      add("被动语态", "be + 过去分词，焦点放在承受动作的人或事物。");
    }
  }

  if (/^\s*(do|does|did|can|could|will|would|should|is|are|was|were|have|has|had)\b/i.test(sentence) || sentence.trim().endsWith("?")) {
    add("疑问句", "助动词或情态动词提前，用来发问。");
  }

  if (!grammar.length) {
    add("基础陈述句", "句子主要依靠主语和谓语推进信息。");
  }
  return grammar;
}

function determineFrame(words, predicate) {
  if (!words.length) return { name: "空句", formula: "S + V", type: "sv" };
  const norms = words.map((w) => w.norm);
  if (norms[0] === "there" && beVerbs.has(norms[1])) {
    return { name: "There be 存在句", formula: "There + be + 名词 + 地点/补充", type: "there" };
  }
  if (predicate.start === -1) {
    return { name: "短语/标题结构", formula: "核心名词 + 修饰语", type: "phrase" };
  }
  const main = words[predicate.main]?.norm;
  const after = words.slice(predicate.end + 1).filter((w) => isWord(w.raw));
  const hasObjectLike = after.some((w) => !prepositions.has(w.norm) && !conjunctions.has(w.norm));
  const startsWithModifier = after.some(Boolean) && (
    after[0].norm.endsWith("ly") ||
    ["again", "away", "back", "better", "faster", "here", "less", "more", "slower", "there", "worse"].includes(after[0].norm)
  );
  const isPassive = predicate.main > 0 && beVerbs.has(words[predicate.main - 1]?.norm) && isPastParticiple(main);
  if (isPassive) return { name: "被动结构", formula: "S + be + 过去分词 + by/补充", type: "passive" };
  if (linkingVerbs.has(main)) return { name: "主系表结构", formula: "S + linking verb + complement", type: "svc" };
  if (intransitiveVerbs.has(main) && startsWithModifier) return { name: "主谓结构", formula: "S + V", type: "sv" };
  if (hasObjectLike) return { name: "主谓宾结构", formula: "S + V + O", type: "svo" };
  return { name: "主谓结构", formula: "S + V", type: "sv" };
}

function analyzeSentence(sentence, index) {
  const rawTokens = tokenize(sentence);
  const words = rawTokens.map((token, i) => (isWord(token) ? classifyToken(token, i, []) : { raw: token, norm: token, pos: "标点", index: i }));
  words.forEach((token, i) => {
    if (isWord(token.raw)) Object.assign(token, classifyToken(token.raw, i, words));
  });
  const wordOnly = words.filter((token) => isWord(token.raw) || /^[,;:]$/.test(token.raw));
  const startOffset = detectAdverbialStart(wordOnly);
  const predicate = findPredicate(wordOnly, startOffset);
  const frame = determineFrame(wordOnly, predicate);
  const grammar = detectGrammar(wordOnly, sentence);

  const subjectTokens = predicate.start > -1 ? wordOnly.slice(startOffset, predicate.start) : wordOnly.slice(0, 3);
  const predicateTokens = predicate.start > -1 ? wordOnly.slice(predicate.start, predicate.end + 1) : [];
  const afterPredicate = predicate.end > -1 ? wordOnly.slice(predicate.end + 1) : wordOnly.slice(3);
  const prepIndex = afterPredicate.findIndex((token) => prepositions.has(token.norm));
  let objectTokens = prepIndex > -1 ? afterPredicate.slice(0, prepIndex) : afterPredicate;
  let modifierTokens = prepIndex > -1 ? afterPredicate.slice(prepIndex) : [];
  const complementTokens = frame.type === "svc" ? afterPredicate : [];
  if (["sv", "passive"].includes(frame.type)) {
    objectTokens = [];
    modifierTokens = afterPredicate;
  }

  const roles = [];
  if (startOffset > 0) {
    roles.push({
      type: "modifier",
      label: "前置状语",
      text: roleText(wordOnly.slice(0, startOffset)),
      note: "放在句首，先交代时间、原因、让步或条件。",
    });
  }
  roles.push({
    type: "subject",
    label: "主语",
    text: roleText(subjectTokens),
    note: "句子谈论的对象，回答“谁/什么”。",
  });
  roles.push({
    type: "predicate",
    label: "谓语",
    text: roleText(predicateTokens),
    note: "核心动作或状态，决定句子的时态、语态和语气。",
  });
  if (frame.type === "svc") {
    roles.push({
      type: "complement",
      label: "表语",
      text: roleText(complementTokens),
      note: "说明主语的身份、状态或特征。",
    });
  } else if (roleText(objectTokens) !== "未明显出现") {
    roles.push({
      type: "object",
      label: "宾语",
      text: roleText(objectTokens),
      note: "动作影响或指向的对象。",
    });
  }
  const modifierText = roleText(modifierTokens);
  const prepositionalPhrases = collectPrepositionalPhrases(wordOnly, Math.max(predicate.end + 1, 0));
  if (modifierText !== "未明显出现" || prepositionalPhrases.length) {
    roles.push({
      type: "modifier",
      label: "修饰/补充",
      text: modifierText !== "未明显出现" ? modifierText : prepositionalPhrases.join("; "),
      note: "补充地点、时间、方式、原因或对象范围。",
    });
  }

  const tense = detectTense(wordOnly);
  const voice = grammar.some((item) => item.name === "被动语态") ? "被动" : "主动";
  const clauses = grammar
    .filter((item) => item.name.includes("从句"))
    .map((item) => item.name)
    .join("、") || "无明显从句";

  const explanation = buildExplanation(frame, grammar, tense, voice, clauses);
  return { sentence, index, rawTokens, words, roles, frame, grammar, tense, voice, clauses, explanation };
}

function detectTense(words) {
  const norms = words.map((w) => w.norm);
  if (norms.some((word, i) => haveVerbs.has(word) && isPastParticiple(norms[i + 1]))) return "完成时";
  if (norms.some((word, i) => beVerbs.has(word) && norms[i + 1]?.endsWith("ing"))) return "进行时";
  if (norms.some((word) => word === "will" || word === "shall")) return "一般将来时";
  if (norms.some((word) => word === "was" || word === "were" || word.endsWith("ed"))) return "一般过去时";
  if (norms.some((word) => word === "is" || word === "are" || word === "am" || word.endsWith("s"))) return "一般现在时";
  return "需结合上下文判断";
}

function buildExplanation(frame, grammar, tense, voice, clauses) {
  const items = [
    `整体框架是「${frame.formula}」，先找到谓语，再向前看主语、向后看宾语或补充成分。`,
    `时态倾向：${tense}；语态：${voice}；从句：${clauses}。`,
  ];
  grammar.slice(0, 3).forEach((item) => items.push(`${item.name}：${item.tip}`));
  return items;
}

function analyzeText() {
  const text = nodes.input.value.trim();
  const words = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
  nodes.stats.textContent = `${words.length} 词`;
  if (!text) {
    currentAnalysis = [];
    activeSentenceIndex = 0;
    renderEmpty();
    renderPractice();
    return;
  }
  const sentences = splitSentences(text);
  currentAnalysis = sentences.map(analyzeSentence);
  activeSentenceIndex = Math.min(activeSentenceIndex, currentAnalysis.length - 1);
  nodes.state.textContent = "已根据本地语法规则拆解";
  nodes.count.textContent = `${currentAnalysis.length} 句`;
  renderSentenceTabs();
  renderActiveSentence();
  buildPractice();
  renderReadings();
}

async function loadBbcNews() {
  bbcNewsLoading = true;
  renderReadings();
  try {
    const response = await fetch(`${NEWS_DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    bbcNewsItems = Array.isArray(data.items) ? data.items : [];
    bbcNewsMeta = data.meta ?? null;
  } catch {
    bbcNewsItems = [];
    bbcNewsMeta = null;
  } finally {
    bbcNewsLoading = false;
    readingOffset = 0;
    renderReadings();
  }
}

function renderEmpty() {
  nodes.count.textContent = "等待输入";
  nodes.tabs.innerHTML = "";
  nodes.syntax.innerHTML = `<div class="empty-state"><div><strong>粘贴英文，句子会在这里展开。</strong><br>每个单词可悬停查看中文和日语释义。</div></div>`;
  nodes.practiceFrame.textContent = "根据当前句型出题";
}

function renderSentenceTabs() {
  nodes.tabs.innerHTML = currentAnalysis
    .map(
      (item, index) =>
        `<button class="sentence-tab ${index === activeSentenceIndex ? "active" : ""}" data-index="${index}" type="button">S${index + 1}</button>`,
    )
    .join("");
}

function renderActiveSentence() {
  const active = currentAnalysis[activeSentenceIndex];
  if (!active) {
    renderEmpty();
    return;
  }
  const tokenHtml = active.rawTokens
    .map((token) => {
      if (!isWord(token)) return `<span class="punct">${escapeHtml(token)}</span>`;
      const info = lookupWord(token);
      return `<span class="word-token" tabindex="0" data-word="${escapeAttr(info.norm)}">${escapeHtml(token)}</span>`;
    })
    .join("");

  const rolesHtml = active.roles
    .map(
      (role) => `
        <div class="role-row">
          <div class="role-label ${role.type}">${escapeHtml(role.label)}</div>
          <div class="role-content">
            <strong>${escapeHtml(role.text)}</strong>
            <span>${escapeHtml(role.note)}</span>
          </div>
        </div>
      `,
    )
    .join("");

  const grammarTags = active.grammar.map((item) => `<span class="tag">${escapeHtml(item.name)}</span>`).join("");
  const explanation = active.explanation.map((line) => `<li>${escapeHtml(line)}</li>`).join("");

  nodes.syntax.innerHTML = `
    <div class="sentence-text">${tokenHtml}</div>
    <div class="grammar-summary">
      <div class="summary-cell"><span>句型</span><strong>${escapeHtml(active.frame.name)}</strong><br>${escapeHtml(active.frame.formula)}</div>
      <div class="summary-cell"><span>时态/语态</span><strong>${escapeHtml(active.tense)}</strong><br>${escapeHtml(active.voice)}</div>
      <div class="summary-cell"><span>从句</span><strong>${escapeHtml(active.clauses)}</strong></div>
    </div>
    <div class="role-map">${rolesHtml}</div>
    <div class="tag-row">${grammarTags}</div>
    <div class="explain-box">
      <h3>解析</h3>
      <ul>${explanation}</ul>
    </div>
  `;
  nodes.practiceFrame.textContent = active.frame.formula;
}

function buildPractice() {
  const active = currentAnalysis[activeSentenceIndex];
  if (!active) {
    activePractice = [];
    renderPractice();
    return;
  }
  const grammar = active.grammar[0]?.name ?? "基础陈述句";
  const framePrompt = getFramePrompt(active.frame.type, active.frame.formula);
  activePractice = [
    {
      type: "frame",
      label: "框架复用",
      prompt: framePrompt,
      checker: (answer) => evaluateFrame(answer, active.frame.type),
    },
    {
      type: "grammar",
      label: grammar,
      prompt: getGrammarPrompt(grammar),
      checker: (answer) => evaluateGrammar(answer, grammar),
    },
    {
      type: "upgrade",
      label: "加一点难度",
      prompt: `用同样主题写一句更完整的话，至少加入一个介词短语或连接词。`,
      checker: (answer) => evaluateUpgrade(answer),
    },
  ];
  renderPractice();
}

function getFramePrompt(type, formula) {
  const map = {
    svo: `按照「${formula}」写一句英文，主题可以是学习、工作或旅行。`,
    svc: `按照「${formula}」写一句英文，用表语描述一个人或事物的状态。`,
    sv: `按照「${formula}」写一句英文，动作要清楚，句子可以很短。`,
    passive: "写一句被动句，结构为「主语 + be + 过去分词 + 补充」。",
    there: "写一句 There be 句型，说明某处有什么。",
    phrase: "把短语扩展成一个完整英文句子，至少包含主语和谓语。",
  };
  return map[type] ?? `按照「${formula}」写一句英文。`;
}

function getGrammarPrompt(grammar) {
  if (grammar.includes("定语从句")) return "写一句包含 who / which / that 的定语从句。";
  if (grammar.includes("条件")) return "写一句 if 条件句，表达一个学习建议。";
  if (grammar.includes("让步")) return "写一句 although 让步句，主句表达真实结果。";
  if (grammar.includes("原因")) return "写一句 because 原因句，解释一个选择。";
  if (grammar.includes("时间")) return "写一句 when / after / before 时间从句。";
  if (grammar.includes("被动")) return "写一句被动语态，说明某件事由谁完成。";
  if (grammar.includes("完成")) return "写一句 have / has / had + 过去分词。";
  if (grammar.includes("进行")) return "写一句 be + -ing，描述正在发生的动作。";
  if (grammar.includes("情态")) return "写一句带 can / should / must 的建议或能力句。";
  if (grammar.includes("不定式")) return "写一句 to + 动词原形，表达目的。";
  if (grammar.includes("比较")) return "写一句 more ... than 或 -er than 的比较句。";
  return "写一句清楚的陈述句，主语和谓语都要明确。";
}

function renderPractice() {
  if (!activePractice.length) {
    nodes.practiceList.innerHTML = `<div class="empty-state"><div><strong>分析后会生成练习。</strong><br>每道题会按你的回答给出点评。</div></div>`;
    return;
  }
  nodes.practiceList.innerHTML = activePractice
    .map(
      (item, index) => `
        <div class="practice-item" data-practice="${index}">
          <div class="practice-prompt">
            <span>${escapeHtml(item.label)}</span>
            <p>${escapeHtml(item.prompt)}</p>
          </div>
          <div class="practice-answer">
            <input aria-label="${escapeAttr(item.label)}回答" placeholder="Write your sentence..." />
            <button class="primary-button check-practice" type="button">点评</button>
          </div>
          <div class="feedback" aria-live="polite"></div>
        </div>
      `,
    )
    .join("");
}

function evaluateFrame(answer, type) {
  const analysis = analyzeSentence(answer, 0);
  const wordCount = (answer.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).length;
  const hasVerb = analysis.roles.some((role) => role.type === "predicate" && role.text !== "未明显出现");
  const hasSubject = analysis.roles.some((role) => role.type === "subject" && role.text !== "未明显出现");
  if (wordCount < 4) return "句子偏短。先补出清楚的主语和谓语，再加一个宾语或补充成分。";
  if (!hasVerb) return "还没有抓到明显谓语。英文句子的骨架通常需要一个核心动词。";
  if (!hasSubject) return "主语不够明确。试着把动作是谁做的放在动词前面。";
  if (type === "passive" && !analysis.grammar.some((item) => item.name === "被动语态")) {
    return "内容能读懂，不过这次目标是被动语态。可以用 is/was + past participle。";
  }
  if (type === "there" && !answer.trim().toLowerCase().startsWith("there")) {
    return "句子可用，但 There be 框架需要以 There is / There are 开头。";
  }
  return `不错，骨架清楚。系统识别到「${analysis.frame.formula}」。下一步可以尝试加入时间、地点或原因短语，让信息更完整。`;
}

function evaluateGrammar(answer, grammar) {
  const lower = answer.toLowerCase();
  const analysis = analyzeSentence(answer, 0);
  const found = analysis.grammar.map((item) => item.name);
  if (answer.trim().length < 12) return "先写成一个完整句子，再检查目标语法是否出现。";
  if (grammar.includes("定语从句") && !/\b(who|which|that|where)\b/.test(lower)) {
    return "还没有明显的定语从句。可以在名词后加 who / which / that 来补充说明。";
  }
  if (grammar.includes("条件") && !/\bif\b/.test(lower)) return "目标是 if 条件句，可以用 If + 条件, 主句。";
  if (grammar.includes("让步") && !/\balthough|though\b/.test(lower)) return "目标是让步关系，可以用 Although 开头。";
  if (grammar.includes("原因") && !/\bbecause|since|as\b/.test(lower)) return "原因关系还不明显，可以加入 because。";
  if (grammar.includes("时间") && !/\bwhen|after|before|while\b/.test(lower)) return "时间从句还不明显，可以加入 when / after / before。";
  if (grammar.includes("被动") && !found.includes("被动语态")) return "被动语态需要 be + 过去分词，例如 was written / is made。";
  if (grammar.includes("完成") && !found.includes("完成时")) return "完成时需要 have / has / had + 过去分词。";
  if (grammar.includes("进行") && !found.includes("进行时")) return "进行时需要 be + -ing。";
  if (grammar.includes("情态") && !/\b(can|could|should|must|may|might|will|would)\b/.test(lower)) {
    return "情态动词还没出现。试试 can / should / must + 动词原形。";
  }
  if (grammar.includes("不定式") && !/\bto\s+[a-z]+\b/.test(lower)) return "不定式结构需要 to + 动词原形。";
  if (grammar.includes("比较") && !/\bthan\b|\bmore\b/.test(lower)) return "比较关系还不明显，可以用 more ... than 或 -er than。";
  return `命中目标语法。${found.length ? `我还看到了：${found.slice(0, 3).join("、")}。` : ""} 注意动词形式和标点，句子会更自然。`;
}

function evaluateUpgrade(answer) {
  const wordCount = (answer.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).length;
  const lower = answer.toLowerCase();
  if (wordCount < 7) return "这句还可以更丰满。加一个地点、时间、原因或方式短语。";
  if (!Array.from(prepositions).some((prep) => lower.includes(` ${prep} `)) && !Array.from(conjunctions).some((conj) => lower.includes(` ${conj} `))) {
    return "句子核心不错，但还没看到介词短语或连接词。试着加入 in / with / because / when。";
  }
  return "这句有扩展信息，表达比基础句更具体。下一步可以检查连接词前后逻辑是否紧密。";
}

function renderFavorites() {
  nodes.favStats.textContent = `${favorites.words.length} 个单词，${favorites.grammar.length} 条语法`;
  nodes.favTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.favTab === activeFavTab));
  const list = favorites[activeFavTab] ?? [];
  if (!list.length) {
    nodes.favList.innerHTML = `<div class="empty-state"><div><strong>暂无收藏。</strong><br>${activeFavTab === "words" ? "悬停单词即可收藏。" : "分析句子后可收藏语法。"}</div></div>`;
    return;
  }
  nodes.favList.innerHTML = list
    .map((item, index) => {
      if (activeFavTab === "words") {
        return `
          <div class="favorite-item">
            <div>
              <strong>${escapeHtml(item.word)}</strong>
              <span>${escapeHtml(item.pos)} · 中文：${escapeHtml(item.zh)} · 日本語：${escapeHtml(item.ja)}</span>
            </div>
            <div class="mini-actions">
              <button class="mini-button speak-fav-word" data-index="${index}" type="button" title="朗读">▶</button>
              <button class="mini-button remove-fav" data-index="${index}" type="button" title="移除">×</button>
            </div>
          </div>
        `;
      }
      return `
        <div class="favorite-item">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.sentence)}</span>
          </div>
          <button class="mini-button remove-fav" data-index="${index}" type="button" title="移除">×</button>
        </div>
      `;
    })
    .join("");
}

function addWordFavorite(word) {
  const info = lookupWord(word);
  if (favorites.words.some((item) => item.norm === info.norm)) {
    showToast("这个单词已经在收藏里");
    return;
  }
  favorites.words.unshift(info);
  saveFavorites();
  showToast("已收藏单词");
}

function addGrammarFavorite() {
  const active = currentAnalysis[activeSentenceIndex];
  if (!active) {
    showToast("先分析一个句子");
    return;
  }
  const name = active.grammar.map((item) => item.name).join("、");
  const key = `${name}-${active.sentence}`;
  if (favorites.grammar.some((item) => item.key === key)) {
    showToast("这条语法已经收藏过");
    return;
  }
  favorites.grammar.unshift({
    key,
    name,
    frame: active.frame.formula,
    sentence: active.sentence,
  });
  saveFavorites();
  showToast("已收藏语法");
}

function getLearningPack(item) {
  if (item.learning) return item.learning;
  return {
    reading: [
      "This study version expands the headline and short source summary into a longer learning task. Read for the main actor, action, result, and context.",
      "After you understand the short summary, open the BBC link and check the details. Then rewrite your own summary without copying the original wording.",
    ],
    vocabulary: [],
    grammar: [
      {
        name: "新闻标题压缩",
        pattern: "headline + summary + follow-up question",
        explanation: "先把标题扩写成完整句，再用摘要补充背景。",
        task: "用 The report says that ... 写一句完整句。",
      },
    ],
    comprehension: [
      "What happened?",
      "Who was affected?",
      "What extra detail do you need from the full article?",
    ],
    drills: [
      "Write a 35-50 word summary in your own words.",
      "Write one sentence with because.",
    ],
    shadowing: ["I read the headline first, then I use the summary to build context."],
  };
}

function renderLearningList(items, className = "") {
  return items
    .map((item, index) => `<li class="${className}"><span>${index + 1}</span>${escapeHtml(item)}</li>`)
    .join("");
}

function renderLearningPack(item) {
  const learning = getLearningPack(item);
  const reading = Array.isArray(learning.reading) ? learning.reading : [];
  const vocabulary = Array.isArray(learning.vocabulary) ? learning.vocabulary : [];
  const grammar = Array.isArray(learning.grammar) ? learning.grammar : [];
  const comprehension = Array.isArray(learning.comprehension) ? learning.comprehension : [];
  const drills = Array.isArray(learning.drills) ? learning.drills : [];
  const shadowing = Array.isArray(learning.shadowing) ? learning.shadowing : [];

  const vocabHtml = vocabulary.length
    ? vocabulary
        .map(
          (word) => `
            <div class="learning-vocab">
              <strong>${escapeHtml(word.word)}</strong>
              <span>中文：${escapeHtml(word.zh)} · 日本語：${escapeHtml(word.ja)}</span>
              <p>${escapeHtml(word.note)}</p>
              <em>${escapeHtml(word.example)}</em>
            </div>
          `,
        )
        .join("")
    : `<p class="learning-muted">打开 BBC 原文后，把你遇到的新词补进自己的收藏表。</p>`;

  const grammarHtml = grammar
    .map(
      (point) => `
        <div class="learning-point">
          <strong>${escapeHtml(point.name)}</strong>
          <code>${escapeHtml(point.pattern)}</code>
          <p>${escapeHtml(point.explanation)}</p>
          <em>${escapeHtml(point.task)}</em>
        </div>
      `,
    )
    .join("");

  return `
    <div class="learning-pack">
      <div class="learning-section">
        <h3>学习版长读</h3>
        ${reading.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      </div>
      <div class="learning-section">
        <h3>重点词汇</h3>
        <div class="learning-vocab-grid">${vocabHtml}</div>
      </div>
      <div class="learning-section">
        <h3>语法观察</h3>
        <div class="learning-point-grid">${grammarHtml}</div>
      </div>
      <div class="learning-section">
        <h3>理解题</h3>
        <ol class="learning-list">${renderLearningList(comprehension)}</ol>
      </div>
      <div class="learning-section">
        <h3>造句训练</h3>
        <ol class="learning-list">${renderLearningList(drills)}</ol>
      </div>
      <div class="learning-section">
        <h3>跟读句</h3>
        <ol class="learning-list shadowing-list">${renderLearningList(shadowing)}</ol>
      </div>
    </div>
  `;
}

function renderReadings() {
  if (bbcNewsLoading) {
    nodes.readingHint.textContent = "正在读取 BBC 头条";
    nodes.readingList.innerHTML = `<div class="empty-state"><div><strong>正在加载 BBC News。</strong><br>新闻由 GitHub Actions 每日更新。</div></div>`;
    return;
  }

  if (!bbcNewsItems.length) {
    nodes.readingHint.textContent = "暂时无法读取新闻";
    nodes.readingList.innerHTML = `<div class="empty-state"><div><strong>没有可显示的 BBC 头条。</strong><br>请稍后刷新，或等待下一次每日更新。</div></div>`;
    return;
  }

  const level = nodes.level.value;
  const levelIndex = levels.indexOf(level);
  const pool = bbcNewsItems.filter((item) => {
    const diff = levels.indexOf(item.level) - levelIndex;
    return diff >= 0 && diff <= 1;
  });
  const fallback = bbcNewsItems.filter((item) => Math.abs(levels.indexOf(item.level) - levelIndex) <= 1);
  const source = pool.length ? pool : fallback.length ? fallback : bbcNewsItems;
  const rotated = source
    .slice(readingOffset)
    .concat(source.slice(0, readingOffset))
    .slice(0, 3);
  const updated = bbcNewsMeta?.updatedAt ? new Date(bbcNewsMeta.updatedAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" }) : "每日";
  nodes.readingHint.textContent = `BBC Top Stories · 更新于 ${updated}`;
  nodes.readingList.innerHTML = rotated
    .map(
      (item) => `
        <article class="reading-item">
          <a class="reading-title" href="${escapeAttr(item.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>
          <span class="source-summary">BBC 摘要：${escapeHtml(item.summary)}</span>
          <div class="reading-meta">
            <b>${escapeHtml(item.level)}</b>
            <b>BBC News</b>
            ${item.tags.map((tag) => `<b>${escapeHtml(tag)}</b>`).join("")}
          </div>
          ${renderLearningPack(item)}
        </article>
      `,
    )
    .join("");
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    showToast("当前浏览器不支持朗读");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function showPopover(word, target) {
  const info = lookupWord(word);
  popoverWord = info.norm;
  nodes.popover.innerHTML = `
    <div class="popover-head">
      <div>
        <strong>${escapeHtml(info.word)}</strong>
        <div class="tag-row"><span class="tag">${escapeHtml(info.pos)}</span></div>
      </div>
      <div class="popover-actions">
        <button class="mini-button" id="speakWordBtn" type="button" title="朗读单词">▶</button>
        <button class="mini-button" id="saveWordBtn" type="button" title="收藏单词">☆</button>
      </div>
    </div>
    <div class="popover-defs">
      <div>中文：${escapeHtml(info.zh)}</div>
      <div>日本語：${escapeHtml(info.ja)}</div>
    </div>
  `;
  const rect = target.getBoundingClientRect();
  const popRect = { width: 310, height: 150 };
  let left = rect.left;
  let top = rect.bottom + 8;
  if (left + popRect.width > window.innerWidth - 12) left = window.innerWidth - popRect.width - 12;
  if (top + popRect.height > window.innerHeight - 12) top = rect.top - popRect.height - 8;
  nodes.popover.style.left = `${Math.max(12, left)}px`;
  nodes.popover.style.top = `${Math.max(12, top)}px`;
  nodes.popover.classList.add("show");
  nodes.popover.setAttribute("aria-hidden", "false");
}

function hidePopoverSoon() {
  window.clearTimeout(popoverTimer);
  popoverTimer = window.setTimeout(() => {
    nodes.popover.classList.remove("show");
    nodes.popover.setAttribute("aria-hidden", "true");
  }, 180);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

let analyzeTimer = null;
nodes.input.addEventListener("input", () => {
  const words = nodes.input.value.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
  nodes.stats.textContent = `${words.length} 词`;
  nodes.state.textContent = words.length ? "正在准备分析" : "粘贴英文后会自动分析";
  window.clearTimeout(analyzeTimer);
  analyzeTimer = window.setTimeout(analyzeText, 420);
});

nodes.analyze.addEventListener("click", analyzeText);

nodes.sample.addEventListener("click", () => {
  const next = samples[(Math.floor(Math.random() * samples.length) + Date.now()) % samples.length];
  nodes.input.value = next;
  activeSentenceIndex = 0;
  analyzeText();
});

nodes.clear.addEventListener("click", () => {
  nodes.input.value = "";
  analyzeText();
});

nodes.tabs.addEventListener("click", (event) => {
  const button = event.target.closest(".sentence-tab");
  if (!button) return;
  activeSentenceIndex = Number(button.dataset.index);
  renderSentenceTabs();
  renderActiveSentence();
  buildPractice();
});

nodes.syntax.addEventListener("mouseover", (event) => {
  const token = event.target.closest(".word-token");
  if (!token) return;
  window.clearTimeout(popoverTimer);
  $$(".word-token", nodes.syntax).forEach((item) => item.classList.remove("focused"));
  token.classList.add("focused");
  showPopover(token.dataset.word, token);
});

nodes.syntax.addEventListener("focusin", (event) => {
  const token = event.target.closest(".word-token");
  if (!token) return;
  token.classList.add("focused");
  showPopover(token.dataset.word, token);
});

nodes.syntax.addEventListener("mouseout", (event) => {
  const token = event.target.closest(".word-token");
  if (!token) return;
  token.classList.remove("focused");
  hidePopoverSoon();
});

nodes.syntax.addEventListener("focusout", (event) => {
  const token = event.target.closest(".word-token");
  if (!token) return;
  token.classList.remove("focused");
  hidePopoverSoon();
});

nodes.popover.addEventListener("mouseenter", () => window.clearTimeout(popoverTimer));
nodes.popover.addEventListener("mouseleave", hidePopoverSoon);
nodes.popover.addEventListener("click", (event) => {
  if (event.target.closest("#speakWordBtn") && popoverWord) speak(popoverWord);
  if (event.target.closest("#saveWordBtn") && popoverWord) addWordFavorite(popoverWord);
});

nodes.favGrammar.addEventListener("click", addGrammarFavorite);

nodes.practiceList.addEventListener("click", (event) => {
  const button = event.target.closest(".check-practice");
  if (!button) return;
  const item = button.closest(".practice-item");
  const index = Number(item.dataset.practice);
  const input = $("input", item);
  const feedback = $(".feedback", item);
  feedback.textContent = activePractice[index].checker(input.value);
  feedback.classList.add("show");
});

nodes.newPractice.addEventListener("click", () => {
  buildPractice();
  showToast("题目已刷新");
});

nodes.favTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeFavTab = tab.dataset.favTab;
    renderFavorites();
  });
});

nodes.favList.addEventListener("click", (event) => {
  const remove = event.target.closest(".remove-fav");
  if (remove) {
    favorites[activeFavTab].splice(Number(remove.dataset.index), 1);
    saveFavorites();
    return;
  }
  const speakButton = event.target.closest(".speak-fav-word");
  if (speakButton) {
    const item = favorites.words[Number(speakButton.dataset.index)];
    if (item) speak(item.word);
  }
});

nodes.clearFavorites.addEventListener("click", () => {
  if (activeFavTab === "words") {
    favorites.words = [];
  } else {
    favorites.grammar = [];
  }
  saveFavorites();
  showToast("已清空当前收藏栏");
});

nodes.refreshReading.addEventListener("click", () => {
  readingOffset = bbcNewsItems.length ? (readingOffset + 1) % bbcNewsItems.length : 0;
  renderReadings();
});

nodes.level.addEventListener("change", renderReadings);

nodes.speakAll.addEventListener("click", () => {
  const text = nodes.input.value.trim();
  speak(text || "Please paste English text first.");
});

nodes.stopSpeak.addEventListener("click", () => {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
});

renderEmpty();
renderFavorites();
renderReadings();
loadBbcNews();
nodes.input.value = samples[1];
analyzeText();
