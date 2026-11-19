/**
 * Demo-only sign-in. There is no backend: the one demo account is checked in the browser and the
 * session lives in sessionStorage (this tab) or, with “记住我”, localStorage for 7 days. It
 * protects nothing; it exists so the login and logout flow can be shown.
 */
import { localDateTime } from "./dates";

export const DEMO_ACCOUNT = {
  username: "admin",
  email: "admin@example.com",
  password: "demo1234",
  name: "林梅",
  role: "馆长",
} as const;

export const REMEMBER_DAYS = 7;
const STORAGE_KEY = "yoga-admin-demo.session";

export type Session = {
  username: string;
  name: string;
  role: string;
  /** Local time, `YYYY-MM-DD HH:mm:ss`. */
  signedInAt: string;
  /** Epoch ms; only set when “记住我” was ticked. */
  expiresAt?: number;
};

type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type SessionStores = { local: KeyValueStore | null; session: KeyValueStore | null };

/** Storage can be missing or throw (private windows, blocked site data); fall back to memory for this tab. */
let memorySession: Session | null = null;

function browserStores(): SessionStores {
  const pick = (name: "localStorage" | "sessionStorage") => {
    try {
      const store = typeof window === "undefined" ? null : window[name];
      if (!store) return null;
      store.getItem(STORAGE_KEY);
      return store;
    } catch {
      return null;
    }
  };
  return { local: pick("localStorage"), session: pick("sessionStorage") };
}

function read(store: KeyValueStore | null): Session | null {
  try {
    const raw = store?.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function write(store: KeyValueStore | null, value: Session | null): boolean {
  try {
    if (!store) return false;
    if (value) store.setItem(STORAGE_KEY, JSON.stringify(value));
    else store.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function readSession(stores: SessionStores = browserStores(), now: Date = new Date()): Session | null {
  const fromTab = read(stores.session);
  if (fromTab) return fromTab;
  const remembered = read(stores.local);
  if (remembered) {
    if (!remembered.expiresAt || remembered.expiresAt > now.getTime()) return remembered;
    write(stores.local, null);
  }
  return memorySession;
}

export type SignInResult =
  | { ok: true; session: Session }
  | { ok: false; field: "username" | "password" | "both"; error: string };

export function signIn(
  username: string,
  password: string,
  remember: boolean,
  stores: SessionStores = browserStores(),
  now: Date = new Date(),
): SignInResult {
  const name = username.trim().toLowerCase();
  if (!name) return { ok: false, field: "username", error: "请输入用户名" };
  if (!password) return { ok: false, field: "password", error: "请输入密码" };
  if ((name !== DEMO_ACCOUNT.username && name !== DEMO_ACCOUNT.email) || password !== DEMO_ACCOUNT.password) {
    return { ok: false, field: "both", error: "用户名或密码错误" };
  }

  const session: Session = {
    username: DEMO_ACCOUNT.username,
    name: DEMO_ACCOUNT.name,
    role: DEMO_ACCOUNT.role,
    signedInAt: localDateTime(now),
    ...(remember ? { expiresAt: now.getTime() + REMEMBER_DAYS * 86_400_000 } : {}),
  };
  write(remember ? stores.session : stores.local, null);
  const saved = write(remember ? stores.local : stores.session, session);
  memorySession = saved ? null : session;
  return { ok: true, session };
}

/** Clears the session everywhere and returns the one that was active, if any. */
export function signOut(stores: SessionStores = browserStores(), now: Date = new Date()): Session | null {
  const previous = readSession(stores, now);
  write(stores.session, null);
  write(stores.local, null);
  memorySession = null;
  return previous;
}

/** Whole minutes between sign-in and `now`, for the signed-out page. */
export function sessionMinutes(signedInAt: string, now: Date = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(signedInAt);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match.map(Number);
  const start = new Date(y, mo - 1, d, h, mi, s);
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60_000));
}
