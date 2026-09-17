---
description: Pre-built integrations for popular services using Model Context Protocol (MCP). Connect to Google Workspace with ready-made connectors.
title: MCP Connectors - GroqDocs
image: https://console.groq.com/og_cloudv5.jpg
---

# MCP Connectors

Connectors provide a streamlined way to integrate with popular business applications without needing to build custom MCP servers. Groq currently supports **Google Workspace** connectors, giving you instant access to Gmail, Google Calendar, and Google Drive.

MCP Connectors on Groq are currently in beta. Please let us know your feedback in our [Community](https://community.groq.com).

## [Available Connectors](#available-connectors)

We currently support the following Google Workspace (read-only) connectors:

| Service             | Connector ID             | Required Scope                                  | Primary Use Cases                     |
| ------------------- | ------------------------ | ----------------------------------------------- | ------------------------------------- |
| **Gmail**           | connector_gmail          | https://www.googleapis.com/auth/gmail.readonly  | Read and search emails                |
| **Google Calendar** | connector_googlecalendar | https://www.googleapis.com/auth/calendar.events | View calendar events                  |
| **Google Drive**    | connector_googledrive    | https://www.googleapis.com/auth/drive.readonly  | Search and access files and documents |

## [Authentication](#authentication)

Connectors use OAuth 2.0 for authentication. You'll need to:

1. **[Set up OAuth credentials](https://developers.google.com/identity/protocols/oauth2)** for your Google application
2. **Obtain an access token** through your OAuth flow
3. **Pass the token** in the `authorization` field. **Only share credentials with MCP servers you fully trust.**

For development and testing, you can use Google's [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) to generate temporary access tokens.

## [Example Connectors](#example-connectors)

### [Google Calendar Example](#google-calendar-example)

Here's how to use the Google Calendar connector to check your schedule:

_Requires scope `https://www.googleapis.com/auth/calendar.events`_

Python

```
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const response = await client.responses.create({
  model: "openai/gpt-oss-120b",
  tools: [{
    type: "mcp",
    server_label: "Google Calendar",
    connector_id: "connector_googlecalendar",
    authorization: "ya29.A0AR3da...", // Your OAuth access token
    require_approval: "never"
  }],
  input: "What's on my calendar for today?"
});

// The response will include calendar events if found
console.log(response.output_text);
```

```
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

response = client.responses.create(
    model="openai/gpt-oss-120b",
    tools=[{
        "type": "mcp",
        "server_label": "Google Calendar",
        "connector_id": "connector_googlecalendar",
        "authorization": "ya29.A0AR3da...", # Your OAuth access token
        "require_approval": "never"
    }],
    input="What's on my calendar for today?"
)

print(response.output_text)
```

```
curl https://api.groq.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -d '{
    "model": "openai/gpt-oss-120b",
    "tools": [{
      "type": "mcp",
      "server_label": "Google Calendar",
      "connector_id": "connector_googlecalendar",
      "authorization": "ya29.A0AR3da...",
      "require_approval": "never"
    }],
    "input": "What'"'"'s on my calendar for today?"
  }'
```

### [Gmail Example](#gmail-example)

Access and manage your emails with the Gmail connector:

_Requires scope `https://www.googleapis.com/auth/gmail.readonly`_

Python

```
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const response = await client.responses.create({
  model: "openai/gpt-oss-120b",
  tools: [{
    type: "mcp",
    server_label: "Gmail",
    connector_id: "connector_gmail",
    authorization: "ya29.A0AR3da...", // Your OAuth access token
    require_approval: "never"
  }],
  input: "Show me unread emails from this week"
});

console.log(response.output_text);
```

```
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

response = client.responses.create(
    model="openai/gpt-oss-120b",
    tools=[{
        "type": "mcp",
        "server_label": "Gmail",
        "connector_id": "connector_gmail",
        "authorization": "ya29.A0AR3da...", # Your OAuth access token
        "require_approval": "never"
    }],
    input="Show me unread emails from this week"
)

print(response.output_text)
```

```
curl https://api.groq.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -d '{
    "model": "openai/gpt-oss-120b",
    "tools": [{
      "type": "mcp",
      "server_label": "Gmail",
      "connector_id": "connector_gmail",
      "authorization": "ya29.A0AR3da...",
      "require_approval": "never"
    }],
    "input": "Show me unread emails from this week"
  }'
```

### [Google Drive Example](#google-drive-example)

Search and access your files with the Google Drive connector:

_Requires scope `https://www.googleapis.com/auth/drive.readonly`_

Python

```
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const response = await client.responses.create({
  model: "openai/gpt-oss-120b",
  tools: [{
    type: "mcp",
    server_label: "Google Drive",
    connector_id: "connector_googledrive",
    authorization: "ya29.A0AR3da...", // Your OAuth access token
    require_approval: "never"
  }],
  input: "Find spreadsheet files I worked on last month"
});

console.log(response.output_text);
```

```
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

response = client.responses.create(
    model="openai/gpt-oss-120b",
    tools=[{
        "type": "mcp",
        "server_label": "Google Drive",
        "connector_id": "connector_googledrive",
        "authorization": "ya29.A0AR3da...", # Your OAuth access token
        "require_approval": "never"
    }],
    input="Find spreadsheet files I worked on last month"
)

print(response.output_text)
```

```
curl https://api.groq.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -d '{
    "model": "openai/gpt-oss-120b",
    "tools": [{
      "type": "mcp",
      "server_label": "Google Drive",
      "connector_id": "connector_googledrive",
      "authorization": "ya29.A0AR3da...",
      "require_approval": "never"
    }],
    "input": "Find spreadsheet files I worked on last month"
  }'
```

## [Available Tools by Connector](#available-tools-by-connector)

Each connector provides different tools based on the service's API capabilities:

**Google Calendar Connector:**

- `get_profile` \- Get user profile information
- `search` \- Search calendar events within time windows
- `search_events` \- Look up events using filters
- `read_event` \- Read specific event details by ID

**Gmail Connector:**

- `get_profile` \- Get Gmail profile information
- `search_emails` \- Search emails by query or labels
- `get_recent_emails` \- Fetch latest received messages
- `read_email` \- Read specific email content and metadata

**Google Drive Connector:**

- `get_profile` \- Get Drive user profile
- `search` \- Search files using queries
- `recent_documents` \- Find recently modified files
- `fetch` \- Download file content

## [OAuth Setup for Development](#oauth-setup-for-development)

For testing connectors, you can use Google's OAuth 2.0 Playground:

1. Visit [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)
2. Under "Step 1: Select and authorize APIs", enter the required scope:

- Calendar: `https://www.googleapis.com/auth/calendar.events`
- Gmail: `https://www.googleapis.com/auth/gmail.readonly`
- Drive: `https://www.googleapis.com/auth/drive.readonly`

3. Complete the authorization flow
4. Copy the access token from "Step 2: Exchange authorization code for tokens"
5. Use this token in your API requests

OAuth access tokens are temporary (typically 1 hour). For production use, implement proper OAuth flows in your application to refresh tokens automatically.

## [Real-World Use Cases](#realworld-use-cases)

With connectors, you can build AI agents that:

- **Access your email**: Connect to Gmail to read, summarize, or search through messages
- **Manage your calendar**: Check availability, view events, or search meetings across Google Calendar
- **Browse your files**: Search and read documents from Google Drive

[Try the Open Source DemoGet started with our Google MCP Connectors demo template featuring CLI examples and a web app with OAuth integration](https://github.com/build-with-groq/groq-google-mcp)

## [Next Steps](#next-steps)

- **Explore [Remote MCP Servers](https://console.groq.com/docs/tool-use/remote-mcp)** for custom integrations beyond connectors
- **Check out the [Responses API](https://console.groq.com/docs/responses-api)** for advanced workflows
- **[Build custom MCP servers](https://spec.modelcontextprotocol.io/)** for specialized needs
