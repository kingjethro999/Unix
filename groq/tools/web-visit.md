---
description: Access and analyze specific website content using the built-in website visit tool for contextual information.
title: Visit Website - GroqDocs
image: https://console.groq.com/og_cloudv5.jpg
---

# Visit Website

Some models and systems on Groq have native support for visiting and analyzing specific websites, allowing them to access current web content and provide detailed analysis based on the actual page content. This tool enables models to retrieve and process content from any publicly accessible website.

The use of this tool with a supported model or system in GroqCloud is not a HIPAA Covered Cloud Service under Groq's Business Associate Addendum at this time. This tool is also not available currently for use with regional / sovereign endpoints.

## [Supported Models](#supported-models)

Built-in website visiting is supported for the following models and systems (on [versions](https://console.groq.com/docs/compound#system-versioning) later than `2025-07-23`):

| Model ID           | Model                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| groq/compound      | [Compound](https://console.groq.com/docs/compound/systems/compound)           |
| groq/compound-mini | [Compound Mini](https://console.groq.com/docs/compound/systems/compound-mini) |

For a comparison between the `groq/compound` and `groq/compound-mini` systems and more information regarding extra capabilities, see the [Compound Systems](https://console.groq.com/docs/compound/systems#system-comparison) page.

## [Quick Start](#quick-start)

To use website visiting, simply include a URL in your request to one of the supported models. The examples below show how to access all parts of the response: the final content, reasoning process, and tool execution details.

Python

```
import json
from groq import Groq

client = Groq(
    default_headers={
        "Groq-Model-Version": "latest"
    }
)

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Summarize the key points of this page: https://groq.com/blog/inside-the-lpu-deconstructing-groq-speed",
        }
    ],
    model="groq/compound",
)

message = chat_completion.choices[0].message

# Print the final content
print(message.content)

# Print the reasoning process
print(message.reasoning)

# Print executed tools
if message.executed_tools:
    print(message.executed_tools[0])
```

```
import { Groq } from "groq-sdk";

const groq = new Groq({
  defaultHeaders: {
    "Groq-Model-Version": "latest"
  }
});

const chatCompletion = await groq.chat.completions.create({
  messages: [
    {
      role: "user",
      content: "Summarize the key points of this page: https://groq.com/blog/inside-the-lpu-deconstructing-groq-speed",
    },
  ],
  model: "groq/compound",
});

const message = chatCompletion.choices[0].message;

// Print the final content
console.log(message.content);

// Print the reasoning process
console.log(message.reasoning);

// Print the first executed tool
console.log(message.executed_tools[0]);
```

```
curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
-H "Authorization: Bearer $GROQ_API_KEY" \
-H "Content-Type: application/json" \
-H "Groq-Model-Version: latest" \
-d '{
  "messages": [
    {
      "role": "user",
      "content": "Summarize the key points of this page: https://groq.com/blog/inside-the-lpu-deconstructing-groq-speed"
    }
  ],
  "model": "groq/compound"
}'
```

_These examples show how to access the complete response structure to understand the website visiting process._

When the API is called, it will automatically detect URLs in the user's message and visit the specified website to retrieve its content. The response includes three key components:

- **Content**: The final synthesized response from the model
- **Reasoning**: The internal decision-making process showing the website visit
- **Executed Tools**: Detailed information about the website that was visited

## [How It Works](#how-it-works)

When you include a URL in your request:

1. **URL Detection**: The system automatically detects URLs in your message
2. **Website Visit**: The tool fetches the content from the specified website
3. **Content Processing**: The website content is processed and made available to the model
4. **Response Generation**: The model uses both your query and the website content to generate a comprehensive response

### [Final Output](#final-output)

This is the final response from the model, containing the analysis based on the visited website content. The model can summarize, analyze, extract specific information, or answer questions about the website's content.

message.content

**Key Take-aways from "Inside the LPU: Deconstructing Groq's Speed"**

| Area                                    | What Groq does differently                                                                                                                                    | Why it matters                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Numerics – TruePoint**                | Uses a mixed-precision scheme that keeps 100-bit accumulation while storing weights/activations in lower-precision formats (FP8, BF16, block-floating-point). | Gives 2-4× speed-up over pure BF16 **without** the accuracy loss that typical INT8/FP8 quantization causes.                                        |
| **Memory hierarchy**                    | Hundreds of megabytes of on-chip **SRAM** act as the primary weight store, not a cache layer.                                                                 | Eliminates the 100-ns-plus latency of DRAM/HBM fetches that dominate inference workloads, enabling fast, deterministic weight access.              |
| **Execution model – static scheduling** | The compiler fully unrolls the execution graph (including inter-chip communication) down to the clock-cycle level.                                            | Removes dynamic-scheduling overhead (queues, reorder buffers, speculation) → deterministic latency, perfect for tensor-parallelism and pipelining. |
| **Parallelism strategy**                | Focuses on **tensor parallelism** (splitting a single layer across many LPUs) rather than pure data parallelism.                                              | Reduces latency for a single request; a trillion-parameter model can generate tokens in real-time.                                                 |
| **Speculative decoding**                | Runs a small "draft" model to propose tokens, then verifies a batch of those tokens on the large model using the LPU's pipeline-parallel hardware.            | Verification is no longer memory-bandwidth bound; 2-4 tokens can be accepted per pipeline stage, compounding speed gains.                          |

\[...truncated for brevity\]

**Bottom line:** Groq's LPU architecture combines precision-aware numerics, on-chip SRAM, deterministic static scheduling, aggressive tensor-parallelism, efficient speculative decoding, and a tightly synchronized inter-chip network to deliver dramatically lower inference latency without compromising model quality.

### [Reasoning and Internal Tool Calls](#reasoning-and-internal-tool-calls)

This shows the model's internal reasoning process and the website visit it executed to gather information. You can inspect this to understand how the model approached the problem and what URL it accessed. This is useful for debugging and understanding the model's decision-making process.

message.reasoning

<tool>visit(<https://groq.com/blog/inside-the-lpu-deconstructing-groq-speed>)</tool> <output>Title: groq.com URL: <https://groq.com/blog/inside-the-lpu-deconstructing-groq-speed>

URL: <https://groq.com/blog/inside-the-lpu-deconstructing-groq-speed>08/01/2025 · Andrew Ling

### [Inside the LPU: Deconstructing Groq's Speed](#inside-the-lpu-deconstructing-groqs-speed)

Moonshot's Kimi K2 recently launched in preview on GroqCloud and developers keep asking us: how is Groq running a 1-trillion-parameter model this fast?

Legacy hardware forces a choice: faster inference with quality degradation, or accurate inference with unacceptable latency. This tradeoff exists because GPU architectures optimize for training workloads. The LPU–purpose-built hardware for inference–preserves quality while eliminating architectural bottlenecks which create latency in the first place.

### [Accuracy Without Tradeoffs: TruePoint Numerics](#accuracy-without-tradeoffs-truepoint-numerics)

Traditional accelerators achieve speed through aggressive quantization, forcing models into INT8 or lower precision numerics that introduce cumulative errors throughout the computation pipeline and lead to loss of quality.

\[...truncated for brevity\]

### [The Bottom Line](#the-bottom-line)

Groq isn't tweaking around the edges. We build inference from the ground up for speed, scale, reliability and cost-efficiency. That's how we got Kimi K2 running at 40× performance in just 72 hours.</output>

### [Tool Execution Details](#tool-execution-details)

This shows the details of the website visit operation, including the type of tool executed and the content that was retrieved from the website.

message.executed_tools\[0\] (type: 'visit')

JSON

```
{
  "index": 0,
  "type": "visit",
  "arguments": "{\"url\": \"https://groq.com/blog/inside-the-lpu-deconstructing-groq-speed\"}",
  "output": "Title: groq.com
      URL: https://groq.com/blog/inside-the-lpu-deconstructing-groq-speed

      URL: https://groq.com/blog/inside-the-lpu-deconstructing-groq-speed
      08/01/2025 · Andrew Ling

      # Inside the LPU: Deconstructing Groq's Speed

      Moonshot's Kimi K2 recently launched in preview on GroqCloud and developers keep asking us: how is Groq running a 1-trillion-parameter model this fast?

      Legacy hardware forces a choice: faster inference with quality degradation, or accurate inference with unacceptable latency. This tradeoff exists because GPU architectures optimize for training workloads. The LPU–purpose-built hardware for inference–preserves quality while eliminating architectural bottlenecks which create latency in the first place.

      [...truncated for brevity - full blog post content extracted]

      ## The Bottom Line

      Groq isn't tweaking around the edges. We build inference from the ground up for speed, scale, reliability and cost-efficiency. That's how we got Kimi K2 running at 40× performance in just 72 hours.",
  "search_results": {
      "results": []
  }
}
```

## [Usage Tips](#usage-tips)

- **Single URL per Request**: Only one website will be visited per request. If multiple URLs are provided, only the first one will be processed.
- **Publicly Accessible Content**: The tool can only visit publicly accessible websites that don't require authentication.
- **Content Processing**: The tool automatically extracts the main content while filtering out navigation, ads, and other non-essential elements.
- **Real-time Access**: Each request fetches fresh content from the website at the time of the request, rendering the full page to capture dynamic content.

## [Pricing](#pricing)

Please see the [Pricing](https://groq.com/pricing) page for more information about costs.
