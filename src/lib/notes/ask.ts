/** Hand a lesson question to an external AI assistant with the lesson context pre-filled. */
export type AskProvider = "chatgpt" | "claude" | "perplexity" | "google";

export const ASK_PROVIDERS: Array<{ id: AskProvider; name: string }> = [
  { id: "chatgpt", name: "ChatGPT" },
  { id: "claude", name: "Claude" },
  { id: "perplexity", name: "Perplexity" },
  { id: "google", name: "Google" },
];

export interface AskContext {
  lessonTitle: string;
  world: string;
  /** What was on screen / being explained when the question came up */
  context?: string;
}

/** A self-contained prompt: works in any assistant without extra setup. */
export function buildPrompt(question: string, ctx: AskContext): string {
  const parts = [
    `I'm an electronic music producer (I use Ableton, make house/techno) learning music theory.`,
    `Lesson: "${ctx.lessonTitle}" (${ctx.world}).`,
    ctx.context ? `The lesson just explained: "${ctx.context}"` : "",
    `My question: ${question.trim()}`,
    `Please answer simply and briefly, with a concrete example on a piano keyboard or in Ableton if it helps.`,
  ];
  return parts.filter(Boolean).join("\n");
}

export function askUrl(provider: AskProvider, question: string, ctx: AskContext): string {
  const full = encodeURIComponent(buildPrompt(question, ctx));
  switch (provider) {
    case "chatgpt":
      return `https://chatgpt.com/?q=${full}`;
    case "claude":
      return `https://claude.ai/new?q=${full}`;
    case "perplexity":
      return `https://www.perplexity.ai/search?q=${full}`;
    case "google":
      // A search engine works best with the short question plus the topic
      return `https://www.google.com/search?q=${encodeURIComponent(`${question.trim()} ${ctx.lessonTitle} music theory`)}`;
  }
}
