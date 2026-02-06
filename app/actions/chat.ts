'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const apiKey = process.env.GEMINI_API_KEY
// Fallback or error if key is missing is handled by SDK usually but good to check
// const genAI = new GoogleGenerativeAI(apiKey || 'MISSING_KEY') 
// We will instantiate inside the action to be safe

export type ChatMessage = {
    role: 'user' | 'assistant'
    content: string
}

export async function chatWithGemini(
    history: ChatMessage[],
    newMessage: string,
    attachmentIds: string[],
    activePageContent?: string
) {
    if (!process.env.GEMINI_API_KEY) {
        return {
            error: "Gemini API Key is not configured. Please add GEMINI_API_KEY to your .env file."
        }
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" })

        // 1. Fetch content for attachments
        let contextString = ""
        if (attachmentIds.length > 0) {
            const supabase = await createClient()
            const { data: pages } = await supabase
                .from('pages')
                .select('title, content')
                .in('id', attachmentIds)

            if (pages && pages.length > 0) {
                contextString += "\n\n[ATTACHED DOCUMENTS]:\n"
                pages.forEach(p => {
                    contextString += `--- Document: ${p.title} ---\n${p.content || '(Empty Document)'}\n\n`
                })
            }
        }

        // 2. Add Active Page Context
        if (activePageContent) {
            contextString += `\n\n[CURRENT ACTIVE EDITOR CONTENT]:\n${activePageContent}\n\n`
        }

        // 3. Construct System Prompt / Context
        // We can't strict "system" prompt in standard Flash unless using beta systemInstruction, 
        // but prepending context to the last message is a solid pattern.

        const systemInstruction = `You are Unix AI, an expert writing assistant embedded in a text editor.
        Your goal is to help the user write, edit, and brainstorm.
        User has attached context below. Use it to answer their query.
        Be concise, helpful, and professional. 
        Format your response in Markdown.`

        // 4. Build history for Gemini
        // Gemini format: { role: 'user' | 'model', parts: [{ text: ... }] }
        const chatHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }))

        const chat = model.startChat({
            history: chatHistory,
            // systemInstruction: systemInstruction, // Beta feature, usage depends on SDK version. 
            // Safer to prepend context to the message for now if unsure of version support, 
            // but 1.5 Pro/Flash support system instructions generally.
        })

        const finalPrompt = `${systemInstruction}\n${contextString}\n\nUSER QUERY: ${newMessage}`

        const result = await chat.sendMessage(finalPrompt)
        const response = result.response.text()

        return { success: true, message: response }

    } catch (error: any) {
        console.error("Gemini Chat Error:", error)
        return { error: "Failed to communicate with AI. " + (error.message || "") }
    }
}
