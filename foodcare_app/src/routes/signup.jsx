import { Lock, User as UserIcon, ChevronLeft, Eye, EyeOff, Mail, Phone, ShieldCheck, CheckCircle2 } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (otpCooldown <= 0) return;

    const intervalId = setInterval(() => {
      setOtpCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [otpCooldown]);

  const canResendOtp = otpCooldown === 0;

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (otpCooldown > 0) {
      setErrorMsg(`กรุณารออีก ${otpCooldown} วินาที ก่อนขอรหัส OTP ใหม่`);
      return;
    }

    if (!username.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setErrorMsg("กรุณากรอกข้อมูลให้ครบถ้วนก่อนขอรับรหัส OTP");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setIsLoading(true);

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
      setSuccessMsg(data.message || "ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว");
      setOtp("");
    } catch (err) {
      console.error("Send OTP Error:", err);
      setErrorMsg(err.message || "ไม่สามารถติดต่อเซิร์ฟเวอร์หลังบ้านได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!otp.trim()) {
      setErrorMsg("กรุณากรอก OTP 6 หลักที่ได้รับทางอีเมล");
      return;
    }

    setIsLoading(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans select-none antialiased">
      <div className="relative z-10 w-full max-w-[390px]">
        {/* กรอบหน้าจอมือถือ */}
        <div className="w-full h-[844px] bg-[#f8fafc] rounded-[54px] border-[5px] border-slate-900 shadow-[0_25px_70px_-15px_rgba(15,23,42,0.18)] flex flex-col relative overflow-hidden">
          
          {/* Dynamic Island */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            <div className="w-12 h-1 rounded-full bg-slate-900" />
            <div className="w-2 h-2 rounded-full bg-blue-500/30" />
          </div>

          {/* แถบด้านบน: ปุ่มย้อนกลับ (เอา step1 ออกแล้ว) */}
          <div className="pt-13 px-6 pb-1 flex items-center z-30">
            <button 
              type="button"
              onClick={onSwitchToLogin}
              className="h-10 w-10 rounded-2xl bg-white border border-slate-200/80 text-slate-600 hover:text-indigo-600 shadow-sm active:scale-95 transition-all flex items-center justify-center focus:outline-none cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>

          {/* ส่วนเนื้อหาหลัก */}
          <div className="flex-1 overflow-y-auto px-6 pt-1 pb-6 flex flex-col style-scrollbar relative z-20">
            
            {/* โลโก้และหัวข้อ */}
            <div className="flex flex-col items-center text-center mt-1 mb-4">
              <div className="h-25 w-25 rounded-[24px] bg-white p-2 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.15)] border border-slate-100 ring-4 ring-indigo-50/60 flex items-center justify-center mb-3">
                <img src={logoImg} alt="FoodCare Logo" className="w-full h-full object-contain rounded-[16px]" />
              </div>

              <h1 className="text-[24px] font-black text-slate-800 tracking-tight leading-tight">
                สร้างบัญชีใหม่
              </h1>
              <p className="text-[12px] font-semibold text-slate-400 mt-1">
                เข้าร่วมจัดการตู้เย็นกับ FoodCare
              </p>
            </div>

            {/* กล่องการ์ดสีขาวที่รองรับฟอร์ม */}
            <div className="bg-white rounded-[32px] p-5 border border-slate-200/70 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-3.5">
                {errorMsg && (
                  <div className="p-3 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl text-center leading-relaxed animate-shake">
                    ⚠️ {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-2xl text-center leading-relaxed">
                    🎉 {successMsg}
                  </div>
                )}

                {/* 1. Username */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 px-1">ชื่อผู้ใช้งาน</label>
                  <Field 
                    icon={<UserIcon className="h-4.5 w-4.5" />} 
                    placeholder="กรอก Username ของคุณ" 
                    value={username} 
                    onChange={setUsername} 
                    disabled={otpSent}
                  />
                </div>

                {/* 2. อีเมลสำหรับยืนยันตัวตน (เอาปุ่มส่ง OTP ออกแล้ว เต็มความกว้างสวยงาม) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 px-1">อีเมลสำหรับยืนยันตัวตน</label>
                  <Field 
                    icon={<Mail className="h-4.5 w-4.5" />} 
                    type="email" 
                    placeholder="example@foodcare.app" 
                    value={email} 
                    onChange={setEmail} 
                    disabled={otpSent}
                  />
                </div>

                {/* 3. เบอร์โทรศัพท์ */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 px-1">เบอร์โทรศัพท์</label>
                  <Field 
                    icon={<Phone className="h-4.5 w-4.5" />} 
                    type="tel" 
                    placeholder="08x-xxx-xxxx" 
                    value={phone} 
                    onChange={setPhone} 
                    disabled={otpSent}
                  />
                </div>

                {/* 4. รหัสผ่าน */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 px-1">รหัสผ่านใหม่</label>
                  <Field 
                    icon={<Lock className="h-4.5 w-4.5" />} 
                    type="password" 
                    placeholder="กำหนดรหัสผ่าน (6 ตัวอักษรขึ้นไป)" 
                    value={password} 
                    onChange={setPassword} 
                    isPassword 
                    disabled={otpSent}
                  />
                </div>

                {/* กล่องกรอกรหัส OTP (จะแสดงขึ้นมาเมื่อกดส่ง OTP แล้ว) */}
                {otpSent && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2 mt-2">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[11px] font-black text-indigo-700">รหัสยืนยัน OTP</span>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg("");
                          setSuccessMsg("");
                          setOtp("");
                          setOtpSent(false);
                          setOtpCooldown(0);
                        }}
                        className="text-[10.5px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        แก้ไขข้อมูล
                      </button>
                    </div>
                    <Field 
                      icon={<ShieldCheck className="h-4.5 w-4.5 text-indigo-600" />} 
                      type="text" 
                      placeholder="กรอกรหัส OTP 6 หลัก" 
                      value={otp} 
                      onChange={setOtp} 
                    />
                    <div className="flex justify-between items-center text-[10.5px] px-1 pt-0.5">
                      <span className="text-slate-400">ส่งรหัสไปที่อีเมลของคุณแล้ว</span>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={!canResendOtp}
                        className={`font-bold ${canResendOtp ? "text-indigo-600 hover:underline cursor-pointer" : "text-slate-400 cursor-not-allowed"}`}
                      >
                        {canResendOtp ? "ส่งรหัสใหม่อีกครั้ง" : `ส่งใหม่ได้ใน (${otpCooldown}s)`}
                      </button>
                    </div>
                  </div>
                )}

                {/* ปุ่มหลักด้านล่างปุ่มเดียว ควบคุมตามสถานะ */}
                {otpSent ? (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-black text-sm shadow-[0_8px_20px_-4px_rgba(79,70,229,0.35)] hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus:outline-none mt-4 cursor-pointer disabled:opacity-70"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isLoading ? "กำลังตรวจสอบ..." : "ยืนยันและสร้างบัญชี"}</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12.5 rounded-2xl bg-[#3b5bfd] hover:bg-[#324fdb] active:scale-[0.98] text-white font-black text-sm shadow-[0_8px_20px_-4px_rgba(59,91,253,0.35)] transition-all flex items-center justify-center gap-2 focus:outline-none mt-4 cursor-pointer disabled:opacity-70"
                  >
                    <span>{isLoading ? "กำลังส่งรหัส OTP..." : "ขอรหัส OTP เพื่อลงทะเบียน"}</span>
                  </button>
                )}
              </form>
            </div>

            {/* ส่วนสลับไปหน้าเข้าสู่ระบบ */}
            <div className="mt-auto pt-5 pb-1 text-center">
              <p className="text-xs font-semibold text-slate-400">
                มีบัญชีผู้ใช้งานแล้ว?{" "}
                <button 
                  type="button"
                  onClick={onSwitchToLogin} 
                  className="text-indigo-600 font-black hover:underline ml-1 focus:outline-none cursor-pointer"
                >
                  ลงชื่อเข้าสู่ระบบ
                </button>
              </p>
            </div>

          </div>

          {/* Home Bar Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-300 z-30 pointer-events-none" />
        </div>
      </div>

      <style>{`
        .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 2; }
      `}</style>
    </div>
  );
}

function Field({ icon, type = "text", placeholder, value, onChange, isPassword = false, disabled = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`flex items-center gap-3 px-4 h-12 rounded-2xl border transition-all duration-150 group ${
      disabled 
        ? "bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed" 
        : "bg-slate-50/90 border-slate-200/90 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-600/10"
    }`}>
      <div className={`${disabled ? "text-slate-300" : "text-slate-400 group-focus-within:text-indigo-600"} transition-colors shrink-0`}>
        {icon}
      </div>
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-transparent outline-none text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium disabled:cursor-not-allowed"
      />
      {isPassword && !disabled && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none shrink-0 p-1 cursor-pointer"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

export default Signup;