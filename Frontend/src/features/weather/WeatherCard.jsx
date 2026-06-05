import { Link } from 'react-router';
import {
  CloudSun,
  ChevronRight,
  Droplets,
  CloudRain,
  Wind,
  Thermometer,
} from 'lucide-react';
import { cn } from '../../shared/lib/cn';
import { weatherEmoji } from '../../features/weather/weatherUtils';

/**
 * Compact weather card — used in dashboard right sidebar.
 * Accepts compact weather object from sidebar API or full bundle.current.
 */
export default function WeatherCard({
  weather,
  loading = false,
  className = '',
  showLink = true,
  embedded = false,
}) {
  if (loading) {
    return (
      <div className={cn('animate-pulse rounded-xl bg-slate-100 h-36', className)} />
    );
  }

  if (!weather) {
    return (
      <p className={cn('py-4 text-center text-xs text-slate-400', className)}>
        আবহাওয়া লোড হয়নি
      </p>
    );
  }

  const rain = weather.rainChance ?? weather.rainfallChance ?? 0;
  const body = (
    <div
      className={cn(
        'rounded-xl bg-gradient-to-br from-sky-50 to-emerald-50/60 p-3 ring-1 ring-sky-100/80',
        showLink && 'hover:ring-sky-200 transition-shadow',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl shrink-0" aria-hidden>
          {weatherEmoji(weather.condition, rain)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-sky-900 truncate">{weather.location}</p>
          <p className="text-2xl font-extrabold text-slate-900 leading-tight">
            {weather.temperature}°C
            <span className="ml-2 text-xs font-medium text-slate-500">{weather.condition}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Droplets size={12} className="text-sky-500" />
              {weather.humidity}%
            </span>
            <span className="inline-flex items-center gap-1">
              <CloudRain size={12} className="text-blue-500" />
              {rain}%
            </span>
            {weather.windSpeed != null && (
              <span className="inline-flex items-center gap-1">
                <Wind size={12} className="text-teal-600" />
                {weather.windSpeed} km/h
              </span>
            )}
          </div>
        </div>
      </div>
      {(weather.advice || weather.adviceList?.[0]) && (
        <p className="mt-3 rounded-lg bg-white/70 px-2.5 py-2 text-[11px] leading-relaxed text-emerald-900 ring-1 ring-emerald-100 line-clamp-3">
          <Thermometer size={11} className="inline mr-1 -mt-0.5 text-emerald-600" />
          {weather.advice || weather.adviceList[0]}
        </p>
      )}
      {showLink && (
        <p className="mt-2 flex items-center justify-end gap-0.5 text-[10px] font-semibold text-sky-700">
          বিস্তারিত পূর্বাভাস <ChevronRight size={11} />
        </p>
      )}
    </div>
  );

  if (embedded || !showLink) return body;

  return (
    <Link to="/app/weather" className="block group">
      {body}
    </Link>
  );
}

export function WeatherCardSection({ title = 'আবহাওয়া', weather, loading, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-gradient-to-r from-slate-50/80 to-white">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <CloudSun size={16} strokeWidth={2} />
          </span>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        <Link
          to="/app/weather"
          className="flex items-center gap-0.5 text-[11px] font-semibold text-sky-700 hover:text-sky-800"
        >
          পূর্ণ পূর্বাভাস <ChevronRight size={12} />
        </Link>
      </div>
      <div className="p-3">
        {children ?? <WeatherCard weather={weather} loading={loading} embedded showLink={false} />}
      </div>
    </section>
  );
}
