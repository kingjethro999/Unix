---
description: Learn why tools are essential for building powerful AI agents and how they enable LLMs to take action in the real world.
title: Tool Use Overview - GroqDocs
image: https://console.groq.com/og_cloudv5.jpg
---

# Tool Use

Applications using LLMs become much more powerful when the model can interact with external resources, such as APIs, databases, and the web, to gather dynamic data or to perform actions. **Tool use** (or function calling) is what transforms a language model from a conversational interface into an autonomous agent capable of taking action, accessing real-time information, and solving complex multi-step problems.

This doc starts with a high-level overview of tool use and then dives into the details of how tool use works. If you're already familiar with tool use, you can skip to the [How to Use Tools on the Groq API](#how-to-use-tools-on-the-groq-api) section.

## [How Tool Use Works](#how-tool-use-works)

There are a few important pieces in the tool calling process:

1. A request is made to the model with tool definitions
2. The model returns tool call requests
3. The tool is executed and results are returned to the model
4. The model evaluates the results and continues or completes

Let's break down each step in more detail.

### [1\. Initial Request with Tool Definitions](#1-initial-request-with-tool-definitions)

To use tools, the model must be provided with tool definitions. These tool definitions are in JSON schema format and are passed to the model via the `tools` parameter in the API request.

JSON

```
// Sample request body with tool definitions and messages
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
          // JSON Schema object
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City and state, e.g. San Francisco, CA"
            },
            "unit": {
              "type": "string",
              "enum": ["celsius", "fahrenheit"]
            }
          },
          "required": ["location"]
        }
      }
    }
  ],
  "messages": [
    {
      "role": "system",
      "content": "You are a weather assistant. Respond to the user question and use tools if needed to answer the query."
    },
    {
      "role": "user",
      "content": "What's the weather in San Francisco?"
    }
  ],
}
```

**Key fields:**

