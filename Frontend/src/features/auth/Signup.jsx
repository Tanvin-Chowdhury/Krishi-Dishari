import { useContext, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import { FaUser } from "react-icons/fa";
import { toast } from "react-toastify";
import VideoBackground from "../Background/VideoBackground";
import Logo from "../Logo/Logo";
import { useNavigate } from "react-router";
import { AuthContext } from "../../Provider/AuthContext";
import api from "../../services/api";
import { fileToDataUrl } from "../../shared/lib/fileToDataUrl";

const roleOptions = [
  { value: "1", label: "কৃষক" },
  { value: "2", label: "ক্রেতা" },
  { value: "3", label: "বিশেষজ্ঞ" },
  { value: "4", label: "শ্রমিক" },
];

const genderOptions = ["পুরুষ", "মহিলা", "অন্যান্য"];

const Signup = () => {
  const navigate = useNavigate();
  const { loginUser } = useContext(AuthContext);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [gender, setGender] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("শুধু ছবির ফাইল নির্বাচন করুন");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ছবি ২ MB এর কম হতে হবে");
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const full_name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const role_id = form.role_id.value;
    const genderValue = gender;

    if (password.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }

    if (password.length > 20) {
      setError("পাসওয়ার্ড ২০ অক্ষরের বেশি হতে পারবে না");
      return;
    }

    if (!gender) {
      setError("অনুগ্রহ করে একটি লিঙ্গ নির্বাচন করুন");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      let photo_data = null;
      if (photoFile) {
        photo_data = await fileToDataUrl(photoFile);
      }

      const data = await api.signup({
        full_name,
        email,
        password,
        role_id,
        gender: genderValue,
        photo_data,
      });

      loginUser(data.user, data.token);

      toast.success("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!");
      form.reset();
      navigate("/auth/login");
    } catch (err) {
      setError(err.message || "Server error");
      toast.error(err.message || "Server error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePasswordShow = () => {
    setShowPassword((current) => !current);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-slate-900">
      <VideoBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />

      <div className="relative z-10 w-full max-w-[450px] mx-4 my-8">
        <div
          className="bg-[rgba(233,240,236,0.9)] rounded-[20px] p-8 md:p-10"
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderRadius: "16px",
            boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "2rem",
          }}
        >
          <div className="flex flex-col items-center mb-6">
            <Logo variant="light" size="lg" className="mb-5" />
            <h2 className="text-2xl font-bold text-white">
              নতুন একাউন্ট তৈরি করুন
            </h2>
            <p className="text-sm text-white">
              আপনার কৃষি জীবনের নতুন যাত্রা শুরু করুন
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="text-white text-sm" htmlFor="role_id">
                আপনি কে?
              </label>
              <select
                id="role_id"
                name="role_id"
                className="w-full mt-2 pl-4 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg outline-none focus:border-emerald-400 focus:bg-white/25 focus:ring-2 focus:ring-emerald-400/30 transition-all font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px] text-white"
                required
              >
                <option className="text-slate-900" value="">
                  -- নির্বাচন করুন --
                </option>
                {roleOptions.map((role) => (
                  <option
                    className="text-slate-900"
                    key={role.value}
                    value={role.value}
                  >
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[13px] text-white/90 block"
                htmlFor="name"
              >
                নাম
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <FaUser className="w-5 h-5 text-white/60 group-focus-within:text-emerald-400 transition-colors" />
                </div>
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg outline-none focus:border-emerald-400 focus:bg-white/25 focus:ring-2 focus:ring-emerald-400/30 transition-all font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px] text-white placeholder:text-white/50"
                  placeholder="আপনার পূর্ণ নাম লিখুন"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[13px] text-white/90 block"
                htmlFor="email"
              >
                ইমেইল বা ফোন নম্বর
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Mail className="w-5 h-5 text-white/60 group-focus-within:text-emerald-400 transition-colors" />
                </div>
                <input
                  id="email"
                  type="text"
                  name="email"
                  className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg outline-none focus:border-emerald-400 focus:bg-white/25 focus:ring-2 focus:ring-emerald-400/30 transition-all font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px] text-white placeholder:text-white/50"
                  placeholder="আপনার ইমেইল অথবা ফোন নম্বর লিখুন"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[13px] text-white/90 block"
                htmlFor="password"
              >
                পাসওয়ার্ড
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Lock className="w-5 h-5 text-white/60 group-focus-within:text-emerald-400 transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="w-full pl-12 pr-12 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg outline-none focus:border-emerald-400 focus:bg-white/25 focus:ring-2 focus:ring-emerald-400/30 transition-all font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px] text-white placeholder:text-white/50"
                  placeholder="একটি শক্তিশালী পাসওয়ার্ড লিখুন"
                  required
                />
                <button
                  type="button"
                  onClick={handleTogglePasswordShow}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-white/90">লিঙ্গ</p>
              <div className="flex flex-wrap gap-4 w-full pl-5 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[14px] text-white">
                {genderOptions.map((item) => (
                  <label key={item} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value={item}
                      checked={gender === item}
                      onChange={(event) => setGender(event.target.value)}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-white/90">ছবি আপলোড করুন</p>
              <label className="border-2 border-dashed border-emerald-500 rounded-lg p-4 flex flex-col items-center cursor-pointer bg-white/10">
                <input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />

                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-emerald-300" />
                    <span className="text-sm text-emerald-100">
                      ছবি নির্বাচন করুন
                    </span>
                  </>
                )}
              </label>
            </div>

            {error && (
              <p className="rounded-lg border border-red-300/40 bg-red-500/20 px-3 py-2 text-sm text-red-50">
                {error}
              </p>
            )}

            <div className="flex justify-between items-center pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3.5 rounded-lg font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[16px] shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? "অপেক্ষা করুন..." : "প্রবেশ করুন "}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span
                  className="px-3 font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[13px] text-white/70"
                  style={{ background: "rgba(255, 255, 255, 0.15)" }}
                >
                  অথবা
                </span>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/auth/login")}
                className="group inline-flex items-center gap-2 font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[15px] text-white/90 hover:text-white transition-all"
              >
                <span>অ্যাকাউন্ট আছে?</span>
                <span className="font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-emerald-300 group-hover:text-emerald-200 group-hover:underline">
                  লগইন করুন
                </span>
                <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
