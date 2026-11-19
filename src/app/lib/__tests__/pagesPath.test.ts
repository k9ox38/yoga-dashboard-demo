import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../../../..");

/** Forbidden studio markers (assembled so plain-text scans stay clean). */
const BRAND_MARKERS = [
  ["Yu", "She"].join(""),
  ["yu", "she"].join(""),
  ["Yu", "sha"].join(""),
  ["yu", "sha"].join(""),
  String.fromCharCode(0x745c, 0x820d),
  ["yu", "she", ".yoga"].join(""),
  ["yu", "sha", ".yoga"].join(""),
];

describe("GitHub Pages path wiring", () => {
  it("uses project base and hash router", () => {
    const vite = readFileSync(path.join(root, "vite.config.ts"), "utf8");
    const routes = readFileSync(path.join(root, "src/app/routes.tsx"), "utf8");
    expect(vite).toContain("base: '/yoga-dashboard-demo/'");
    expect(routes).toContain("createHashRouter");
    expect(routes).not.toContain("createBrowserRouter");
  });

  it("uses example-domain admin email placeholder", () => {
    const profile = readFileSync(path.join(root, "src/app/pages/ProfilePage.tsx"), "utf8");
    expect(profile).toContain("admin@example.com");
  });

  it("uses neutral demo branding in UI and docs", () => {
    const files = [
      "src/app/Root.tsx",
      "src/app/components/Sidebar.tsx",
      "src/app/components/Settings.tsx",
      "src/app/components/Notifications.tsx",
      "src/app/pages/ProfilePage.tsx",
      "src/app/pages/LoginPage.tsx",
      "src/app/pages/LogoutPage.tsx",
      "src/app/components/BrandMark.tsx",
      "README.md",
      "AGENTS.md",
      "CHANGELOG-nov17-data-consistency.md",
      "index.html",
    ];
    for (const rel of files) {
      const text = readFileSync(path.join(root, rel), "utf8");
      const hasNeutral =
        text.includes("Yoga Admin Demo") ||
        text.includes("瑜伽管理演示") ||
        text.includes("admin@example.com") ||
        text.includes("example.com");
      expect(hasNeutral, `${rel} missing neutral demo branding`).toBe(true);
      for (const marker of BRAND_MARKERS) {
        expect(text.toLowerCase().includes(marker.toLowerCase()), `${rel} still has brand marker`).toBe(false);
      }
    }
  });
});
