import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const TIMEZONE = "Asia/Karachi";

/**
 * Returns YYYY-MM-DD for a given date explicitly in Pakistan/Karachi time
 */
export function getLocalDateString(dateInput?: Date | string | number): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Returns HH:MM for a given date explicitly in Pakistan/Karachi time (24-hour format)
 */
export function getLocalTimeString(dateInput?: Date | string | number): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Convert local Karachi YYYY-MM-DD and HH:MM into a clean ISO timestamp (+05:00)
 */
export function createKarachiIsoString(dateStr: string, timeStr?: string): string {
  const [year, month, day] = dateStr.split("-").map((v) => v.padStart(2, "0"));
  const cleanTime = (timeStr && timeStr.trim()) ? timeStr.trim() : "00:00";
  const [hour, min] = cleanTime.split(":").map((v) => v.padStart(2, "0"));
  // Pakistan Standard Time is UTC+05:00
  return `${year}-${month}-${day}T${hour}:${min}:00+05:00`;
}

/**
 * Format a stored date into clean readable localized Date & Time in Karachi timezone (e.g. 16 Oct 2026, 07:30 AM)
 */
export function formatDateTime(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-PK", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format date only in Karachi timezone (e.g. 16 Oct 2026)
 */
export function formatDateOnly(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PK", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

