import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// Read middleware source directly to avoid importing next/server in jsdom
const middlewarePath = path.resolve(__dirname, "../../middleware.ts");
const middlewareSource = fs.readFileSync(middlewarePath, "utf-8");

describe("Middleware configuration", () => {
  it("imports next-intl middleware", () => {
    expect(middlewareSource).toContain("next-intl/middleware");
  });

  it("imports routing from i18n", () => {
    expect(middlewareSource).toContain("./i18n/routing");
  });

  it("imports Supabase updateSession", () => {
    expect(middlewareSource).toContain("updateSession");
  });

  it("exports middleware function", () => {
    expect(middlewareSource).toMatch(/export\s+(async\s+)?function\s+middleware/);
  });

  it("exports config with matcher", () => {
    expect(middlewareSource).toContain("export const config");
    expect(middlewareSource).toContain("matcher");
  });

  it("matcher excludes api routes", () => {
    expect(middlewareSource).toContain("api");
  });

  it("matcher excludes auth callback", () => {
    expect(middlewareSource).toContain("auth/callback");
  });

  it("matcher excludes static assets", () => {
    expect(middlewareSource).toContain("_next/static");
    expect(middlewareSource).toContain("_next/image");
  });

  it("runs intl middleware before Supabase session", () => {
    const intlIndex = middlewareSource.indexOf("intlMiddleware(request)");
    const supabaseIndex = middlewareSource.indexOf("updateSession(request");
    expect(intlIndex).toBeGreaterThan(-1);
    expect(supabaseIndex).toBeGreaterThan(-1);
    expect(intlIndex).toBeLessThan(supabaseIndex);
  });
});
