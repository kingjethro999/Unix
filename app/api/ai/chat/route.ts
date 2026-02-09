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
    }).nullable().optional(),
    folderId: z.string().optional()
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

        // Initialize Supabase Client early for wiki fetch
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
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

        // WIKI CONTEXT - Fetch world-building entries for consistency
        let wikiContext = ''
        if (data.folderId) {
            try {
                const { data: wikiEntries } = await supabase
                    .from('wiki_entries')
                    .select('type, name, description, metadata')
                    .eq('folder_id', data.folderId)
                    .order('name', { ascending: true })

                if (wikiEntries && wikiEntries.length > 0) {
                    wikiContext = '\n\n*** WORLD-BUILDING WIKI ***\n'

                    const characters = wikiEntries.filter(e => e.type === 'character')
                    const locations = wikiEntries.filter(e => e.type === 'location')
                    const lore = wikiEntries.filter(e => e.type === 'lore')
                    const items = wikiEntries.filter(e => e.type === 'item')
                    const timelines = wikiEntries.filter(e => e.type === 'timeline')

                    if (characters.length > 0) {
                        wikiContext += '\nCHARACTERS:\n'
                        characters.forEach(c => {
                            const meta = c.metadata as Record<string, any> || {}
                            wikiContext += `- ${c.name}`
                            if (meta.aliases?.length) wikiContext += ` (aka ${meta.aliases.join(', ')})`
                            if (c.description) wikiContext += `: ${c.description}`
                            if (meta.traits?.length) wikiContext += ` [Traits: ${meta.traits.join(', ')}]`
                            wikiContext += '\n'
                        })
                    }

                    if (locations.length > 0) {
                        wikiContext += '\nLOCATIONS:\n'
                        locations.forEach(l => {
                            const meta = l.metadata as Record<string, any> || {}
                            wikiContext += `- ${l.name}`
                            if (l.description) wikiContext += `: ${l.description}`
                            if (meta.significance) wikiContext += ` (${meta.significance})`
                            wikiContext += '\n'
                        })
                    }

                    if (lore.length > 0) {
                        wikiContext += '\nLORE:\n'
                        lore.forEach(l => {
                            wikiContext += `- ${l.name}: ${l.description || 'No description'}\n`
                        })
                    }

                    if (items.length > 0) {
                        wikiContext += '\nITEMS:\n'
                        items.forEach(i => {
                            const meta = i.metadata as Record<string, any> || {}
                            wikiContext += `- ${i.name}`
                            if (i.description) wikiContext += `: ${i.description}`
                            if (meta.powers?.length) wikiContext += ` [Powers: ${meta.powers.join(', ')}]`
                            wikiContext += '\n'
                        })
                    }

                    if (timelines.length > 0) {
                        wikiContext += '\nTIMELINE EVENTS:\n'
                        timelines.forEach(t => {
                            const meta = t.metadata as Record<string, any> || {}
                            wikiContext += `- ${meta.date || 'Unknown date'}: ${t.name}`
                            if (t.description) wikiContext += ` - ${t.description}`
                            wikiContext += '\n'
                        })
                    }

                    wikiContext += '\nYou MUST maintain consistency with these world-building elements.\n******************************'
                }
            } catch (err) {
                console.error('Failed to fetch wiki entries:', err)
            }
        }


        // Prepare system instruction
        const mcpEnforcement = wikiContext ? `
*** MODEL CONTEXT PROTOCOL (MCP) ENFORCEMENT ***
The wiki above represents CANONICAL FACTS about this story's universe.
When writing or editing content, you MUST:

1. VALIDATE: Before writing, cross-check ALL character names, traits, appearances, and abilities against the wiki
2. RESPECT TIMELINE: Events must be chronologically possible based on established timeline
3. PRESERVE LOCATIONS: Location descriptions must match wiki entries exactly
4. MAINTAIN VOICE: Characters should speak/act according to their wiki-defined traits
5. HONOR LORE: Magic systems, rules, and world-building facts cannot be violated

⚠️ CONSISTENCY ALERTS ⚠️
If you detect that YOUR OUTPUT would contradict wiki facts:
- STOP before writing contradictory content
- Alert the user: "⚠️ CONSISTENCY WARNING: [specific issue]"
- Suggest how to resolve the conflict
- Only proceed after user confirms

If you detect the USER'S EXISTING content contradicts wiki facts:
- Point it out diplomatically
- Offer to fix it

NEVER silently write content that contradicts established wiki facts.
*************************************************
` : ''

        const systemPrompt = `You are an expert creative writing assistant integrated into a novel/story writing editor called Unix.
You have access to the user's files and can edit or create them directly using tools.

ENVIRONMENT AWARENESS:
${fileListText || 'No files currently in the project.'}
${selectionText}
${styleGuideText}
${wikiContext}
${mcpEnforcement}
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
                },
                {
                    name: 'replace_text',
                    description: 'Replace specific text in a file. Use this for small edits or corrections.',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            fileId: {
                                type: 'STRING',
                                description: 'The ID of the file to edit'
                            },
                            targetText: {
                                type: 'STRING',
                                description: 'The exact text to find and replace'
                            },
                            replacementText: {
                                type: 'STRING',
                                description: 'The new text to insert'
                            }
                        },
                        required: ['fileId', 'targetText', 'replacementText']
                    }
                },
                {
                    name: 'search_and_replace',
                    description: 'Search and replace text across a file or the entire workspace (grep-like).',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            query: {
                                type: 'STRING',
                                description: 'The text to search for'
                            },
                            replacement: {
                                type: 'STRING',
                                description: 'The text to replace with'
                            },
                            scope: {
                                type: 'STRING',
                                enum: ['file', 'workspace'],
                                description: 'Scope of the replacement (default: file)'
                            }
                        },
                        required: ['query', 'replacement']
                    }
                }
            ]
        }]

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

        const response = await fetch(`${BASE_URL}?key = ${API_KEY} `, {
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
                { error: `Gemini API Error: ${response.statusText} ` },
                { status: response.status }
            )
        }

        const result = await response.json()
        const candidate = result.candidates?.[0]

        // Handle Safety Blocks
        if (candidate?.finishReason === 'SAFETY') {
            return NextResponse.json({
                type: 'text',
                text: "I cannot generate a response for that prompt due to safety guidelines."
            })
        }

        const parts = candidate?.content?.parts || []

        // SAVE ASSISTANT RESPONSE
        const textResponse = parts.map((p: any) => p.text).join('')

        // 1. Save text response if exists
        if (textResponse) {
            const { error: insertError } = await supabase.from('chat_messages').insert({
                user_id: user.id,
                role: 'assistant',
                content: textResponse,
                attachments: '[]'
            })

            if (insertError) {
                console.error('Error saving assistant text message:', insertError)
            }
        }

        const functionCalls = parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall)

        // 2. Save each tool call as a separate message
        for (const call of functionCalls) {
            const args = call.args || {}
            let contentToSave = ''

            // Generate descriptive content
            if (call.name === 'update_file') {
                contentToSave = args.actionDescription || `Updated file "${args.fileId}".`
            } else if (call.name === 'create_file') {
                contentToSave = args.actionDescription || `Created file "${args.title}".`
            } else if (call.name === 'rename_file') {
                contentToSave = `Renamed file to "${args.newTitle}".`
            } else if (call.name === 'delete_file') {
                contentToSave = `Deleted file "${args.fileId}".`
            } else if (call.name === 'replace_text') {
                contentToSave = `Replaced text in file "${args.fileId}".`
            } else if (call.name === 'search_and_replace') {
                contentToSave = `Replaced "${args.query}" with "${args.replacement}" ${args.scope === 'workspace' ? 'in workspace' : 'in file'}.`
            } else {
                contentToSave = `Performed action: ${call.name} `
            }

            // Prepare action metadata
            let detail = ''
            if (call.name === 'update_file') detail = args.actionDescription || 'Update'
            else if (call.name === 'create_file') detail = args.title
            else if (call.name === 'rename_file') detail = args.newTitle
            else if (call.name === 'replace_text') detail = 'Text Replacement'
            else if (call.name === 'search_and_replace') detail = 'Global Replace'

            const actionAttachment = {
                type: 'action_metadata', // Marker
                action: {
                    type: call.name === 'update_file' || call.name === 'replace_text' || call.name === 'search_and_replace' ? 'review' : 'write',
                    detail: detail,
                    fileId: args.fileId // Useful for review buttons
                }
            }

            const { error: insertError } = await supabase.from('chat_messages').insert({
                user_id: user.id,
                role: 'assistant',
                content: contentToSave,
                attachments: JSON.stringify([actionAttachment])
            })

            if (insertError) {
                console.error('Error saving assistant tool message:', insertError)
            }
        }

        if (functionCalls.length > 0) {
            return NextResponse.json({
                type: 'tool_call',
                text: textResponse,
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
