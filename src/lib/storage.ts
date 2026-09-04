import { ChatState, Language, Message } from "./types";

const STORAGE_PREFIX = "sdh_";
const DAILY_LIMIT = 50;
const SECRET_SALT = "x7q2m!kP9vR#sL4f";

function getKey(toolId: string): string {
  return `${STORAGE_PREFIX}chat_${toolId}`;
}

function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getTodayKey(): string {
  const now = new Date();
  const raw = `${SECRET_SALT}_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;
  return `${STORAGE_PREFIX}c_${hashStr(raw).toString(36)}`;
}

function getChecksum(count: number, dateStr: string): string {
  const data = `${SECRET_SALT}:${count}:${dateStr}`;
  return String(hashStr(data));
}

function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;
}

interface StoredLimit {
  c: number;
  s: string;
}

export function loadChat(toolId: string): ChatState {
  if (typeof window === "undefined") return { messages: [] };
  try {
    const raw = localStorage.getItem(getKey(toolId));
    if (!raw) return { messages: [] };
    return JSON.parse(raw) as ChatState;
  } catch {
    return { messages: [] };
  }
}

export function saveChat(toolId: string, state: ChatState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getKey(toolId), JSON.stringify(state));
}

export function clearChat(toolId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getKey(toolId));
}

export function getLanguage(): Language | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${STORAGE_PREFIX}lang`) as Language | null;
}

export function setLanguage(lang: Language): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}lang`, lang);
}

export function getDailyMessageCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(getTodayKey());
    if (!raw) return 0;
    const stored: StoredLimit = JSON.parse(raw);
    const dateStr = getTodayDateStr();
    const expectedChecksum = getChecksum(stored.c, dateStr);
    if (stored.s !== expectedChecksum) return DAILY_LIMIT;
    return stored.c;
  } catch {
    return 0;
  }
}

export function incrementDailyMessageCount(): number {
  const count = getDailyMessageCount() + 1;
  const dateStr = getTodayDateStr();
  const data: StoredLimit = {
    c: count,
    s: getChecksum(count, dateStr),
  };
  localStorage.setItem(getTodayKey(), JSON.stringify(data));
  return count;
}

export function getRemainingMessages(): number {
  return Math.max(0, DAILY_LIMIT - getDailyMessageCount());
}

export function canSendMessage(): boolean {
  return getDailyMessageCount() < DAILY_LIMIT;
}

export function resetDailyLimit(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getTodayKey());
}

export function createMessage(role: "user" | "assistant", content: string): Message {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    role,
    content,
    timestamp: Date.now(),
  };
}
