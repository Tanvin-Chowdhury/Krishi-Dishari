// import { useContext, useEffect, useState } from "react";
// import {
//   Award,
//   BookOpen,
//   Calendar,
//   ChevronRight,
//   Clock,
//   FileText,
//   Globe,
//   Mail,
//   MapPin,
//   MessageSquare,
//   Package,
//   Phone,
//   Settings,
//   Shield,
//   TrendingUp,
//   User,
// } from "lucide-react";
// import { AuthContext } from "../../Provider/AuthContext";

// const API_BASE_URL = "http://localhost:5000";

// const roleConfig = {
//   1: { label: "কৃষক", className: "bg-emerald-100 text-emerald-700" },
//   2: { label: "ক্রেতা", className: "bg-purple-100 text-purple-700" },
//   3: { label: "বিশেষজ্ঞ", className: "bg-blue-100 text-blue-700" },
//   4: { label: "শ্রমিক", className: "bg-orange-100 text-orange-700" },
// };

// const statCards = [
//   {
//     label: "সার্টিফিকেট",
//     value: "৭",
//     icon: Award,
//     color: "text-emerald-600",
//     bg: "bg-emerald-50",
//   },
//   {
//     label: "কোর্স সম্পন্ন",
//     value: "১২",
//     icon: BookOpen,
//     color: "text-blue-600",
//     bg: "bg-blue-50",
//   },
//   {
//     label: "পণ্য বিক্রয়",
//     value: "৮৩",
//     icon: Package,
//     color: "text-purple-600",
//     bg: "bg-purple-50",
//   },
//   {
//     label: "কমিউনিটি পোস্ট",
//     value: "৪৫",
//     icon: MessageSquare,
//     color: "text-pink-600",
//     bg: "bg-pink-50",
//   },
// ];

// const recentActivities = [
//   { title: "নতুন পণ্য যোগ করেছেন", time: "২ ঘণ্টা আগে", icon: Package },
//   { title: "নিলামে বিড করেছেন", time: "৫ ঘণ্টা আগে", icon: TrendingUp },
//   {
//     title: "কমিউনিটিতে একটি প্রশ্ন পোস্ট করেছেন",
//     time: "১ দিন আগে",
//     icon: MessageSquare,
//   },
// ];

// const resolveImageUrl = (imagePath) => {
//   if (!imagePath) return "";
//   if (/^(https?:\/\/|data:|blob:)/i.test(imagePath)) return imagePath;
//   const normalizedPath = imagePath.startsWith("/")
//     ? imagePath
//     : `/${imagePath}`;
//   return `${API_BASE_URL}${normalizedPath}`;
// };

// const Profile = () => {
//   const { user, setUser } = useContext(AuthContext);
//   const [dbUser, setDbUser] = useState(user);
//   const [activeTab, setActiveTab] = useState("profile");
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [failedImageSrc, setFailedImageSrc] = useState("");

//   const userId = user?.user_id || user?.id;

//   useEffect(() => {
//     if (!userId) {
//       return;
//     }

//     const fetchUser = async () => {
//       setIsLoading(true);
//       setError("");

//       try {
//         const res = await fetch(`${API_BASE_URL}/api/users/${userId}`);
//         const data = await res.json();

//         if (!res.ok) {
//           throw new Error(data.message || "Failed to load user profile");
//         }

//         setDbUser(data.user);
//         setUser(data.user);
//       } catch (err) {
//         setError(err.message || "Failed to load user profile");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchUser();
//   }, [setUser, user, userId]);

//   const profileUser = dbUser || user || {};
//   const role = roleConfig[profileUser.role_id] || roleConfig[1];
//   const name = profileUser.name || "অতিথি";
//   const email = profileUser.email || "ইমেইল নেই";
//   const phone = profileUser.phone || "মোবাইল নম্বর নেই";
//   const district =
//     profileUser.location_district ||
//     profileUser.location_upazila ||
//     "ঠিকানা নেই";
//   const joinDate = profileUser.created_at
//     ? new Date(profileUser.created_at).toLocaleDateString("bn-BD", {
//         year: "numeric",
//         month: "long",
//         day: "numeric",
//       })
//     : "তারিখ নেই";
//   const rawProfileImage =
//     profileUser.profile_image ||
//     profileUser.profile_picture ||
//     profileUser.avatar ||
//     profileUser.image_url ||
//     "";
//   const profileImageSrc = resolveImageUrl(rawProfileImage);
//   const shouldShowProfileImage =
//     Boolean(profileImageSrc) && failedImageSrc !== profileImageSrc;

