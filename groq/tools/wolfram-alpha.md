---
description: Invoke Wolfram&#x27;s computational knowledge engine to solve math, scientific, and engineering problems that require precise computation.
title: Wolfram‑Alpha Integration - GroqDocs
image: https://console.groq.com/og_cloudv5.jpg
---

# Wolfram‑Alpha Integration

Some models and systems on Groq have native support for Wolfram‑Alpha integration, allowing them to access Wolfram's computational knowledge engine for mathematical, scientific, and engineering computations. This tool enables models to solve complex problems that require precise calculation and access to structured knowledge.

The use of this tool with a supported model or system in GroqCloud is not a HIPAA Covered Cloud Service under Groq's Business Associate Addendum at this time. This tool is also not available currently for use with regional / sovereign endpoints.

## [Supported Models](#supported-models)

Wolfram‑Alpha integration is supported for the following models and systems (on [versions](https://console.groq.com/docs/compound#system-versioning) later than `2025-07-23`):

| Model ID           | Model                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| groq/compound      | [Compound](https://console.groq.com/docs/compound/systems/compound)           |
| groq/compound-mini | [Compound Mini](https://console.groq.com/docs/compound/systems/compound-mini) |

For a comparison between the `groq/compound` and `groq/compound-mini` systems and more information regarding extra capabilities, see the [Compound Systems](https://console.groq.com/docs/compound/systems#system-comparison) page.

## [Quick Start](#quick-start)

To use Wolfram‑Alpha integration, you must provide your own [Wolfram‑Alpha API key](#getting-your-wolframalpha-api-key) in the `wolfram_settings` configuration. The examples below show how to access all parts of the response: the final content, reasoning process, and tool execution details.

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
            "content": "What is 1293392*29393?",
        }
    ],
    model="groq/compound",
    compound_custom={
        "tools": {
            "enabled_tools": ["wolfram_alpha"],
            "wolfram_settings": {"authorization": "your_wolfram_alpha_api_key_here"}
        }
    }
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
      content: "What is 1293392*29393?",
    },
  ],
  model: "groq/compound",
  compound_custom: {
    tools: {
      enabled_tools: ["wolfram_alpha"],
      wolfram_settings: { authorization: "your_wolfram_alpha_api_key_here" }
    }
  }
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
      "content": "What is 1293392*29393?"
    }
  ],
  "model": "groq/compound",
  "compound_custom": {
    "tools": {
      "enabled_tools": ["wolfram_alpha"],
      "wolfram_settings": {"authorization": "your_wolfram_alpha_api_key_here"}
    }
  }
}'
```

_These examples show how to access the complete response structure to understand the Wolfram‑Alpha computation process._

When the API is called with a mathematical or scientific query, it will automatically use Wolfram‑Alpha to compute precise results. The response includes three key components:

- **Content**: The final synthesized response from the model with computational results
- **Reasoning**: The internal decision-making process showing the Wolfram‑Alpha query
- **Executed Tools**: Detailed information about the computation that was performed

## [How It Works](#how-it-works)

When you ask a computational question:

1. **Query Analysis**: The system analyzes your question to determine if Wolfram‑Alpha computation is needed
2. **Wolfram‑Alpha Query**: The tool sends a structured query to Wolfram‑Alpha's computational engine
3. **Result Processing**: The computational results are processed and made available to the model
4. **Response Generation**: The model uses both your query and the computational results to generate a comprehensive response

### [Final Output](#final-output)

This is the final response from the model, containing the computational results and analysis. The model can provide step-by-step solutions, explanations, and contextual information about the mathematical or scientific computation.

message.content

**Multiplication**

To find (1293392 \\times 29393) we simply multiply the two integers.

Using a reliable computational tool (Wolfram|Alpha) gives:

\[ 1293392 \\times 29393 = 38{,}016{,}671{,}056 \]

**Result**

\[ \\boxed{38{,}016{,}671{,}056} \]

_Additional details from the computation_

- Scientific notation: (3.8016671056 \\times 10^{10})
- Number name: **38 billion 16 million 671 thousand 56**
- The result has 11 decimal digits.

Thus, the product of 1,293,392 and 29,393 is **38,016,671,056**.

### [Reasoning and Internal Tool Calls](#reasoning-and-internal-tool-calls)

This shows the model's internal reasoning process and the Wolfram‑Alpha computation it executed to solve the problem. You can inspect this to understand how the model approached the problem and what specific query it sent to Wolfram‑Alpha.

message.reasoning

To solve this problem, I will multiply 1293392 by 29393.

<tool> wolfram(1293392\*29393) </tool> <output>Query: "1293392\*29393"

Input: 1293392×29393

Result: 38016671056

Scientific notation: 3.8016671056 × 10^10

Number line: image: <https://public6.wolframalpha.com/files/PNG%5F9r6zdhh0lo.png>Wolfram Language code: NumberLinePlot\[38016671056\]

Number name: 38 billion 16 million 671 thousand 56

Number length: 11 decimal digits

Comparisons: ≈ 0.13 × the number of stars in our galaxy (≈ 3×10^11)

≈ 0.35 × the number of people who have ever lived (≈ 1.1×10^11)

≈ 4.8 × the number of people alive today (≈ 7.8×10^9)

Wolfram|Alpha website result for "1293392_29393": <https://www.wolframalpha.com/input?i=1293392%2A29393></output>Based on these results, I can see that 1293392_29393 equals 38016671056.

The final answer is 38016671056.

### [Tool Execution Details](#tool-execution-details)

This shows the details of the Wolfram‑Alpha computation, including the type of tool executed, the query that was sent, and the computational results that were retrieved.

message.executed_tools\[0\] (type: 'wolfram')

JSON

```
{
  "index": 0,
  "type": "wolfram",
  "arguments": "{\"query\": \"1293392*29393\"}",
  "output": "Query:\n\"1293392*29393\"\n\nInput:\n1293392×29393\n\nResult:\n38016671056\n\nScientific notation:\n3.8016671056 × 10^10\n\nNumber line:\nimage: https://public6.wolframalpha.com/files/PNG_9r6zdhh0lo.png\nWolfram Language code: NumberLinePlot[38016671056]\n\nNumber name:\n38 billion 16 million 671 thousand 56\n\nNumber length:\n11 decimal digits\n\nComparisons:\n≈ 0.13 × the number of stars in our galaxy (≈ 3×10^11)\n\n≈ 0.35 × the number of people who have ever lived (≈ 1.1×10^11)\n\n≈ 4.8 × the number of people alive today (≈ 7.8×10^9)\n\nWolfram|Alpha website result for \"1293392*29393\":\nhttps://www.wolframalpha.com/input?i=1293392%2A29393",
  "search_results": {
      "results": []
  }
}
```

## [Usage Tips](#usage-tips)

- **API Key Required**: You must provide your own Wolfram‑Alpha API key in the `wolfram_settings.authorization` field to use this feature.
- **Mathematical Queries**: Best suited for mathematical computations, scientific calculations, unit conversions, and factual queries.
- **Structured Data**: Wolfram‑Alpha returns structured computational results that the model can interpret and explain.
- **Complex Problems**: Ideal for problems requiring precise computation that go beyond basic arithmetic.

## [Getting Your Wolfram‑Alpha API Key](#getting-your-wolframalpha-api-key)

To use this integration:

1. Visit [Wolfram‑Alpha API](https://products.wolframalpha.com/api/)
2. Sign up for an account and choose an appropriate plan
3. Generate an API key from your account dashboard
4. Use the API key in the `wolfram_settings.authorization` field in your requests

## [Pricing](#pricing)

Groq does not charge for the use of the Wolfram‑Alpha built-in tool. However, you will be charged separately by Wolfram Research for API usage according to your Wolfram‑Alpha API plan.

## [Provider Information](#provider-information)

Wolfram Alpha functionality is powered by [Wolfram Research](https://wolframalpha.com/), a computational knowledge engine.
