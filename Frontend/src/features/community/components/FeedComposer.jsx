import { useContext } from 'react';
import { Image, Video, Sprout, Bug, Lightbulb, HelpCircle, TrendingUp, Pencil } from 'lucide-react';
import { AuthContext }  from '../../../core/auth/AuthContext';
import UserPhoto        from '../../../shared/components/UserPhoto';
import { ROLE_META }    from '../../../config/NavConfig';

const QUICK_ACTIONS = [
  { icon: Image,       label: 'ছবি',             type: 'discussion',   color: 'text-green-600'  },
  { icon: Sprout,      label: 'ফসল',             type: 'success_story', color: 'text-emerald-600'},
  { icon: Bug,         label: 'রোগ সমস্যা',      type: 'disease_issue', color: 'text-red-500'    },
  { icon: Lightbulb,   label: 'টিপস',            type: 'success_story', color: 'text-amber-500'  },
  { icon: HelpCircle,  label: 'প্রশ্ন',           type: 'question',      color: 'text-blue-500'   },
  { icon: TrendingUp,  label: 'বাজার বিশ্লেষণ', type: 'discussion',   color: 'text-purple-500' },
];

export default function FeedComposer({ onOpen }) {
  const { user }  = useContext(AuthContext);
  const roleId    = user?.role_id ?? 1;
  const meta      = ROLE_META[roleId] ?? ROLE_META[1];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Compose trigger row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex-shrink-0">
          <UserPhoto
            src={user?.photo_url}
            name={user?.full_name}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
            fallbackClassName="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ring-2 ring-white shadow-sm"
            fallbackStyle={{ background: meta?.bgColor || '#059669', color: meta?.color || '#fff' }}
          />
        </div>
        <button type="button" onClick={() => onOpen?.('discussion')}
          className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-sm text-gray-400 hover:bg-gray-100 hover:border-emerald-300 hover:text-emerald-700 transition cursor-text">
          আজ আপনার কৃষি অভিজ্ঞতা শেয়ার করুন...
        </button>
        <button type="button" onClick={() => onOpen?.('discussion')}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition">
          <Pencil size={14} />
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 mx-4" />

      {/* Quick action chips */}
      <div className="flex items-center gap-1 overflow-x-auto px-3 py-2.5">
        {QUICK_ACTIONS.map((a, i) => (
          <button key={i} type="button" onClick={() => onOpen?.(a.type)}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition">
            <a.icon size={12} className={a.color} />
            {a.label}
          </button>
        ))}
        <button type="button" onClick={() => onOpen?.('discussion')}
          className="ml-auto flex-shrink-0 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
          পোস্ট করুন
        </button>
      </div>
    </div>
  );
}
