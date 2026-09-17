---
description: Learn how to use multimodal vision models on Groq for image understanding, OCR, and more.
title: Images and Vision - GroqDocs
image: https://console.groq.com/og_cloudv5.jpg
---

# Images and Vision

Groq API offers fast inference and low latency for multimodal models with vision capabilities for understanding and interpreting visual data from images. By analyzing the content of an image, multimodal models can generate human-readable text for providing insights about given visual data.

## [Supported Models](#supported-models)

Groq API supports powerful multimodal models that can be easily integrated into your applications to provide fast and accurate image processing for tasks such as visual question answering, caption generation, and Optical Character Recognition (OCR).

### [meta-llama/llama-4-scout-17b-16e-instruct](https://console.groq.com/docs/model/llama-4-scout-17b-16e-instruct)

Model ID

`meta-llama/llama-4-scout-17b-16e-instruct`

Description

A powerful multimodal model capable of processing both text and image inputs that supports multilingual, multi-turn conversations, tool use, and JSON mode.

Context Window

128K tokens

Preview Model

Currently in preview and should be used for experimentation.

Image Size Limit

Maximum allowed size for a request containing an image URL as input is 20MB. Requests larger than this limit will return a 400 error.

Image Resolution Limit

Maximum allowed resolution for a request containing images is 33 megapixels (33177600 total pixels) per image. Images larger than this limit will return a 400 error.

Request Size Limit (Base64 Encoded Images)

Maximum allowed size for a request containing a base64 encoded image is 4MB. Requests larger than this limit will return a 413 error.

Images per Request

You can process a maximum of 5 images.

### [qwen/qwen3.6-27b](https://console.groq.com/docs/model/qwen/qwen3.6-27b)

Model ID

`qwen/qwen3.6-27b`

Description

A 27B multimodal model that processes both text and image inputs, with thinking and non-thinking modes, tool use, and JSON mode.

Context Window

131K tokens

Image Size Limit

Maximum allowed size for a request containing an image URL as input is 20MB. Requests larger than this limit will return a 400 error.

Images per Request

You can process a maximum of 5 images.

## [How to Use Vision](#how-to-use-vision)

Use Groq API vision features via:

