import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const API_KEY = process.env.GEMINI_API_KEY
const MODEL = 'gemini-2.5-flash'
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const analyzeSchema = z.object({
    folderId: z.string(),
    type: z.enum(['plot_holes', 'character_voice', 'pacing', 'all']),
    files: z.array(z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
    })),
})

// Generate unique issue ID
function generateId(): string {
    return `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Build prompt for plot hole detection
function buildPlotHolesPrompt(wikiContext: string, filesContent: string): string {
    return `You are a meticulous continuity editor analyzing a manuscript for plot holes and inconsistencies.

=== CANONICAL FACTS (WIKI) ===
${wikiContext || 'No wiki entries available.'}

=== MANUSCRIPT CONTENT ===
${filesContent}

=== YOUR TASK ===
Find ALL instances where the manuscript contradicts the wiki facts or itself.

Focus on:
1. Character traits, appearances, abilities that don't match wiki entries
2. Location descriptions that conflict with established facts
3. Timeline events that are out of order or impossible
4. Lore/magic system rules that are violated
5. Dead characters appearing alive (or vice versa)
6. Objects/items in wrong locations or with wrong properties
7. Internal contradictions within the manuscript itself

For each issue found, provide:
- severity: "error" (definite contradiction), "warning" (likely issue), or "info" (minor concern)
- fileId: the ID of the file where the issue occurs
- fileName: the title of the file
- excerpt: the exact problematic text (max 100 chars)
- message: clear explanation of the inconsistency
- suggestion: how to fix it

Return a JSON object with this exact structure:
{
  "issues": [
    {
      "severity": "error" | "warning" | "info",
      "fileId": "...",
      "fileName": "...",
      "excerpt": "...",
      "message": "...",
      "suggestion": "..."
    }
  ]
}

If no issues found, return: { "issues": [] }
Return ONLY valid JSON, no markdown or explanation.`
}

// Build prompt for character voice analysis
function buildCharacterVoicePrompt(wikiContext: string, filesContent: string): string {
    return `You are a dialogue editor analyzing character voice consistency.

=== CHARACTERS FROM WIKI ===
${wikiContext || 'No character entries available.'}

=== MANUSCRIPT DIALOGUE ===
${filesContent}

=== YOUR TASK ===
Analyze ALL dialogue for character voice consistency.

Look for:
1. Characters who sound too similar (indistinct voices)
2. A single character who sounds different across scenes/chapters
3. Vocabulary/speech patterns that don't match character background
4. Formal/informal register inconsistencies for same character
5. Anachronistic language for the story's time period
6. Characters using knowledge they shouldn't have

For each issue found, provide:
- severity: "error" (major voice inconsistency), "warning" (noticeable issue), "info" (stylistic concern)
- fileId: the ID of the file
- fileName: the title of the file
- excerpt: the problematic dialogue (max 100 chars)
- message: explanation of the voice issue
- suggestion: how to make it more consistent

Return a JSON object with this exact structure:
{
  "issues": [
    {
      "severity": "error" | "warning" | "info",
      "fileId": "...",
      "fileName": "...",
      "excerpt": "...",
      "message": "...",
      "suggestion": "..."
    }
  ]
}

If no issues found, return: { "issues": [] }
Return ONLY valid JSON, no markdown or explanation.`
}

// Build prompt for pacing analysis
function buildPacingPrompt(filesContent: string): string {
    return `You are a pacing editor analyzing story rhythm and flow.

=== MANUSCRIPT CONTENT ===
${filesContent}

=== YOUR TASK ===
Analyze the pacing of EACH chapter/file separately.

For each file, calculate:
1. Pacing score (1-10): 1-3=slow, 4-6=balanced, 7-10=fast
2. Average sentence length tendency
3. Dialogue-to-description ratio (0-100%)
4. Action verb density (low/medium/high)

Also identify pacing issues:
- "Slow zones": Multiple consecutive slow paragraphs that may lose reader attention
- "Rushed zones": Action moving too fast to follow
- "Tone whiplash": Abrupt pacing changes that feel jarring

Return a JSON object with this exact structure:
{
  "pacingData": [
    {
      "fileId": "...",
      "fileName": "...",
      "score": 5,
      "label": "slow" | "balanced" | "fast",
      "details": {
        "avgSentenceLength": 15,
        "dialogueRatio": 40,
        "actionVerbDensity": "medium"
      }
    }
  ],
  "issues": [
    {
      "severity": "warning",
      "fileId": "...",
      "fileName": "...",
      "excerpt": "...",
      "message": "This section has very slow pacing...",
      "suggestion": "Consider adding more dialogue or action..."
    }
  ]
}

Return ONLY valid JSON, no markdown or explanation.`
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const data = analyzeSchema.parse(body)

        if (!API_KEY) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY is not set' },
                { status: 500 }
            )
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Build files content string
        const filesContent = data.files
            .map(f => `=== FILE: "${f.title}" (ID: ${f.id}) ===\n${f.content}`)
            .join('\n\n')

        // Fetch wiki context
        let wikiContext = ''
        try {
            const { data: wikiEntries } = await supabase
                .from('wiki_entries')
                .select('type, name, description, metadata')
                .eq('folder_id', data.folderId)
                .order('name', { ascending: true })

            if (wikiEntries && wikiEntries.length > 0) {
                const characters = wikiEntries.filter(e => e.type === 'character')
                const locations = wikiEntries.filter(e => e.type === 'location')
                const lore = wikiEntries.filter(e => e.type === 'lore')
                const items = wikiEntries.filter(e => e.type === 'item')
                const timelines = wikiEntries.filter(e => e.type === 'timeline')

                if (characters.length > 0) {
                    wikiContext += 'CHARACTERS:\n'
                    characters.forEach(c => {
                        const meta = c.metadata as Record<string, any> || {}
                        wikiContext += `- ${c.name}`
                        if (meta.aliases?.length) wikiContext += ` (aka ${meta.aliases.join(', ')})`
                        if (c.description) wikiContext += `: ${c.description}`
                        if (meta.traits?.length) wikiContext += ` [Traits: ${meta.traits.join(', ')}]`
                        if (meta.appearance) wikiContext += ` [Appearance: ${meta.appearance}]`
                        wikiContext += '\n'
                    })
                }

                if (locations.length > 0) {
                    wikiContext += '\nLOCATIONS:\n'
                    locations.forEach(l => {
                        const meta = l.metadata as Record<string, any> || {}
                        wikiContext += `- ${l.name}`
                        if (l.description) wikiContext += `: ${l.description}`
                        wikiContext += '\n'
                    })
                }

                if (lore.length > 0) {
                    wikiContext += '\nLORE/RULES:\n'
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
            }
        } catch (err) {
            console.error('Failed to fetch wiki entries for analysis:', err)
        }

        // Determine which analyses to run
        const typesToRun: ('plot_holes' | 'character_voice' | 'pacing')[] =
            data.type === 'all'
                ? ['plot_holes', 'character_voice', 'pacing']
                : [data.type as 'plot_holes' | 'character_voice' | 'pacing']

        const allIssues: any[] = []
        const allPacingData: any[] = []

        // Run each analysis type
        for (const analysisType of typesToRun) {
            let prompt: string

            switch (analysisType) {
                case 'plot_holes':
                    prompt = buildPlotHolesPrompt(wikiContext, filesContent)
                    break
                case 'character_voice':
                    prompt = buildCharacterVoicePrompt(wikiContext, filesContent)
                    break
                case 'pacing':
                    prompt = buildPacingPrompt(filesContent)
                    break
            }

            const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3, // Lower temp for more consistent analysis
                        responseMimeType: 'application/json',
                    },
                }),
            })

            if (!response.ok) {
                console.error(`Analysis ${analysisType} failed:`, await response.text())
                continue
            }

            const result = await response.json()
            const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

            try {
                const parsed = JSON.parse(textContent)

                // Add type and IDs to issues
                if (parsed.issues && Array.isArray(parsed.issues)) {
                    parsed.issues.forEach((issue: any) => {
                        allIssues.push({
                            id: generateId(),
                            type: analysisType,
                            severity: issue.severity || 'warning',
                            fileId: issue.fileId || '',
                            fileName: issue.fileName || '',
                            excerpt: issue.excerpt || '',
                            message: issue.message || '',
                            suggestion: issue.suggestion || '',
                            isIgnored: false,
                        })
                    })
                }

                // Handle pacing data
                if (parsed.pacingData && Array.isArray(parsed.pacingData)) {
                    parsed.pacingData.forEach((p: any) => {
                        allPacingData.push({
                            fileId: p.fileId || '',
                            fileName: p.fileName || '',
                            score: p.score || 5,
                            label: p.label || 'balanced',
                            details: p.details || {},
                        })
                    })
                }
            } catch (parseErr) {
                console.error(`Failed to parse ${analysisType} response:`, parseErr)
            }
        }

        return NextResponse.json({
            issues: allIssues,
            pacingData: allPacingData,
        })

    } catch (error) {
        console.error('Analysis error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
