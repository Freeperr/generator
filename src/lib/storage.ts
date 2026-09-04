import { ChatState, Language, Message } from "./types";

const STORAGE_PREFIX = "sdh_";
const DAILY_LIMIT = 50;

function getKey(toolId: string): string {
  return `${STORAGE_PREFIX}chat_${toolId}`;
}

function getTodayKey(): string {
  const now = new Date();
  return `${STORAGE_PREFIX}count_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;
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
  const raw = localStorage.getItem(getTodayKey());
  return raw ? parseInt(raw, 10) || 0 : 0;
}

export function incrementDailyMessageCount(): number {
  const count = getDailyMessageCount() + 1;
  localStorage.setItem(getTodayKey(), String(count));
  return count;
}

export function getRemainingMessages(): number {
  return Math.max(0, DAILY_LIMIT - getDailyMessageCount());
}

export function canSendMessage(): boolean {
  return getDailyMessageCount() < DAILY_LIMIT;
}

export function createMessage(role: "user" | "assistant", content: string): Message {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    role,
    content,
    timestamp: Date.now(),
  };
}
