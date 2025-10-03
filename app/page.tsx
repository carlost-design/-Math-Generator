"use client";

import React, { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, RotateCcw, Lightbulb, Wand2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { outcomesByGrade } from "@/lib/outcomes";
import { useSearchParams } from "next/navigation";
import { NumericKeypad } from "@/components/numeric-keypad";
import { ReadAloudButton } from "@/components/read-aloud-button";
import { RewardBar } from "@/components/reward-bar";
import confetti from "canvas-confetti";

export const dynamic = "force-dynamic";

type Session = { id: string; problem_text: string; correct_answer: number };

type SubmissionResult = { is_correct: boolean; feedback_text: string };

const getErrorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));

function HomeContent() {
  const [grade, setGrade] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");
  const [outcome, setOutcome] = useState("");
  const [useCustomOutcome, setUseCustomOutcome] = useState(false);

  const [loadingGen, setLoadingGen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const [hint, setHint] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const search = useSearchParams();

  const [historyIds, setHistoryIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("ottodoto.sessions");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [history, setHistory] = useState<Session[]>([]);
  const [streak, setStreak] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      return Number(localStorage.getItem("ottodoto.streak")) || 0;
    } catch {
      return 0;
    }
  });
  const [stars, setStars] = useState<number>(0);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem("ottodoto.sessions", JSON.stringify(historyIds.slice(-10))); } catch {}
  }, [historyIds]);

  useEffect(() => {
    (async () => {
      const { getSupabaseBrowser } = await import("@/lib/supabase-browser");
      const sb = getSupabaseBrowser();
      if (!sb || historyIds.length === 0) { setHistory([]); return; }
      const { data } = await sb
        .from("math_problem_sessions")
        .select("id, created_at, problem_text, correct_answer")
        .in("id", historyIds);
      setHistory((data as Session[]) || []);
    })();
  }, [historyIds]);

  useEffect(() => {
    function handler() {
      setSession(null);
      setAnswer("");
      setResult(null);
      setHint(null);
      setSolution(null);
      setStars(0);
    }
    window.addEventListener("ottodoto:new-session", handler);
    return () => window.removeEventListener("ottodoto:new-session", handler);
  }, []);

  useEffect(() => {
    const id = search.get("session");
    if (!id) return;
    (async () => {
      try {
        const { getSupabaseBrowser } = await import("@/lib/supabase-browser");
        const sb = getSupabaseBrowser();
        if (!sb) return;
        const { data } = await sb
          .from("math_problem_sessions")
          .select("id, created_at, problem_text, correct_answer")
          .eq("id", id)
          .single();
        if (data) setSession(data as Session);
      } catch {}
    })();
  }, [search]);

  async function generate() {
    setLoadingGen(true);
    setResult(null);
    setSession(null);
    setHint(null);
    setSolution(null);
    try {
      const res = await fetch("/api/math-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, difficulty, outcome })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate");
      setSession(data.session);
      setHistoryIds((prev) => [...prev.filter((id) => id !== data.session.id), data.session.id].slice(-10));
      try { (await import("sonner")).toast.success("Generated a new problem"); } catch {}
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to generate problem");
    } finally {
      setLoadingGen(false);
    }
  }

  async function submit() {
    if (!session) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, userAnswer: answer })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit");
      const isCorrect: boolean = data.submission.is_correct;
      setResult({ is_correct: isCorrect, feedback_text: data.submission.feedback_text });
      setStars(isCorrect ? Math.min(3, stars + 1) : 0);
      const nextStreak = isCorrect ? streak + 1 : 0;
      setStreak(nextStreak);
      try { localStorage.setItem("ottodoto.streak", String(nextStreak)); } catch {}
      try { (await import("sonner")).toast.success(isCorrect ? "Correct answer saved" : "Submission saved"); } catch {}
      if (isCorrect) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary text-foreground p-6 sm:p-10">
      <div className="max-w-4xl mx-auto">
        <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-6 text-indigo-600" />
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Curriculum-Aligned Math Generator</h1>
          </div>
          <p className="text-muted-foreground mt-2">Generate Primary (P1–P6) math word problems aligned to the 2021 syllabus and save to Supabase.</p>
        </motion.header>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Generate a New Problem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-1 block">Grade</Label>
                  <Select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <option key={g} value={g}>{`P${g}`}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label className="mb-1 block">Difficulty</Label>
                  <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    {["Easy", "Medium", "Hard"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </div>
                <div className="sm:col-span-3">
                  <Label className="mb-1 block">Outcome / Topic (from the 2021 syllabus)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select
                      value={useCustomOutcome ? "custom" : outcome}
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setUseCustomOutcome(true);
                          setOutcome("");
                        } else {
                          setUseCustomOutcome(false);
                          setOutcome(e.target.value);
                        }
                      }}
                    >
                      <option value="">Select a suggested outcome</option>
                      {outcomesByGrade[grade]?.map((o) => (
                        <option key={o.id} value={o.title}>
                          {o.title}
                        </option>
                      ))}
                      <option value="custom">Custom…</option>
                    </Select>
                    <Input
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value)}
                      placeholder="Or type a custom outcome/topic"
                      disabled={!useCustomOutcome}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Button onClick={generate} disabled={loadingGen} className="gap-2">
                  {loadingGen ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {loadingGen ? "Generating…" : "Generate Problem"}
                </Button>
                {session && (
                  <Button onClick={generate} variant="ghost" className="gap-2">
                    <RotateCcw className="size-4" /> Regenerate
                  </Button>
                )}
                {session && (
                  <Button
                    variant="ghost"
                    className="gap-2"
                    onClick={async () => {
                      if (!session) return;
                      setLoadingGen(true);
                      try {
                        const res = await fetch("/api/math-problem/improve", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ grade, difficulty, outcome, basedOn: { problem_text: session.problem_text } })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.error || "Failed to improve");
                        setSession(data.session);
                        try { (await import("sonner")).toast.success("Improved variant ready"); } catch {}
                      } catch (e) {
                        toast.error(getErrorMessage(e) || "Failed to improve");
                      } finally {
                        setLoadingGen(false);
                      }
                    }}
                  >
                    <Wand2 className="size-4" /> Improve
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {loadingGen && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Problem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="mt-4 flex items-centered gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-40" />
              </div>
            </CardContent>
          </Card>
        )}

        {!loadingGen && !session && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>No problem yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Choose a grade and outcome, then click Generate to create a new curriculum-aligned problem.</p>
            </CardContent>
          </Card>
        )}

        {history.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {history.slice(-8).reverse().map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-foreground/80 line-clamp-2">
                      {h.problem_text.length > 100 ? `${h.problem_text.slice(0, 100)}…` : h.problem_text}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => setSession(h)}>Load</Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {session && !loadingGen && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Problem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between gap-2">
                  <p className="whitespace-pre-wrap leading-7 flex-1">{session.problem_text}</p>
                  <ReadAloudButton text={session.problem_text} />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your numeric answer" />
                  <Button onClick={submit} disabled={submitting} variant="secondary" className="min-w-40">
                    {submitting ? (
                      <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Submitting…</span>
                    ) : (
                      "Submit Answer"
                    )}
                  </Button>
                </div>

                <div className="mt-4">
                  <NumericKeypad
                    disabled={submitting}
                    onAppend={(s) => setAnswer((a) => (a + s).slice(0, 32))}
                    onBackspace={() => setAnswer((a) => a.slice(0, -1))}
                    onClear={() => setAnswer("")}
                    onSubmit={submit}
                  />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    className="gap-2"
                    disabled={loadingHint}
                    onClick={async () => {
                      if (!session) return;
                      setLoadingHint(true);
                      setHint(null);
                      try {
                        const res = await fetch("/api/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id, mode: "hint" }) });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.error || "Failed to get hint");
                        setHint(data.content);
                        try { (await import("sonner")).toast.success("Hint ready"); } catch {}
                      } catch (e) {
                        toast.error(getErrorMessage(e) || "Failed to get hint");
                      } finally {
                        setLoadingHint(false);
                      }
                    }}
                  >
                    {loadingHint ? <Loader2 className="size-4 animate-spin" /> : <Lightbulb className="size-4" />} Get Hint
                  </Button>
                  <Button
                    variant="ghost"
                    className="gap-2"
                    disabled={loadingSolution}
                    onClick={async () => {
                      if (!session) return;
                      setLoadingSolution(true);
                      setSolution(null);
                      try {
                        const res = await fetch("/api/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id, mode: "solution" }) });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.error || "Failed to get solution");
                        setSolution(data.content);
                        try { (await import("sonner")).toast.success("Solution ready"); } catch {}
                      } catch (e) {
                        toast.error(getErrorMessage(e) || "Failed to get solution");
                      } finally {
                        setLoadingSolution(false);
                      }
                    }}
                  >
                    {loadingSolution ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} Show Solution
                  </Button>
                </div>

                {hint && (
                  <div className="mt-3 p-3 rounded-lg bg-indigo-50 text-indigo-900">
                    <div className="text-sm font-medium mb-1">Hint</div>
                    <div className="text-sm whitespace-pre-wrap">{hint}</div>
                  </div>
                )}
                {solution && (
                  <div className="mt-3 p-3 rounded-lg bg-emerald-50 text-emerald-900">
                    <div className="text-sm font-medium mb-1">Solution</div>
                    <div className="text-sm whitespace-pre-wrap">{solution}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0, opacity: 1, y: 0 }}
            transition={{ duration: shake ? 0.6 : 0.35 }}
          >
            <Card className={result.is_correct ? "bg-emerald-50" : "bg-amber-50"}>
              <CardHeader>
                <CardTitle>{result.is_correct ? "Correct!" : "Not quite"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-foreground/90">{result.feedback_text}</p>
                <div className="mt-4">
                  <RewardBar streak={streak} stars={stars} />
                </div>
                <div className="mt-4 flex gap-3">
                  <Button onClick={() => { setSession(null); setResult(null); setAnswer(""); }}>Try Another Outcome</Button>
                  <Button variant="secondary" onClick={() => { setResult(null); setAnswer(""); generate(); }}>Next Problem</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary text-foreground p-6 sm:p-10">
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
