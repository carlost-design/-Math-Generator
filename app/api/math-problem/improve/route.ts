import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { getSupabaseServer } from "@/lib/supabase-server";

type Body = {
  grade: number;
  difficulty: "Easy" | "Medium" | "Hard";
  outcome: string;
  basedOn: { problem_text: string };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const { grade, difficulty, outcome, basedOn } = body;
    if (!grade || !basedOn?.problem_text) return NextResponse.json({ error: "grade and basedOn.problem_text required" }, { status: 400 });

    const openai = getOpenAI();
    const prompt = `Improve and slightly vary this Primary P${grade} math word problem while keeping it aligned to the outcome: "${outcome}". Difficulty: ${difficulty}. 
Original problem: ${basedOn.problem_text}
Make a fresh variant with clearer wording or a different everyday context and small number changes. 
Return ONLY minified JSON: {"problem_text": string, "final_answer": number}.`;

    const r = await openai.responses.create({ model: process.env.OPENAI_MODEL_FAST || "gpt-4.1-mini", input: prompt });
    const text = (r as any).output_text ?? (r as any).content?.[0]?.text ?? "{}";
    const parsed = JSON.parse(text) as { problem_text: string; final_answer: number | string };
    const numeric = typeof parsed.final_answer === "number" ? parsed.final_answer : Number(String(parsed.final_answer).replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(numeric)) return NextResponse.json({ error: "AI did not return a numeric final_answer" }, { status: 400 });

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("math_problem_sessions")
      .insert({ problem_text: parsed.problem_text, correct_answer: numeric })
      .select("id, created_at, problem_text, correct_answer")
      .single();
    if (error) return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
    return NextResponse.json({ session: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

