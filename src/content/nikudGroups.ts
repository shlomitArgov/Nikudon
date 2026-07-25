/**
 * Nikud sound-equivalence groups
 * Each group represents nikud signs that produce the same modern Hebrew sound
 */

export interface NikudGroup {
  id: string // 'a', 'e', 'i', 'o', 'u'
  label: string // Display label
  members: string[] // Individual nikud signs in this group
  exampleSyllables: string[] // Example syllables using letters with this nikud
}

export const nikudGroups: NikudGroup[] = [
  {
    id: 'a',
    label: 'אָ',
    members: ['פַּתַח', 'קָמַץ'], // Patakh, Kamatz
    exampleSyllables: ['בַּ', 'בָּ', 'קַ', 'קָ', 'פַּ', 'פָּ'],
  },
  {
    id: 'e',
    label: 'אֶ',
    members: ['סֶגּוֹל', 'צֵירֵי'], // Segol, Tzeire
    exampleSyllables: ['בֶּ', 'בֵּ', 'סֶ', 'צֵ', 'פֶּ', 'פֵּ'],
  },
  {
    id: 'i',
    label: 'אִ',
    members: ['חִירִיק'], // Hiriq
    exampleSyllables: ['בִּ', 'חִ', 'פִּ', 'קִ', 'סִ'],
  },
  {
    id: 'o',
    label: 'אֹ',
    members: ['חוֹלָם'], // Holam
    exampleSyllables: ['בֹּ', 'חֹ', 'פֹּ', 'קֹ', 'סֹ'],
  },
  {
    id: 'u',
    label: 'אֻ',
    members: ['קֻבּוּץ', 'שׁוּרוּק'], // Kubutz, Shuruk
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
