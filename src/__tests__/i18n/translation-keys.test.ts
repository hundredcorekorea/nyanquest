import { describe, it, expect } from "vitest";
import ko from "../../../messages/ko.json";
import en from "../../../messages/en.json";

// Recursively collect all leaf keys as dot-separated paths
function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      keys.push(...collectKeys(val as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

// Extract ICU parameters like {count}, {name}, etc.
function extractParams(str: string): string[] {
  const matches = str.match(/\{(\w+)\}/g);
  return matches ? matches.sort() : [];
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

describe("Translation files integrity", () => {
  const koKeys = collectKeys(ko as Record<string, unknown>);
  const enKeys = collectKeys(en as Record<string, unknown>);

  it("ko.json and en.json have the same number of keys", () => {
    expect(koKeys.length).toBe(enKeys.length);
  });

  it("every ko key exists in en", () => {
    const enKeySet = new Set(enKeys);
    const missing = koKeys.filter((k) => !enKeySet.has(k));
    expect(missing).toEqual([]);
  });

  it("every en key exists in ko", () => {
    const koKeySet = new Set(koKeys);
    const missing = enKeys.filter((k) => !koKeySet.has(k));
    expect(missing).toEqual([]);
  });

  it("no empty string values in ko.json", () => {
    const empty = koKeys.filter((k) => {
      const val = getNestedValue(ko as Record<string, unknown>, k);
      return typeof val === "string" && val.trim() === "";
    });
    expect(empty).toEqual([]);
  });

  it("no empty string values in en.json (except intentional ones)", () => {
    // These keys are intentionally empty in English (Korean-only suffixes like 명, 회, 개월)
    const allowedEmpty = new Set([
      "Common.persons",
      "Common.times",
      "Common.personUnit",
      "DatePicker.year",
      "DatePicker.month",
      "DatePicker.day",
      "DatePicker.hour",
      "DatePicker.minute",
    ]);

    const empty = enKeys.filter((k) => {
      if (allowedEmpty.has(k)) return false;
      const val = getNestedValue(en as Record<string, unknown>, k);
      return typeof val === "string" && val.trim() === "";
    });
    expect(empty).toEqual([]);
  });

  it("ICU parameters match between ko and en for all keys", () => {
    const mismatched: { key: string; ko: string[]; en: string[] }[] = [];

    for (const key of koKeys) {
      const koVal = getNestedValue(ko as Record<string, unknown>, key);
      const enVal = getNestedValue(en as Record<string, unknown>, key);
      if (typeof koVal === "string" && typeof enVal === "string") {
        const koParams = extractParams(koVal);
        const enParams = extractParams(enVal);
        if (JSON.stringify(koParams) !== JSON.stringify(enParams)) {
          mismatched.push({ key, ko: koParams, en: enParams });
        }
      }
    }

    expect(mismatched).toEqual([]);
  });

  it("all top-level namespaces exist in both files", () => {
    const koNamespaces = Object.keys(ko).sort();
    const enNamespaces = Object.keys(en).sort();
    expect(koNamespaces).toEqual(enNamespaces);
  });
});