- **GroqCloud Console Playground**: Use [Llama 4 Scout](https://console.groq.com/playground?model=meta-llama/llama-4-scout-17b-16e-instruct) as the model and upload your image.
- **Groq API Request:** Call the [chat.completions](https://console.groq.com/docs/text-chat#generating-chat-completions-with-groq-sdk) API endpoint and set the model to
  `meta-llama/llama-4-scout-17b-16e-instruct`
  . See code examples below.

## [How to Pass Images from URLs as Input](#how-to-pass-images-from-urls-as-input)

The following are code examples for passing your image to the model via a URL:

curlJavaScriptPythonJSON

Python

```
from groq import Groq
import os

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
completion = client.chat.completions.create(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What's in this image?"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://upload.wikimedia.org/wikipedia/commons/f/f2/LPU-v1-die.jpg"
                    }
                }
            ]
        }
    ],
    temperature=1,
    max_completion_tokens=1024,
    top_p=1,
    stream=False,
    stop=None,
)

print(completion.choices[0].message)
```

## [How to Pass Locally Saved Images as Input](#how-to-pass-locally-saved-images-as-input)

To pass locally saved images, we'll need to first encode our image to a base64 format string before passing it as the `image_url` in our API request as follows:

Python

```
from groq import Groq
import base64
import os

# Function to encode the image
def encode_image(image_path):
  with open(image_path, "rb") as image_file:
    return base64.b64encode(image_file.read()).decode('utf-8')

# Path to your image
image_path = "sf.jpg"

# Getting the base64 string
base64_image = encode_image(image_path)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What's in this image?"},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}",
                    },
                },
            ],
        }
    ],
    model="meta-llama/llama-4-scout-17b-16e-instruct",
)

print(chat_completion.choices[0].message.content)
```

## [Tool Use with Images](#tool-use-with-images)

The `meta-llama/llama-4-scout-17b-16e-instruct` model supports tool use! The following cURL example defines a `get_current_weather` tool that the model can leverage to answer a user query that contains a question about the weather along with an image of a location that the model can infer location (i.e. New York City) from:

shell

```
curl https://api.groq.com/openai/v1/chat/completions -s \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $GROQ_API_KEY" \
-d '{
"model": "meta-llama/llama-4-scout-17b-16e-instruct",
"messages": [
{
    "role": "user",
    "content": [{"type": "text", "text": "Whats the weather like in this state?"}, {"type": "image_url", "image_url": { "url": "https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg"}}]
}
],
"tools": [
{
    "type": "function",
    "function": {
    "name": "get_current_weather",
    "description": "Get the current weather in a given location",
    "parameters": {
        "type": "object",
        "properties": {
        "location": {
            "type": "string",
            "description": "The city and state, e.g. San Francisco, CA"
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
"tool_choice": "auto"
}' | jq '.choices[0].message.tool_calls'
```

The following is the output from our example above that shows how our model inferred the state as New York from the given image and called our example function:

Python

```
[
  {
    "id": "call_q0wg",
    "function": {
      "arguments": "{\"location\": \"New York, NY\",\"unit\": \"fahrenheit\"}",
      "name": "get_current_weather"
    },
    "type": "function"
  }
]
```

## [JSON Mode with Images](#json-mode-with-images)

The `meta-llama/llama-4-scout-17b-16e-instruct` model supports JSON mode! The following Python example queries the model with an image and text (i.e. "Please pull out relevant information as a JSON object.") with `response_format`set for JSON mode:

Python

```
from groq import Groq
import os

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

completion = client.chat.completions.create(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "List what you observe in this photo in JSON format."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://upload.wikimedia.org/wikipedia/commons/d/da/SF_From_Marin_Highlands3.jpg"
                    }
                }
            ]
        }
    ],
    temperature=1,
    max_completion_tokens=1024,
    top_p=1,
    stream=False,
    response_format={"type": "json_object"},
    stop=None,
)

print(completion.choices[0].message)
```

## [Multi-turn Conversations with Images](#multiturn-conversations-with-images)

The `meta-llama/llama-4-scout-17b-16e-instruct` model supports multi-turn conversations! The following Python example shows a multi-turn user conversation about an image:

Python

```
from groq import Groq
import os

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

completion = client.chat.completions.create(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What is in this image?"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://upload.wikimedia.org/wikipedia/commons/d/da/SF_From_Marin_Highlands3.jpg"
                    }
                }
            ]
        },
        {
            "role": "user",
            "content": "Tell me more about the area."
        }
    ],
    temperature=1,
    max_completion_tokens=1024,
    top_p=1,
    stream=False,
    stop=None,
)

print(completion.choices[0].message)
```

## [Venture Deeper into Vision](#venture-deeper-into-vision)

### [Use Cases to Explore](#use-cases-to-explore)

Vision models can be used in a wide range of applications. Here are some ideas:

- **Accessibility Applications:** Develop an application that generates audio descriptions for images by using a vision model to generate text descriptions for images, which can then be converted to audio with one of our audio endpoints.
- **E-commerce Product Description Generation:** Create an application that generates product descriptions for e-commerce websites.
- **Multilingual Image Analysis:** Create applications that can describe images in multiple languages.
- **Multi-turn Visual Conversations:** Develop interactive applications that allow users to have extended conversations about images.

These are just a few ideas to get you started. The possibilities are endless, and we're excited to see what you create with vision models powered by Groq for low latency and fast inference!

### [Next Steps](#next-steps)

Check out our [Groq API Cookbook](https://github.com/groq/groq-api-cookbook) repository on GitHub (and give us a ⭐) for practical examples and tutorials:

- [Image Moderation](https://github.com/groq/groq-api-cookbook/blob/main/tutorials/image%5Fmoderation.ipynb)
- [Multimodal Image Processing (Tool Use, JSON Mode)](https://github.com/groq/groq-api-cookbook/tree/main/tutorials/multimodal-image-processing)

We're always looking for contributions. If you have any cool tutorials or guides to share, submit a pull request for review to help our open-source community!
