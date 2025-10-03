import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { getSupabaseServer } from "@/lib/supabase-server";
import { extractText } from "@/lib/ai";

type SubmitBody = {
  sessionId: string;
  userAnswer: number | string;
  feedback?: boolean; // default true
};

function nearlyEqual(a: number, b: number, eps = 1e-6) {
  const diff = Math.abs(a - b);
  if (diff <= eps) return true;
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return diff / scale <= 1e-4; // relative tolerance
}

// Parse numbers more flexibly: supports "3/4", "1 1/2", "75%", and commas
function parseNumeric(value: number | string): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;
  // percentage
  if (/^[-+]?\d*[\d,]?\d\s*%$/.test(s)) {
    const n = Number(s.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n / 100 : null;
  }
  // mixed number e.g., "1 1/2"
  const mixed = s.match(/^\s*([-+]?\d+[\d,]*)\s+(\d+)[\s/]+(\d+)\s*$/);
  if (mixed) {
    const whole = Number(mixed[1].replace(/,/g, ""));
    const num = Number(mixed[2]);
    const den = Number(mixed[3]);
    if (den !== 0 && Number.isFinite(whole) && Number.isFinite(num) && Number.isFinite(den)) {
      return whole + num / den;
    }
  }
  // simple fraction e.g., "3/4"
  const frac = s.match(/^\s*([-+]?\d+)\s*\/\s*(\d+)\s*$/);
  if (frac) {
    const num = Number(frac[1]);
    const den = Number(frac[2]);
    if (den !== 0 && Number.isFinite(num) && Number.isFinite(den)) return num / den;
  }
  // plain number with commas
  const n = Number(s.replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SubmitBody;
    const feedbackWanted = body.feedback !== false;
    const sessionId = body.sessionId;
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const parsed = parseNumeric(body.userAnswer);
    if (parsed === null) return NextResponse.json({ error: "userAnswer must be numeric (supports %, fractions)" }, { status: 400 });
    const userNum = parsed;

    const supabase = getSupabaseServer();
    const { data: session, error: fetchErr } = await supabase
      .from("math_problem_sessions")
      .select("id, problem_text, correct_answer")
      .eq("id", sessionId)
      .single();

    if (fetchErr || !session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const isCorrect = nearlyEqual(Number(session.correct_answer), userNum);

    let feedback_text = isCorrect ? "Great job! Your answer is correct." : "Thanks for trying—review your steps and try again.";

    if (feedbackWanted) {
      try {
        const openai = getOpenAI();
        const prompt = `Problem: ${session.problem_text}\nCorrect answer: ${session.correct_answer}\nStudent answer: ${userNum}\nExplain briefly why the answer is correct or how to fix it (Primary level, kind tone, 2-4 sentences).`;
        const r = await openai.responses.create({ model: process.env.OPENAI_MODEL_FAST || "gpt-4.1-mini", input: prompt });
        const text = extractText(r);
        if (text) feedback_text = String(text).trim().slice(0, 2000);
      } catch {
        // keep default feedback_text on AI failure
      }
    }

    const { data: submission, error: insErr } = await supabase
      .from("math_problem_submissions")
      .insert({ session_id: session.id, user_answer: userNum, is_correct: isCorrect, feedback_text })
      .select("id, created_at, is_correct, feedback_text, user_answer")
      .single();

    if (insErr) return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });

    return NextResponse.json({ submission });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
