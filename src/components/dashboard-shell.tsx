"use client";

import { UserButton } from "@clerk/nextjs";
import { BookingCountsProvider } from "@/lib/booking-counts-context";
import { BottomNav } from "./bottom-nav";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <BookingCountsProvider>
      <div className="flex min-h-full flex-col bg-cream">
        <header className="sticky top-0 z-40 rounded-b-2xl bg-dark-teal shadow-sm">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-lg text-cream">Boom Health</h1>
              <p className="text-[11px] leading-tight text-cream/70">Fulfillment Portal</p>
            </div>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </div>
        </header>
        <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-4">
          {children}
        </main>
        <BottomNav />
      </div>
    </BookingCountsProvider>
  );
}
