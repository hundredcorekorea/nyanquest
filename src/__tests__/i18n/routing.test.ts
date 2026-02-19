import { describe, it, expect } from "vitest";
import { routing } from "@/i18n/routing";

describe("i18n routing configuration", () => {
  it("includes ko and en locales", () => {
    expect(routing.locales).toContain("ko");
    expect(routing.locales).toContain("en");
  });

  it("has ko as default locale", () => {
    expect(routing.defaultLocale).toBe("ko");
  });

  it("has exactly 2 locales", () => {
    expect(routing.locales).toHaveLength(2);
  });
});

describe("i18n navigation module", () => {
  it("navigation.ts exports named members (Link, redirect, usePathname, useRouter, getPathname)", async () => {
    // Read the source file to verify exports without importing next internals
    const fs = await import("fs");
    const path = await import("path");
    const navPath = path.resolve(__dirname, "../../i18n/navigation.ts");
    const content = fs.readFileSync(navPath, "utf-8");

    expect(content).toContain("export const");
    expect(content).toContain("Link");
    expect(content).toContain("redirect");
    expect(content).toContain("usePathname");
    expect(content).toContain("useRouter");
    expect(content).toContain("getPathname");
    expect(content).toContain("createNavigation");
  });
});