- `name`: Function identifier
- `description`: Helps the model decide when to use this tool
- `parameters`: Function parameters defined as a JSON Schema object. Refer to [JSON Schema](https://json-schema.org/learn/getting-started-step-by-step#introduction-to-json-schema) for schema documentation.

### [2\. Model Returns Tool Call Requests](#2-model-returns-tool-call-requests)

When the model decides to use a tool, it returns structured tool calls in the response. The model returns a `tool_calls` array with the following fields:

JSON

```
{
  "role": "assistant",
  "tool_calls": [{
    "id": "call_abc123",
    "type": "function",
    "function": {
      "name": "get_weather",
      "arguments": "{\"location\": \"San Francisco, CA\", \"unit\": \"fahrenheit\"}"
    }
  }]
}
```

**Key fields:**

- `id`: Unique identifier you'll reference when returning results
- `function.name`: Which tool to execute
- `function.arguments`: JSON string of arguments (needs parsing)

### [3\. Tool Execution and Results](#3-tool-execution-and-results)

Application code will then execute the tool and create a new message with the results. This new message is appended to the conversation and sent back to the model.

JSON

```
{
  "role": "tool",
  # must match the `id` from the assistant's `tool_calls`
  "tool_call_id": "call_abc123",
  "name": "get_weather",
  "content": "{\"temperature\": 72, \"condition\": \"sunny\", \"unit\": \"fahrenheit\"}"
}
```

**Key connections:**

- The `tool` message's `tool_call_id` must match the `id` from the assistant's `tool_calls`
- `content` can be any string value. Different tools may return different types of data.
- The updated messages array is then sent back to the model for the next step

### [4\. Model Evaluates Results and Decides Next Steps](#4-model-evaluates-results-and-decides-next-steps)

The model is then provided with the updated messages array:

JSON

```
[
  {
    "role": "user",
    "content": "What's the weather in San Francisco?"
  },
  {
    "role": "assistant",
    "tool_calls": [{
      "id": "call_abc123",
      "type": "function",
      "function": {
        "name": "get_weather",
        "arguments": "{\"location\": \"San Francisco, CA\", \"unit\": \"fahrenheit\"}"
      }
    }]
  },
  {
    "role": "tool",
    "tool_call_id": "call_abc123",
    "name": "get_weather",
    "content": "{\"temperature\": 72, \"condition\": \"sunny\", \"unit\": \"fahrenheit\"}"
  }
]
```

The model then analyzes the tool results and either:

- Returns a final answer (no more `tool_calls`)
- Returns more tool call requests (loop continues)

JSON

```
{
  "role": "assistant",
  "content": "The weather in San Francisco is sunny and 72 degrees Fahrenheit."
}
```

This tool-calling sequence is normally implemented in your application code, but Groq suports a number of ways to call tools server-side which allow your application code to remain simple while still allowing you to use tools.

## [Supported Models](#supported-models)

All models hosted on Groq support tool use, and in general, we recommend the latest models for improved tool use capabilities:

| Model ID                                  | Local & Remote Tool Use Support? | Parallel Tool Use Support? | JSON Mode Support? | Built-In Tools Support? |
| ----------------------------------------- | -------------------------------- | -------------------------- | ------------------ | ----------------------- |
| openai/gpt-oss-20b                        | Yes ✅                           | No ❌                      | Yes ✅             | Yes ✅                  |
| openai/gpt-oss-120b                       | Yes ✅                           | No ❌                      | Yes ✅             | Yes ✅                  |
| openai/gpt-oss-safeguard-20b              | Yes ✅                           | No ❌                      | Yes ✅             | No ❌                   |
| qwen/qwen3-32b                            | Yes ✅                           | Yes ✅                     | Yes ✅             | No ❌                   |
| qwen/qwen3.6-27b                          | Yes ✅                           | Yes ✅                     | Yes ✅             | No ❌                   |
| meta-llama/llama-4-scout-17b-16e-instruct | Yes ✅                           | Yes ✅                     | Yes ✅             | No ❌                   |
| llama-3.3-70b-versatile                   | Yes ✅                           | Yes ✅                     | Yes ✅             | No ❌                   |
| llama-3.1-8b-instant                      | Yes ✅                           | Yes ✅                     | Yes ✅             | No ❌                   |
| groq/compound                             | No ❌                            | N/A                        | Yes ✅             | Yes ✅                  |
| groq/compound-mini                        | No ❌                            | N/A                        | Yes ✅             | Yes ✅                  |

## [How to Use Tools on the Groq API](#how-to-use-tools-on-the-groq-api)

Groq supports three distinct patterns for tool use, each suited for different use cases: Groq built-in tools, remote tool calling via MCP servers, and local tool calling.

### [1\. Groq Built-In Tools](#1-groq-builtin-tools)

Groq maintains a set of pre-built tools like web search, code execution, and website visiting that execute entirely on Groq's infrastructure. These tools require minimal configuration and no tool orchestration on your end. With one API call, you get a capable, real-time AI agent. All tool calls happen in a single API call – when provided configured to have access to built-in tools, the model autonomously calls built-in tools and handles the entire agentic loop internally.

**Ideal for:**

- Drop-in developer experience with zero setup
- Applications requiring the lowest possible latency
- Web search and browsing capabilities
- Safe code execution environments
- Single-call agentic responses

**Supported models:**

- `groq/compound` and `groq/compound-mini`
- `openai/gpt-oss-20b` and `openai/gpt-oss-120b`

[Groq Built-In Tools GuideFor more details, this guide covers how to use Groq's server-side tools for instant agentic capabilities](https://console.groq.com/docs/tool-use/built-in-tools)

### [2\. Remote Tool Calling with MCP](#2-remote-tool-calling-with-mcp)

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is an open standard that allows models to connect to and execute external tools. Each MCP server hosts a set of tools, providing endpoints to fetch their definitions and execute them without requiring the end user to implement the underlying tool logic.

Groq supports MCP tool discovery and execution server-side via remote tool calling. Similar to built-in tools, this allows you to use third-party tools with minimal configuration and no tool orchestration on your end. To use remote tools, you provide an MCP server configuration, which includes the MCP server URL and authentication headers. Groq's servers will connect to the MCP server, discover the available tools, pass them to the model, and execute any tools that are called server-side — all in a single API call.

**Ideal for:**

- Standardized integrations (GitHub, databases, external APIs)
- Tools maintained by third parties
- Sharing tools across multiple applications
- Accessing tools without hosting infrastructure

[Remote Tools and MCP GuideFor more details, this guide covers how to use MCP servers for third-party tool integrations](https://console.groq.com/docs/tool-use/remote-mcp)

### [3\. Local Tool Calling (Function Calling)](#3-local-tool-calling-function-calling)

If you want the most control over tool execution logic, you can implement local tool calling. To do this, you manually write a set of functions and corresonding tool definitions. The tool definitions are provided to the model at inference time, and the model returns structured tool call requests (example provided above; a JSON object specifying which function to call and what arguments to use). Your application code then executes the function that corresponds to the tool call request locally and sends the results back to the model for the final response.

These functions can connect to external resources such as databases, APIs, and external services, but they are "local" in the sense that they are executed on the same machine as the application code. You can also connect to MCP servers locally to execute tools. This requires implementing code to discover tools from the MCP server, provide them to the model at inference time, routing any tool calls back to the MCP server for execution, and finally returning the results back to the model for the final response.

**Ideal for:**

- Custom business logic
- Internal APIs and databases
- Proprietary workflows
- Fine-grained control over security and execution

[Local Tool Calling GuideLearn how to implement custom tools that execute in your application code](https://console.groq.com/docs/tool-use/local-tool-calling)

### [Comparison](#comparison)

| Pattern        | You Provide                       | Execution Location | Orchestration   | API Calls                   |
| -------------- | --------------------------------- | ------------------ | --------------- | --------------------------- |
| **Built-In**   | List of enabled built-in tools    | Groq servers       | Groq manages    | Single call                 |
| **Remote MCP** | MCP server URL + auth             | MCP server         | Groq manages    | Single call                 |
| **Local**      | Tool definitions + implementation | Your code          | You manage loop | Multiple (2+ per iteration) |

### [Parallel Tool Use](#parallel-tool-use)

Many models support **parallel tool use**, where multiple tools can be called simultaneously in a single request. This is crucial for efficient agentic systems:

**Without parallel tool use:**

curl

```
Query: "What's the weather in NYC and LA?"
Call 1: get_weather(location="NYC")      → Wait for result
Call 2: get_weather(location="LA")       → Wait for result
Final response
```

**With parallel tool use:**

curl

```
Query: "What's the weather in NYC and LA?"
Call 1: [get_weather(location="NYC"), get_weather(location="LA")]
Both execute simultaneously → Final response
```

Parallel tool use dramatically reduces latency for queries that require multiple tool calls.

### [Why Groq's Speed Matters](#why-groqs-speed-matters)

Because agentic workflows involve multiple inference calls, using Groq's fast inference can significantly improve the user experience of an agentic application:

- **Single tool call workflow**: 2 inference calls instead of 1 (first call to determine if a tool call is needed, second call to send the tool call results back to the model)
- **Multi-tool workflow**: 3-5+ inference calls
- **Complex agent loops**: 10+ inference calls

With traditional inference speeds of 10-30 tokens/second, multi-tool workflows can feel painfully slow. Groq's inference speed of **300-1,000+ tokens/second** makes these agentic experiences feel **instantaneous**.

## [What's Next?](#whats-next)

Now that you understand the fundamentals of tool use and agentic systems, explore the specific patterns for using tools on the Groq API:

[Groq Built-In ToolsUse web search, code execution, and more without setup](https://console.groq.com/docs/tool-use/built-in-tools)[Remote Tools and MCPConnect to MCP servers for standardized tool integrations](https://console.groq.com/docs/tool-use/remote-mcp)[Local Tool CallingDefine and execute custom tools in your application code](https://console.groq.com/docs/tool-use/local-tool-calling)[Compound SystemsPurpose-built agentic systems with built-in tools and orchestration](https://console.groq.com/docs/compound)
