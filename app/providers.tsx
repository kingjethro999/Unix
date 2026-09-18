"use client";

import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      <ThemeToggle />
    </ThemeProvider>
  );
}
