import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PACKS = {
  starter: { credits: 10, price_usd: 4.99, label: "Starter" },
  popular: { credits: 35, price_usd: 14.99, label: "Popular" },
  pro: { credits: 80, price_usd: 29.99, label: "Pro" },
} as const;

export type PackKey = keyof typeof PACKS;
