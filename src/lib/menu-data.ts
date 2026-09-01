import type { Language } from './types'

// %NAME% is substituted with the restaurant's own name (see MenuExperience.tsx) — kept as a
// placeholder rather than string concatenation because "restaurant & cafe" sits *before* the name
// in Arabic/Kurdish idafa word order but *after* it in English.
export const copy = {
  ar: { welcome: 'أهلاً وسهلاً بكم في مطعم وكافي %NAME%', subtitle: 'طعمٌ يُحكى', explore: 'يلا ناكل ونشرب', menu: 'المينيو', search: 'ابحث عن صنف...', all: 'الكل', close: 'إغلاق', from: 'يبدأ من', currency: 'د.ع', empty: 'لا توجد أصناف مطابقة' },
  ckb: { welcome: 'بەخێربێن بۆ چێشتخانە و کافێی %NAME%', subtitle: 'تامیەک کە دەگێڕدرێتەوە', explore: 'وەرن با بخۆین و بخۆینەوە', menu: 'مینیۆ', search: 'بگەڕێ بۆ خواردنێک...', all: 'هەموو', close: 'داخستن', from: 'لە', currency: 'د.ع', empty: 'هیچ خواردنێک نەدۆزرایەوە' },
  en: { welcome: 'Welcome to %NAME% Restaurant & Café', subtitle: 'A taste worth telling', explore: "Let's Eat & Drink", menu: 'The menu', search: 'Search the menu...', all: 'All', close: 'Close', from: 'From', currency: 'IQD', empty: 'No items found' },
} as const

export type CopyStrings = { [K in keyof (typeof copy)['ar']]: string }
