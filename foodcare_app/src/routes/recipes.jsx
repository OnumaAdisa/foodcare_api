import { createFileRoute } from "@tanstack/react-router";
import { ChefHat, Refrigerator, Clock, Sparkles, ChevronRight, User as UserIcon, Home, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { recipes as staticRecipes } from "../components/foodcare/data";
import { getRecipeImage } from "../components/foodcare/recipeImages";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

export const Route = createFileRoute("/recipes")({
  component: Recipes,
  head: () => ({ meta: [{ title: "เมนูสร้างสรรค์อัจฉริยะ — FoodCare" }] }),
});

function Recipes({ currentTab, onNavigate, onSelectRecipe, user }) {
  const [active, setActive] = useState("แนะนำ");
  const [fridgeItems, setFridgeItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiRecipes, setAiRecipes] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const activeTab = currentTab || "recipes";
  const setActiveTab = onNavigate || (() => {});
  const filterCats = ["🌟 แนะนำ", "✨ AI Chef", "⚡ ของใกล้หมด", "⏱️ ทำง่ายสุด"];

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/fridge`, { credentials: "include" })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setFridgeItems(resData.data || []);
        }
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));

    const savedAiRecipes = sessionStorage.getItem('foodcare_ai_recipes');
    if (savedAiRecipes) setAiRecipes(JSON.parse(savedAiRecipes));
  }, [user]);

  const getDaysLeft = (expiryDate) => {
    if (!expiryDate) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const generateAiRecipe = async () => {
    if (fridgeItems.length === 0) {
      alert("ตู้เย็นว่างเปล่า เพิ่มวัตถุดิบก่อนให้เชฟ AI คิดเมนูนะครับ!");
      return;
    }

    setIsAiThinking(true);
    setActive("✨ AI Chef");
    const ingredientNames = fridgeItems.map(item => item.item_name);

    try {
      const response = await fetch(`${API_BASE}/api/recipes/suggest`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientNames })
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("เซิร์ฟเวอร์หลังบ้านยังไม่ได้เปิดหรือยังไม่ได้รีสตาร์ต (กรุณารัน node server.js ใหม่)");
      }
      
      if (data.success && Array.isArray(data.recipes) && data.recipes.length > 0) {
        setAiRecipes(data.recipes);
        sessionStorage.setItem('foodcare_ai_recipes', JSON.stringify(data.recipes));
      } else {
        alert(data.message || "เซิร์ฟเวอร์ AI มีปัญหา กรุณาลองใหม่อีกครั้งครับ");
      }
    } catch (err) {
      console.error("AI Chef error:", err);
      alert(err.message || "ติดต่อ AI Chef ไม่สำเร็จ");
    } finally {
      setIsAiThinking(false);
    }
  };

  const getMatchedRecipes = () => {
    if (active === "✨ AI Chef") return aiRecipes;
    if (fridgeItems.length === 0) return [];

    let processedRecipes = staticRecipes.map((recipe) => {
      const required = recipe.requiredIngredients || recipe.ingredients || [];
      const matched = required.filter((req) =>
        fridgeItems.some((fItem) =>
          fItem.item_name?.toLowerCase().includes(req.name.toLowerCase()) ||
          req.name.toLowerCase().includes(fItem.item_name?.toLowerCase())
        )
      );

      const soonestExpiry = required.reduce((min, req) => {
        const match = fridgeItems.find((fItem) =>
          fItem.item_name?.toLowerCase().includes(req.name.toLowerCase()) ||
          req.name.toLowerCase().includes(fItem.item_name?.toLowerCase())
        );
        if (!match) return min;
        const days = getDaysLeft(match.expiry_date);
        return days < min ? days : min;
      }, 999);

      const matchPercent = required.length ? Math.round((matched.length / required.length) * 100) : 0;

      return {
        ...recipe,
        matchedCount: matched.length,
        totalRequired: required.length,
        matchPercent,
        soonestExpiry,
        isRelevant: matched.length >= 1
      };
    }).filter((r) => r.isRelevant);

    if (active === "⚡ ของใกล้หมด") {
      processedRecipes = processedRecipes.filter(r => r.soonestExpiry <= 3);
    } else if (active === "⏱️ ทำง่ายสุด") {
      processedRecipes = processedRecipes.filter(r => r.level === "ง่าย" || r.level === "ง่ายมาก");
    }

    return processedRecipes.sort((a, b) => {
      if (a.soonestExpiry !== b.soonestExpiry) return a.soonestExpiry - b.soonestExpiry;
      return b.matchPercent - a.matchPercent;
    });
  };

  const matchedRecipes = getMatchedRecipes();
  const hasItems = fridgeItems.length > 0;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans select-none antialiased">
      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-slate-50/70 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">

          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          <header className="px-5 pt-13 pb-3 flex flex-col gap-2.5 z-30 relative bg-white/40 backdrop-blur-md border-b border-slate-200/30">
            <div>
              <h1 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <ChefHat className="h-5 w-5 text-indigo-500" /> เมนูสร้างสรรค์อัจฉริยะ
              </h1>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                {user?.username ? `ตู้เย็นของคุณ ${user.username}` : "ใช้วัตถุดิบที่คุณมี ลดขยะอาหารเพื่อโลก"}
              </p>
            </div>
            
            <button 
              onClick={generateAiRecipe}
              disabled={isAiThinking || !hasItems}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-black text-xs shadow-md shadow-indigo-500/20 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isAiThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-yellow-300" />}
              {isAiThinking ? "เชฟ AI กำลังคิดเมนู..." : "ให้ AI ช่วยคิดเมนูจากของในตู้เย็น"}
            </button>
          </header>

          <div className="flex-1 px-4.5 space-y-3.5 pt-3.5 pb-32 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50 relative">

            <div className="flex gap-2 overflow-x-auto -mx-4.5 px-4.5 pb-1 hide-scrollbar">
              {filterCats.map((c) => {
                const isSelected = active === c || (c === "🌟 แนะนำ" && active === "แนะนำ");
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActive(c)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all duration-150 focus:outline-none ${
                      isSelected
                        ? "bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white shadow-sm shadow-indigo-500/25 border-transparent"
                        : "bg-white/80 text-slate-500 border-slate-200/70 hover:bg-white hover:text-slate-800"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2.5">
              {loading ? (
                <div className="text-center py-10 text-xs font-bold text-slate-400">กำลังประมวลผลเมนูอาหาร... 🍳</div>
              ) : !hasItems ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 p-6">
                  <ChefHat className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-extrabold text-slate-600">ตู้เย็นคุณว่างเปล่า</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1 leading-relaxed">เพิ่มวัตถุดิบเข้าตู้เย็นก่อนให้ AI ช่วยคิดเมนูนะครับ</p>
                </div>
              ) : matchedRecipes.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 p-6">
                  <ChefHat className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-extrabold text-slate-600">ยังไม่มีเมนูที่แมตช์</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1 leading-relaxed">เปลี่ยนตัวกรองด้านบน หรือกด "ให้ AI ช่วยคิดเมนู" เลยครับ!</p>
                </div>
              ) : (
                matchedRecipes.map((r) => {
                  const foodImg = getRecipeImage(r.title, r.image);

                  return (
                    <div
                      key={r.id}
                      onClick={() => { if (typeof onSelectRecipe === "function") onSelectRecipe(r.id); }}
                      className="rounded-[22px] border border-slate-100 bg-white p-3 shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200 flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* ส่วนแสดงรูปภาพอาหารพร้อมป้ายแจ้งเตือน */}
                        <div className="h-16 w-16 rounded-2xl bg-slate-100 shrink-0 overflow-hidden relative shadow-inner">
                          <img
                            src={foodImg}
                            alt={r.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";
                            }}
                          />
                          {r.soonestExpiry <= 3 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-rose-500/90 text-white text-[8px] font-black text-center py-0.5 tracking-tight backdrop-blur-[2px]">
                              ⚡ ใช้ด่วน
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {active !== "✨ AI Chef" && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[9.5px] font-black text-emerald-600 border border-emerald-100">
                                มี {r.matchedCount}/{r.totalRequired} อย่าง ({r.matchPercent}%)
                              </span>
                            )}
                            <span className="text-[9.5px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md">{r.level}</span>
                          </div>
                          <p className="font-black text-[13.5px] text-slate-800 mt-1 truncate leading-tight group-hover:text-indigo-600 transition-colors">{r.title}</p>
                          <p className="text-[10.5px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {r.time}
                          </p>
                        </div>
                      </div>

                      <div className="h-7 w-7 rounded-xl bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors shadow-xs shrink-0">
                        <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="absolute bottom-3 left-4 right-4 h-16 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[26px] px-2 flex items-center justify-between z-40 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
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
      className={`flex flex-col items-center gap-0.5 flex-1 py-1 transition-all duration-300 focus:outline-none ${active ? "text-indigo-600 scale-105" : "text-slate-400 hover:text-slate-600"}`}
    >
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? "bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/25" : "bg-transparent"}`}>
        <Icon className={`h-4.5 w-4.5 transition-transform ${active ? "stroke-[2.5]" : "stroke-[2]"}`} />
      </div>
      <span className={`text-[9.5px] font-black tracking-tight mt-0.5 transition-all ${active ? "text-indigo-600 opacity-100" : "text-slate-400 opacity-80"}`}>
        {label}
      </span>
    </button>
  );
}

export default Recipes;