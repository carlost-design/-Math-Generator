"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Square } from "lucide-react";

type Props = { text: string };

export function ReadAloudButton({ text }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (utteranceRef.current && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function speak() {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; // slower for kids
    u.onend = () => setSpeaking(false);
    utteranceRef.current = u;
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }

  function stop() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return (
    <Button type="button" variant="ghost" className="gap-2" onClick={speaking ? stop : speak} aria-label="Read aloud problem">
      {speaking ? <Square className="size-4" /> : <Volume2 className="size-4" />} {speaking ? "Stop" : "Read Aloud"}
    </Button>
  );
}

