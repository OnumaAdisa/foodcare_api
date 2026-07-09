import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { useState } from "react";
import logoImg from '../assets/logo.jpg';

function Login({ onLogin, onSwitchToSignup }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (username.trim() === "" || password.trim() === "") {
      setErrorMsg("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // 🌐 ยิงเชื่อมระบบส่งข้อมูลตรวจสอบกับ Node.js หลังบ้านจริง
    fetch("http://127.0.0.1:8080/api/login", {
      method: "POST",
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
        // เมื่อล็อกอินสำเร็จ ส่งข้อมูลผู้ใช้จริงไปเก็บไว้ที่สเตทกลางของ App.jsx
        if (typeof onLogin === "function") {
          onLogin({
            id: data.user.user_id || data.user.id,
            username: data.user.username,
            householdId: data.user.household_id || null
          });
        }
      } else {
        setErrorMsg(data.message || "ชื่อผู้ใช้งาน หรือ รหัสผ่านไม่ถูกต้อง");
      }
    })
    .catch((err) => {
      console.error("Login Error:", err);
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์หลังบ้านได้คราบบบ ❌");
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4 font-sans select-none antialiased">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-blue-400/15 to-sky-400/0 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] bg-gradient-to-tr from-emerald-400/10 to-teal-400/0 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-white/80 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          <div className="flex-1 overflow-y-auto px-7 pt-24 pb-10 flex flex-col justify-between h-full style-scrollbar relative z-20">
            
            <div className="flex flex-col items-center text-center mt-4">
              <div className="relative w-28 h-28 rounded-[32px] bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 p-[2.5px] shadow-[0_20px_40px_-10px_rgba(59,130,246,0.3)] mb-6 animate-float">
                <div className="w-full h-full bg-white rounded-[29px] overflow-hidden flex items-center justify-center p-1.5">
                  <img src={logoImg} alt="FoodCare Logo" className="w-full h-full object-cover rounded-[22px]" />
                </div>
                <div className="absolute inset-0 rounded-[32px] bg-blue-500 blur-xl opacity-20 -z-10 scale-95"></div>
              </div>

              <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent tracking-tight">เข้าสู่ระบบ</h1>
              <p className="text-xs font-bold text-slate-400 mt-2 max-w-[240px] uppercase tracking-wider">
                FoodCare Smart Fridge Management
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl text-center animate-shake">
                  ⚠️ {errorMsg}
                </div>
              )}

              <Field 
                icon={<User className="h-5 w-5" />} 
                type="text" 
                placeholder="ชื่อผู้ใช้งาน (Username)" 
                value={username} 
                onChange={setUsername} 
              />
              
              <Field 
                icon={<Lock className="h-5 w-5" />} 
                type="password" 
                placeholder="รหัสผ่าน" 
                value={password} 
                onChange={setPassword} 
                isPassword
              />

              <div className="text-right px-1">
                <span className="text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer hover:underline">
                  ลืมรหัสผ่าน?
                </span>
              </div>

              <button
                type="submit"
                className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white font-black text-base shadow-[0_12px_35px_-6px_rgba(37,99,235,0.4)] hover:brightness-105 active:scale-[0.97] transition-all duration-200 focus:outline-none"
              >
                เข้าสู่ระบบใช้งาน
              </button>
            </form>

            <p className="mt-auto pt-8 text-center text-sm font-bold text-slate-400">
              ยังไม่มีบัญชีผู้ใช้?{" "}
              <span onClick={onSwitchToSignup} className="text-indigo-600 font-extrabold hover:text-indigo-700 transition-colors cursor-pointer hover:underline ml-1">
                สมัครสมาชิกใหม่
              </span>
            </p>

          </div>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/50 z-50 pointer-events-none"></div>
        </div>
      </div>

      <style>{`
        .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-8px) rotate(1deg); } }
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

export default Login;