// Local-only safety check. Keep this deterministic and easy to unit-test.

const LEET_REPLACEMENTS: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "@": "a",
  "$": "s",
};

export const CRISIS_PATTERNS = [
  "suic",
  "killmyself",
  "killmysef",
  "killingmyself",
  "killme",
  "wanttodie",
  "takemyownlife",
  "wishingiweredead",
  "betteroffdead",
  "endmylife",
  "enditall",
  "hurtmyself",
  "hurtingmyself",
  "harmmyself",
  "selfharm",
  "selfinjury",
  "cutmyself",
  "overdose",
  "hangmyself",
  "jumpoff",
  "noreasontolive",
  "cantgoon",
  "disappearforever",
] as const;

export function normalizeCrisisText(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((character) => LEET_REPLACEMENTS[character] ?? character)
    .join("")
    .replace(/[^a-z0-9]/g, "");
}

export function containsCrisisLanguage(text: string): boolean {
  const normalized = normalizeCrisisText(text);
  return CRISIS_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export const isCrisisMessage = containsCrisisLanguage;