//   const personalInfo = [
//     { label: "পুরো নাম", value: name, icon: User },
//     { label: "মোবাইল", value: phone, icon: Phone },
//     { label: "ইমেইল", value: email, icon: Mail },
//     { label: "ঠিকানা", value: district, icon: MapPin },
//     { label: "যোগদানের তারিখ", value: joinDate, icon: Calendar },
//   ];

//   const tabs = [
//     { id: "profile", label: "প্রোফাইল তথ্য", icon: User },
//     { id: "activity", label: "কার্যক্রম", icon: Clock },
//     { id: "settings", label: "সেটিংস", icon: Settings },
//     { id: "privacy", label: "গোপনীয়তা", icon: Shield },
//   ];
//   const initials = name
//     .split(" ")
//     .filter(Boolean)
//     .slice(0, 2)
//     .map((part) => part[0])
//     .join("")
//     .toUpperCase();
//   const avatarAlt = `${name} profile`;
//   const avatarContent = shouldShowProfileImage ? (
//     <img
//       src={profileImageSrc}
//       alt={avatarAlt}
//       className="h-full w-full object-cover"
//       onError={() => setFailedImageSrc(profileImageSrc)}
//     />
//   ) : (
//     initials || <User className="h-12 w-12 text-white" />
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-white">
//       <section className="relative overflow-hidden px-4 py-12 md:px-8 md:py-14">
//         <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-700" />
//         <div className="absolute -left-24 top-6 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
//         <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
//         <div className="relative z-10 mx-auto max-w-7xl">
//           <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-sm md:p-8">
//             <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
//               <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
//                 <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white/50 bg-white/20 text-4xl font-black text-white shadow-xl">
//                   {avatarContent}
//                 </div>

//                 <div className="text-white">
//                   <div className="mb-3 flex flex-wrap items-center gap-3">
//                     <h1 className="text-3xl font-black tracking-tight md:text-4xl">
//                       {name}
//                     </h1>
//                     <span
//                       className={`rounded-full px-4 py-1.5 text-sm font-bold ring-1 ring-black/5 ${role.className}`}
//                     >
//                       {role.label}
//                     </span>
//                     {/* <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold">
//                       <CheckCircle2 className="h-4 w-4" />
//                       ডাটাবেস থেকে লোড
//                     </span> */}
//                   </div>
//                   <div className="flex flex-wrap gap-4 text-sm text-white/90">
//                     <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
//                       <Mail className="h-4 w-4" />
//                       {email}
//                     </span>
//                     <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
//                       <MapPin className="h-4 w-4" />
//                       {district}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-3 sm:w-auto">
//                 <QuickBadge
//                   icon={Calendar}
//                   title="যোগদানের তারিখ"
//                   value={joinDate}
//                 />
//                 <QuickBadge icon={Phone} title="মোবাইল" value={phone} />
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
//         {isLoading && (
//           <p className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
//             ডাটাবেস থেকে প্রোফাইল লোড হচ্ছে...
//           </p>
//         )}

//         {error && (
//           <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
//             {error}
//           </p>
//         )}

//         <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
//           {statCards.map((stat) => {
//             const Icon = stat.icon;
//             return (
//               <div
//                 key={stat.label}
//                 className="group rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
//               >
//                 <div
//                   className={`mx-auto mb-3 w-fit rounded-xl p-3 transition group-hover:scale-105 ${stat.bg}`}
//                 >
//                   <Icon className={`h-6 w-6 ${stat.color}`} />
//                 </div>
//                 <p className="text-2xl font-black text-gray-800">
//                   {stat.value}
//                 </p>
//                 <p className="text-sm text-gray-600">{stat.label}</p>
//               </div>
//             );
//           })}
//         </div>

