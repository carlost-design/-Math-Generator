import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { getSupabaseServer } from "@/lib/supabase-server";
import { extractText } from "@/lib/ai";

type Body = {
  sessionId: string;
  mode: "hint" | "solution";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const { sessionId, mode } = body;
    if (!sessionId || (mode !== "hint" && mode !== "solution")) {
      return NextResponse.json({ error: "sessionId and mode ('hint'|'solution') required" }, { status: 400 });
    }
    const supabase = getSupabaseServer();
    const { data: session, error } = await supabase
      .from("math_problem_sessions")
      .select("id, problem_text, correct_answer")
      .eq("id", sessionId)
      .single();
    if (error || !session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const openai = getOpenAI();
    const base = `Problem: ${session.problem_text}\nCorrect answer: ${session.correct_answer}`;
    const prompt =
      mode === "hint"
        ? `${base}\nGive a gentle hint (2-3 bullet points) to guide a Primary student. Do NOT reveal the final numeric answer.`
        : `${base}\nProvide step-by-step solution (3-6 concise steps) ending with the final numeric answer.`;

    const r = await openai.responses.create({ model: process.env.OPENAI_MODEL_QUALITY || "gpt-4o", input: prompt });
    const text = extractText(r);
    const content = String(text).trim().slice(0, 4000);
    return NextResponse.json({ content });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
