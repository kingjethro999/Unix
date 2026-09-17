---
description: Access comprehensive real-time web content with automatic citations using the built-in browser search tool.
title: Browser Search - GroqDocs
image: https://console.groq.com/og_cloudv5.jpg
---

# Browser Search

Some models on Groq have built-in support for interactive browser search, providing a more comprehensive approach to accessing real-time web content than traditional web search. Unlike [Web Search](https://console.groq.com/docs/web-search) which performs a single search and retrieves text snippets from webpages, browser search mimics human browsing behavior by navigating websites interactively, providing more detailed results.

For latency sensitive use cases, we recommend using [Web Search](https://console.groq.com/docs/web-search) instead.

The use of this tool with a supported model or system in GroqCloud is not a HIPAA Covered Cloud Service under Groq's Business Associate Addendum at this time. This tool is also not available currently for use with regional / sovereign endpoints.

## [Supported Models](#supported-models)

Built-in browser search is supported for the following models:

| Model ID                     | Model                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| openai/gpt-oss-20b           | [OpenAI GPT-OSS 20B](https://console.groq.com/docs/model/openai/gpt-oss-20b)                     |
| openai/gpt-oss-120b          | [OpenAI GPT-OSS 120B](https://console.groq.com/docs/model/openai/gpt-oss-120b)                   |
| openai/gpt-oss-safeguard-20b | [OpenAI GPT-OSS-Safeguard 20B](https://console.groq.com/docs/model/openai/gpt-oss-safeguard-20b) |

**Note:** Browser search is not compatible with [structured outputs](https://console.groq.com/docs/structured-outputs).

## [Quick Start](#quick-start)

To use browser search, change the `model` parameter to one of the supported models.

Python

```
from groq import Groq

client = Groq()

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "What happened in AI last week? Give me a concise, one paragraph summary of the most important events."
        }
    ],
    model="openai/gpt-oss-20b",
    temperature=1,
    max_completion_tokens=2048,
    top_p=1,
    stream=False,
    stop=None,
    tool_choice="required",
    tools=[
        {
            "type": "browser_search"
        }
    ]
)

print(chat_completion.choices[0].message.content)
```

```
import { Groq } from 'groq-sdk';

const groq = new Groq();

const chatCompletion = await groq.chat.completions.create({
  "messages": [
    {
      "role": "user",
      "content": "What happened in AI last week? Give me a concise, one paragraph summary of the most important events."
    }
  ],
  "model": "openai/gpt-oss-20b",
  "temperature": 1,
  "max_completion_tokens": 2048,
  "top_p": 1,
  "stream": false,
  "reasoning_effort": "medium",
  "stop": null,
  "tool_choice": "required",
  "tools": [
    {
      "type": "browser_search"
    }
  ]
});

console.log(chatCompletion.choices[0].message.content);
```

```
curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What happened in AI last week? Give me a concise, one paragraph summary of the most important events."
      }
    ],
    "model": "openai/gpt-oss-20b",
    "temperature": 1,
    "max_completion_tokens": 2048,
    "top_p": 1,
    "stream": false,
    "stop": null,
    "tool_choice": "required",
    "tools": [
      {
        "type": "browser_search"
      }
    ]
  }'
```

When the API is called, it will use browser search to best answer the user's query. This tool call is performed on the server side, so no additional setup is required on your part to use this feature.

### [Final Output](#final-output)

This is the final response from the model, containing snippets from the web pages that were searched, and the final response at the end. The model combines information from multiple sources to provide a comprehensive response.

message.content

...\[truncated site snippets\]

Last week saw a reshuffling of AI leadership and a flurry of policy and product moves: Anthropic passed OpenAI as the top‑ranked enterprise large‑language‑model provider with a 32 % share 【2†L6-L10】, while Meta’s “Meta AI” claimed to be self‑improving, prompting fresh safety worries 【2†L17-L23】; the U.S. announced it will funnel all federal data into domestically built AI models and tighten high‑end chip export controls 【2†L27-L31】. Microsoft began testing a “smart mode” for Copilot that auto‑chooses the best model – a clear pre‑lude to GPT‑5 – and also launched Copilot Mode in Edge, while Microsoft’s research flagged which jobs are most impacted by AI chatbots 【2†L37-L44】【2†L46-L50】. Adobe rolled out new generative‑AI tools for Photoshop (Generative Upscale, Harmonize, etc.) 【2†L55-L60】 and Google expanded its AI‑powered Search “AI Mode” to support image uploads for homework help 【2†L64-L68】. At the World AI Conference, China’s premier proposed an international AI‑governance body and, amid U.S. chip restrictions, Chinese AI firms formed alliances and released an open‑source GLM‑4.5 model for agents 【2†L92-L100】【2†L110-L116】. Finally, OpenAI CEO Sam Altman likened the forthcoming GPT‑5 rollout to the Manhattan Project, highlighting the speed and safety concerns of the next‑generation model 【2†L119-L124】.

## [Pricing](#pricing)

Please see the [Pricing](https://groq.com/pricing) page for more information.

## [Best Practices](#best-practices)

When using browser search with reasoning models, consider setting `reasoning_effort` to `low` to optimize performance and token usage. Higher reasoning effort levels can result in extended browser sessions with more comprehensive web exploration, which may consume significantly more tokens than necessary for most queries. Using `low` reasoning effort provides a good balance between search quality and efficiency.

## [Provider Information](#provider-information)

Browser search functionality is powered by [Exa](https://exa.ai/), a search engine designed for AI applications. Exa provides comprehensive web browsing capabilities that go beyond traditional search by allowing models to navigate and interact with web content in a more human-like manner.
