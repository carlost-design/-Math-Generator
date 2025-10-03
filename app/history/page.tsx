import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Session = {
  id: string;
  created_at: string;
  problem_text: string;
  correct_answer: number;
};

export const dynamic = "force-dynamic"; // always fetch fresh

export default async function HistoryPage() {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("math_problem_sessions")
    .select("id, created_at, problem_text, correct_answer")
    .order("created_at", { ascending: false })
    .limit(50);

  const sessions = (data as Session[]) || [];

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Recent Problem Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-muted-foreground">No sessions yet. Generate a problem on the home page.</p>
          ) : (
            <ul className="space-y-4">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">{new Date(s.created_at).toLocaleString()}</div>
                    <div className="text-sm text-foreground/90 line-clamp-2">
                      {s.problem_text}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-sm text-foreground/70">Ans: {s.correct_answer}</span>
                    <Link href={`/?session=${encodeURIComponent(s.id)}`}>
                      <Button size="sm" variant="secondary">Open</Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
