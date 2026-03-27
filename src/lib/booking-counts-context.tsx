"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Counts = { upcoming: number | null; collected: number | null };
type Setters = {
  setUpcomingCount: (n: number) => void;
  setCollectedCount: (n: number) => void;
};

const CountsCtx = createContext<Counts>({ upcoming: null, collected: null });
const SettersCtx = createContext<Setters>({
  setUpcomingCount: () => {},
  setCollectedCount: () => {},
});

export function BookingCountsProvider({ children }: { children: ReactNode }) {
  const [upcoming, setUpcoming] = useState<number | null>(null);
  const [collected, setCollected] = useState<number | null>(null);

  return (
    <CountsCtx.Provider value={{ upcoming, collected }}>
      <SettersCtx.Provider
        value={{ setUpcomingCount: setUpcoming, setCollectedCount: setCollected }}
      >
        {children}
      </SettersCtx.Provider>
    </CountsCtx.Provider>
  );
}

export function useBookingCounts() {
  return useContext(CountsCtx);
}

export function useSetBookingCounts() {
  return useContext(SettersCtx);
}
