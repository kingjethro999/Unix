# Unix - AI-Powered Creative Writing Studio

Unix is a modern, distraction-free writing environment enhanced by a context-aware AI assistant. Built for novelists and creative writers, it seamlessly integrates advanced AI tools directly into the writing workflow.

## 🚀 Usage

### AI Chat Sidebar
- **Context Aware**: The AI knows about your current file, selected text, and other project files.
- **Smart Tools**: can `write`, `update`, `create`, and `rename` files directly.
- **Persistent History**: Chat history is saved to the database, so you never lose a conversation.

### Smart Features
- **Auto-Renaming**: When the AI writes a new chapter or article for you, it automatically renames "Untitled Page" to a relevant title.
- **Style Guide**: Create a `.unixrc` file to enforce specific writing styles, character voices, or world-building rules. The AI will adhere to these rules in every interaction.

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Vector)
- **AI Model**: Google Gemini 2.5 Flash
- **State Management**: Zustand (via `editor-store`)

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone <your-repo-url>
    cd unix
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Setup**
    Create a `.env` file with the following keys:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    GEMINI_API_KEY=your_gemini_api_key
    ```

4.  **Database Migration**
    Run the SQL migrations in your Supabase dashboard (found in `migrations/` or `chat_history.sql`).

5.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 📂 Project Structure

- `app/`: Next.js App Router pages and API routes.
- `components/`: UI components (Editor, Sidebar, etc.).
- `lib/`: Utilities and Supabase client configurations.
- `migrations/`: SQL files for setting up the database schema.
