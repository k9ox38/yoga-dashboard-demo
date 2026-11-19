import { describe, expect, it } from "vitest";
import { DEMO_ACCOUNT, REMEMBER_DAYS, readSession, sessionMinutes, signIn, signOut, type SessionStores } from "../auth";

function memoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  };
}

function stores() {
  const local = memoryStore();
  const session = memoryStore();
  return { local, session, all: { local, session } as SessionStores };
}

const now = new Date(2026, 10, 19, 8, 12, 5);

describe("demo sign-in", () => {
  it("validates empty fields before checking the account", () => {
    const s = stores();
    expect(signIn("  ", "x", false, s.all, now)).toMatchObject({ ok: false, field: "username", error: "请输入用户名" });
    expect(signIn("admin", "", false, s.all, now)).toMatchObject({ ok: false, field: "password", error: "请输入密码" });
    expect(readSession(s.all, now)).toBeNull();
  });

  it("rejects a wrong password without saying which field was wrong", () => {
    const s = stores();
    expect(signIn("admin", "nope", false, s.all, now)).toMatchObject({ ok: false, field: "both", error: "用户名或密码错误" });
    expect(signIn("someone", DEMO_ACCOUNT.password, false, s.all, now)).toMatchObject({ ok: false, field: "both" });
  });

  it("accepts the demo username or email, case-insensitively, and keeps the session to this tab", () => {
    const s = stores();
    const result = signIn(" Admin@Example.com ", DEMO_ACCOUNT.password, false, s.all, now);
    expect(result.ok).toBe(true);
    expect(s.session.data.size).toBe(1);
    expect(s.local.data.size).toBe(0);
    expect(readSession(s.all, now)).toMatchObject({ username: "admin", name: "林梅", signedInAt: "2026-11-19 08:12:05" });
    expect(readSession(s.all, now)?.expiresAt).toBeUndefined();
  });

  it("remembers the session for 7 days, then drops it", () => {
    const s = stores();
    signIn("admin", DEMO_ACCOUNT.password, true, s.all, now);
    expect(s.local.data.size).toBe(1);
    expect(s.session.data.size).toBe(0);
    const later = new Date(now.getTime() + (REMEMBER_DAYS - 1) * 86_400_000);
    expect(readSession(s.all, later)).not.toBeNull();
    const expired = new Date(now.getTime() + REMEMBER_DAYS * 86_400_000 + 1);
    expect(readSession(s.all, expired)).toBeNull();
    expect(s.local.data.size).toBe(0);
  });

  it("signing out clears both stores and returns the old session", () => {
    const s = stores();
    signIn("admin", DEMO_ACCOUNT.password, true, s.all, now);
    const previous = signOut(s.all, now);
    expect(previous?.signedInAt).toBe("2026-11-19 08:12:05");
    expect(readSession(s.all, now)).toBeNull();
    expect(signOut(s.all, now)).toBeNull();
  });

  it("still signs in for this tab when storage is unavailable", () => {
    const broken = { getItem: () => null, setItem: () => { throw new Error("blocked"); }, removeItem: () => {} };
    const all: SessionStores = { local: broken, session: broken };
    expect(signIn("admin", DEMO_ACCOUNT.password, false, all, now).ok).toBe(true);
    expect(readSession(all, now)?.username).toBe("admin");
    signOut(all, now);
    expect(readSession(all, now)).toBeNull();
  });

  it("measures how long the session lasted", () => {
    expect(sessionMinutes("2026-11-19 08:12:05", new Date(2026, 10, 19, 8, 45, 0))).toBe(32);
    expect(sessionMinutes("bad", now)).toBeNull();
  });
});
