import { createFileRoute } from "@tanstack/react-router";
import { Bell, ChefHat, Refrigerator, AlertTriangle, Sparkles, Plus, Search, Leaf, Clock, Star, ChevronRight, User as UserIcon, Users, Settings, Award, Shield, HelpCircle, Trash2, LogOut, ShoppingBasket, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { FoodRow } from "../components/foodcare/FoodRow";
import { recipes } from "../components/foodcare/data";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

// 🟢 นำเข้า initial items จาก QuickAddPage เพื่อนับจำนวนวัตถุดิบที่ใช้ประจำ
const QUICK_ITEMS_DEFAULT_COUNT = 6; // ตรงกับจำนวน initial array ใน QuickAddPage

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "FoodCare — ตู้เย็นอัจฉริยะ ลดขยะอาหาร" },
      { name: "description", content: "FoodCare แอปจัดการตู้เย็น แจ้งเตือนวันหมดอายุ และแนะนำเมนูเพื่อลดขยะอาหาร" },
    ],
  }),
});

function Dashboard({ currentTab, onNavigate, onLogout, user }) {
  const [dbItems, setDbItems] = useState([]);
  const [greeting, setGreeting] = useState("สวัสดี");
  const [isLoading, setIsLoading] = useState(true);
  const [matchedRecipeCount, setMatchedRecipeCount] = useState(0);

  const activeTab = currentTab || "home";
  const setActiveTab = onNavigate || (() => {});

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("สวัสดีตอนเช้า ✨");
    else if (hour < 17) setGreeting("สวัสดีตอนบ่าย 🔥");
    else setGreeting("สวัสดีตอนเย็น 🌙");
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/api/fridge`, { credentials: "include" })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          const myHouseholdId = user?.householdId || 0;
          const myItems = resData.data.filter(item => item.household_id === myHouseholdId);
          setDbItems(myItems);

          const matched = recipes.filter((recipe) =>
            recipe.requiredIngredients?.some((req) =>
              myItems.some(
                (fItem) =>
                  fItem.item_name?.toLowerCase().includes(req.name.toLowerCase()) ||
                  fItem.category === req.category
              )
            )
          );
          setMatchedRecipeCount(matched.length);
        }
      })
      .catch((err) => console.error("Error fetching fridge:", err))
      .finally(() => setIsLoading(false));
  }, [user]);

  const totalItems = dbItems.length;

  const expiringItems = dbItems.filter(item => {
    if (!item.expiry_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(item.expiry_date);
    expiry.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diff <= 3;
  });
  const expiringCount = expiringItems.length;

  const freshnessRate = totalItems > 0
    ? Math.round(dbItems.reduce((acc, curr) => acc + (curr.remaining_percent || 100), 0) / totalItems)
    : 100;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4 font-sans select-none antialiased">

      <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-br from-blue-400/15 to-sky-400/0 rounded-full blur-[140px] animate-pulse"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[600px] h-[600px] bg-gradient-to-tr from-emerald-400/10 to-teal-400/0 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }}></div>

      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-slate-50/70 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">

          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-950"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          {/* TAB 1: หน้าหลัก */}
          {activeTab === "home" && (
            <div className="flex flex-col h-full animate-tabFade">
              <header className="px-6 pt-14 pb-4 flex items-center justify-between z-30 relative bg-white/40 backdrop-blur-md border-b border-slate-200/30">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 p-[2.5px] shadow-lg shadow-blue-500/20">
                    <div className="w-full h-full bg-white rounded-[14px] grid place-items-center text-blue-600">
                      <Refrigerator className="h-5 w-5 text-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{greeting}</p>
                    <h1 className="text-base font-black text-slate-800 leading-tight tracking-tight flex items-center gap-1">
                      คุณ{user?.username || "ผู้ใช้งาน"} 🌟
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></span>
                    </h1>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("alerts")}
                  className="relative h-10 w-10 rounded-xl bg-white border border-slate-200/60 shadow-sm grid place-items-center text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all duration-200 active:scale-95 focus:outline-none"
                >
                  <Bell className="h-4.5 w-4.5 text-slate-700" />
                  {expiringCount > 0 && <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
                </button>
              </header>

              <div className="flex-1 px-5 space-y-6 pt-4 pb-28 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50">

                {/* Hero Card */}
                <div className="relative overflow-hidden rounded-[36px] p-6 text-white border border-white/20 shadow-[0_20px_40px_-15px_rgba(30,58,138,0.25)]" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a8a 100%)" }}>
                  <div className="absolute right-[-40px] top-[-40px] h-52 w-52 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 opacity-40 blur-3xl pointer-events-none animate-pulse" />
                  <div className="absolute left-[-20px] bottom-[-40px] h-40 w-40 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 opacity-30 blur-2xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-md text-cyan-300">
                      <Sparkles className="h-3 w-3 animate-spin-slow" /> AI วิเคราะห์คลัง
                    </span>
                    <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight">
                      ตู้เย็นของคุณ<br />สดใหม่ระดับ <span className="text-cyan-300 font-extrabold text-3xl">{freshnessRate}%</span>
                    </h2>
                    <p className="mt-1.5 text-xs font-semibold text-slate-300/90">
                      {totalItems > 0
                        ? `มี ${expiringCount} รายการที่ควรทำเมนูก่อนหมดอายุ`
                        : "ตู้เย็นว่างเปล่า ลองเพิ่มวัตถุดิบเข้ามาได้เลยครับ"}
                    </p>
                    <div className="mt-6">
                      <div className="h-3 rounded-full bg-slate-950/40 p-[2.5px] overflow-hidden backdrop-blur-sm border border-white/5 shadow-inner">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]" style={{ width: `${freshnessRate}%` }} />
                      </div>
                      <div className="mt-4 flex items-center gap-2.5 text-xs font-bold text-emerald-300 bg-emerald-500/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-emerald-400/20 shadow-sm">
                        <div onClick={() => setActiveTab("alerts")} className="flex items-center gap-2.5 cursor-pointer">
                          <Leaf className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>เดือนนี้ช่วยลดขยะอาหารสะสมไป <span className="text-white text-sm font-black mx-0.5 underline decoration-emerald-400">{totalItems > 0 ? "2.4" : "0"}</span> กิโลกรัม</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search & Add */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-3 px-4 h-13 rounded-2xl bg-white border border-slate-200/50 shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all duration-200 group">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input placeholder="ค้นหาวัตถุดิบ หรือเมนูแนะนำ..." className="flex-1 bg-transparent outline-none text-[13.5px] font-bold text-slate-700 placeholder:text-slate-400" />
                  </div>
                  <button type="button" onClick={() => setActiveTab("add")} className="h-13 w-13 rounded-2xl grid place-items-center text-white shadow-lg shadow-indigo-500/30 bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-400 focus:outline-none active:scale-90 duration-150">
                    <Plus className="h-5 w-5 stroke-[3]" />
                  </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-3.5">
                  <StatCard icon={Refrigerator} value={totalItems} label="วัตถุดิบทั้งหมด" grad="from-blue-600 to-cyan-500" shadow="shadow-blue-500/20" onClick={() => setActiveTab("fridge")} />
                  <StatCard icon={AlertTriangle} value={expiringCount} label="ใกล้หมดอายุ" grad="from-rose-600 to-orange-500" shadow="shadow-rose-500/20" onClick={() => setActiveTab("alerts")} />
                  <StatCard icon={ChefHat} value={matchedRecipeCount} label="เมนูแนะนำวันนี้" grad="from-emerald-600 to-teal-500" shadow="shadow-emerald-500/20" onClick={() => setActiveTab("recipes")} />
                  <StatCard icon={Star} value={QUICK_ITEMS_DEFAULT_COUNT} label="วัตถุดิบที่ใช้ประจำ" grad="from-purple-600 to-pink-500" shadow="shadow-purple-500/20" onClick={() => setActiveTab("quick-add")} />
                </div>

                {/* วัตถุดิบใกล้หมดอายุ */}
                <div className="space-y-3.5">
                  <Section title="วัตถุดิบใกล้หมดอายุ" actionLabel="จัดการทั้งหมด" onClick={() => setActiveTab("alerts")} />
                  {isLoading ? (
                    <div className="p-6 text-center text-xs font-bold text-slate-400">กำลังเปิดตู้เย็นหาข้อมูล... 🧊</div>
                  ) : totalItems === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 bg-white/50 rounded-3xl text-center">
                      <Refrigerator className="h-8 w-8 text-slate-300 mx-auto mb-2.5" />
                      <p className="text-xs font-extrabold text-slate-600">ตู้เย็นของคุณยังไม่มีวัตถุดิบอาหาร</p>
                      <p className="text-[11px] font-semibold text-slate-400 mt-1">กดปุ่ม + ด้านบนเพื่อเริ่มเพิ่มชิ้นแรกเลยครับ</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {dbItems.slice(0, 3).map((it) => (
                        <div key={it.item_id} className="bg-white rounded-2xl border border-slate-100">
                          <FoodRow
                            item={{
                              id: it.item_id,
                              name: it.item_name,
                              quantity: it.quantity,
                              remaining_percent: it.remaining_percent,
                              category: it.category,
                              expiry_date: it.expiry_date
                            }}
                            onNavigate={setActiveTab}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* เมนูสร้างสรรค์ */}
                <div className="space-y-3.5">
                  <Section title="เมนูสร้างสรรค์อัจฉริยะ" actionLabel="ดูเพิ่ม" onClick={() => setActiveTab("recipes")} />
                  <div className="flex gap-4 overflow-x-auto -mx-5 px-5 pb-3 snap-x hide-scrollbar">
                    {totalItems === 0 ? (
                      <div className="w-full text-center p-4 text-[11px] font-bold text-slate-400 bg-slate-100/40 rounded-2xl">
                        🍳 เพิ่มวัตถุดิบในตู้เย็นก่อน เพื่อให้ AI แกะสูตรเมนูแนะนำครับ
                      </div>
                    ) : matchedRecipeCount === 0 ? (
                      <div className="w-full text-center p-4 text-[11px] font-bold text-slate-400 bg-slate-100/40 rounded-2xl">
                        🍳 ยังไม่มีเมนูที่แมตช์วัตถุดิบในตู้เย็นของคุณ ลองเพิ่มวัตถุดิบเพิ่มขึ้นครับ
                      </div>
                    ) : (
                      recipes
                        .filter((recipe) =>
                          recipe.requiredIngredients?.some((req) =>
                            dbItems.some(
                              (fItem) =>
                                fItem.item_name?.toLowerCase().includes(req.name.toLowerCase()) ||
                                fItem.category === req.category
                            )
                          )
                        )
                        .map((r) => (
                          <div key={r.id} onClick={() => setActiveTab("recipes")} className="snap-start min-w-[215px] max-w-[215px] rounded-[28px] overflow-hidden border border-slate-200/60 shadow-sm bg-white block active:scale-[0.97] hover:shadow-md transition-all duration-200 group cursor-pointer">
                            <div className={`h-26 bg-gradient-to-br ${r.tone} relative overflow-hidden`}>
                              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                              <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-[9px] font-black text-white tracking-widest uppercase">แมตช์วัตถุดิบของคุณ</div>
                              <ChefHat className="absolute right-4 bottom-3 h-8 w-8 text-white/30 group-hover:scale-110 group-hover:text-white/60 transition-all duration-300" />
                            </div>
                            <div className="p-4">
                              <p className="font-extrabold text-sm text-slate-800 leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">{r.title}</p>
                              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                                <Clock className="h-3 w-3 text-slate-300" /> {r.time} · <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-[10px] font-black">{r.level}</span>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Shopping List shortcut */}
                <div onClick={() => setActiveTab("shopping")} className="block rounded-3xl p-4.5 border border-slate-200/50 bg-gradient-to-r from-white via-white to-slate-50/50 shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200 group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-11 w-11 rounded-xl grid place-items-center text-white shrink-0 shadow-lg shadow-teal-500/20 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-400">
                        <ShoppingBasket className="h-4.5 w-4.5 stroke-[2.5]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-slate-800">รายการซื้อของเข้าบ้าน</p>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5 truncate max-w-[210px]">คัดกรองอัตโนมัติเมื่อของหมดตู้</p>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center shadow-sm group-hover:bg-white group-hover:translate-x-0.5 transition-all">
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 stroke-[2.5]" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: โปรไฟล์ */}
          {activeTab === "profile" && (
            <div className="flex flex-col h-full animate-tabFade">
              <header className="px-6 pt-14 pb-4 flex items-center justify-between z-30 relative bg-white/40 backdrop-blur-md border-b border-slate-200/30">
                <h1 className="text-lg font-black text-slate-800 tracking-tight">โปรไฟล์ของฉัน</h1>
                <button type="button" className="h-10 w-10 rounded-xl bg-white border border-slate-200/60 shadow-sm grid place-items-center text-slate-600 focus:outline-none active:scale-95 duration-150">
                  <Settings className="h-4.5 w-4.5 text-slate-700" />
                </button>
              </header>

              <div className="flex-1 px-5 space-y-5 pt-4 pb-28 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50">
                <div className="relative overflow-hidden rounded-[32px] p-5 text-white border border-white/20 shadow-[0_20px_40px_-15px_rgba(30,58,138,0.25)]" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a8a 100%)" }}>
                  <div className="absolute right-[-20px] bottom-[-40px] h-44 w-44 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 opacity-30 blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-400/30 via-white/20 to-blue-500/30 backdrop-blur-md border border-white/20 grid place-items-center text-2xl font-black text-white shadow-inner animate-float">
                      {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="text-xl font-black tracking-tight">คุณ{user?.username || "ผู้ใช้งาน"}</p>
                      <p className="text-xs font-medium text-slate-300/90 truncate mt-0.5">{user?.username || "user"}@foodcare.app</p>
                      <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/20 shadow-sm">
                        <Award className="h-3 w-3" /> นักลดขยะระดับ Gold
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <MetricCard value={totalItems > 0 ? "2.4" : "0"} unit="kg" label="ลดขยะสะสม" grad="from-emerald-500 to-teal-400" color="text-emerald-600" />
                  <MetricCard value={matchedRecipeCount} unit="เมนู" label="แนะนำวันนี้" grad="from-indigo-600 to-blue-500" color="text-indigo-600" />
                  <MetricCard value={totalItems} unit="ชิ้น" label="วัตถุดิบทั้งหมด" grad="from-purple-600 to-pink-500" color="text-purple-600" />
                </div>

                <div className="rounded-3xl p-4.5 border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 backdrop-blur-sm shadow-sm relative overflow-hidden">
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl grid place-items-center text-white shrink-0 shadow-md shadow-emerald-500/10 bg-gradient-to-br from-emerald-500 to-teal-500">
                      <Leaf className="h-5 w-5 stroke-[2.5]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-extrabold text-sm text-emerald-950">ผลกระทบของคุณต่อโลก</p>
                      <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">
                        คุณช่วยลด CO₂ ไปได้ <span className="font-black text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded-md">{totalItems > 0 ? "5.8" : "0"} กก.</span> เทียบเท่ากับการปลูกต้นไม้ใหญ่จำนวน {totalItems > 0 ? "2" : "0"} ต้น
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">การจัดการบัญชี</h3>
                    <div className="rounded-[28px] border border-slate-100 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
                      <div onClick={() => setActiveTab("household")} className="w-full cursor-pointer">
                        <ProfileMenuRow icon={Users} label="จัดการครอบครัว (Hybrid Fridge)" iconGrad="from-blue-600 to-cyan-500" />
                      </div>
                      <ProfileMenuRow icon={Bell} label="ตั้งค่าการแจ้งเตือนวันหมดอายุ" iconGrad="from-amber-500 to-orange-500" />
                      <ProfileMenuRow icon={Sparkles} label="ความชอบอาหารและภูมิแพ้" iconGrad="from-purple-600 to-pink-500" />
                      <ProfileMenuRow icon={Shield} label="ความปลอดภัยและความเป็นส่วนตัว" iconGrad="from-indigo-600 to-blue-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">การสนับสนุนระบบ</h3>
                    <div className="rounded-[28px] border border-slate-100 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
                      <ProfileMenuRow icon={HelpCircle} label="ศูนย์ช่วยเหลือและติดต่อทีมงาน" iconGrad="from-slate-600 to-slate-400" />
                      <ProfileMenuRow icon={Trash2} label="ล้างข้อมูลระบบตู้เย็นทั้งหมด" iconGrad="from-rose-600 to-red-500" danger />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-600 font-bold text-sm shadow-sm active:scale-[0.98] transition-all duration-150 focus:outline-none"
                >
                  <LogOut className="h-4 w-4 stroke-[2.5]" /> ออกจากระบบผู้ใช้งาน
                </button>
              </div>
            </div>
          )}

          {/* Bottom Nav */}
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
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        @keyframes tabFade { from { opacity: 0; transform: scale(0.99); } to { opacity: 1; transform: scale(1); } }
        .animate-tabFade { animation: tabFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-center gap-0.5 flex-1 py-1.5 transition-all duration-300 focus:outline-none ${active ? "text-indigo-600 scale-105" : "text-slate-400 hover:text-slate-600"}`}
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

