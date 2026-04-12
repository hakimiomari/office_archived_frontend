// Afghanistan's 34 provinces
// The `code` is the canonical English name stored in the database.
// Display names are translated via the `provinces` namespace in messages/*.json
export const AFGHANISTAN_PROVINCES = [
  "Kabul",
  "Kandahar",
  "Herat",
  "Balkh",
  "Nangarhar",
  "Kunduz",
  "Helmand",
  "Ghazni",
  "Baghlan",
  "Badakhshan",
  "Takhar",
  "Faryab",
  "Jawzjan",
  "Samangan",
  "Sar-e Pol",
  "Bamyan",
  "Daykundi",
  "Ghor",
  "Badghis",
  "Farah",
  "Nimroz",
  "Uruzgan",
  "Zabul",
  "Paktika",
  "Paktia",
  "Khost",
  "Logar",
  "Wardak",
  "Parwan",
  "Kapisa",
  "Panjshir",
  "Nuristan",
  "Kunar",
  "Laghman",
] as const;

export type ProvinceCode = (typeof AFGHANISTAN_PROVINCES)[number];

// Maps a province code to a translation key (lowercase, no spaces/dashes)
export function provinceKey(code: string): string {
  return code.toLowerCase().replace(/[\s-]/g, "");
}
