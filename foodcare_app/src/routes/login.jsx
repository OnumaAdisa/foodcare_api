import { 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ArrowRight, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  ChevronLeft, 
  RefreshCw,
  Mail
} from "lucide-react";
import { useState, useEffect } from "react";
import logoImg from '../assets/logo.jpg';

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

function Login({ onLogin, onSwitchToSignup }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 🔑 State สำหรับระบบลืมรหัสผ่าน (Forgot Password Modal)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState("request"); // 'request' | 'verify' | 'success'
  const [forgotInput, setForgotInput] = useState(""); // Username หรือ Email
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState("");
  const [forgotCooldown, setForgotCooldown] = useState(0);

  // นับเวลาถอยหลังการส่ง OTP ใหม่
  useEffect(() => {
    if (forgotCooldown <= 0) return;
    const timer = setInterval(() => {
      setForgotCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [forgotCooldown]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim() || !password.trim()) {
      setErrorMsg("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setIsLoading(true);

    fetch(`${API_BASE}/api/login`, {
      method: "POST",
      credentials: "include",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        username: username.trim(), 
        password: password 
      }) 
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        if (typeof onLogin === "function") {
          onLogin({
            id: data.user.user_id || data.user.id,
            user_id: data.user.user_id || data.user.id,
            username: data.user.username,
            email: data.user.email || "",
            phone: data.user.phone || "",
            householdId: data.user.household_id || null,
            household_id: data.user.household_id || null
          });
        }
      } else {
        setErrorMsg(data.message || "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
      }
    })
    .catch((err) => {
      console.error("Login Error:", err);
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ในขณะนี้");
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  // ขอรหัส OTP สำหรับรีเซ็ตรหัสผ่าน
  const handleSendForgotOtp = async (e) => {
    if (e) e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotInput.trim()) {
      setForgotError("กรุณากรอกชื่อผู้ใช้งาน หรือ อีเมลของคุณ");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername: forgotInput.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "เกิดข้อผิดพลาดในการส่งรหัส OTP");
      }

      setForgotMaskedEmail(data.maskedEmail || forgotInput);
      setForgotSuccess(data.message || "ส่งรหัส OTP เรียบร้อยแล้ว");
      setForgotStep("verify");
      setForgotCooldown(60);
      setForgotOtp("");
    } catch (err) {
      console.error("Forgot OTP Error:", err);
      setForgotError(err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setForgotLoading(false);
    }
  };

  // ยืนยัน OTP และบันทึกรหัสผ่านใหม่
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotOtp.trim()) {
      setForgotError("กรุณากรอกรหัส OTP 6 หลัก");
      return;
    }
    if (!newPassword.trim()) {
      setForgotError("กรุณากรอกรหัสผ่านใหม่");
      return;
    }
    if (newPassword.length < 6) {
      setForgotError("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError("รหัสผ่านยืนยันไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername: forgotInput.trim(),
          otp: forgotOtp.trim(),
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      }

      setForgotStep("success");
      // เติมชื่อผู้ใช้ลงในช่องล็อกอินให้อัตโนมัติ
      if (forgotInput.trim() && !forgotInput.includes("@")) {
        setUsername(forgotInput.trim());
      }
    } catch (err) {
      console.error("Reset Password Error:", err);
      setForgotError(err.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotError("");
    setForgotSuccess("");
    setForgotStep("request");
    setForgotOtp("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans select-none antialiased">

      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-[#f8fafc] rounded-[54px] border-[5px] border-slate-900 shadow-[0_30px_90px_-20px_rgba(15,23,42,0.35)] flex flex-col relative overflow-hidden">
          
          {/* Dynamic Island */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/30"></div>
          </div>

          {/* ส่วนภาพ Header ด้านบน (ความสูงคงที่ 230px ให้สัดส่วนภาพเด่นพอดี) */}
          <div className="relative h-[230px] w-full shrink-0 overflow-hidden bg-slate-900">
            <img 
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80" 
              alt="Fresh Food Header" 
              className="w-full h-full object-cover brightness-[0.88] contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/35 pointer-events-none" />
          </div>

          {/* การ์ดฟอร์มหลัก: ปรับระยะให้เนื้อหาชิดขึ้นมาด้านบนอย่างเป็นธรรมชาติ */}
          <div className="flex-1 -mt-9 bg-white rounded-t-[38px] px-7 pt-0 pb-7 flex flex-col z-20 shadow-[0_-15px_35px_rgba(0,0,0,0.08)] relative">
            
            {/* โลโก้ขนาดใหญ่โดดเด่น คั่นกึ่งกลางขอบการ์ด */}
            <div className="flex justify-center -translate-y-1/2 -mb-9">
              <div className="h-27 w-27 rounded-[30px] bg-white p-2.5 shadow-[0_14px_30px_-6px_rgba(15,23,42,0.22)] border-[3px] border-white flex items-center justify-center ring-1 ring-slate-100">
                <img src={logoImg} alt="FoodCare Logo" className="w-full h-full object-contain rounded-[20px]" />
              </div>
            </div>

            {/* ส่วนหัวข้อ: จัดระยะชิดต่อจากโลโก้ทันที */}
            <div className="text-center pt-3 pb-4">
              <h1 className="text-[24px] font-black text-slate-800 tracking-tight leading-tight">
                เข้าสู่ระบบ
              </h1>
              <p className="text-[12px] font-semibold text-slate-400 mt-1">
                จัดการของในตู้เย็น ลดขยะอาหารเพื่อโลก
              </p>
            </div>

            {/* ฟอร์มกรอกข้อมูล: ยกขึ้นมาต่อจากหัวข้ออย่างกระชับ */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {errorMsg && (
                <div className="p-2.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 px-1">ชื่อผู้ใช้งาน</label>
                  <Field 
                    icon={<User className="h-4.5 w-4.5" />} 
                    type="text" 
                    placeholder="กรอก Username ของคุณ" 
                    value={username} 
                    onChange={setUsername} 
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 px-1">รหัสผ่าน</label>
                  <Field 
                    icon={<Lock className="h-4.5 w-4.5" />} 
                    type="password" 
                    placeholder="กรอกรหัสผ่าน" 
                    value={password} 
                    onChange={setPassword} 
                    isPassword
                  />
                </div>
              </div>

              <div className="flex justify-end pr-1 pt-0.5">
                <button 
                  type="button" 
                  onClick={() => {
                    setForgotError("");
                    setForgotSuccess("");
                    setForgotStep("request");
                    setForgotInput(username.trim());
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none cursor-pointer"
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-black text-sm shadow-[0_8px_20px_-4px_rgba(79,70,229,0.35)] hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus:outline-none disabled:opacity-70 mt-3 cursor-pointer"
              >
                <span>{isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบใช้งาน"}</span>
                {!isLoading && <ArrowRight className="h-4 w-4 stroke-[2.5]" />}
              </button>
            </form>

            {/* ส่วนสลับไปหน้าสมัครสมาชิก: วางไว้ด้านล่างสุดด้วย mt-auto */}
            <div className="mt-auto pt-6 text-center">
              <p className="text-xs font-bold text-slate-400">
                ยังไม่มีบัญชีผู้ใช้งาน?{" "}
                <button 
                  type="button"
                  onClick={onSwitchToSignup} 
                  className="text-indigo-600 font-black hover:underline ml-1 focus:outline-none cursor-pointer"
                >
                  สมัครสมาชิกใหม่
                </button>
              </p>
            </div>

          </div>

          {/* ======================================================== */}
          {/* 🌟 MODAL ระบบลืมรหัสผ่าน (FORGOT PASSWORD MODAL) */}
          {/* ======================================================== */}
          {showForgotModal && (
            <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col p-6 animate-tabFade overflow-y-auto style-scrollbar">
              
              {/* Header ของ Modal */}
              <div className="flex items-center justify-between pt-6 pb-2">
                <div className="flex items-center gap-2">
                  {forgotStep === "verify" && (
                    <button
                      type="button"
                      onClick={() => setForgotStep("request")}
                      className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  <div className="h-9 w-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <KeyRound className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800">
                      {forgotStep === "success" ? "สำเร็จแล้ว" : "รีเซ็ตรหัสผ่าน"}
                    </h2>
                    <p className="text-[10.5px] font-semibold text-slate-400">
                      {forgotStep === "request" && "ขั้นตอนที่ 1: ขอรับรหัส OTP"}
                      {forgotStep === "verify" && "ขั้นตอนที่ 2: ตั้งรหัสผ่านใหม่"}
                      {forgotStep === "success" && "เปลี่ยนรหัสผ่านเรียบร้อย"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                </button>
              </div>

              {/* ข้อความแจ้งเตือน Error / Success */}
              {forgotError && (
                <div className="mt-3 p-3 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl animate-tabFade">
                  ⚠️ {forgotError}
                </div>
              )}
              {forgotSuccess && forgotStep !== "success" && (
                <div className="mt-3 p-3 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl animate-tabFade">
                  ✓ {forgotSuccess}
                </div>
              )}

              {/* STEP 1: กรอกชื่อผู้ใช้ / อีเมล เพื่อขอรับ OTP */}
              {forgotStep === "request" && (
                <form onSubmit={handleSendForgotOtp} className="mt-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                      <p className="font-extrabold text-slate-800">ระบุชื่อผู้ใช้งาน หรือ อีเมลของคุณ</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        ระบบจะค้นหาบัญชีและส่งรหัส OTP 6 หลักไปยังอีเมลที่ผูกไว้กับบัญชีของคุณเพื่อยืนยันตัวตน
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1 px-1">
                        ชื่อผู้ใช้งาน (Username) หรือ อีเมล
                      </label>
                      <Field
                        icon={<User className="h-4.5 w-4.5" />}
                        type="text"
                        placeholder="เช่น on1 หรือ your@gmail.com"
                        value={forgotInput}
                        onChange={setForgotInput}
                      />
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-black text-sm shadow-[0_8px_20px_-4px_rgba(79,70,229,0.35)] hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus:outline-none disabled:opacity-70 cursor-pointer"
                    >
                      {forgotLoading ? (
                        <span>กำลังตรวจสอบและส่ง OTP...</span>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          <span>ขอรับรหัส OTP ทางอีเมล</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={closeForgotModal}
                      className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      ยกเลิก และกลับไปหน้าเข้าสู่ระบบ
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: กรอก OTP และกำหนดรหัสผ่านใหม่ */}
              {forgotStep === "verify" && (
                <form onSubmit={handleResetPassword} className="mt-4 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">ส่งรหัสไปยัง</p>
                        <p className="text-xs font-extrabold text-slate-800 truncate">{forgotMaskedEmail}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForgotStep("request")}
                        className="text-[11px] font-bold text-indigo-600 hover:underline shrink-0 cursor-pointer"
                      >
                        เปลี่ยน
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1 px-1">
                        <label className="text-[11px] font-bold text-slate-500">รหัส OTP 6 หลัก</label>
                        <button
                          type="button"
                          onClick={handleSendForgotOtp}
                          disabled={forgotCooldown > 0 || forgotLoading}
                          className="text-[10.5px] font-bold text-indigo-600 disabled:text-slate-400 hover:underline flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <RefreshCw className={`h-3 w-3 ${forgotCooldown > 0 ? "animate-spin" : ""}`} />
                          {forgotCooldown > 0 ? `ขอใหม่ใน (${forgotCooldown}s)` : "ส่งรหัสใหม่"}
                        </button>
                      </div>
                      <div className="flex items-center gap-3 px-4 h-12 rounded-2xl bg-slate-50/90 border border-slate-200/90 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-600/10 transition-all duration-150">
                        <ShieldCheck className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="กรอกตัวเลข 6 หลัก"
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full bg-transparent outline-none text-center font-mono font-black text-sm tracking-[0.3em] text-slate-800 placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal placeholder:font-medium placeholder:text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1 px-1">รหัสผ่านใหม่</label>
                      <Field
                        icon={<Lock className="h-4.5 w-4.5" />}
                        type="password"
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        value={newPassword}
                        onChange={setNewPassword}
                        isPassword
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1 px-1">ยืนยันรหัสผ่านใหม่อีกครั้ง</label>
                      <Field
                        icon={<Lock className="h-4.5 w-4.5" />}
                        type="password"
                        placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        isPassword
                      />
                    </div>
                  </div>

                  <div className="pt-3 space-y-2">
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-black text-sm shadow-[0_8px_20px_-4px_rgba(16,185,129,0.35)] hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus:outline-none disabled:opacity-70 cursor-pointer"
                    >
                      {forgotLoading ? "กำลังบันทึกรหัสผ่านใหม่..." : "ยืนยันและเปลี่ยนรหัสผ่าน"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setForgotStep("request")}
                      className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      ย้อนกลับ
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: แจ้งเตือนเมื่อเปลี่ยนรหัสผ่านสำเร็จ */}
              {forgotStep === "success" && (
                <div className="mt-8 flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-tabFade">
                  <div className="h-20 w-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 shadow-md">
                    <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
                  </div>

                  <div className="space-y-1.5 px-4">
                    <h3 className="text-lg font-black text-slate-800">เปลี่ยนรหัสผ่านสำเร็จแล้ว!</h3>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                      รหัสผ่านบัญชีของคุณได้รับการอัปเดตเรียบร้อยแล้ว ตอนนี้คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
                    </p>
                  </div>

                  <div className="w-full pt-6">
                    <button
                      type="button"
                      onClick={closeForgotModal}
                      className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-black text-sm shadow-[0_8px_20px_-4px_rgba(79,70,229,0.35)] hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
                    >
                      <span>ไปที่หน้าเข้าสู่ระบบ</span>
                      <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Home Bar Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-300 z-30 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, type = "text", placeholder, value, onChange, isPassword = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex items-center gap-3 px-4 h-12 rounded-2xl bg-slate-50/90 border border-slate-200/90 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-600/10 transition-all duration-150 group">
      <div className="text-slate-400 group-focus-within:text-indigo-600 transition-colors shrink-0">
        {icon}
      </div>
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium"
      />
      {isPassword && (
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

export default Login;