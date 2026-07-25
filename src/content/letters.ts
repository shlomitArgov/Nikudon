/**
 * Hebrew alphabet letters (without sofiot - final forms)
 * 22 letters total
 */
export const letters = [
  'א', // Alef
  'ב', // Bet
  'ג', // Gimel
  'ד', // Dalet
  'ה', // He
  'ו', // Vav
  'ז', // Zayin
  'ח', // Het
  'ט', // Tet
  'י', // Yod
  'כ', // Kaf
  'ל', // Lamed
  'מ', // Mem
  'נ', // Nun
  'ס', // Samekh
  'ע', // Ayin
  'פ', // Pe
  'צ', // Tsadi
  'ק', // Qof
  'ר', // Resh
  'ש', // Shin
  'ת', // Tav
] as const

export type Letter = typeof letters[number]