//         <div className="mb-6 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
//           <div className="flex gap-2">
//             {tabs.map((tab) => {
//               const Icon = tab.icon;
//               return (
//                 <button
//                   key={tab.id}
//                   type="button"
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-bold transition ${
//                     activeTab === tab.id
//                       ? "bg-emerald-600 text-white shadow-sm"
//                       : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
//                   }`}
//                 >
//                   <Icon className="h-5 w-5" />
//                   {tab.label}
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {activeTab === "profile" && (
//           <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
//             <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-7">
//               <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-gray-800">
//                 <User className="h-5 w-5 text-emerald-600" />
//                 ব্যক্তিগত তথ্য
//               </h2>
//               <div className="space-y-3">
//                 {personalInfo.map((item) => {
//                   const Icon = item.icon;
//                   return (
//                     <div
//                       key={item.label}
//                       className="flex items-center gap-4 rounded-xl border border-transparent p-3 transition hover:border-emerald-100 hover:bg-emerald-50/60"
//                     >
//                       <div className="rounded-xl bg-emerald-100/70 p-2.5">
//                         <Icon className="h-5 w-5 text-emerald-600" />
//                       </div>
//                       <div>
//                         <p className="text-xs text-gray-500">{item.label}</p>
//                         <p className="font-extrabold text-gray-800">
//                           {item.value}
//                         </p>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </section>

//             <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-5">
//               <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-800">
//                 <Globe className="h-5 w-5 text-emerald-600" />
//                 কৃষি তথ্য
//               </h2>
//               <InfoRow label="রোল আইডি" value={profileUser.role_id || "নেই"} />
//               <InfoRow label="জেলা" value={district} />
//               <InfoRow
//                 label="উপজেলা"
//                 value={profileUser.location_upazila || "নেই"}
//               />
//             </section>
//           </div>
//         )}

//         {activeTab === "activity" && (
//           <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
//             <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-800">
//               <Clock className="h-5 w-5 text-emerald-600" />
//               সাম্প্রতিক কার্যক্রম
//             </h2>
//             <div className="space-y-3">
//               {recentActivities.map((activity) => {
//                 const Icon = activity.icon;
//                 return (
//                   <div
//                     key={activity.title}
//                     className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/50"
//                   >
//                     <div className="rounded-lg bg-emerald-100/70 p-2">
//                       <Icon className="h-5 w-5 text-emerald-600" />
//                     </div>
//                     <div>
//                       <p className="font-extrabold text-gray-800">
//                         {activity.title}
//                       </p>
//                       <p className="text-xs text-gray-500">{activity.time}</p>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </section>
//         )}

//         {activeTab === "settings" && (
//           <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
//             <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-800">
//               <Settings className="h-5 w-5 text-emerald-600" />
//               সেটিংস
//             </h2>
//             <Action title="পাসওয়ার্ড পরিবর্তন করুন" />
//             <Action title="নোটিফিকেশন সেটিংস" />
//           </section>
//         )}

//         {activeTab === "privacy" && (
//           <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
//             <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-800">
//               <Shield className="h-5 w-5 text-emerald-600" />
//               গোপনীয়তা
//             </h2>
//             <p className="text-sm text-gray-600">
//               আপনার প্রোফাইল তথ্য নির্দিষ্ট ব্যবহারকারীর ডাটাবেস রেকর্ড থেকে
//               দেখানো হচ্ছে।
//             </p>
//             <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
//               <FileText className="h-4 w-4" />
//               নীতিমালা দেখুন
//             </div>
//           </section>
//         )}
//       </main>
//     </div>
//   );
// };

// const InfoRow = ({ label, value }) => (
//   <div className="flex items-center justify-between border-b border-gray-100 py-3">
//     <span className="text-sm text-gray-500">{label}</span>
//     <span className="font-extrabold text-gray-800">{value}</span>
//   </div>
// );

// const Action = ({ title }) => (
//   <button
//     type="button"
//     className="mb-3 flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
//   >
//     <span className="font-extrabold text-gray-800">{title}</span>
//     <ChevronRight className="h-5 w-5 text-gray-400" />
//   </button>
// );

// const QuickBadge = ({ icon: Icon, title, value }) => (
//   <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm">
//     <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold text-white/80">
//       <Icon className="h-3.5 w-3.5" />
//       {title}
//     </p>
//     <p className="truncate text-sm font-bold">{value}</p>
//   </div>
// );

// export default Profile;

import { useContext, useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Phone,
  User,
  Shield,
  Settings,
  TrendingUp,
  MessageSquare,
  Package,
} from "lucide-react";
import { AuthContext } from "../../Provider/AuthContext";
import api from "../../services/api";

const roleConfig = {
  1: { label: "কৃষক", className: "bg-emerald-100 text-emerald-700" },
  2: { label: "ক্রেতা", className: "bg-purple-100 text-purple-700" },
  3: { label: "বিশেষজ্ঞ", className: "bg-blue-100 text-blue-700" },
  4: { label: "শ্রমিক", className: "bg-orange-100 text-orange-700" },
};

const statCards = [
  {
    label: "সার্টিফিকেট",
    value: "৭",
    icon: Award,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    label: "কোর্স সম্পন্ন",
    value: "১২",
    icon: BookOpen,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "পণ্য বিক্রয়",
    value: "৮৩",
    icon: Package,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    label: "কমিউনিটি পোস্ট",
    value: "৪৫",
    icon: MessageSquare,
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
];

const recentActivities = [
  { title: "নতুন পণ্য যোগ করেছেন", time: "২ ঘণ্টা আগে", icon: Package },
  { title: "নিলামে বিড করেছেন", time: "৫ ঘণ্টা আগে", icon: TrendingUp },
  {
    title: "কমিউনিটিতে প্রশ্ন পোস্ট করেছেন",
    time: "১ দিন আগে",
    icon: MessageSquare,
  },
];

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = user?.user_id;

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await api.getUserProfile(userId);
        if (!res.success)
          throw new Error(res.message || "Failed to load profile");

        setProfileData(res.user);
        setUser(res.user);
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]); // Removed setUser from dependency to prevent loop

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  const p = profileData || user || {};
  const role = roleConfig[p.role_id] || {
    label: "অজানা",
    className: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-lime-600 py-12 text-white">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 md:flex-row">
          <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white/20 flex items-center justify-center text-6xl font-bold shadow-xl">
            {p.photo_url ? (
              <img
                src={p.photo_url}
                alt={p.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              p.full_name?.[0] || "👤"
            )}
          </div>

          <div>
            <h1 className="text-4xl font-bold">{p.full_name}</h1>
            <span
              className={`inline-block mt-2 px-5 py-1.5 rounded-full text-sm font-semibold ${role.className}`}
            >
              {role.label}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200/70 bg-white p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5"
              >
                <div className={`mx-auto mb-3 w-fit rounded-xl p-3 ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-8 overflow-x-auto">
          {["profile", "activity", "settings", "privacy"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold whitespace-nowrap border-b-2 transition ${
                activeTab === tab
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab === "profile" && "প্রোফাইল"}
              {tab === "activity" && "কার্যক্রম"}
              {tab === "settings" && "সেটিংস"}
              {tab === "privacy" && "গোপনীয়তা"}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 shadow">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <User className="text-emerald-600" /> ব্যক্তিগত তথ্য
              </h2>
              <div className="space-y-5">
                <InfoRow label="পূর্ণ নাম" value={p.full_name} />
                <InfoRow label="ইমেইল" value={p.email} />
                <InfoRow label="মোবাইল" value={p.phone} />
                <InfoRow label="লিঙ্গ" value={p.gender} />
                <InfoRow
                  label="উপজেলা"
                  value={p.upazila_id || "আপডেট করা হয়নি"}
                />
                <InfoRow label="গ্রাম" value={p.village || "আপডেট করা হয়নি"} />
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-3xl p-8 shadow h-fit">
              <h2 className="text-xl font-bold mb-5">অতিরিক্ত তথ্য</h2>
              <InfoRow label="রোল" value={role.label} />
              <InfoRow
                label="যোগদান"
                value={
                  p.created_at
                    ? new Date(p.created_at).toLocaleDateString("bn-BD")
                    : "N/A"
                }
              />
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="bg-white rounded-3xl p-8 shadow">
            <h2 className="text-2xl font-bold mb-6">সাম্প্রতিক কার্যক্রম</h2>
            <div className="space-y-4">
              {recentActivities.map((act, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-center border-l-4 border-emerald-500 pl-4 py-2"
                >
                  <act.icon className="w-6 h-6 text-emerald-600" />
                  <div>
                    <p>{act.title}</p>
                    <p className="text-sm text-gray-500">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-3 border-b last:border-none">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold">{value || "তথ্য নেই"}</span>
  </div>
);

export default Profile;
