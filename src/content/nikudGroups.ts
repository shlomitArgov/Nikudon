/**
 * Nikud sound-equivalence groups
 * Each group represents nikud signs that produce the same modern Hebrew sound.
 *
 * Kamatz Katan is intentionally absent: it shares a glyph with Kamatz Gadol
 * but is pronounced "o", and a pre-reader cannot judge the grammatical context
 * that distinguishes them. Kamatz here is always the "ah" grapheme in group 'a'.
 */

// Alef is the neutral display carrier for every niqqud grapheme shown to the
// child. The combining mark sits on this carrier so the child sees the niqqud
// symbol itself, not a specific consonant.
const CARRIER = 'א' // Hebrew letter Alef

/**
 * A single niqqud sign: the glyph to display, its Hebrew name, and the key for
 * its recorded name-audio clip (played when the child taps it to learn the
 * name, separate from the vowel-sound clip keyed by the group id).
 */
export interface NikudGrapheme {
  glyph: string // Alef-carrier display glyph, e.g. אַ
  name: string // Hebrew name of the sign
  audioId: string // key for the name-audio clip, e.g. 'patach'
}

export interface NikudGroup {
  id: string // 'a', 'e', 'i', 'o', 'u'
  label: string // Representative display glyph for the group
  graphemes: NikudGrapheme[] // Individual signs in this sound-group
  exampleSyllables: string[] // Example syllables using letters with this nikud
}

export const nikudGroups: NikudGroup[] = [
  {
    id: 'a',
    label: CARRIER + 'ַ',
    graphemes: [
      { glyph: CARRIER + 'ַ', name: 'פַּתַח', audioId: 'patach' },
      { glyph: CARRIER + 'ָ', name: 'קָמַץ', audioId: 'kamatz' },
    ],
    exampleSyllables: ['בַּ', 'בָּ', 'קַ', 'קָ', 'פַּ', 'פָּ'],
  },
  {
    id: 'e',
    label: CARRIER + 'ֶ',
    graphemes: [
      { glyph: CARRIER + 'ֶ', name: 'סֶגּוֹל', audioId: 'segol' },
      { glyph: CARRIER + 'ֵ', name: 'צֵירֵי', audioId: 'tzeire' },
    ],
    exampleSyllables: ['בֶּ', 'בֵּ', 'סֶ', 'צֵ', 'פֶּ', 'פֵּ'],
  },
  {
    id: 'i',
    label: CARRIER + 'ִ',
    graphemes: [{ glyph: CARRIER + 'ִ', name: 'חִירִיק', audioId: 'hiriq' }],
    exampleSyllables: ['בִּ', 'חִ', 'פִּ', 'קִ', 'סִ'],
  },
  {
    id: 'o',
    label: CARRIER + 'ֹ',
    graphemes: [{ glyph: CARRIER + 'ֹ', name: 'חוֹלָם', audioId: 'holam' }],
    exampleSyllables: ['בֹּ', 'חֹ', 'פֹּ', 'קֹ', 'סֹ'],
  },
  {
    id: 'u',
    label: CARRIER + 'ֻ',
    graphemes: [
      { glyph: CARRIER + 'ֻ', name: 'קֻבּוּץ', audioId: 'kubutz' },
      { glyph: 'וּ', name: 'שׁוּרוּק', audioId: 'shuruk' },
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

/**
 * Display a niqqud on its own — without a Hebrew letter — by swapping the Alef
 * carrier for a dotted-circle placeholder (◌), the Unicode-standard way to show
 * a combining mark in isolation. Graphemes with no Alef carrier (e.g. Shuruk,
 * which is Vav + Dagesh) are returned unchanged.
 */
export function isolatedNiqud(grapheme: NikudGrapheme): string {
  return grapheme.glyph.replace(CARRIER, '◌')
}
