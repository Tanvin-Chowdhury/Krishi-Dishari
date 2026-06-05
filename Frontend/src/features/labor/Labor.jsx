import React, { useState } from "react";
import NavBar from "../NavBar/NavBar";
import {
  Search,
  MapPin,
  Star,
  Phone,
  MessageCircle,
  Briefcase,
  Calendar,
  DollarSign,
  Filter,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router";

const workersDatabase = [
  {
    id: 1,
    name: "আব্দুল করিম",
    photo:
      "https://images.unsplash.com/photo-1759411364609-aeb30eb034e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtJTIwd29ya2VyJTIwbGFib3J8ZW58MXx8fHwxNzYwODE1NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "যশোর, খুলনা",
    rating: 4.8,
    completedJobs: 145,
    experience: "৮ বছর",
    skills: ["ধান রোপণ", "সেচ কাজ", "সার প্রয়োগ"],
    dailyRate: "৬০০",
    availability: "এখনই পাওয়া যাচ্ছে",
    verified: true,
    description: "অভিজ্ঞ কৃষি শ্রমিক। ধান, গম, সবজি চাষে দক্ষ।",
  },
  {
    id: 2,
    name: "রহিম উদ্দিন",
    photo:
      "https://images.unsplash.com/photo-1609075916355-cb02b783347e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHdvcmtlcnxlbnwxfHx8fDE3NjA4MTU0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "রাজশাহী",
    rating: 4.9,
    completedJobs: 230,
    experience: "১২ বছর",
    skills: ["ফসল কাটা", "মাড়াই", "জমি চাষ"],
    dailyRate: "৭৫০",
    availability: "এখনই পাওয়া যাচ্ছে",
    verified: true,
    description: "সব ধরনের কৃষিকাজে অভিজ্ঞ। টিম নিয়ে কাজ করতে পারি।",
  },
  {
    id: 3,
    name: "জাহিদ হাসান",
    photo:
      "https://images.unsplash.com/photo-1679137231699-3bde5c94bdcb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtaW5nJTIwaGVscCUyMHdvcmtlcnN8ZW58MXx8fHwxNzYwODE1NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "বগুড়া, রাজশাহী",
    rating: 4.7,
    completedJobs: 98,
    experience: "৫ বছর",
    skills: ["সবজি চাষ", "কীটনাশক স্প্রে", "গাছের যত্ন"],
    dailyRate: "৫৫০",
    availability: "১ সপ্তাহ পর",
    verified: true,
    description: "সবজি চাষে বিশেষজ্ঞ। জৈব চাষে অভিজ্ঞ।",
  },
  {
    id: 4,
    name: "মোস্তফা কামাল",
    photo:
      "https://images.unsplash.com/photo-1759411364609-aeb30eb034e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtJTIwd29ya2VyJTIwbGFib3J8ZW58MXx8fHwxNzYwODE1NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "খুলনা",
    rating: 4.6,
    completedJobs: 76,
    experience: "৪ বছর",
    skills: ["ট্রাক্টর চালনা", "জমি চাষ", "বীজ বপন"],
    dailyRate: "৮০০",
    availability: "এখনই পাওয়া যাচ্ছে",
    verified: true,
    description: "ট্রাক্টর চালক ও জমি চাষে দক্ষ শ্রমিক।",
  },
  {
    id: 5,
    name: "সালাম মিয়া",
    photo:
      "https://images.unsplash.com/photo-1609075916355-cb02b783347e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHdvcmtlcnxlbnwxfHx8fDE3NjA4MTU0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "দিনাজপুর",
    rating: 4.9,
    completedJobs: 187,
    experience: "১০ বছর",
    skills: ["আলু চাষ", "ধান রোপণ", "সেচ ব্যবস্থাপনা"],
    dailyRate: "৭০০",
    availability: "৩ দিন পর",
    verified: true,
    description: "উত্তরবঙ্গের চাষাবাদে অভিজ্ঞ। দক্ষ ও বিশ্বস্ত।",
  },
  {
    id: 6,
    name: "হারুন রশিদ",
    photo:
      "https://images.unsplash.com/photo-1679137231699-3bde5c94bdcb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtaW5nJTIwaGVscCUyMHdvcmtlcnN8ZW58MXx8fHwxNzYwODE1NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "চট্টগ্রাম",
    rating: 4.5,
    completedJobs: 63,
    experience: "৩ বছর",
    skills: ["ফল চাষ", "বাগান পরিচর্যা", "ড্রিপ সেচ"],
    dailyRate: "৫০০",
    availability: "এখনই পাওয়া যাচ্ছে",
    verified: false,
    description: "ফল বাগান পরিচর্যায় বিশেষ দক্ষতা।",
  },
];

const skillCategories = [
  "সকল দক্ষতা",
  "ধান চাষ",
  "সবজি চাষ",
  "ফসল কাটা",
  "জমি চাষ",
  "সেচ কাজ",
  "ট্রাক্টর চালনা",
  "কীটনাশক স্প্রে",
  "ফল চাষ",
];

const Labor = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showHireForm, setShowHireForm] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const navigate = useNavigate();

  const filteredWorkers = workersDatabase.filter((worker) => {
    const matchesSearch =
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.skills.some((skill) => skill.includes(searchQuery));

    const matchesSkill =
      !selectedSkill ||
      selectedSkill === "সকল দক্ষতা" ||
      worker.skills.some((skill) =>
        skill.includes(
          selectedSkill.replace("ধান চাষ", "ধান").replace("সবজি চাষ", "সবজি"),
        ),
      );

    return matchesSearch && matchesSkill;
  });

  const handleHireWorker = (worker) => {
    setSelectedWorker(worker);
    setShowHireForm(true);
  };

  return (
    <div className="bg-[rgba(246,246,246,0.9)] min-h-screen w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[24px] md:text-[32px] text-gray-800 mb-2">
                কৃষি শ্রমিক বাজার
              </h1>
              <p className="font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px] md:text-[16px] text-gray-600">
                অভিজ্ঞ ও দক্ষ শ্রমিক খুঁজুন এবং নিয়োগ করুন
              </p>
            </div>
            <button
              onClick={() => navigate("market")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-md transition-all"
            >
              <span className="font-['Inter:SemiBold',_'Noto_Sans_Bengali:SemiBold',_sans-serif] text-[14px] md:text-[16px]">
                মার্কেটপ্লেসে ফিরুন
              </span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative bg-[#e0dada] rounded-[28px] h-[50px] flex items-center px-4">
              <Search className="w-5 h-5 text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="নাম বা স্থান অনুসন্ধান করুন"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[14px] md:text-[16px] text-black placeholder:text-[rgba(0,0,0,0.45)]"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[18px] md:text-[20px] text-gray-800">
              দক্ষতা অনুযায়ী ফিল্টার করুন
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {skillCategories.map((skill, index) => {
              const isSelected =
                selectedSkill === skill ||
                (!selectedSkill && skill === "সকল দক্ষতা");
              return (
                <button
                  key={index}
                  onClick={() =>
                    setSelectedSkill(skill === "সকল দক্ষতা" ? null : skill)
                  }
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-emerald-50"
                  }`}
                >
                  <span className="font-['Inter:SemiBold',_'Noto_Sans_Bengali:SemiBold',_sans-serif] text-[14px]">
                    {skill}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <p className="text-[20px] md:text-[24px] font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-gray-800">
                {filteredWorkers.length}
              </p>
            </div>
            <p className="text-[12px] font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-gray-600">
              মোট শ্রমিক
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-yellow-500" />
              <p className="text-[20px] md:text-[24px] font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-gray-800">
                ৪.৭
              </p>
            </div>
            <p className="text-[12px] font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-gray-600">
              গড় রেটিং
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-green-600" />
              <p className="text-[20px] md:text-[24px] font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-gray-800">
                {
                  workersDatabase.filter(
                    (w) => w.availability === "এখনই পাওয়া যাচ্ছে",
                  ).length
                }
              </p>
            </div>
            <p className="text-[12px] font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-gray-600">
              উপলব্ধ
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <p className="text-[20px] md:text-[24px] font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-gray-800">
                ৬৫০
              </p>
            </div>
            <p className="text-[12px] font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-gray-600">
              গড় দৈনিক মজুরি (৳)
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[20px] md:text-[24px] text-gray-800 mb-4">
            উপলব্ধ শ্রমিকগণ
          </h2>

          {filteredWorkers.length > 0 ? (
            filteredWorkers.map((worker) => (
              <div
                key={worker.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 aspect-square md:aspect-auto relative">
                    <img
                      src={worker.photo}
                      alt={worker.name}
                      className="w-full h-full object-cover"
                    />
                    {worker.verified && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-[12px] font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] flex items-center gap-1">
                        <span>✓</span>
                        <span>যাচাইকৃত</span>
                      </div>
                    )}
                    <div
                      className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[12px] font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] ${
                        worker.availability === "এখনই পাওয়া যাচ্ছে"
                          ? "bg-emerald-500 text-white"
                          : "bg-orange-500 text-white"
                      }`}
                    >
                      {worker.availability}
                    </div>
                  </div>

                  <div className="flex-1 p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[20px] md:text-[24px] text-gray-800 mb-2">
                          {worker.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <p className="font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px] text-gray-600">
                            {worker.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-['Inter:SemiBold',_'Noto_Sans_Bengali:SemiBold',_sans-serif] text-[14px] text-gray-800">
                              {worker.rating}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4 text-gray-500" />
                            <span className="font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px] text-gray-600">
                              {worker.completedJobs} কাজ সম্পন্ন
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px] text-gray-600">
                              অভিজ্ঞতা: {worker.experience}
                            </span>
                          </div>
                        </div>
                        <p className="font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px] text-gray-700 mb-3">
                          {worker.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {worker.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[12px] font-['Inter:SemiBold',_'Noto_Sans_Bengali:SemiBold',_sans-serif]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="md:text-right">
                        <div className="bg-emerald-50 rounded-xl p-4 mb-3">
                          <p className="font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[12px] text-gray-600 mb-1">
                            দৈনিক মজুরি
                          </p>
                          <p className="font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[24px] md:text-[28px] text-emerald-600">
                            ৳{worker.dailyRate}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleHireWorker(worker)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[14px] md:text-[16px] transition-all flex items-center justify-center gap-2"
                      >
                        <Briefcase className="w-5 h-5" />
                        <span>নিয়োগ করুন</span>
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all">
                        <Phone className="w-5 h-5" />
                      </button>
                      <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-all">
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center">
              <p className="font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[18px] text-gray-500">
                কোনো শ্রমিক পাওয়া যায়নি
              </p>
              <p className="font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px] text-gray-400 mt-2">
                অন্য ফিল্টার বা অনুসন্ধান চেষ্টা করুন
              </p>
            </div>
          )}
        </div>
      </div>

      {showHireForm && selectedWorker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[20px] md:text-[24px] text-gray-800 mb-4">
              শ্রমিক নিয়োগ করুন
            </h2>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <img
                  src={selectedWorker.photo}
                  alt={selectedWorker.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <p className="font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[16px] text-gray-800">
                    {selectedWorker.name}
                  </p>
                  <p className="font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px] text-gray-600">
                    ৳{selectedWorker.dailyRate}/দিন
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-['Inter:SemiBold',_'Noto_Sans_Bengali:SemiBold',_sans-serif] text-[14px] text-gray-700 mb-2">
                    কাজের বিবরণ
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px]"
                    rows={3}
                    placeholder="কি ধরনের কাজ করতে হবে তা লিখুন..."
                  />
                </div>
                <div>
                  <label className="block font-['Inter:SemiBold',_'Noto_Sans_Bengali:SemiBold',_sans-serif] text-[14px] text-gray-700 mb-2">
                    কাজের তারিখ
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-3 font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px]"
                  />
                </div>
                <div>
                  <label className="block font-['Inter:SemiBold',_'Noto_Sans_Bengali:SemiBold',_sans-serif] text-[14px] text-gray-700 mb-2">
                    দিনের সংখ্যা
                  </label>
                  <input
                    type="number"
                    min="1"
                    defaultValue="1"
                    className="w-full border border-gray-300 rounded-lg p-3 font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px]"
                  />
                </div>
                <div>
                  <label className="block font-['Inter:SemiBold',_'Noto_Sans_Bengali:SemiBold',_sans-serif] text-[14px] text-gray-700 mb-2">
                    কাজের স্থান
                  </label>
                  <input
                    type="text"
                    placeholder="গ্রাম, উপজেলা, জেলা"
                    className="w-full border border-gray-300 rounded-lg p-3 font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px]"
                  />
                </div>
                <div>
                  <label className="block font-['Inter:SemiBold',_'Noto_Sans_Bengali:SemiBold',_sans-serif] text-[14px] text-gray-700 mb-2">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    placeholder="০১৭xxxxxxxx"
                    className="w-full border border-gray-300 rounded-lg p-3 font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowHireForm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-['Inter:SemiBold',_'Noto_Sans_Bengali:SemiBold',_sans-serif] text-[14px] transition-all"
              >
                বাতিল
              </button>
              <button
                onClick={() => {
                  setShowHireForm(false);
                  alert("নিয়োগের অনুরোধ পাঠানো হয়েছে!");
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-['Inter:SemiBold',_'Noto_Sans_Bengali:SemiBold',_sans-serif] text-[14px] transition-all"
              >
                নিয়োগ নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-[rgba(255,255,255,0.95)] backdrop-blur-sm border-t border-emerald-500 shadow-lg z-50"></div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Labor;
