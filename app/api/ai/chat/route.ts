import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Types for Gemini API
interface TextPart {
    text: string
}

interface FunctionCallPart {
    functionCall: {
        name: string
        args: Record<string, any>
    }
}

interface FunctionResponsePart {
    functionResponse: {
        name: string
        response: Record<string, any>
    }
}

type Part = TextPart | FunctionCallPart | FunctionResponsePart

interface Content {
    role: 'user' | 'model' | 'function'
    parts: Part[]
}

interface Tool {
    functionDeclarations: {
        name: string
        description: string
        parameters: {
            type: string
            properties: Record<string, any>
            required?: string[]
        }
    }[]
}

const API_KEY = process.env.GEMINI_API_KEY
const MODEL = 'gemini-2.5-flash'
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const chatSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['user', 'model']),
        content: z.string()
    })),
    contextFiles: z.array(z.object({
        id: z.string(),
        title: z.string(),
        content: z.string()
    })).optional(),
    allFiles: z.array(z.object({
        id: z.string(),
        title: z.string(),
        wordCount: z.number()
    })).optional(),
    activeSelection: z.object({
        fileId: z.string(),
        text: z.string(),
        start: z.number(),
        end: z.number()
    }).nullable().optional()
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const data = chatSchema.parse(body)

        if (!API_KEY) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY is not set' },
                { status: 500 }
            )
        }

        // Build file list for environment awareness
        const fileListText = data.allFiles && data.allFiles.length > 0
            ? `\n\nAVAILABLE FILES IN PROJECT:\n${data.allFiles.map(f => `- "${f.title}" (ID: ${f.id}, ~${f.wordCount} words)`).join('\n')}`
            : ''

        // Build selection context
        const selectionText = data.activeSelection
            ? `\n\nUSER HAS SELECTED TEXT from File "${data.activeSelection.fileId}":\n"${data.activeSelection.text}"\n\n(Focus your answer/edits on this selection if relevant)`
            : ''

        // STYLE GUIDE ENFORCEMENT
        let styleGuideText = ''
        const styleFile = data.contextFiles?.find(f => f.title === '.unixrc')
        if (styleFile) {
            styleGuideText = `\n\n*** STYLE GUIDE ENFORCEMENT (.unixrc) ***\nYou MUST adhere to these rules:\n${styleFile.content}\n******************************************`
        }

        // Prepare system instruction
        const systemPrompt = `You are an expert creative writing assistant integrated into a novel/story writing editor called Unix.
You have access to the user's files and can edit or create them directly using tools.

ENVIRONMENT AWARENESS:
${fileListText || 'No files currently in the project.'}
${selectionText}
${styleGuideText}

CRITICAL INSTRUCTIONS:
1. When asked to write, edit, expand, or create content, you MUST use the appropriate tool ('update_file' or 'create_file').
2. Do NOT output the full content in the chat. Use tools to write content.
3. If you use a tool, your chat response should be extremely concise.
4. Refer to files by their 'Title', NOT their 'ID'. Use 'ID' only in tool calls.
5. If a file is attached, apply changes to THAT file. Do NOT ask where to save.
6. **PARALLEL PROCESSING**: If the user asks to edit multiple files (e.g. "Chapter 1 and 2"), you MUST call 'update_file' multiple times in parallel for each file. Do not ask for permission to edit multiple files. Just do it.

CONTENT LENGTH RULES (CRITICAL):
- ALWAYS match the length and depth of existing content.
- If existing chapters are 10,000+ words, new chapters should be similar length.
- If the user asks to "expand" or write "more", at MINIMUM double the existing content.
- Writers create novels, not summaries. Be VERBOSE and detailed.
- Include dialogue, descriptions, internal thoughts, scene-setting, and pacing.

SMART CONTEXT GATHERING:
- When user mentions creating "Chapter 4", automatically consider the context of previous chapters.
- Maintain consistent tone, prose style, character voices, and plot continuity.
- If creating a new chapter, the 'create_file' tool will handle it.

SMART RENAMING (CRITICAL):
- If you are updating a file named "Untitled Page" (or "Untitled", "New Page", etc.) with substantial new content (like a story start, biography, article, or chapter), you MUST also title it appropriately.
- CALL 'rename_file' IMMEDIATELY after writing the content.
- Do not ask for permission to rename "Untitled Page". Just do it.
- Example: User asks "Write a bio of Caesar". You write it to "Untitled Page". Then you IMMEDIATELY call rename_file("current_id", "Julius Caesar Biography").`

        const contents: Content[] = []

        // Initialize contents with system prompt and context
        const systemParts: Part[] = [{ text: systemPrompt }]
        if (data.contextFiles && data.contextFiles.length > 0) {
            const contextText = data.contextFiles
                .map(f => `File ID: ${f.id}\nFile Title: ${f.title}\nContent:\n${f.content}`)
                .join('\n\n')
            systemParts.push({ text: `\n\nCONTEXT FILES (Read these carefully for style/tone matching):\n${contextText}` })
        }

        // Add conversation history
        if (data.messages.length > 0 && data.messages[0].role === 'user') {
            const firstMsg = data.messages[0]
            const combinedParts = [...systemParts, { text: firstMsg.content }]
            contents.push({ role: 'user', parts: combinedParts })

            // Add remaining messages
            for (let i = 1; i < data.messages.length; i++) {
                contents.push({
                    role: data.messages[i].role === 'user' ? 'user' : 'model',
                    parts: [{ text: data.messages[i].content }],
                })
            }
        } else {
            contents.push({ role: 'user', parts: systemParts })
            data.messages.forEach((msg) => {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }],
                })
            })
        }

        const tools: Tool[] = [{
            functionDeclarations: [
                {
                    name: 'update_file',
                    description: 'Update the content of an existing file in the editor',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            fileId: {
                                type: 'STRING',
                                description: 'The ID of the file to update (e.g., page UUID)'
                            },
                            content: {
                                type: 'STRING',
                                description: 'The new full content of the file. MUST be substantial and match existing content length.'
                            },
                            actionDescription: {
                                type: 'STRING',
                                description: 'A short, user-friendly description of the action performed'
                            }
                        },
                        required: ['fileId', 'content']
                    }
                },
                {
                    name: 'create_file',
                    description: 'Create a new file in the editor with content',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            title: {
                                type: 'STRING',
                                description: 'The title for the new file (e.g., "Chapter 4")'
                            },
                            content: {
                                type: 'STRING',
                                description: 'The content of the new file. MUST be substantial and match the style/length of existing files.'
                            },
                            actionDescription: {
                                type: 'STRING',
                                description: 'A short description of what was created'
                            }
                        },
                        required: ['title', 'content']
                    }
                },
                {
                    name: 'rename_file',
                    description: 'Rename an existing file',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            fileId: {
                                type: 'STRING',
                                description: 'The ID of the file to rename'
                            },
                            newTitle: {
                                type: 'STRING',
                                description: 'The new title for the file'
                            }
                        },
                        required: ['fileId', 'newTitle']
                    }
                },
                {
                    name: 'delete_file',
                    description: 'Delete a file (Use with caution)',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            fileId: {
                                type: 'STRING',
                                description: 'The ID of the file to delete'
                            }
                        },
                        required: ['fileId']
                    }
                }
            ]
        }]

        // Initialize Supabase Client
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // SAVE USER MESSAGE
        if (data.messages.length > 0 && data.messages[data.messages.length - 1].role === 'user') {
            const lastMsg = data.messages[data.messages.length - 1]
            const { error: insertError } = await supabase.from('chat_messages').insert({
                user_id: user.id,
                role: 'user',
                content: lastMsg.content,
                // We're assuming contextFiles are attachments for the *last* message if any exist and it's a new turn
                attachments: data.contextFiles ? JSON.stringify(data.contextFiles) : '[]'
            })

            if (insertError) {
                console.error('Error saving user message:', insertError)
            }
        }

        const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents,
                tools,
                generationConfig: {
                    temperature: 0.7,
                }
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Gemini API Error:', errorText)

            // Forward 429 status code
            if (response.status === 429) {
                return NextResponse.json(
                    { error: 'Daily quota reached' },
                    { status: 429 }
                )
            }

            return NextResponse.json(
                { error: `Gemini API Error: ${response.statusText}` },
                { status: response.status }
            )
        }

        const result = await response.json()
        const candidate = result.candidates?.[0]
        const parts = candidate?.content?.parts || []

        // SAVE ASSISTANT RESPONSE
        const textResponse = parts.map((p: any) => p.text).join('')

        // If there are function calls, we count that as "content" too for history purposes, 
        // or we might want to log the text part if it exists. 
        // For now, let's strictly log the text response. 
        // If the AI only calls a tool, textResponse might be empty.
        // We can synthesize a description if empty.

        let contentToSave = textResponse
        const functionCalls = parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall)

        if (functionCalls.length > 0 && !contentToSave) {
            contentToSave = `[Action: ${functionCalls.map((fc: any) => fc.name).join(', ')}]`
        }

        if (contentToSave) {
            const { error: insertError } = await supabase.from('chat_messages').insert({
                user_id: user.id,
                role: 'assistant',
                content: contentToSave
            })

            if (insertError) {
                console.error('Error saving assistant message:', insertError)
            }
        }

        if (functionCalls.length > 0) {
            return NextResponse.json({
                type: 'tool_call',
                toolCalls: functionCalls
            })
        }

        return NextResponse.json({
            type: 'text',
            text: textResponse
        })

    } catch (error) {
        console.error('Chat error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
