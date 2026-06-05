/** কৃষি উৎপাদ — ছোট/মাঝারি পরিমাণে বিক্রয় */
export const MARKETPLACE_PRODUCE_CATEGORIES = [
  'শস্য ও ধান',
  'সবজি',
  'ফল',
  'ডাল ও তেলবীজ',
  'মসলা ও শাক',
  'মধু ও কৃষি উৎপাদ',
  'দুগ্ধ, ডিম ও দুগ্ধজাত',
  'মাছ, মাংস ও হাঁস-মুরগি',
];

/** বীজ, সার ও কৃষি উপকরণ */
export const MARKETPLACE_INPUT_CATEGORIES = [
  'বীজ',
  'সার',
  'কীটনাশক',
  'ফসল সুরক্ষা পণ্য',
  'জৈব কৃষি পণ্য',
  'পশু খাদ্য',
];

/** যন্ত্রপাতি ও সরঞ্জাম */
export const MARKETPLACE_EQUIPMENT_CATEGORIES = [
  'কৃষি যন্ত্রপাতি',
  'সেচ সরঞ্জাম',
  'ফসল সংগ্রহ যন্ত্র',
  'কৃষি সরঞ্জাম',
  'গ্রিনহাউস সরবরাহ',
  'সংরক্ষণ সামগ্রী',
  'কৃষি আনুষাঙ্গিক',
];

export const MARKETPLACE_CATEGORY_GROUPS = [
  { label: 'কৃষি উৎপাদ (ছোট/মাঝারি পরিমাণ)', categories: MARKETPLACE_PRODUCE_CATEGORIES },
  { label: 'বীজ, সার ও কৃষি উপকরণ', categories: MARKETPLACE_INPUT_CATEGORIES },
  { label: 'যন্ত্রপাতি ও সরঞ্জাম', categories: MARKETPLACE_EQUIPMENT_CATEGORIES },
];

export const MARKETPLACE_CATEGORIES = [
  ...MARKETPLACE_PRODUCE_CATEGORIES,
  ...MARKETPLACE_INPUT_CATEGORIES,
  ...MARKETPLACE_EQUIPMENT_CATEGORIES,
];

export const DEFAULT_MARKETPLACE_CATEGORY = 'সবজি';

export const MARKETPLACE_UNITS = [
  { value: 'কেজি', label: 'কেজি' },
  { value: 'গ্রাম', label: 'গ্রাম' },
  { value: 'মণ', label: 'মণ' },
  { value: 'লিটার', label: 'লিটার' },
  { value: 'টি', label: 'টি (পিস)' },
  { value: 'ডজন', label: 'ডজন' },
  { value: 'বস্তা', label: 'বস্তা' },
];

/** পুরনো ইংরেজি বিভাগ → বাংলা (প্রদর্শন ও পরিসংখ্যান) */
export const LEGACY_CATEGORY_LABELS = {
  Seeds: 'বীজ',
  Fertilizers: 'সার',
  Pesticides: 'কীটনাশক',
  'Farming Equipment': 'কৃষি সরঞ্জাম',
  'Irrigation Tools': 'সেচ সরঞ্জাম',
  'Harvesting Equipment': 'ফসল সংগ্রহ যন্ত্র',
  'Agricultural Machinery': 'কৃষি যন্ত্রপাতি',
  'Animal Feed': 'পশু খাদ্য',
  'Crop Protection Products': 'ফসল সুরক্ষা পণ্য',
  'Organic Farming Products': 'জৈব কৃষি পণ্য',
  'Greenhouse Supplies': 'গ্রিনহাউস সরবরাহ',
  'Storage Materials': 'সংরক্ষণ সামগ্রী',
  'Farming Accessories': 'কৃষি আনুষাঙ্গিক',
  'Harvested Crops': 'সবজি',
};

export function displayCategory(name) {
  if (!name) return '';
  return LEGACY_CATEGORY_LABELS[name] || name;
}

export function normalizeCategoryKey(name) {
  return displayCategory(name);
}
