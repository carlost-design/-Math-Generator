"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", initial);
    setDark(initial);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  if (dark === null) return null;
  return (
    <Button variant="ghost" size="sm" aria-label="Toggle theme" onClick={toggle} className="gap-2">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />} {dark ? "Light" : "Dark"}
    </Button>
  );
}

