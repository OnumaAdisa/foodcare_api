import { createFileRoute } from "@tanstack/react-router";
import { Plus, Filter, Refrigerator, ShieldAlert, CheckCircle, Flame, ChefHat, User as UserIcon, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { FoodRow } from "../components/foodcare/FoodRow";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

const cats = ["ทั้งหมด", "meat", "vegetable", "fruit", "dairy"];

const getCatLabel = (cat) => {
  if (cat === "ทั้งหมด") return "ทั้งหมด";
  if (cat === "meat") return "เนื้อสัตว์";
  if (cat === "vegetable") return "ผัก";
  if (cat === "fruit") return "ผลไม้";
  if (cat === "dairy") return "ผลิตภัณฑ์นม";
  return cat;
};

export const Route = createFileRoute("/fridge")({
  component: Fridge,
  head: () => ({ meta: [{ title: "ตู้เย็นของฉัน — FoodCare" }] }),
});

function Fridge({ currentTab, onNavigate, user }) {
  const [items, setItems] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("ทั้งหมด");
  const activeTab = currentTab || "fridge";
  const setActiveTab = onNavigate || (() => {});

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/fridge`, { credentials: "include" })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          // 🟢 ดึงข้อมูลตู้เย็นตามบ้าน หรือตาม ID ของผู้ใช้โดยตรง
          const myHouseholdId = user?.householdId || user?.household_id || user?.id;
          
          const rawItems = resData.data.filter(item => Number(item.household_id) === Number(myHouseholdId));
          
          const mappedItems = rawItems.map((item) => {
            const expDate = new Date(item.expiry_date);
            const today = new Date();
            const diffTime = expDate - today;
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
              id: item.item_id || item.id,                 
              name: item.item_name || item.name,           
              qty: item.quantity,                          
              category: item.category || "other",                     
              remaining_percent: item.remaining_percent ?? 100,
              percent: item.remaining_percent ?? 100,           
              expiry_date: item.expiry_date || null,
              daysLeft: daysLeft > 0 ? daysLeft : 0             
            };
          });

          setItems(mappedItems);
        }
      })
      .catch((err) => console.error("Error fetching fridge list:", err))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = active === "ทั้งหมด" ? items : items.filter((i) => i.category === active);

  const freshCount = items.filter((i) => i.remaining_percent > 60).length;
  const warningCount = items.filter((i) => i.remaining_percent <= 60 && i.remaining_percent > 30).length;
  const dangerCount = items.filter((i) => i.remaining_percent <= 30).length;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4 font-sans select-none antialiased">
      
      <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-br from-blue-400/15 to-sky-400/0 rounded-full blur-[140px] animate-pulse"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[600px] h-[600px] bg-gradient-to-tr from-emerald-400/10 to-teal-400/0 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }}></div>

      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-slate-50/70 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          <header className="px-6 pt-14 pb-4 flex items-center justify-between z-30 relative bg-white/40 backdrop-blur-md border-b border-slate-200/30">
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <Refrigerator className="h-5 w-5 text-indigo-500" /> ตู้เย็นของฉัน
              </h1>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                {loading ? "กำลังค้นตู้เย็น..." : `${items.length} รายการ · แตะเพื่อบันทึกการใช้`}
              </p>
            </div>
            <button type="button" className="h-10 w-10 rounded-xl bg-white border border-slate-200/60 shadow-sm grid place-items-center text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all duration-200 active:scale-95 focus:outline-none">
              <Filter className="h-4.5 w-4.5 text-slate-700" />
            </button>
          </header>

          <div className="flex-1 px-5 space-y-5 pt-4 pb-28 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50 relative">
            
            <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-2 hide-scrollbar">
              {cats.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActive(c)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-extrabold border transition-all duration-200 focus:outline-none ${
                    active === c
                      ? "bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20 border-transparent scale-105"
                      : "bg-white/80 text-slate-500 border-slate-200/60 hover:bg-white hover:text-slate-800"
                  }`}
                >
                  {getCatLabel(c)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <Stat label="ยังสดใหม่" value={loading ? "0" : freshCount} icon={CheckCircle} grad="from-emerald-500/10 to-teal-50/30" border="border-emerald-100" color="text-emerald-600" />
              <Stat label="ใกล้หมดอายุ" value={loading ? "0" : warningCount} icon={Flame} grad="from-amber-500/10 to-orange-50/30" border="border-amber-100" color="text-amber-600" />
              <Stat label="ต้องกินด่วน" value={loading ? "0" : dangerCount} icon={ShieldAlert} grad="from-rose-500/10 to-red-50/30" border="border-rose-100" color="text-rose-600" />
            </div>

            <div className="space-y-2.5">
              {loading ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 text-xs font-bold text-slate-400">
                  🧊 เปิดระบบเชื่อมระบบหลังบ้าน...
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((it) => (
                  <div key={it.id} className="bg-white rounded-2xl border border-slate-100/80 shadow-sm block transition-all hover:shadow-md">
                    <FoodRow 
                      item={it} 
                      onNavigate={(tab, id) => setActiveTab(tab, id)} 
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-6">
                  <Refrigerator className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-extrabold text-slate-400">ตู้เย็นในหมวดนี้ยังว่างเปล่าครับ</p>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("add")} 
            className="absolute bottom-26 right-5 h-14 w-14 rounded-full grid place-items-center text-white shadow-[0_8px_25px_rgba(79,70,229,0.4)] hover:brightness-110 active:scale-90 transition-all duration-150 z-50 border border-white/20 focus:outline-none"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" }}
          >
            <Plus className="h-6 w-6 stroke-[3]" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 h-18 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl px-4 flex items-center justify-between z-40 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
            <NavItem icon={Home} label="หน้าหลัก" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
            <NavItem icon={Refrigerator} label="ตู้เย็น" active={activeTab === "fridge"} onClick={() => setActiveTab("fridge")} />
            <NavItem icon={ChefHat} label="เมนูแนะนำ" active={activeTab === "recipes"} onClick={() => setActiveTab("recipes")} />
            <NavItem icon={UserIcon} label="โปรไฟล์" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
          </div>

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/60 z-50 pointer-events-none"></div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { width: 0px; height: 0px; background: transparent; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        @keyframes tabFade { from { opacity: 0; transform: scale(0.99); } to { opacity: 1; transform: scale(1); } }
        .animate-tabFade { animation: tabFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>
    </div>
  );
}

function Stat({ label, value, icon: Icon, grad, border, color }) {
  return (
    <div className={`rounded-2xl p-3 border ${border} bg-gradient-to-br ${grad} relative overflow-hidden text-center shadow-sm`}>
      <div className="flex items-center justify-between mb-1">
        <Icon className={`h-4.5 w-4.5 ${color} opacity-80`} />
      </div>
      <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{value}</p>
      <p className="text-[10px] font-black text-slate-400 mt-2 truncate tracking-wide uppercase">{label}</p>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button 
      type="button"
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

export default Fridge;