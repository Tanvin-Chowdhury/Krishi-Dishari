import { useEffect, useState } from "react";
import { Calendar, Clock, Timer } from "lucide-react";
import { Label } from "../../shared/design-system/Form";
import {
  applyDurationPreset,
  buildAuctionDateTimePayload,
  BD_TZ_LABEL,
  DURATION_PRESETS,
  formatAuctionDateTimePreview,
  formatDurationPreview,
  remainingMsUntil,
} from "../../shared/lib/auctionDatetime";

const fieldClass =
  "w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10";

/**
 * User-friendly end time: date + time pickers, quick presets, live countdown preview.
 */
export default function AuctionEndTimePicker({ endDate, endTime, onChange }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => setRemaining(remainingMsUntil(endDate, endTime));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate, endTime]);

  const applyPreset = (hours) => {
    const { date, time } = applyDurationPreset(hours);
    onChange({ endDate: date, endTime: time });
  };

  const preview = formatAuctionDateTimePreview(endDate, endTime);
  const payload = buildAuctionDateTimePayload(endDate, endTime);

  return (
    <div className="space-y-4">
      <div>
        <Label required>নিলাম কতক্ষণ চলবে?</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {DURATION_PRESETS.map(({ label, hours }) => (
            <button
              key={hours}
              type="button"
              onClick={() => applyPreset(hours)}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 hover:border-emerald-300"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="end_date" required>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="text-emerald-600" />
              শেষের তারিখ
            </span>
          </Label>
          <input
            id="end_date"
            type="date"
            value={endDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => onChange({ endDate: e.target.value, endTime })}
            required
            className={`${fieldClass} mt-1.5`}
          />
        </div>
        <div>
          <Label htmlFor="end_time" required>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-emerald-600" />
              শেষের সময়
            </span>
          </Label>
          <input
            id="end_time"
            type="time"
            value={endTime}
            onChange={(e) => onChange({ endDate, endTime: e.target.value })}
            required
            className={`${fieldClass} mt-1.5`}
          />
        </div>
      </div>

      <p className="text-[11px] text-slate-400">{BD_TZ_LABEL}</p>

      {preview && payload && (
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <Timer size={20} className="text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700/80">
                নিলাম শেষ হবে
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                {preview}
              </p>
              <p className="mt-2 text-lg font-black tabular-nums text-emerald-700">
                {formatDurationPreview(remaining)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { buildAuctionDateTimePayload };
