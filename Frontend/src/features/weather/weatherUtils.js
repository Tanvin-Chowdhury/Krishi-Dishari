/** Shared weather display helpers for sidebar + forecast page. */

const DAY_NAMES = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];

export function weatherEmoji(condition, rainChance = 0) {
  const rain = Number(rainChance) || 0;
  const text = String(condition ?? '');
  if (rain >= 60) return '🌧️';
  if (text.includes('বৃষ্টি')) return '🌦️';
  if (text.includes('ঝড়')) return '⛈️';
  if (text.includes('পরিষ্কার') || text.includes('clear')) return '☀️';
  if (text.includes('কুয়াশা')) return '🌫️';
  return '⛅';
}

export function formatDayLabel(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return 'আজ';
  if (diff === 1) return 'আগামীকাল';
  return DAY_NAMES[d.getDay()] || dateStr;
}

export function normalizeCompactWeather(raw) {
  if (!raw) return null;
  const c = raw.current || raw;
  return {
    location: raw.location || c.location,
    temperature: c.temperature ?? c.temp,
    condition: c.condition,
    humidity: c.humidity,
    windSpeed: c.windSpeed ?? c.wind_speed,
    rainChance: c.rainChance ?? c.rainfallChance ?? c.rain_chance,
    advice: Array.isArray(raw.advice) ? raw.advice[0] : raw.advice || c.advice,
    adviceList: raw.advice || c.adviceList || (c.advice ? [c.advice] : []),
    forecast: raw.forecast,
    source: raw.source,
  };
}

export const LOCATION_STORAGE_KEY = 'kd-weather-location';

export function getSavedLocation() {
  try {
    return localStorage.getItem(LOCATION_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveLocation(name) {
  try {
    if (name) localStorage.setItem(LOCATION_STORAGE_KEY, name);
    else localStorage.removeItem(LOCATION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const SUGGESTED_LOCATIONS = [
  'ঢাকা',
  'চট্টগ্রাম',
  'রাজশাহী',
  'খুলনা',
  'সিলেট',
  'বরিশাল',
  'রংপুর',
  'ময়মনসিংহ'
];
