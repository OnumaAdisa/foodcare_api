import { createFileRoute } from "@tanstack/react-router";
import { ChefHat, Refrigerator, Search, Clock, Sparkles, ChevronRight, User as UserIcon, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { recipes as staticRecipes } from "../components/foodcare/data";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

export const Route = createFileRoute("/recipes")({
  component: Recipes,
  head: () => ({ meta: [{ title: "เมนูสร้างสรรค์อัจฉริยะ — FoodCare" }] }),
});

function Recipes({ currentTab, onNavigate, onSelectRecipe, user }) {
  const [active, setActive] = useState("แนะนำ");
  const [fridgeItems, setFridgeItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeTab = currentTab || "recipes";
  const setActiveTab = onNavigate || (() => {});
  const filterCats = ["แนะนำ", "ใช้วัตถุดิบใกล้หมด", "อาหารเช้า", "เพื่อสุขภาพ"];

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/fridge`, { credentials: "include" })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          const myHouseholdId = user?.householdId || 0;
          const myItems = resData.data.filter(item => item.household_id === myHouseholdId);
          setFridgeItems(myItems);
        }
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [user]);

  // ✅ คำนวณวันที่เหลือของแต่ละ item
  const getDaysLeft = (expiryDate) => {
    if (!expiryDate) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  // ✅ แมตช์เมนูกับวัตถุดิบในตู้ — จากทั้งชื่อและหมวดหมู่
  const getMatchedRecipes = () => {
    if (fridgeItems.length === 0) return [];

    return staticRecipes.map((recipe) => {
      const matched = recipe.requiredIngredients.filter((req) =>
        fridgeItems.some((fItem) =>
          fItem.item_name?.toLowerCase().includes(req.name.toLowerCase()) ||
          fItem.category === req.category
        )
      );

      // หา item ที่ใช้ในสูตรนี้และใกล้หมดอายุที่สุด
      const soonestExpiry = recipe.requiredIngredients.reduce((min, req) => {
        const match = fridgeItems.find((fItem) =>
          fItem.item_name?.toLowerCase().includes(req.name.toLowerCase()) ||
          fItem.category === req.category
        );
        if (!match) return min;
        const days = getDaysLeft(match.expiry_date);
        return days < min ? days : min;
      }, 999);

      const matchPercent = Math.round((matched.length / recipe.requiredIngredients.length) * 100);

      return {
        ...recipe,
        matchedCount: matched.length,
        totalRequired: recipe.requiredIngredients.length,
        matchPercent,
        soonestExpiry,
        // แมตช์ขั้นต่ำ 1 อย่างขึ้นไปถึงแสดง
        isRelevant: matched.length >= 1
      };
    })
    .filter((r) => r.isRelevant)
    // ✅ เรียงจากวัตถุดิบใกล้หมดอายุก่อน แล้วตามด้วย % แมตช์
    .sort((a, b) => {
      if (a.soonestExpiry !== b.soonestExpiry) return a.soonestExpiry - b.soonestExpiry;
      return b.matchPercent - a.matchPercent;
    });
  };

  const matchedRecipes = getMatchedRecipes();
  const hasItems = fridgeItems.length > 0;

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

          <header className="px-6 pt-14 pb-4 flex flex-col gap-3.5 z-30 relative bg-white/40 backdrop-blur-md border-b border-slate-200/30">
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <ChefHat className="h-5 w-5 text-indigo-500" /> เมนูสร้างสรรค์อัจฉริยะ
              </h1>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                {user?.username ? `ตู้เย็นของคุณ ${user.username}` : "ใช้วัตถุดิบที่คุณมี ลดขยะอาหารเพื่อโลก"}
              </p>
            </div>
            <div className="flex items-center gap-3 px-4 h-11 rounded-xl bg-white border border-slate-200/50 shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all duration-200 group">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input placeholder="ค้นหาสูตรอาหาร หรือวัตถุดิบ..." className="flex-1 bg-transparent outline-none text-xs font-bold text-slate-700 placeholder:text-slate-400" />
            </div>
          </header>

          <div className="flex-1 px-5 space-y-5 pt-4 pb-28 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50 relative">

            <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-2 hide-scrollbar">
              {filterCats.map((c) => (
                <button key={c} type="button" onClick={() => setActive(c)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-extrabold border transition-all duration-200 focus:outline-none ${
                    active === c
                      ? "bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white shadow-md border-transparent scale-105"
                      : "bg-white/80 text-slate-500 border-slate-200/60 hover:bg-white hover:text-slate-800"
                  }`}
                >{c}</button>
              ))}
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 p-3.5 flex items-center gap-3 shadow-inner">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white grid place-items-center shadow-md">
                <Sparkles className="h-4 w-4 fill-white text-yellow-300 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">แมตช์จากวัตถุดิบในตู้เย็นคุณจริงๆ</p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 leading-tight">เรียงจากวัตถุดิบใกล้หมดอายุก่อน เพื่อลดขยะอาหาร</p>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-12 text-xs font-bold text-slate-400">กำลังประมวลผลเมนูอาหาร... 🍳</div>
              ) : !hasItems ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-6">
                  <ChefHat className="h-8 w-8 text-slate-300 mx-auto mb-2.5" />
                  <p className="text-xs font-extrabold text-slate-600">ไม่สามารถคำนวณเมนูแนะนำได้</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1 leading-relaxed">กรุณาเพิ่มวัตถุดิบเข้าตู้เย็นก่อนนะคราบบบ</p>
                </div>
              ) : matchedRecipes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-6">
                  <ChefHat className="h-8 w-8 text-slate-300 mx-auto mb-2.5" />
                  <p className="text-xs font-extrabold text-slate-600">ยังไม่มีเมนูที่แมตช์</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1 leading-relaxed">ลองเพิ่มวัตถุดิบหลากหลายขึ้นเพื่อให้ระบบแนะนำเมนูได้มากขึ้นครับ</p>
                </div>
              ) : (
                matchedRecipes.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => { if (typeof onSelectRecipe === "function") onSelectRecipe(r.id); }}
                    className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200 flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${r.tone} shrink-0 overflow-hidden relative shadow-inner grid place-items-center`}>
                        <ChefHat className="h-6 w-6 text-white/40" />
                        {/* ✅ badge วัตถุดิบใกล้หมดอายุ */}
                        {r.soonestExpiry <= 3 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-rose-500/80 text-white text-[8px] font-black text-center py-0.5">
                            ⚡ ใช้ด่วน
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* ✅ แสดง % แมตช์จริง */}
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[9px] font-black text-emerald-600 border border-emerald-100">
                            มี {r.matchedCount}/{r.totalRequired} อย่าง ({r.matchPercent}%)
                          </span>
                          <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md">{r.level}</span>
                        </div>
                        <p className="font-black text-sm text-slate-800 mt-1.5 truncate group-hover:text-indigo-600 transition-colors">{r.title}</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {r.time}
                        </p>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors shadow-sm">
                      <ChevronRight className="h-4 w-4 stroke-[2.5]" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

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

export default Recipes;