import type { TopicSection } from "@/types/domain"

export const SECTION_ORDER: TopicSection[] = ["theory", "systems"]

export const SECTION_META: Record<
  TopicSection,
  { titleCs: string; eyebrowEn: string }
> = {
  theory: {
    titleCs: "Teoretické základy informatiky a matematika",
    eyebrowEn: "Theory & mathematics",
  },
  systems: {
    titleCs: "Programové, výpočetní a informační systémy",
    eyebrowEn: "Systems & applications",
  },
}

/** Folds case and strips diacritics so "grafov" matches "Grafové algoritmy". */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}
