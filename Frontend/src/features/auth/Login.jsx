import { useContext, useEffect, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router";
import VideoBackground from "../Background/VideoBackground";
import Logo from "../Logo/Logo";
import { AuthContext } from "../../Provider/AuthContext";
import api from "../../services/api";

const Login = () => {
  const { loginUser } = useContext(AuthContext);
  const [showLoginCard, setShowLoginCard] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setShowLoginCard(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const loginInput = form.loginInput.value.trim();
    const password = form.password.value;

    try {
      const data = await api.login(loginInput, password);

      if (!data.success) {
        throw new Error(data.message || "ইমেইল/ফোন বা পাসওয়ার্ড সঠিক নয়");
      }

      loginUser(data.user, data.token);

      toast.success("কৃষি-দিশারিতে আপনাকে স্বাগতম!");

      const redirectPath = location.state?.from?.pathname || "/app/home";
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePasswordShow = () => {
    setShowPassword((current) => !current);
  };

  const handleForgotPassword = () => {
    const email = emailRef.current?.value;

    if (!email) {
      toast.warning("ইমেইল বা ফোন নম্বর বা পাসওয়ার্ড দিন");
      return;
    }

    setError(
      "পাসওয়ার্ড রিসেট করার জন্য আপনার ইমেইল বা ফোন নম্বরটি প্রদান করুন",
    );
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-slate-900">
      <VideoBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />

      <div
        className={`relative z-10 w-full max-w-[450px] mx-4 transition-all duration-1000 ${
          showLoginCard
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div
          className="relative"
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
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="text-center mb-5">
              <h2 className="font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[30px] text-white mb-1">
                লগইন করুন
              </h2>
              <p className="font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[13px] text-white/80">
                আপনার অ্যাকাউন্টে প্রবেশ করুন
              </p>
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
                  id="loginInput"
                  type="text"
                  name="loginInput"
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
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
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

            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[13px] text-white/80 hover:text-white hover:underline transition-all"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>

            {error && (
              <p className="rounded-lg border border-red-300/40 bg-red-500/20 px-3 py-2 text-sm text-red-50">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3.5 rounded-lg font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-[16px] shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <span>প্রবেশ করুন</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

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
                onClick={() => navigate("/auth/signup")}
                className="group inline-flex items-center gap-2 font-['Inter:Regular',_'Noto_Sans_Bengali:Regular',_sans-serif] text-[15px] text-white/90 hover:text-white transition-all"
              >
                <span>অ্যাকাউন্ট নেই?</span>
                <span className="font-['Inter:Bold',_'Noto_Sans_Bengali:Bold',_sans-serif] text-emerald-300 group-hover:text-emerald-200 group-hover:underline">
                  নিবন্ধন করুন
                </span>
                <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {!showLoginCard && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-50">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-white font-medium animate-pulse">লোড হচ্ছে...</p>
        </div>
      )}
    </div>
  );
};

export default Login;
