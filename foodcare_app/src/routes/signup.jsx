import { Lock, User as UserIcon, ChevronLeft, Eye, EyeOff, Mail, Phone, ShieldCheck, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import logoImg from '../assets/logo.jpg'; 

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

async function apiRequest(url, options = {}) {
  const response = await fetch(url, { credentials: "include", ...options });
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Request failed (${response.status})`);
    }
    return data;
  }

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      text && text.trim().startsWith("<")
        ? "เซิร์ฟเวอร์ตอบกลับเป็น HTML แทน JSON กรุณาเปิด backend ที่ 127.0.0.1:8080 ก่อนใช้งาน"
        : text || `Request failed (${response.status})`
    );
  }

  return text ? { raw: text } : {};
}

function Signup({ onSwitchToLogin, onLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (otpCooldown <= 0) return;

    const intervalId = setInterval(() => {
      setOtpCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [otpCooldown]);

  const otpButtonLabel = otpCooldown > 0 ? `ส่งใหม่อีกครั้ง (${otpCooldown}s)` : otpSent ? "ส่งใหม่อีกครั้ง" : "ส่ง OTP";
  const canResendOtp = otpCooldown === 0;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (otpCooldown > 0) {
      setErrorMsg(`กรุณารออีก ${otpCooldown} วินาที ก่อนส่ง OTP ใหม่`);
      return;
    }

    if (!username.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setErrorMsg("กรุณากรอก username, email, phone และ password ให้ครบถ้วน");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    try {
      const data = await apiRequest(`${API_BASE}/api/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password
        })
      });

      setOtpSent(true);
      setOtpCooldown(30);
      setSuccessMsg(data.message || "ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมลและยืนยันในหน้านี้");
      setOtp("");
    } catch (err) {
      console.error("Send OTP Error:", err);
      setErrorMsg(err.message || "ไม่สามารถติดต่อเซิร์ฟเวอร์หลังบ้านได้");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!otp.trim()) {
      setErrorMsg("กรุณากรอก OTP ที่ได้รับ");
      return;
    }

    try {
      const data = await apiRequest(`${API_BASE}/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          otp: otp.trim()
        })
      });

      setSuccessMsg(data.message || "ยืนยัน OTP สำเร็จ! กำลังเข้าสู่ระบบ...");
      if (typeof onLogin === "function" && data.user) {
        onLogin({
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          householdId: data.user.household_id || null
        });
      }
      setTimeout(() => {
        if (typeof onLogin !== "function") {
          onSwitchToLogin();
        }
      }, 1500);
    } catch (err) {
      console.error("Verify OTP Error:", err);
      setErrorMsg(err.message || "ยืนยัน OTP ไม่สำเร็จ");
    }
  };


  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4 font-sans select-none antialiased">
      <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-blue-400/15 to-sky-400/0 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] bg-gradient-to-tr from-emerald-400/10 to-teal-400/0 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-white/80 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          <div className="absolute top-14 left-6 z-30">
            <button 
              type="button"
              onClick={onSwitchToLogin}
              className="p-2.5 rounded-2xl bg-white border border-slate-200/60 text-slate-600 hover:text-indigo-600 shadow-sm hover:shadow active:scale-90 transition-all duration-200 focus:outline-none"
            >
              <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-7 pt-24 pb-10 flex flex-col justify-between h-full style-scrollbar relative z-20">
            <div className="flex flex-col items-center text-center mt-2">
              <div className="relative w-24 h-24 rounded-[26px] bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 p-[2px] shadow-[0_16px_35px_-10px_rgba(59,130,246,0.25)] mb-5 animate-float">
                <div className="w-full h-full bg-white rounded-[24px] overflow-hidden flex items-center justify-center p-1.5">
                  <img src={logoImg} alt="FoodCare Logo" className="w-full h-full object-cover rounded-[19px]" />
                </div>
              </div>

              <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent tracking-tight">
                สร้างบัญชีใหม่
              </h1>
              <p className="text-xs font-bold text-slate-400 mt-2 max-w-[240px] uppercase tracking-wider">
                Join FoodCare Smart Revolution
              </p>
            </div>

            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="mt-6 space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl text-center animate-shake">
                  ⚠️ {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                  🎉 {successMsg}
                </div>
              )}

              <Field icon={<UserIcon className="h-5 w-5" />} placeholder="ชื่อผู้ใช้งาน (Username)" value={username} onChange={setUsername} />

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Field icon={<Mail className="h-5 w-5" />} type="email" placeholder="อีเมล" value={email} onChange={setEmail} />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpSent && !canResendOtp}
                  className={`h-[58px] px-4 rounded-2xl font-black text-[11px] shadow-[0_8px_20px_-8px_rgba(79,70,229,0.7)] whitespace-nowrap transition-all duration-200 ${
                    otpSent
                      ? canResendOtp
                        ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:brightness-105 active:scale-[0.98]"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed opacity-80"
                      : "bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:brightness-105 active:scale-[0.98]"
                  }`}
                >
                  {otpButtonLabel}
                </button>
              </div>

              {otpSent && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-[11px] font-bold text-indigo-700">
                  รหัส OTP ถูกส่งไปยังอีเมลของคุณแล้ว กรุณากรอกเพื่อยืนยันตัวตนก่อนสมัครสมาชิก
                </div>
              )}

              {otpSent && (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Field icon={<ShieldCheck className="h-5 w-5" />} type="text" placeholder="กรอกรหัส OTP 6 หลัก" value={otp} onChange={setOtp} />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg("");
                      setSuccessMsg("");
                      setOtp("");
                      setOtpSent(false);
                      setOtpCooldown(0);
                    }}
                    className="h-[58px] px-3 rounded-2xl border border-slate-200 bg-white text-slate-600 font-bold text-[11px] hover:border-slate-300 transition-all"
                  >
                    แก้ไขข้อมูล
                  </button>
                </div>
              )}

              <Field icon={<Phone className="h-5 w-5" />} type="tel" placeholder="เบอร์โทรศัพท์" value={phone} onChange={setPhone} />
              <Field icon={<Lock className="h-5 w-5" />} type="password" placeholder="กำหนดรหัสผ่านใหม่" value={password} onChange={setPassword} isPassword />

              {otpSent && (
                <button
                  type="submit"
                  className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white font-black text-base shadow-[0_12px_35px_-6px_rgba(37,99,235,0.4)] hover:brightness-105 active:scale-[0.97] transition-all duration-200 focus:outline-none"
                >
                  ลงทะเบียน
                </button>
              )}
            </form>

            <p className="mt-auto pt-8 text-center text-sm font-bold text-slate-400">
              มีบัญชีผู้ใช้งานแล้ว?{" "}
              <span onClick={onSwitchToLogin} className="text-indigo-600 font-extrabold hover:text-indigo-700 transition-colors cursor-pointer hover:underline ml-1">
                ลงชื่อเข้าสู่ระบบ
              </span>
            </p>
          </div>

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/50 z-50 pointer-events-none"></div>
        </div>
      </div>

      <style>{`
        .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-6px) rotate(1deg); } }
        .animate-float { animation: float 4s ease-in-out infinite; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 2; }
      `}</style>
    </div>
  );
}

function Field({ icon, type = "text", placeholder, value, onChange, isPassword = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex items-center gap-3.5 px-4.5 py-4 rounded-2xl bg-slate-100/50 border border-slate-200/50 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all duration-200 group shadow-inner">
      <div className="text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-200">
        {icon}
      </div>
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none text-[14px] font-bold text-slate-700 placeholder:text-slate-400"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

export default Signup;