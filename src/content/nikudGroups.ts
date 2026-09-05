/**
 * Nikud sound-equivalence groups
 * Each group represents nikud signs that produce the same modern Hebrew sound.
 *
 * Kamatz Katan is intentionally absent: it shares a glyph with Kamatz Gadol
 * but is pronounced "o", and a pre-reader cannot judge the grammatical context
 * that distinguishes them. Kamatz here is always the "ah" grapheme in group 'a'.
 */

// Alef is the neutral display carrier for every niqqud grapheme shown as an
// answer option. The combining mark sits on this carrier so the child sees the
// niqqud symbol itself, not a specific consonant.
const CARRIER = 'א' // Hebrew letter Alef

export interface NikudGroup {
  id: string // 'a', 'e', 'i', 'o', 'u'
  label: string // Display label (Alef carrier + a representative mark)
  members: string[] // Names of the individual nikud signs in this group
  graphemes: string[] // Displayable glyphs (carrier + one mark) for this sound
  exampleSyllables: string[] // Example syllables using letters with this nikud
}

export const nikudGroups: NikudGroup[] = [
  {
    id: 'a',
    label: CARRIER + 'ַ', // Alef + Patach
    members: ['פַּתַח', 'קָמַץ'], // Patakh, Kamatz
    graphemes: [
      CARRIER + 'ַ', // Alef + Patach
      CARRIER + 'ָ', // Alef + Kamatz (Gadol)
    ],
    exampleSyllables: ['בַּ', 'בָּ', 'קַ', 'קָ', 'פַּ', 'פָּ'],
  },
  {
    id: 'e',
    label: CARRIER + 'ֶ', // Alef + Segol
    members: ['סֶגּוֹל', 'צֵירֵי'], // Segol, Tzeire
    graphemes: [
      CARRIER + 'ֶ', // Alef + Segol
      CARRIER + 'ֵ', // Alef + Tzeire
    ],
    exampleSyllables: ['בֶּ', 'בֵּ', 'סֶ', 'צֵ', 'פֶּ', 'פֵּ'],
  },
  {
    id: 'i',
    label: CARRIER + 'ִ', // Alef + Hiriq
    members: ['חִירִיק'], // Hiriq
    graphemes: [
      CARRIER + 'ִ', // Alef + Hiriq
    ],
    exampleSyllables: ['בִּ', 'חִ', 'פִּ', 'קִ', 'סִ'],
  },
  {
    id: 'o',
    label: CARRIER + 'ֹ', // Alef + Holam
    members: ['חוֹלָם'], // Holam
    graphemes: [
      CARRIER + 'ֹ', // Alef + Holam Haser
    ],
    exampleSyllables: ['בֹּ', 'חֹ', 'פֹּ', 'קֹ', 'סֹ'],
  },
  {
    id: 'u',
    label: CARRIER + 'ֻ', // Alef + Kubutz
    members: ['קֻבּוּץ', 'שׁוּרוּק'], // Kubutz, Shuruk
    graphemes: [
      CARRIER + 'ֻ', // Alef + Kubutz
      'וּ', // Vav + Dagesh (Shuruk)
    ],
    exampleSyllables: ['בֻּ', 'בּוּ', 'קֻ', 'קוּ', 'פֻּ', 'פּוּ'],
  },
] as const

export type NikudGroupId = typeof nikudGroups[number]['id']

/**
 * Get a nikud group by its ID
 */
export function getNikudGroup(id: NikudGroupId): NikudGroup | undefined {
  return nikudGroups.find((group) => group.id === id)
}

/**
 * Get all nikud group IDs
 */
export function getAllNikudGroupIds(): NikudGroupId[] {
  return nikudGroups.map((group) => group.id)
}
