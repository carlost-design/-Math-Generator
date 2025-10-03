"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) => (pathname === href || (href === "/" && pathname === "/"));
  return (
    <header className="sticky top-0 z-40 w-full bg-transparent py-3">
      <div className="mx-auto max-w-6xl px-4">
        <div className="hidden md:flex items-center justify-between rounded-full border border-border bg-card shadow-md px-4 py-2">
          {/* Left: brand */}
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-foreground/90">
            <span className="inline-flex items-center gap-1">
              <span className="size-3 rounded-full bg-[#F59E0B] inline-block" />
              <span className="size-3 rounded-full bg-[#EF4444] inline-block" />
              <span className="size-3 rounded-full bg-[#22C55E] inline-block" />
              <span className="size-3 rounded-full bg-[#60A5FA] inline-block" />
              <span className="size-3 rounded-full bg-[#10B981] inline-block" />
            </span>
            <span>OttoDoto</span>
          </Link>
          {/* Center: nav links (desktop) */}
          <nav className="flex items-center gap-8 text-sm">
            <Link href="/" className={isActive("/") ? "text-primary" : "text-foreground/80 hover:text-foreground"}>Home</Link>
            <Link href="/history" className={isActive("/history") ? "text-primary" : "text-foreground/80 hover:text-foreground"}>History</Link>
            <Link href="/settings" className={isActive("/settings") ? "text-primary" : "text-foreground/80 hover:text-foreground"}>Settings</Link>
          </nav>
          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("ottodoto:new-session"));
                try { toast.success("Started a new session"); } catch {}
              }}
            >
              New Session
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
