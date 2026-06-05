export const SKILL_OPTIONS = [
  { code: 'rice_farming', label: 'ধান চাষ' },
  { code: 'vegetable_farming', label: 'সবজি চাষ' },
  { code: 'fruit_farming', label: 'ফল চাষ' },
  { code: 'irrigation', label: 'সেচ কাজ' },
  { code: 'land_preparation', label: 'জমি চাষ' },
  { code: 'harvesting', label: 'ফসল কাটা' },
  { code: 'fertilizer', label: 'সার প্রয়োগ' },
  { code: 'pest_control', label: 'কীটনাশক' },
];

export const STATUS_VARIANT = {
  PENDING: 'amber',
  ACCEPTED: 'blue',
  ACTIVE: 'green',
  COMPLETED: 'gray',
  CANCELLED: 'red',
  REJECTED: 'red',
};

export const PLACEHOLDER_AVATAR =
  'https://images.unsplash.com/photo-1759411364609-aeb30eb034e4?w=400&h=400&fit=crop';

export const REQUESTER_ROLES = [1, 2];
export const LABOR_ROLE = 4;

export const WORK_TYPE_OPTIONS = [
  { code: 'daily', label: 'দৈনিক কাজ' },
  { code: 'seasonal', label: 'মৌসুমি কাজ' },
  { code: 'contract', label: 'চুক্তিভিত্তিক' },
  { code: 'harvest', label: 'ফসল কাটা' },
  { code: 'irrigation', label: 'সেচ কাজ' },
  { code: 'land_prep', label: 'জমি প্রস্তুতি' },
];

export const WORK_TYPE_LABEL = Object.fromEntries(
  WORK_TYPE_OPTIONS.map((w) => [w.code, w.label])
);

export const JOB_POST_STATUS_META = {
  open:   { label: 'খোলা',     variant: 'green' },
  filled: { label: 'পূর্ণ',     variant: 'blue' },
  closed: { label: 'বন্ধ',     variant: 'gray' },
};

export const APPLICATION_STATUS_META = {
  pending:   { label: 'অপেক্ষমাণ',   variant: 'amber' },
  accepted:  { label: 'গৃহীত',       variant: 'green' },
  rejected:  { label: 'প্রত্যাখ্যাত', variant: 'red' },
  withdrawn: { label: 'প্রত্যাহৃত',   variant: 'gray' },
};

export const PAYMENT_STATUS_META = {
  unpaid:  { label: 'অপরিশোধিত',     variant: 'red' },
  partial: { label: 'আংশিক পরিশোধিত', variant: 'amber' },
  paid:    { label: 'পরিশোধিত',       variant: 'green' },
};
