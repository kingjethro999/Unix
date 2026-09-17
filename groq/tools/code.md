---
description: Perform calculations, run Python code snippets, and solve computational problems automatically in a secure sandboxed environment.
title: Code Execution - GroqDocs
image: https://console.groq.com/og_cloudv5.jpg
---

# Code Execution

Some models and systems on Groq have native support for automatic code execution, allowing them to perform calculations, run code snippets, and solve computational problems in real-time.

Only Python is currently supported for code execution.

The use of this tool with a supported model or system in GroqCloud is not a HIPAA Covered Cloud Service under Groq's Business Associate Addendum at this time. This tool is also not available currently for use with regional / sovereign endpoints.

## [Supported Models and Systems](#supported-models-and-systems)

Built-in code execution is supported for the following models and systems:

| Model ID            | Model                                                                          |
| ------------------- | ------------------------------------------------------------------------------ |
| openai/gpt-oss-20b  | [OpenAI GPT-OSS 20B](https://console.groq.com/docs/model/openai/gpt-oss-20b)   |
| openai/gpt-oss-120b | [OpenAI GPT-OSS 120B](https://console.groq.com/docs/model/openai/gpt-oss-120b) |
| groq/compound       | [Compound](https://console.groq.com/docs/compound/systems/compound)            |
| groq/compound-mini  | [Compound Mini](https://console.groq.com/docs/compound/systems/compound-mini)  |

For a comparison between the `groq/compound` and `groq/compound-mini` systems and more information regarding additional capabilities, see the [Compound Systems](https://console.groq.com/docs/compound/systems#system-comparison) page.

## [Quick Start (Compound)](#quick-start-compound)

To use code execution with [Groq's Compound systems](https://console.groq.com/docs/compound), change the `model` parameter to one of the supported models or systems.

Python

```
import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

response = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Calculate the square root of 101 and show me the Python code you used",
        }
    ],
    model="groq/compound-mini",
)

# Final output
print(response.choices[0].message.content)

# Reasoning + internal tool calls
print(response.choices[0].message.reasoning)

# Code execution tool call
if response.choices[0].message.executed_tools:
    print(response.choices[0].message.executed_tools[0])
```

```
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const response = await groq.chat.completions.create({
  messages: [
    {
      role: "user",
      content: "Calculate the square root of 101 and show me the Python code you used",
    },
  ],
  model: "groq/compound-mini",
});

// Final output
console.log(response.choices[0].message.content);

// Reasoning + internal tool calls
console.log(response.choices[0].message.reasoning);

// Code execution tool call
console.log(response.choices[0].message.executed_tools?.[0]);
```

```
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "groq/compound-mini",
    "messages": [
      {
        "role": "user",
        "content": "Calculate the square root of 101 and show me the Python code you used"
      }
    ]
  }'
```

_And that's it!_

When the API is called, it will intelligently decide when to use code execution to best answer the user's query. Code execution is performed on the server side in a secure sandboxed environment, so no additional setup is required on your part.

### [Final Output](#final-output)

This is the final response from the model, containing the answer based on code execution results. The model combines computational results with explanatory text to provide a comprehensive response. Use this as the primary output for user-facing applications.

message.content

The square root of 101 is: 10.04987562112089

Here is the Python code I used:

Python

```
import math
print("The square root of 101 is: ")
print(math.sqrt(101))
```

### [Reasoning and Internal Tool Calls](#reasoning-and-internal-tool-calls)

This shows the model's internal reasoning process and the Python code it executed to solve the problem. You can inspect this to understand how the model approached the computational task and what code it generated. This is useful for debugging and understanding the model's decision-making process.

message.reasoning

<tool>python(import math; print("The square root of 101 is: "); print(math.sqrt(101)))</tool> <output>The square root of 101 is: 10.04987562112089 </output>

### [Executed Tools Information](#executed-tools-information)

This contains the raw executed tools data, including the generated Python code, execution output, and metadata. You can use this to access the exact code that was run and its results programmatically.

message.executed_tools\[0\]

JSON

```
{
  "string": "",
  "name": "",
  "index": 0,
  "type": "python",
  "arguments": "{\"code\": \"import math; print(\"The square root of 101 is: \"); print(math.sqrt(101))\"}",
  "output": "The square root of 101 is: \n10.04987562112089\n",
  "search_results": { "results": [] }
}
```

## [Quick Start (GPT-OSS)](#quick-start-gptoss)

To use code execution with OpenAI's GPT-OSS models on Groq ([20B](https://console.groq.com/docs/model/openai/gpt-oss-20b) & [120B](https://console.groq.com/docs/model/openai/gpt-oss-120b)), add the `code_interpreter` tool to your request.

Python

```
from groq import Groq

client = Groq(api_key="your-api-key-here")

response = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Calculate the square root of 12345. Output only the final answer.",
        }
    ],
    model="openai/gpt-oss-20b",  # or "openai/gpt-oss-120b"
    tool_choice="required",
    tools=[
        {
            "type": "code_interpreter"
        }
    ],
)

# Final output
print(response.choices[0].message.content)

# Reasoning + internal tool calls
print(response.choices[0].message.reasoning)

# Code execution tool call
print(response.choices[0].message.executed_tools[0])
```

```
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const response = await groq.chat.completions.create({
  messages: [
    {
      role: "user",
      content: "Calculate the square root of 12345. Output only the final answer.",
    },
  ],
  model: "openai/gpt-oss-20b", // or "openai/gpt-oss-120b"
  tool_choice: "required",
  tools: [
    {
      type: "code_interpreter"
    },
  ],
});

// Final output
console.log(response.choices[0].message.content);

// Reasoning + internal tool calls
console.log(response.choices[0].message.reasoning);

// Code execution tool call
console.log(response.choices[0].message.executed_tools?.[0]);
```

```
curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Calculate the square root of 12345. Output only the final answer."
      }
    ],
    "model": "openai/gpt-oss-20b",
    "tool_choice": "required",
    "tools": [
      {
        "type": "code_interpreter"
      }
    ]
  }'
```

When the API is called, it will use code execution to best answer the user's query. Code execution is performed on the server side in a secure sandboxed environment, so no additional setup is required on your part.

### [Final Output](#final-output)

This is the final response from the model, containing the answer based on code execution results. The model combines computational results with explanatory text to provide a comprehensive response.

message.content

111.1080555135405112450044

### [Reasoning and Internal Tool Calls](#reasoning-and-internal-tool-calls)

This shows the model's internal reasoning process and the Python code it executed to solve the problem. You can inspect this to understand how the model approached the computational task and what code it generated.

message.reasoning

We need sqrt(12345). Compute.math.sqrt returns 111.1080555... Let's compute with precision.Let's get more precise.We didn't get output because decimal sqrt needs context. Let's compute.It didn't output because .sqrt() might not be available for Decimal? Actually Decimal has sqrt method? There is sqrt in Decimal from Python 3.11? Actually it's decimal.Decimal.sqrt() available. But maybe need import Decimal. Let's try.It outputs nothing? Actually maybe need to print.

### [Executed Tools Information](#executed-tools-information)

This contains the raw executed tools data, including the generated Python code, execution output, and metadata. You can use this to access the exact code that was run and its results programmatically.

message.executed_tools\[0\]

JSON

```
{
  name: 'python',
  index: 0,
  type: 'function',
  arguments: 'import math\nmath.sqrt(12345)\n',
  search_results: { results: null },
  code_results: [ { text: '111.1080555135405' } ]
}
```

## [How It Works](#how-it-works)

When you make a request to a model or system that supports code execution, it:

1. **Analyzes your query** to determine if code execution would be helpful (for compound systems or when tool choice is not set to `required`)
2. **Generates Python code** to solve the problem or answer the question
3. **Executes the code** in a secure sandboxed environment powered by [E2B](https://e2b.dev/)
4. **Returns the results** along with the code that was executed

## [Use Cases (Compound)](#use-cases-compound)

### [Mathematical Calculations](#mathematical-calculations)

Ask the model to perform complex calculations, and it will automatically execute Python code to compute the result.

Python

```
import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Calculate the monthly payment for a $30,000 loan over 5 years at 6% annual interest rate using the standard loan payment formula. Use python code.",
        }
    ],
    model="groq/compound-mini",
)

print(chat_completion.choices[0].message.content)
```

```
import Groq from "groq-sdk";

const groq = new Groq();

const chatCompletion = await groq.chat.completions.create({
  messages: [
    {
      role: "user",
      content: "Calculate the monthly payment for a $30,000 loan over 5 years at 6% annual interest rate using the standard loan payment formula. Use python code.",
    },
  ],
  model: "groq/compound-mini",
});

console.log(chatCompletion.choices[0]?.message?.content || "");
```

```
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "groq/compound-mini",
    "messages": [
      {
        "role": "user",
        "content": "Calculate the monthly payment for a $30,000 loan over 5 years at 6% annual interest rate using the standard loan payment formula. Use python code."
      }
    ]
  }'
```

### [Code Debugging and Testing](#code-debugging-and-testing)

Provide code snippets to check for errors or understand their behavior. The model can execute the code to verify functionality.

Python

```
import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Will this Python code raise an error? `import numpy as np; a = np.array([1, 2]); b = np.array([3, 4, 5]); print(a + b)`",
        }
    ],
    model="groq/compound-mini",
)

print(chat_completion.choices[0].message.content)
```

```
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const chatCompletion = await groq.chat.completions.create({
  messages: [
    {
      role: "user",
      content: "Will this Python code raise an error? `import numpy as np; a = np.array([1, 2]); b = np.array([3, 4, 5]); print(a + b)`",
    },
  ],
  model: "groq/compound-mini",
});

console.log(chatCompletion.choices[0]?.message?.content || "");
```

```
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "groq/compound-mini",
    "messages": [
      {
        "role": "user",
        "content": "Will this Python code raise an error? `import numpy as np; a = np.array([1, 2]); b = np.array([3, 4, 5]); print(a + b)`"
      }
    ]
  }'
```

## [Security and Limitations](#security-and-limitations)

- Code execution runs in a **secure sandboxed environment** with no access to external networks or sensitive data
- Only **Python** is currently supported for code execution
- The execution environment is **ephemeral** \- each request runs in a fresh, isolated environment
- Code execution has reasonable **timeout limits** to prevent infinite loops
- No persistent storage between requests

## [Pricing](#pricing)

Please see the [Pricing](https://groq.com/pricing) page for more information.

## [Provider Information](#provider-information)

Code execution functionality is powered by Foundry Labs ([E2B](https://e2b.dev/)), a secure cloud environment for AI code execution. E2B provides isolated, ephemeral sandboxes that allow models to run code safely without access to external networks or sensitive data.
