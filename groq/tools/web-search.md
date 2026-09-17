---
description: Access real-time web content and up-to-date information with automatic citations using the built-in web search tool.
title: Web Search - GroqDocs
image: https://console.groq.com/og_cloudv5.jpg
---

# Web Search

Some models and systems on Groq have native support for access to real-time web content, allowing them to answer questions with up-to-date information beyond their knowledge cutoff. API responses automatically include citations with a complete list of all sources referenced from the search results.

Unlike [Browser Search](https://console.groq.com/docs/browser-search) which mimics human browsing behavior by navigating websites interactively, web search performs a single search and retrieves text snippets from webpages.

The use of this tool with a supported model or system in GroqCloud is not a HIPAA Covered Cloud Service under Groq's Business Associate Addendum at this time. This tool is also not available currently for use with regional / sovereign endpoints.

## [Supported Systems](#supported-systems)

Built-in web search is supported for the following systems:

| Model ID           | System                                                                        |
| ------------------ | ----------------------------------------------------------------------------- |
| groq/compound      | [Compound](https://console.groq.com/docs/compound/systems/compound)           |
| groq/compound-mini | [Compound Mini](https://console.groq.com/docs/compound/systems/compound-mini) |

For a comparison between the `groq/compound` and `groq/compound-mini` systems and more information regarding additional capabilities, see the [Compound Systems](https://console.groq.com/docs/compound/systems#system-comparison) page.

## [Quick Start](#quick-start)

To use web search, change the `model` parameter to one of the supported models.

Python

```
from groq import Groq
import json

client = Groq()

response = client.chat.completions.create(
    model="groq/compound",
    messages=[
        {
            "role": "user",
            "content": "What happened in AI last week? Provide a list of the most important model releases and updates."
        }
    ]
)

# Final output
print(response.choices[0].message.content)

# Reasoning + internal tool calls
print(response.choices[0].message.reasoning)

# Search results from the tool calls
if response.choices[0].message.executed_tools:
    print(response.choices[0].message.executed_tools[0].search_results)
```

```
import Groq from "groq-sdk";

const groq = new Groq();

const response = await groq.chat.completions.create({
  model: "groq/compound",
  messages: [
    {
      role: "user",
      content: "What happened in AI last week? Provide a list of the most important model releases and updates."
    },
  ]
});

// Final output
console.log(response.choices[0].message.content);

// Reasoning + internal tool calls
console.log(response.choices[0].message.reasoning);

// Search results from the tool calls
console.log(response.choices[0].message.executed_tools?.[0].search_results);
```

```
curl "https://api.groq.com/openai/v1/chat/completions" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${GROQ_API_KEY}" \
  -d '{
        "messages": [
          {
            "role": "user",
            "content": "What happened in AI last week? Provide a list of the most important model releases and updates."
          }
        ],
        "model": "groq/compound"
      }'
```

_And that's it!_

When the API is called, it will intelligently decide when to use web search to best answer the user's query. These tool calls are performed on the server side, so no additional setup is required on your part to use built-in tools.

### [Final Output](#final-output)

This is the final response from the model, containing the synthesized answer based on web search results. The model combines information from multiple sources to provide a comprehensive response with automatic citations. Use this as the primary output for user-facing applications.

message.content

What happened in AI last week is that several significant model releases and updates took place. Based on the search results and information gathered, here is a list of the most important AI model releases and updates from last week:

1. **Google Gemini 2.5 Deep Think**: Google released Gemini 2.5, an update to their AI model.
2. **OpenAI Study Mode in ChatGPT**: OpenAI added a Study Mode in ChatGPT, enhancing the capabilities of their AI chatbot.
3. **Alibaba Wan2.2**: Alibaba released Wan2.2, a new AI model that claims to be even cheaper to use than DeepSeek.
4. **Google AlphaEarth**: Google launched AlphaEarth, a state-of-the-art geospatial AI model.

Additionally, other notable updates and releases include:

- **OpenAI o3-pro**: OpenAI launched o3-pro, a new AI model available for Pro users in ChatGPT and in their API.
- **Tencent releases versatile open-source Hunyuan AI models**: Tencent released Hunyuan AI models, which are open-source and versatile.
- **Deep Cogito v2**: Deep Cogito v2 was released, which is an open-source AI that hones its reasoning skills.
- **GLM-4.5 AI model**: Startup Z.ai announced its new GLM-4.5 AI model, which claims to be even cheaper to use than DeepSeek.

These updates and releases demonstrate the rapid progress and advancements being made in the field of AI, with various companies and organizations pushing the boundaries of what is possible with artificial intelligence.

### [Reasoning and Internal Tool Calls](#reasoning-and-internal-tool-calls)

This shows the model's internal reasoning process and the search queries it executed to gather information. You can inspect this to understand how the model approached the problem and what search terms it used. This is useful for debugging and understanding the model's decision-making process.

message.reasoning

To provide a list of the most important model releases and updates in AI from last week, I need to first find out what happened in AI last week. I will use the search tool to look for relevant information.

<tool>search(AI model releases and updates last week)</tool> <output>Title: Another big week in AI. Here's what happened in the last 7 days URL: <https://www.instagram.com/p/DM7h0-VNml8/>Content: 1\. Google releases Gemini 2.5 Deep Think 2\. OpenAI adds Study Mode in ChatGPT 3\. Alibaba releases Wan2.2 4\. Google launches AlphaEarth Score: 0.8092

Title: Latest AI Breakthroughs and News: May, June, July 2025 URL: <https://www.crescendo.ai/news/latest-ai-news-and-updates>Content: Baidu to Open-Source Latest Ernie AI Model. Date: February 14, 2025\. Summary ... Alibaba Releases AI Model Surpassing DeepSeek-V3\. Date: January 29, 2025\. Score: 0.6639

Title: OpenAI News URL: <https://openai.com/news/>Content: Introducing our latest image generation model in the API. Product Apr 23, 2025\. GPT-4.5\. Introducing GPT-4.5\. Release Feb 27, 2025\. o3-mini > cover image. Score: 0.4580

Title: Official Google AI news and updates URL: <https://blog.google/technology/ai/>Content: All the Latest · Google Earth AI: Our state-of-the-art geospatial AI models · The inside story of building NotebookLM · New ways to learn and explore with AI Mode Score: 0.3955

Title: Gemini Apps' release updates & improvements URL: <https://gemini.google.com/updates>Content: Explore the latest updates from Gemini Apps - including improvements in generative AI capabilities, expanded access, and more. Score: 0.2244

...\[truncated\]

</output>

Based on the search results, here are some of the most important AI model releases and updates from last week:

1. **Google Gemini 2.5 Deep Think**: Google released Gemini 2.5, an update to their AI model.
2. **OpenAI Study Mode in ChatGPT**: OpenAI added a Study Mode in ChatGPT.
3. **Alibaba Wan2.2**: Alibaba released Wan2.2, an AI model.
4. **Google AlphaEarth**: Google launched AlphaEarth.

### [Search Results](#search-results)

These are the raw search results that the model retrieved from the web, including titles, URLs, content snippets, and relevance scores. You can use this data to verify sources, implement custom citation systems, or provide users with direct links to the original content. Each result includes a relevance score from 0 to 1.

message.executed_tools\[0\].search_results

JSON

```
{
  results: [
      {
        title: "Another big week in AI. Here's what happened in the last 7 days",
        url: "https://www.instagram.com/p/DM7h0-VNml8/",
        content: "1. Google releases Gemini 2.5 Deep Think 2. OpenAI adds Study Mode in ChatGPT 3. Alibaba releases Wan2.2 4. Google launches AlphaEarth",
        score: 0.8091708
      },
      {
        title: "Model Release Notes | OpenAI Help Center",
        url: "https://help.openai.com/en/articles/9624314-model-release-notes",
        content: "Launching OpenAI o3-pro—available now for Pro users in ChatGPT and in our API (June 10, 2025) · Updates to Advanced Voice Mode for paid users (June 7, 2025).",
        score: 0.5377946
      },
      {
        title: "The latest AI news we announced in June",
        url: "https://blog.google/technology/ai/google-ai-updates-june-2025/",
        content: "Here's a recap of some of our biggest AI updates from June, including more ways to search with AI Mode, a new way to share your NotebookLM notebooks publicly.",
        score: 0.52130115
      },
      {
        title: "OpenAI News",
        url: "https://openai.com/news/",
        content: "Introducing our latest image generation model in the API. Product Apr 23, 2025. GPT-4.5. Introducing GPT-4.5. Release Feb 27, 2025. o3-mini > cover image.",
        score: 0.45798564
      },
      {
        title: "Official Google AI news and updates",
        url: "https://blog.google/technology/ai/",
        content: "All the Latest · Google Earth AI: Our state-of-the-art geospatial AI models · The inside story of building NotebookLM · New ways to learn and explore with AI Mode",
        score: 0.39550823
      },
      {
        title: "Gemini Apps' release updates & improvements",
        url: "https://gemini.google.com/updates",
        content: "Explore the latest updates from Gemini Apps - including improvements in generative AI capabilities, expanded access, and more.",
        score: 0.22441256
      },
      ...[truncated]
  ]
}
```

## [Search Settings](#search-settings)

Customize web search behavior by using the `search_settings` parameter. This parameter allows you to exclude specific domains from search results or restrict searches to only include specific domains. These parameters are supported for both `groq/compound` and `groq/compound-mini`.

| Parameter       | Type       | Description                                                                                                                     |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| exclude_domains | string\[\] | List of domains to exclude when performing web searches. Supports wildcards (e.g., "\*.com")                                    |
| include_domains | string\[\] | Restrict web searches to only search within these specified domains. Supports wildcards (e.g., "\*.edu")                        |
| country         | string     | Boost search results from a specific country. This will prioritize content from the selected country in the web search results. |

Supported Countries

`afghanistan`, `albania`, `algeria`, `andorra`, `angola`, `argentina`, `armenia`, `australia`, `austria`, `azerbaijan`, `bahamas`, `bahrain`, `bangladesh`, `barbados`, `belarus`, `belgium`, `belize`, `benin`, `bhutan`, `bolivia`, `bosnia and herzegovina`, `botswana`, `brazil`, `brunei`, `bulgaria`, `burkina faso`, `burundi`, `cambodia`, `cameroon`, `canada`, `cape verde`, `central african republic`, `chad`, `chile`, `china`, `colombia`, `comoros`, `congo`, `costa rica`, `croatia`, `cuba`, `cyprus`, `czech republic`, `denmark`, `djibouti`, `dominican republic`, `ecuador`, `egypt`, `el salvador`, `equatorial guinea`, `eritrea`, `estonia`, `ethiopia`, `fiji`, `finland`, `france`, `gabon`, `gambia`, `georgia`, `germany`, `ghana`, `greece`, `guatemala`, `guinea`, `haiti`, `honduras`, `hungary`, `iceland`, `india`, `indonesia`, `iran`, `iraq`, `ireland`, `israel`, `italy`, `jamaica`, `japan`, `jordan`, `kazakhstan`, `kenya`, `kuwait`, `kyrgyzstan`, `latvia`, `lebanon`, `lesotho`, `liberia`, `libya`, `liechtenstein`, `lithuania`, `luxembourg`, `madagascar`, `malawi`, `malaysia`, `maldives`, `mali`, `malta`, `mauritania`, `mauritius`, `mexico`, `moldova`, `monaco`, `mongolia`, `montenegro`, `morocco`, `mozambique`, `myanmar`, `namibia`, `nepal`, `netherlands`, `new zealand`, `nicaragua`, `niger`, `nigeria`, `north korea`, `north macedonia`, `norway`, `oman`, `pakistan`, `panama`, `papua new guinea`, `paraguay`, `peru`, `philippines`, `poland`, `portugal`, `qatar`, `romania`, `russia`, `rwanda`, `saudi arabia`, `senegal`, `serbia`, `singapore`, `slovakia`, `slovenia`, `somalia`, `south africa`, `south korea`, `south sudan`, `spain`, `sri lanka`, `sudan`, `sweden`, `switzerland`, `syria`, `taiwan`, `tajikistan`, `tanzania`, `thailand`, `togo`, `trinidad and tobago`, `tunisia`, `turkey`, `turkmenistan`, `uganda`, `ukraine`, `united arab emirates`, `united kingdom`, `united states`, `uruguay`, `uzbekistan`, `venezuela`, `vietnam`, `yemen`, `zambia`, `zimbabwe`

### [Domain Filtering with Wildcards](#domain-filtering-with-wildcards)

Both `include_domains` and `exclude_domains` support wildcard patterns using the `*` character. This allows for flexible domain filtering:

- Use `*.com` to include/exclude all .com domains
- Use `*.edu` to include/exclude all educational institutions
- Use specific domains like `example.com` to include/exclude exact matches

You can combine both parameters to create precise search scopes. For example:

- Include only .com domains while excluding specific sites
- Restrict searches to specific country domains
- Filter out entire categories of websites

### [Search Settings Examples](#search-settings-examples)

Exclude DomainsInclude DomainsWildcard Use

shell

```
curl "https://api.groq.com/openai/v1/chat/completions" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${GROQ_API_KEY}" \
  -d '{
         "messages": [
           {
             "role": "user",
             "content": "Tell me about the history of Bonsai trees in America"
           }
         ],
         "model": "groq/compound-mini",
         "search_settings": {
           "exclude_domains": ["wikipedia.org"]
         }
       }'
```

shell

```
curl "https://api.groq.com/openai/v1/chat/completions" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${GROQ_API_KEY}" \
  -d '{
         "messages": [
           {
             "role": "user",
             "content": "What is the latest in AI?"
           }
         ],
         "model": "groq/compound-mini",
         "search_settings": {
           "include_domains": ["arxiv.org"]
         }
       }'
```

shell

```
curl "https://api.groq.com/openai/v1/chat/completions" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${GROQ_API_KEY}" \
  -d '{
         "messages": [
           {
             "role": "user",
             "content": "What is the latest in AI?"
           }
         ],
         "model": "groq/compound-mini",
         "search_settings": {
           "include_domains": ["*.org"],
           "exclude_domains": ["wikipedia.org"]
         }
       }'
```

## [Pricing](#pricing)

Please see the [Pricing](https://groq.com/pricing) page for more information.

There are two types of web search: [basic search](#basic-search) and [advanced search](#advanced-search), and these are billed differently.

### [Basic Search](#basic-search)

A more basic, less comprehensive version of search that provides essential web search capabilities. Basic search is supported on Compound version `2025-07-23`. To use basic search, specify the version in your API request. See [Compound System Versioning](https://console.groq.com/docs/compound#system-versioning) for details on how to set your Compound version.

### [Advanced Search](#advanced-search)

The default search experience that provides more comprehensive and intelligent search results. Advanced search is automatically used with Compound versions newer than `2025-07-23` and offers enhanced capabilities for better information retrieval and synthesis.

## [Provider Information](#provider-information)

Web search functionality is powered by [Tavily](https://tavily.com/), a search API optimized for AI applications. Tavily provides real-time access to web content with intelligent ranking and citation capabilities specifically designed for language models.
