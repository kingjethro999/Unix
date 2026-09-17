---
description: Reasoning models on Groq for complex problem-solving, step-by-step analysis, and explicit reasoning formats with fast inference.
title: Reasoning - GroqDocs
image: https://console.groq.com/og_cloudv5.jpg
---

# Reasoning

Reasoning models excel at complex problem-solving tasks that require step-by-step analysis, logical deduction, and structured thinking and solution validation. With Groq inference speed, these types of models can deliver instant reasoning capabilities critical for real-time applications.

## [Why Speed Matters for Reasoning](#why-speed-matters-for-reasoning)

Reasoning models are capable of complex decision making with explicit reasoning chains that are part of the token output and used for decision-making, which make low-latency and fast inference essential. Complex problems often require multiple chains of reasoning tokens where each step build on previous results. Low latency compounds benefits across reasoning chains and shaves off minutes of reasoning to a response in seconds.

## [Supported Models](#supported-models)

| Model ID                     | Model                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| openai/gpt-oss-20b           | [OpenAI GPT-OSS 20B](https://console.groq.com/docs/model/openai/gpt-oss-20b)                     |
| openai/gpt-oss-120b          | [OpenAI GPT-OSS 120B](https://console.groq.com/docs/model/openai/gpt-oss-120b)                   |
| openai/gpt-oss-safeguard-20b | [OpenAI GPT-OSS-Safeguard 20B](https://console.groq.com/docs/model/openai/gpt-oss-safeguard-20b) |
| qwen/qwen3-32b               | [Qwen 3 32B](https://console.groq.com/docs/model/qwen3-32b)                                      |
| qwen/qwen3.6-27b             | [Qwen 3.6 27B](https://console.groq.com/docs/model/qwen/qwen3.6-27b)                             |

## [Reasoning Format](#reasoning-format)

Groq API supports explicit reasoning formats through the `reasoning_format` parameter, giving you fine-grained control over how the model's reasoning process is presented. This is particularly valuable for valid JSON outputs, debugging, and understanding the model's decision-making process.

**Note:** The format defaults to `raw` or `parsed` when JSON mode or tool use are enabled as those modes do not support `raw`. If reasoning is explicitly set to `raw` with JSON mode or tool use enabled, we will return a 400 error.

### [Options for Reasoning Format](#options-for-reasoning-format)

| reasoning_format Options | Description                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| parsed                   | Separates reasoning into a dedicated message.reasoning field while keeping the response concise. |
| raw                      | Includes reasoning within <think> tags in the main text content.                                 |
| hidden                   | Returns only the final answer.                                                                   |

### [Including Reasoning in the Response](#including-reasoning-in-the-response)

You can also control whether reasoning is included in the response by setting the `include_reasoning` parameter.

| include_reasoning Options | Description                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| true                      | Includes the reasoning in a dedicated message.reasoning field. This is the default behavior. |
| false                     | Excludes reasoning from the response.                                                        |

**Note:** The `include_reasoning` parameter cannot be used together with `reasoning_format`. These parameters are mutually exclusive.

## [Reasoning Effort](#reasoning-effort)

### [Options for Reasoning Effort (Qwen 3.6 27B)](#options-for-reasoning-effort-qwen-36-27b)

The `reasoning_effort` parameter controls the level of effort the model will put into reasoning. This is only supported by [Qwen 3.6 27B](https://console.groq.com/docs/model/qwen/qwen3.6-27b).

| reasoning_effort Options | Description                                                     |
| ------------------------ | --------------------------------------------------------------- |
| none                     | Disable reasoning. The model will not use any reasoning tokens. |
| default                  | Enable reasoning.                                               |

### [Options for Reasoning Effort (GPT-OSS)](#options-for-reasoning-effort-gptoss)

The `reasoning_effort` parameter controls the level of effort the model will put into reasoning. This is only supported by [GPT-OSS 20B](https://console.groq.com/docs/model/openai/gpt-oss-20b) and [GPT-OSS 120B](https://console.groq.com/docs/model/openai/gpt-oss-120b).

| reasoning_effort Options | Description                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------- |
| low                      | Low effort reasoning. The model will use a small number of reasoning tokens.       |
| medium                   | Medium effort reasoning. The model will use a moderate number of reasoning tokens. |
| high                     | High effort reasoning. The model will use a large number of reasoning tokens.      |

## [Quick Start](#quick-start)

Get started with reasoning models using this basic example that demonstrates how to make a simple API call for complex problem-solving tasks.

Python

```
import Groq from 'groq-sdk';

const client = new Groq();
const completion = await client.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
        {
            role: "user",
            content: "How many r's are in the word strawberry?"
        }
    ],
    temperature: 0.6,
    max_completion_tokens: 1024,
    top_p: 0.95,
    stream: true
});

for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0].delta.content || "");
}
```

```
from groq import Groq

client = Groq()
completion = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[
        {
            "role": "user",
            "content": "How many r's are in the word strawberry?"
        }
    ],
    temperature=0.6,
    max_completion_tokens=1024,
    top_p=0.95,
    stream=True
)

for chunk in completion:
    print(chunk.choices[0].delta.content or "", end="")
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
             "content": "How many r'\''s are in the word strawberry?"
           }
         ],
         "model": "openai/gpt-oss-20b",
         "temperature": 0.6,
         "max_completion_tokens": 4096,
         "top_p": 0.95,
         "stream": true,
         "stop": null
       }'
```

## [Quick Start with Tool Use](#quick-start-with-tool-use)

This example shows how to combine reasoning models with function calling to create intelligent agents that can perform actions while explaining their thought process.

curl

```
curl https://api.groq.com//openai/v1/chat/completions -s \
  -H "authorization: bearer $GROQ_API_KEY" \
  -d '{
    "model": "openai/gpt-oss-20b",
    "messages": [
        {
            "role": "user",
            "content": "What is the weather like in Paris today?"
        }
    ],
    "tools": [
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get current temperature for a given location.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "City and country e.g. Bogotá, Colombia"
                        }
                    },
                    "required": [
                        "location"
                    ],
                    "additionalProperties": false
                },
                "strict": true
            }
        }
    ]}'
```

## [Recommended Configuration Parameters](#recommended-configuration-parameters)

| Parameter             | Default        | Range                                      | Description                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | -------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| messages              | \-             | \-                                         | Array of message objects. Important: Avoid system prompts - include all instructions in the user message!                                                                                                                                                                                                                                                                   |
| temperature           | 0.6            | 0.0 - 2.0                                  | Controls randomness in responses. Lower values make responses more deterministic. Recommended range: 0.5-0.7 to prevent repetitions or incoherent outputs                                                                                                                                                                                                                   |
| max_completion_tokens | 1024           | \-                                         | Maximum length of model's response. Default may be too low for complex reasoning - consider increasing for detailed step-by-step solutions                                                                                                                                                                                                                                  |
| top_p                 | 0.95           | 0.0 - 1.0                                  | Controls diversity of token selection                                                                                                                                                                                                                                                                                                                                       |
| stream                | false          | boolean                                    | Enables response streaming. Recommended for interactive reasoning tasks                                                                                                                                                                                                                                                                                                     |
| stop                  | null           | string/array                               | Custom stop sequences                                                                                                                                                                                                                                                                                                                                                       |
| seed                  | null           | integer                                    | Set for reproducible results. Important for benchmarking - run multiple tests with different seeds                                                                                                                                                                                                                                                                          |
| response_format       | {type: "text"} | {type: "json_object"} or {type: "text"}    | Set to json_object type for structured output.                                                                                                                                                                                                                                                                                                                              |
| reasoning_format      | raw            | "parsed", "raw", "hidden"                  | Controls how model reasoning is presented in the response. Must be set to either parsed or hidden when using tool calling or JSON mode.                                                                                                                                                                                                                                     |
| reasoning_effort      | default        | "none", "default", "low", "medium", "high" | Controls the level of effort the model will put into reasoning. none and default are only supported by [Qwen 3.6 27B](https://console.groq.com/docs/model/qwen/qwen3.6-27b). low, medium, and high are only supported by [GPT-OSS 20B](https://console.groq.com/docs/model/openai/gpt-oss-20b) and [GPT-OSS 120B](https://console.groq.com/docs/model/openai/gpt-oss-120b). |

## [Accessing Reasoning Content](#accessing-reasoning-content)

Accessing the reasoning content in the response is dependent on the model and the reasoning format you are using. See the examples below for more details and refer to the [Reasoning Format](#reasoning-format) section for more information.

### [Non-GPT-OSS Models](#nongptoss-models)

RawParsedHidden

When using `raw` reasoning format, the reasoning content is accessible in the main text content of assistant responses within `<think>` tags. This example demonstrates making a request with `reasoning_format` set to `raw` to see the model's internal thinking process alongside the final answer.

Python

```
import { Groq } from 'groq-sdk';

const groq = new Groq();

const chatCompletion = await groq.chat.completions.create({
  "messages": [
    {
      "role": "user",
      "content": "How do airplanes fly? Be concise."
    }
  ],
  "model": "qwen/qwen3-32b",
  "stream": false,
  "reasoning_format": "raw"
});

console.log(chatCompletion.choices[0].message);
```

```
from groq import Groq

client = Groq()

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "How do airplanes fly? Be concise."
        }
    ],
    model="qwen/qwen3-32b",
    stream=False,
    reasoning_format="raw"
)

print(chat_completion.choices[0].message)
```

```
curl https://api.groq.com/openai/v1/chat/completions -s \
  -H "authorization: bearer $GROQ_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "How do airplanes fly? Be concise."
      }
    ],
    "model": "qwen/qwen3-32b",
    "stream": false,
    "reasoning_format": "raw"
  }'
```

Example Output (response.choices\[0\].message)

JSON

```
{
  "role": "assistant",
  "content": "<think>Okay, the user is asking how airplanes fly and wants a concise answer. Let me start by recalling the basics of flight mechanics. First, lift is essential. Airplanes generate lift with their wings. The shape of the wing, or airfoil, causes air to move faster over the top, creating lower pressure compared to the bottom. This pressure difference lifts the plane. But wait, I should mention Bernoulli's principle here. Also, angle of attack affects lift by directing airflow downward, which pushes the wing up by Newton's third law. Both factors contribute to lift. Thrust is needed to move the plane forward, providing the speed necessary for lift. Engines like jet engines or propellers generate thrust. Drag is the opposing force; the plane must overcome it. Stability and control come into play too—ailerons, rudder, elevator for maneuvers. Wait, the user wants it concise. Maybe I should prioritize the main points: lift due to wings' shape and angle, thrust from engines, and balance forces. Avoid getting too technical with equations but mention the key components. Also, mention that controlled flight involves managing these forces. Let me make sure I'm not missing anything crucial. Maybe lift, thrust, drag, weight—those are the four forces. But since the user wants it brief, I can simplify to the main elements without listing all four forces. Double-check if Bernoulli's principle is accurate here. Some debates exist about its role versus Newton's laws, but a simplified explanation is acceptable here. Also, mention that the engines provide forward motion, which is crucial for sustaining lift. Putting it all together: airplanes fly by generating lift through their wings' design and angle of attack, using engines for thrust to maintain speed, and controlling flight with adjustable surfaces. Should be concise and cover the essentials.</think>Airplanes fly by generating **lift** through the shape of their wings (airfoils), which causes faster airflow over the top and slower air underneath, creating a pressure difference. **Thrust** from engines (or propellers) propels them forward, countering **drag**, while **control surfaces** (ailerons, rudder, elevator) adjust airflow for stability and direction. Lift must overcome **weight** (gravity) to stay aloft."
}
```

When using `parsed` reasoning format, the model's reasoning is separated into a dedicated `reasoning` field, making it easier to access both the final answer and the thinking process programmatically. This format is ideal for applications that need to process or display reasoning content separately from the main response.

Python

```
import { Groq } from 'groq-sdk';

const groq = new Groq();

const chatCompletion = await groq.chat.completions.create({
  "messages": [
    {
      "role": "user",
      "content": "How do airplanes fly? Be concise."
    }
  ],
  "model": "qwen/qwen3-32b",
  "stream": false,
  "reasoning_format": "parsed"
});

console.log(chatCompletion.choices[0].message);
```

```
from groq import Groq

client = Groq()

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "How do airplanes fly? Be concise."
        }
    ],
    model="qwen/qwen3-32b",
    stream=False,
    reasoning_format="parsed"
)

print(chat_completion.choices[0].message)
```

```
curl https://api.groq.com/openai/v1/chat/completions -s \
  -H "authorization: bearer $GROQ_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "How do airplanes fly? Be concise."
      }
    ],
    "model": "qwen/qwen3-32b",
    "stream": false,
    "reasoning_format": "parsed"
  }'
```

Example Output (response.choices\[0\].message)

JSON

```
{
  "role": "assistant",
  "content": "Airplanes fly by generating **lift** through their wings' shape (airfoils), creating a pressure difference (lower pressure above, higher below). **Thrust** from engines overcomes drag, propelling the plane forward. Controlled movement (pitch, roll, yaw) adjusts lift and direction. In short: **lift + thrust > weight + drag** enables flight.",
  "reasoning": "Okay, the user is asking how airplanes fly and wants a concise answer. Let me break this down. First, I need to recall the basic principles of flight. The main concepts are lift, thrust, drag, and weight. Lift is generated by the wings, right? The shape of the wing causes air to move faster over the top, creating lower pressure compared to the bottom, which lifts the plane. Then there's thrust from the engines, which pushes the plane forward, overcoming drag. Drag is the resistance from the air. The pilot controls the plane's direction with surfaces like ailerons, elevators, and rudders. Also, Newton's third law comes into play with the engines pushing air backward, propelling the plane forward. Wait, the question is asking for conciseness. I should make sure not to include too much detail. Maybe mention the four forces, the wing's shape (airfoil), and how the engines generate thrust. Avoid getting into too much depth about different types of engines or control surfaces unless necessary. Is there anything else important? Maybe the angle of attack? Or the balance between the forces. But keeping it simple. The answer should be brief enough. Let me check the key points again: lift due to wing shape causing pressure difference, thrust overcoming drag, controlled movement. That should cover it without being too technical.",
}
```

When using `hidden` reasoning format, only the final answer is returned without any visible reasoning content. This is useful for applications where you want the benefits of reasoning models but don't need to expose the thinking process to end users. The model will still reason, but the reasoning content will not be returned in the response.

Python

```
import { Groq } from 'groq-sdk';

const groq = new Groq();

const chatCompletion = await groq.chat.completions.create({
  "messages": [
    {
      "role": "user",
      "content": "How do airplanes fly? Be concise."
    }
  ],
  "model": "qwen/qwen3-32b",
  "stream": false,
  "reasoning_format": "hidden"
});

console.log(chatCompletion.choices[0].message);
```

```
from groq import Groq

client = Groq()

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "How do airplanes fly? Be concise."
        }
    ],
    model="qwen/qwen3-32b",
    stream=False,
    reasoning_format="hidden"
)

print(chat_completion.choices[0].message)
```

```
curl https://api.groq.com/openai/v1/chat/completions -s \
  -H "authorization: bearer $GROQ_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "How do airplanes fly? Be concise."
      }
    ],
    "model": "qwen/qwen3-32b",
    "stream": false,
    "reasoning_format": "hidden"
  }'
```

Example Output (response.choices\[0\].message)

JSON

```
{
  "role": "assistant",
  "content": "Airplanes fly by generating **lift** via airfoil-shaped wings, which create a pressure difference (Bernoulli’s principle) as air moves faster over the curved top surface. **Thrust** from engines overcomes air **drag**, maintaining forward motion to sustain lift. Control surfaces (ailerons, elevators, rudder) adjust **direction** and **altitude**, balancing **weight** (gravity) and lift for stable flight."
}
```

### [GPT-OSS Models](#gptoss-models)

With `openai/gpt-oss-20b` and `openai/gpt-oss-120b`, the `reasoning_format` parameter is not supported. By default, these models will include reasoning content in the `reasoning` field of the assistant response. You can also control whether reasoning is included in the response by setting the `include_reasoning` parameter.

Reasoning ExcludedReasoning IncludedReasoning Included (High)

Python

```
import { Groq } from 'groq-sdk';

const groq = new Groq();

const chatCompletion = await groq.chat.completions.create({
  "messages": [
    {
      "role": "user",
      "content": "How do airplanes fly? Be concise."
    }
  ],
  "model": "openai/gpt-oss-20b",
  "stream": false,
  "include_reasoning": false
});

console.log(chatCompletion.choices[0].message);
```

```
from groq import Groq

client = Groq()

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "How do airplanes fly? Be concise."
        }
    ],
    model="openai/gpt-oss-20b",
    stream=False,
    include_reasoning=False
)

print(chat_completion.choices[0].message)
```

```
curl https://api.groq.com/openai/v1/chat/completions -s \
  -H "authorization: bearer $GROQ_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "How do airplanes fly? Be concise."
      }
    ],
    "model": "openai/gpt-oss-20b",
    "stream": false,
    "include_reasoning": false
  }'
```

Example Output (response.choices\[0\].message)

JSON

```
{
  "role": "assistant",
  "content": "Airplanes fly because their wings are shaped like airfoils that slice the air and produce lift: air travels faster over the curved upper surface (Bernoulli principle) and/or is deflected downward, creating an upward lift force that exceeds gravity. Engines provide thrust to overcome drag and keep the aircraft moving forward, so lift can keep it aloft. Control surfaces then balance lift, weight, thrust, and drag to steer and maintain flight."
}
```

Python

```
import { Groq } from 'groq-sdk';

const groq = new Groq();

const chatCompletion = await groq.chat.completions.create({
  "messages": [
    {
      "role": "user",
      "content": "How do airplanes fly? Be concise."
    }
  ],
  "model": "openai/gpt-oss-20b",
  "stream": false
});

console.log(chatCompletion.choices[0].message);
```

```
from groq import Groq

client = Groq()

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "How do airplanes fly? Be concise."
        }
    ],
    model="openai/gpt-oss-20b",
    stream=False
)

print(chat_completion.choices[0].message)
```

```
curl https://api.groq.com/openai/v1/chat/completions -s \
  -H "authorization: bearer $GROQ_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "How do airplanes fly? Be concise."
      }
    ],
    "model": "openai/gpt-oss-20b",
    "stream": false
  }'
```

Example Output (response.choices\[0\].message)

JSON

```
{
  "role": "assistant",
  "content": "Airplanes fly because their wings are shaped like airfoils that slice the air and produce lift: air travels faster over the curved upper surface (Bernoulli principle) and/or is deflected downward, creating an upward lift force that exceeds gravity. Engines provide thrust to overcome drag and keep the aircraft moving forward, so lift can keep it aloft. Control surfaces then balance lift, weight, thrust, and drag to steer and maintain flight.",
  "reasoning": "We need concise answer: planes fly because of lift generated from wings due to airfoil shape, Bernoulli, angle of attack, thrust vs drag. So concisely explain: plane wings shape produces lift, engines provide thrust, controls manage pitch etc. Also mention aerodynamics: lift > weight, thrust > drag. So answer concise. Let's prepare: \"airplane wings produce lift due to airfoil shape... engine thrust propels...\" etc."
}
```

Python

```
import { Groq } from 'groq-sdk';

const groq = new Groq();

const chatCompletion = await groq.chat.completions.create({
  "messages": [
    {
      "role": "user",
      "content": "How do airplanes fly? Be concise."
    }
  ],
  "model": "openai/gpt-oss-20b",
  "reasoning_effort": "high",
  "include_reasoning": true,
  "stream": false
});

console.log(chatCompletion.choices[0].message);
```

```
from groq import Groq

client = Groq()

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "How do airplanes fly? Be concise."
        }
    ],
    model="openai/gpt-oss-20b",
    reasoning_effort="high",
    include_reasoning=True,
    stream=False
)

print(chat_completion.choices[0].message)
```

```
curl https://api.groq.com/openai/v1/chat/completions -s \
  -H "authorization: bearer $GROQ_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "How do airplanes fly? Be concise."
      }
    ],
    "model": "openai/gpt-oss-20b",
    "reasoning_effort": "high",
    "include_reasoning": true,
    "stream": false
  }'
```

Example Output (response.choices\[0\].message)

JSON

```
{
  "role": "assistant",
  "content": "Planes fly because their wings, shaped like airfoils, move through the air to create a pressure difference that produces lift. Engines generate thrust to overcome drag, while lift balances the plane’s weight. When lift equals weight and thrust equals drag, the aircraft flies level; if lift exceeds weight it climbs, and if thrust exceeds drag it accelerates.",
  "reasoning": "The user asks: How do airplanes fly? Be concise. The user wants a concise answer. I must answer succinctly. The answer: basically lift, thrust, drag, weight. The plane's wings generate lift due to Bernoulli or angle of attack, engines produce thrust. Balanced forces. Maybe mention lift > weight for climb, etc. Or just mention wings shape, airfoil, Bernoulli's principle, Newton's third law, lift, thrust, etc. Keep concise. We can give a short paragraph: Airplanes fly because the wings are shaped to produce lift, the engines generate thrust, and the plane's weight pulls down; lift must balance weight, and thrust must overcome drag. That's it. Should be concise. Let's answer in maybe one or two sentences: An airplane generates lift by moving through air over its wing-shaped surfaces, creating a pressure difference; engines produce thrust to counteract drag, and the lift force balances weight, allowing flight. That is concise. Alternatively: Planes fly because the wings produce lift (pressure difference due to shape and motion), engines provide thrust, and the aircraft's weight pulls downward; lift equals weight and thrust equals drag for level flight. Thus answer."
}
```

## [Optimizing Performance](#optimizing-performance)

### [Temperature and Token Management](#temperature-and-token-management)

The model performs best with temperature settings between 0.5-0.7, with lower values (closer to 0.5) producing more consistent mathematical proofs and higher values allowing for more creative problem-solving approaches. Monitor and adjust your token usage based on the complexity of your reasoning tasks - while the default max_completion_tokens is 1024, complex proofs may require higher limits.

### [Prompt Engineering](#prompt-engineering)

To ensure accurate, step-by-step reasoning while maintaining high performance:

- DeepSeek-R1 works best when all instructions are included directly in user messages rather than system prompts.
- Structure your prompts to request explicit validation steps and intermediate calculations.
- Avoid few-shot prompting and go for zero-shot prompting only.
