"use client";

type Props = {
  streak: number;
  stars: number; // 0..3 for current round
};

export function RewardBar({ streak, stars }: Props) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 py-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Streak:</span>
        <span className="text-primary font-semibold">{streak}</span>
      </div>
      <div className="flex items-center gap-1" aria-label={`Stars ${stars} of 3`}>
        {[0, 1, 2].map((i) => (
          <svg key={i} width="22" height="22" viewBox="0 0 24 24" className={i < stars ? "text-primary" : "text-muted-foreground"}>
            <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    </div>
  );
}

