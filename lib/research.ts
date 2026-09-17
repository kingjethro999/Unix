export type ResearchSource = { title: string; url: string; snippet: string };

const timeout = (ms = 15_000) => AbortSignal.timeout(ms);
const clean = (value: unknown, max = 4_000) =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";

async function exa(query: string): Promise<ResearchSource[]> {
  if (!process.env.EXA_API_KEY) return [];
  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    signal: timeout(),
    headers: {
      "x-api-key": process.env.EXA_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      numResults: 3,
      contents: { text: { maxCharacters: 1200 } },
    }),
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    results?: Array<{ title?: string; url?: string; text?: string }>;
  };
  return (payload.results || []).flatMap((item) =>
    item.url
      ? [
          {
            title: clean(item.title) || new URL(item.url).hostname,
            url: item.url,
            snippet: clean(item.text, 1200),
          },
        ]
      : [],
  );
}

async function tavily(query: string): Promise<ResearchSource[]> {
  if (!process.env.TAVILY_API_KEY) return [];
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    signal: timeout(),
    headers: {
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      max_results: 3,
      search_depth: "basic",
      include_answer: false,
    }),
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    results?: Array<{ title?: string; url?: string; content?: string }>;
  };
  return (payload.results || []).flatMap((item) =>
    item.url
      ? [
          {
            title: clean(item.title) || new URL(item.url).hostname,
            url: item.url,
            snippet: clean(item.content, 1200),
          },
        ]
      : [],
  );
}

async function firecrawl(url: string) {
  if (!process.env.FIRECRAWL_API_KEY) return "";
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    signal: timeout(),
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
  });
  if (!response.ok) return "";
  const payload = (await response.json()) as {
    markdown?: string;
    data?: { markdown?: string };
  };
  return clean(payload.markdown || payload.data?.markdown, 3_000);
}

async function jina(url: string) {
  if (!process.env.JINA_API_KEY) return "";
  const response = await fetch(`https://r.jina.ai/${url}`, {
    signal: timeout(),
    headers: { Authorization: `Bearer ${process.env.JINA_API_KEY}` },
  });
  return response.ok ? clean(await response.text(), 3_000) : "";
}

export async function gatherResearch(query: string) {
  const found = await Promise.allSettled([exa(query), tavily(query)]);
  const unique = new Map<string, ResearchSource>();
  for (const item of found)
    if (item.status === "fulfilled")
      for (const source of item.value)
        if (!unique.has(source.url)) unique.set(source.url, source);
  const sources = [...unique.values()].slice(0, 4);
  await Promise.all(
    sources.slice(0, 2).map(async (source) => {
      const text = (await firecrawl(source.url)) || (await jina(source.url));
      if (text) source.snippet = text;
    }),
  );
  return sources;
}
