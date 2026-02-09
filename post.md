# Unix: The AI-Native IDE for Creative Writers

## Inspiration
I've always been fascinated by the new wave of "AI-native" code editors like **Cursor** and **Antigravity** (the very agent I'm using!). They don't just tack on AI as a sidebar; they integrate it deeply into the coding workflow.

But then I looked at my friends who are writers. They're stuck in a fragmented workflow: writing in a simple notepad or Google Doc, then switching tabs to ChatGPT or Gemini to brainstorm ideas, fix grammar, or get feedback, and then copy-pasting everything back. It's distracting and breaks their flow state.

**Why should programmers have all the fun?**

I decided to build **Unix**—an "IDE" (Integrated Development Environment) but for *stories* instead of code. I wanted to give writers the same power to refactor, debug (proofread), and generate content that developers have effectively used for years.

## What it does
Unix is a distraction-free writing environment with a powerful, context-aware AI engine baked right in.
*   **Context-Aware Chat:** The AI knows your entire story context—characters, plot points, and tone—so you don't have to explain it every time.
*   **Granular Editing:** You don't just "chat" with the AI; you can select a paragraph and ask it to *"make this more descriptive"* or *"fix the pacing,"* and it updates the text directly in the editor.
*   **Global Actions:** Features like "Global Search & Replace" aren't just dumb text matching; the AI understands semantic nuance.
*   **Review Mode:** AI suggestions don't just overwrite your work. They appear as "Pull Requests" for your story, letting you review diffs, accept changes, or reject them—keeping the human writer in total control.

## How we built it
The project is built with a modern tech stack designed for speed and interactivity:
*   **Next.js & React:** For a responsive, app-like frontend.
*   **Supabase:** Handling real-time database needs, auth, and storing the complex relationships between chapters and chat history.
*   **Google Gemini API:** The brain of the operation. We utilized Gemini's large context window to feed it entire manuscripts, enabling it to maintain consistency across long stories.
*   **Zustand:** For complex client-side state management, handling the "diff" views and optimistic UI updates for instant feedback.

We implemented a custom **"Review State" engine** ($S_{review}$) that persists pending AI actions across devices.
$$ S_{review} = \{ C_{original}, C_{proposed}, \Delta_{diff} } $$
This ensures that if you start an AI refactor on your desktop, you can review and merge it on your tablet without losing context.

## Challenges we ran into
*   **The "Empty Response" Ghost:** We struggled with the AI sometimes returning empty strings or getting blocked by safety filters without feedback. We had to build robust error handling to catch these edge cases and inform the user.
*   **Syncing Pending States:** Keeping the "Review" state (where a user hasn't accepted a change yet) synced across a real-time database was tricky. We had to modify our schema to store "transient" states in the persistent database layer so users could switch devices mid-edit.
*   **Context Window Management:** Balancing how much of the story to send to Gemini without hitting token limits or latency issues required careful pruning and prioritization logic.

## Accomplishments that we're proud of
*   **The "Writer's PR" System:** Successfully implementing a Git-like workflow for creative writing. Seeing a "diff" of a paragraph and clicking "Accept" feels incredibly satisfying.
*   **Seamless Integration:** The way the AI feels like a collaborator rather than a tool. It lives *in* the editor, not just next to it.
*   **Cross-Device Continuity:** Being able to draft a prompt on one screen and see the result on another instantly.

## What's next for Unix
*   **Collaborative Writing:** True multi-user editing (Google Docs style) but with AI as a third collaborator.
*   **Export Engine:** One-click typesetting for PDF and ePub formats effectively.
