import { createFileRoute } from "@tanstack/react-router";
import { Award, Bell, ChevronRight, HelpCircle, Leaf, LogOut, Settings, Shield, Sparkles, Trash2, Users, Refrigerator, ChefHat, User as UserIcon, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { MobileShell } from "../components/foodcare/MobileShell";

export const Route = createFileRoute("/profile")({
  component: Profile,
  head: () => ({ meta: [{ title: "โปรไฟล์ — FoodCare" }] }),
});

// 🌟 ปรับเพิ่มการรับ Prop จาก App.jsx เพื่อสลับหน้าจอ (currentTab, setActiveTab) และสั่ง Logout
function Profile({ currentTab, onNavigate, onLogout }) {
  // ใช้ค่า activeTab ร่วมกับระบบจัดการหลักของแอปเพื่อให้แท็บบาร์สลับหน้าได้จริง
  const activeTab = currentTab || "profile"; 
  const setActiveTab = onNavigate || (() => {});

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4 font-sans select-none antialiased">
      
      {/* Background Decorative Light Blobs */}
      <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-blue-400/15 to-sky-400/0 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] bg-gradient-to-tr from-emerald-400/10 to-teal-400/0 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full max-w-[390px]">
        {/* Phone Frame - High-End Luxury Premium */}
        <div className="w-full h-[844px] bg-slate-50/70 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">
          
          {/* Dynamic Island Simulation */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          {/* App Header (Glassmorphic Top) */}
          <header className="px-6 pt-14 pb-4 flex items-center justify-between z-30 relative bg-white/40 backdrop-blur-md border-b border-slate-200/30 sticky top-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-800 tracking-tight">โปรไฟล์ของฉัน</h1>
            </div>
            <button className="h-10 w-10 rounded-xl bg-white border border-slate-200/60 shadow-sm grid place-items-center text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all duration-200 active:scale-95 focus:outline-none">
              <Settings className="h-4.5 w-4.5 text-slate-700" />
            </button>
          </header>

          {/* Scrollable Content Area */}
          <div className="flex-1 px-5 space-y-5 pt-4 pb-28 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50">
            
            {/* User Premium ID Card */}
            <div className="relative overflow-hidden rounded-[32px] p-5 text-white border border-white/20 shadow-[0_20px_40px_-15px_rgba(30,58,138,0.25)]" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a8a 100%)" }}>
              <div className="absolute right-[-20px] bottom-[-40px] h-44 w-44 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 opacity-30 blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex items-center gap-4">
                {/* 🌟 เปลี่ยนตัวอักษรย่อ Avatar ตรงนี้เป็น "อ" ให้ตรงกับชื่อคุณอรอุมา */}
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-400/30 via-white/20 to-blue-500/30 backdrop-blur-md border border-white/20 grid place-items-center text-2xl font-black text-white shadow-inner animate-float">
                  อ
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-black tracking-tight">คุณอรอุมา</p>
                  <p className="text-xs font-medium text-slate-300/90 truncate mt-0.5">onuma@foodcare.app</p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/20 shadow-sm">
                    <Award className="h-3 w-3" /> นักลดขยะระดับ Gold
                  </div>
                </div>
              </div>
            </div>

            {/* Core Metrics Bento Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <Metric value="2.4" unit="kg" label="ลดขยะสะสม" grad="from-emerald-500 to-teal-400 text-emerald-600 bg-emerald-50" />
              <Metric value="48" unit="จาน" label="เมนูที่ทำแล้ว" grad="from-indigo-600 to-blue-500 text-indigo-600 bg-indigo-50" />
              <Metric value="184" unit="ชิ้น" label="วัตถุดิบทั้งหมด" grad="from-purple-600 to-pink-500 text-purple-600 bg-purple-50" />
            </div>

            {/* Eco Impact Glass Card */}
            <div className="rounded-3xl p-4.5 border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 backdrop-blur-sm shadow-sm relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl grid place-items-center text-white shrink-0 shadow-md shadow-emerald-500/10 bg-gradient-to-br from-emerald-500 to-teal-500">
                  <Leaf className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div className="flex-1">
                  <p className="font-extrabold text-sm text-emerald-950">ผลกระทบของคุณต่อโลก</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">
                    คุณช่วยลด CO₂ ไปได้ <span className="font-black text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded-md">5.8 กก.</span> เทียบเท่ากับการปลูกต้นไม้ใหญ่จำนวน 2 ต้น
                  </p>
                </div>
              </div>
            </div>

            {/* Accounts Group Section */}
            <Section title="การจัดการบัญชี">
              <Row icon={Users} label="จัดการครอบครัว (Hybrid Fridge)" iconGrad="from-blue-600 to-cyan-500" />
              <Row icon={Bell} label="ตั้งค่าการแจ้งเตือนวันหมดอายุ" iconGrad="from-amber-500 to-orange-500" />
              <Row icon={Sparkles} label="ความชอบอาหารและภูมิแพ้" iconGrad="from-purple-600 to-pink-500" />
              <Row icon={Shield} label="ความปลอดภัยและความเป็นส่วนตัว" iconGrad="from-indigo-600 to-blue-500" />
            </Section>

            {/* System Support Section */}
            <Section title="การสนับสนุนระบบ">
              <Row icon={HelpCircle} label="ศูนย์ช่วยเหลือและติดต่อทีมงาน" iconGrad="from-slate-600 to-slate-400" />
              <Row icon={Trash2} label="ล้างข้อมูลระบบตู้เย็นทั้งหมด" iconGrad="from-rose-600 to-red-500" danger />
            </Section>

            {/* 🔒 ผูกคำสั่ง onClick={onLogout} เข้ากับปุ่มออกจากระบบเพื่อให้เด้งกลับหน้าล็อกอินได้จริง */}
            <button 
              type="button"
              onClick={onLogout}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-600 font-bold text-sm shadow-sm active:scale-[0.98] transition-all duration-150 focus:outline-none"
            >
              <LogOut className="h-4 w-4 stroke-[2.5]" /> ออกจากระบบผู้ใช้งาน
            </button>

            {/* Footer Build Version Info */}
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">FoodCare App v1.0 • Smart Eco Tech</p>
          </div>

          {/* 📱 🟢 แท็บบาร์ข้างล่าง (Bottom Navigation Bar) - Premium Floating Glassmorphic */}
          <div className="absolute bottom-4 left-4 right-4 h-18 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl px-4 flex items-center justify-between z-40 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
            <NavItem icon={Refrigerator} label="หน้าหลัก" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <NavItem icon={ShoppingCart} label="ตู้เย็น" active={activeTab === 'fridge'} onClick={() => setActiveTab('fridge')} />
            <NavItem icon={ChefHat} label="เมนูแนะนำ" active={activeTab === 'recipes'} onClick={() => setActiveTab('recipes')} />
            <NavItem icon={UserIcon} label="โปรไฟล์" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          </div>

          {/* iPhone Home Indicator bar */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/60 z-50 pointer-events-none"></div>

        </div>
      </div>

      {/* Tailwind & Animation Injection */}
      <style>{`
        .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// Components ย่อยเคลียร์ปัญหา Type Annotations เรียบร้อย

function Metric({ value, unit, label, grad }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-3 text-center shadow-sm relative overflow-hidden group border-b-[3px]">
      <div className={`absolute -right-4 -bottom-4 h-12 w-12 bg-gradient-to-br ${grad.split(' ')[0]} ${grad.split(' ')[1]} opacity-5 rounded-full`} />
      <p className="text-xl font-black text-slate-800 tracking-tight leading-none">
        {value}
        <span className="text-[10px] text-slate-400 font-bold ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] font-bold text-slate-400 mt-2 truncate tracking-wide">{label}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">{title}</h3>
      <div className="rounded-[28px] border border-slate-100 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function Row({ icon: Icon, label, danger, iconGrad }) {
  return (
    <button className="w-full text-left bg-transparent hover:bg-slate-50/50 active:bg-slate-100/50 transition-all duration-150 focus:outline-none group">
      <div className="flex items-center gap-3.5 p-3.5">
        <div className={`h-9 w-9 rounded-xl grid place-items-center text-white shadow-md bg-gradient-to-tr ${iconGrad} ${danger ? "shadow-rose-500/20" : "shadow-slate-400/10"}`}>
          <Icon className="h-4.5 w-4.5 stroke-[2.5]" />
        </div>
        <p className={`flex-1 text-[13.5px] font-bold ${danger ? "text-rose-600" : "text-slate-700 group-hover:text-slate-900 transition-colors"}`}>{label}</p>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 flex-1 py-1.5 transition-all duration-300 focus:outline-none ${
        active ? "text-indigo-600 scale-105" : "text-slate-400 hover:text-slate-600"
      }`}
    >
      <div className={`p-2 rounded-xl transition-all duration-300 ${active ? "bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/30" : "bg-transparent"}`}>
        <Icon className={`h-4.5 w-4.5 transition-transform ${active ? "stroke-[2.5]" : "stroke-[2]"}`} />
      </div>
      <span className={`text-[9.5px] font-black tracking-tight mt-0.5 transition-all ${active ? "text-indigo-600 opacity-100" : "text-slate-400 opacity-80"}`}>
        {label}
      </span>
    </button>
  );
}

export default Profile;