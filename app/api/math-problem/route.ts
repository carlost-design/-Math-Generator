import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { getSupabaseServer } from "@/lib/supabase-server";

type GenerateBody = {
  grade?: number; // 1-6
  outcome?: string; // free-text excerpt from syllabus
  difficulty?: "Easy" | "Medium" | "Hard";
};

function promptFor(grade: number, difficulty: string, outcome: string) {
  const level = grade;
  let constraints = "";
  if (level <= 2) {
    constraints = [
      "Use only addition/subtraction with whole numbers up to 100.",
      "One-step word problem with clear context (money, time, lengths).",
      "No fractions/decimals/percentages.",
    ].join(" ");
  } else if (level <= 4) {
    constraints = [
      "Use addition/subtraction, and include multiplication or division when natural.",
      "Whole numbers typically up to 10,000; avoid cumbersome computations.",
      "At most 2 steps; decimals optional only for P4 (1 decimal place).",
    ].join(" ");
  } else {
    constraints = [
      "Allow fractions, decimals, and percentages.",
      "2–3 steps maximum; keep numbers tidy so the final answer is a clean number.",
      "Include units in the problem text when relevant (e.g., kg, m, $, %).",
    ].join(" ");
  }

  const core = `Generate ONE Primary P${level} mathematics word problem aligned to this syllabus outcome: "${outcome}". Difficulty: ${difficulty}. Use age-appropriate language, Singapore primary context, and avoid ambiguity. ${constraints}`;
  const keywords = outcome.toLowerCase();
  const specials: string[] = [];
  if (keywords.includes("fraction")) specials.push("Use proper/simple fractions; keep denominators small (<=12). Avoid mixed numbers unless needed.");
  if (keywords.includes("percent")) specials.push("Use whole-number percentages (e.g., 10%, 15%, 25%).");
  if (keywords.includes("area")) specials.push("If geometry, make dimensions whole numbers; include units (cm, m). Avoid irregular shapes unless described simply.");
  if (keywords.includes("perimeter")) specials.push("Perimeter questions should have at most two shapes; numbers small.");
  if (keywords.includes("ratio")) specials.push("Use simple ratios like 2:3 or 3:5.");
  if (keywords.includes("speed") || keywords.includes("time")) specials.push("Distance-time problems: keep speeds to whole numbers; units in km/h or m/s, be explicit about time.");
  const extras = specials.length ? `Additional constraints: ${specials.join(" ")}` : "";
  const jsonRule = `Return ONLY minified JSON with keys: {"problem_text": string, "final_answer": number}. Do not include any extra keys, commentary, markdown, or units in final_answer.`;
  return `${core}\n${extras}\n${jsonRule}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateBody;
    const grade = body.grade ?? 5;
    const difficulty = body.difficulty ?? "Medium";
    const outcome = body.outcome?.slice(0, 400) ?? "General arithmetic competence";

    const openai = getOpenAI();

    // Attempt 1
    let text: string | null = null;
    {
      const resp = await openai.responses.create({
        model: process.env.OPENAI_MODEL_FAST || "gpt-4.1-mini",
        input: promptFor(grade, difficulty, outcome)
      });
      text = (resp as any).output_text ?? (resp as any).content?.[0]?.text ?? null;
    }
    let parsed: { problem_text: string; final_answer: number | string } | null = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }
    let numeric = parsed && typeof parsed.final_answer === "number" ? parsed.final_answer : parsed ? Number(String(parsed.final_answer).replace(/[^\d.-]/g, "")) : NaN;

    // Fallback attempt if parsing failed or not numeric
    if (!parsed || !Number.isFinite(numeric)) {
      const fallback = await openai.responses.create({
        model: process.env.OPENAI_MODEL_FAST || "gpt-4.1-mini",
        input: promptFor(grade, difficulty, outcome) + "\nIMPORTANT: Ensure final_answer is a pure number (no words or units)."
      });
      const t = (fallback as any).output_text ?? (fallback as any).content?.[0]?.text ?? "{}";
      const tmpParsed = JSON.parse(t) as { problem_text: string; final_answer: number | string };
      parsed = tmpParsed;
      numeric = typeof tmpParsed.final_answer === "number" ? tmpParsed.final_answer : Number(String(tmpParsed.final_answer).replace(/[^\d.-]/g, ""));
    }
    if (!parsed || !Number.isFinite(numeric)) return NextResponse.json({ error: "AI did not return a numeric final_answer" }, { status: 400 });

    const supabase = getSupabaseServer();
    const safeParsed = parsed as { problem_text: string; final_answer: number | string };
    const { data, error } = await supabase
      .from("math_problem_sessions")
      .insert({ problem_text: safeParsed.problem_text, correct_answer: numeric })
      .select("id, created_at, problem_text, correct_answer")
      .single();

    if (error) {
      console.error("Supabase insert error", error);
      return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
    }

    return NextResponse.json({ session: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