function StatCard({ icon: Icon, value, label, grad, shadow, onClick }) {
  return (
    <div onClick={onClick} className="rounded-[24px] bg-white border border-slate-100 p-4 shadow-sm block hover:shadow-md active:scale-[0.95] transition-all duration-200 group cursor-pointer relative overflow-hidden border-b-[3px]">
      <div className={`absolute -right-4 -bottom-4 h-16 w-16 bg-gradient-to-br ${grad} opacity-5 rounded-full`} />
      <div className={`h-9 w-9 rounded-xl grid place-items-center text-white bg-gradient-to-tr ${grad} shadow-md ${shadow}`}>
        <Icon className="h-4.5 w-4.5 stroke-[2.5]" />
      </div>
      <p className="mt-4 text-2xl font-black text-slate-800 tracking-tight leading-none">{value}</p>
      <p className="text-[10.5px] font-bold text-slate-400 mt-1.5 truncate tracking-wide">{label}</p>
    </div>
  );
}

function MetricCard({ value, unit, label, grad }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-3 text-center shadow-sm relative overflow-hidden border-b-[3px]">
      <div className={`absolute -right-4 -bottom-4 h-12 w-12 bg-gradient-to-br ${grad} opacity-5 rounded-full`} />
      <p className="text-xl font-black text-slate-800 tracking-tight leading-none">
        {value}
        <span className="text-[10px] text-slate-400 font-bold ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] font-bold text-slate-400 mt-2 truncate tracking-wide">{label}</p>
    </div>
  );
}

function ProfileMenuRow({ icon: Icon, label, danger, iconGrad }) {
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

function Section({ title, actionLabel, onClick }) {
  return (
    <div className="flex items-center justify-between pt-1 px-0.5">
      <h3 className="text-[14.5px] font-black text-slate-800 tracking-tight">{title}</h3>
      <button type="button" onClick={onClick} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5 transition-all focus:outline-none">
        {actionLabel} <ChevronRight className="h-3 w-3 stroke-[3]" />
      </button>
    </div>
  );
}

export default Dashboard;