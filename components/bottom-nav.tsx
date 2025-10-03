"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, Settings } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-50">
      <ul className="mx-auto max-w-5xl grid grid-cols-3 px-4 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/" && pathname === "/");
          return (
            <li key={href} className="flex items-center justify-center">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs ${
                  active ? "text-primary" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                <Icon className="size-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
