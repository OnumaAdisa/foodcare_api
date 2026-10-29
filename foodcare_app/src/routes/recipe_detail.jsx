import { Heart, Share2, ArrowLeft, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { recipes as staticRecipes } from "../components/foodcare/data";
import { FoodIcon } from "../components/foodcare/foodIcons";
import { getRecipeImage } from "../components/foodcare/recipeImages";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

function RecipeDetail({ recipeId, onBack, onStartCooking, user }) {
  const aiRecipes = JSON.parse(sessionStorage.getItem('foodcare_ai_recipes') || '[]');
  const allRecipes = [...aiRecipes, ...staticRecipes];
  
  const r = allRecipes.find((x) => x.id === recipeId) || staticRecipes[0];
  const [fridgeItems, setFridgeItems] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/fridge`, { credentials: "include" })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setFridgeItems(resData.data || []);
        }
      })
      .catch((err) => console.error(err));
  }, [user]);

  const getDaysLeft = (expiryDate) => {
    if (!expiryDate) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const getMatchDetails = (ingName) => {
    const match = fridgeItems.find(
      (fItem) =>
        fItem.item_name?.toLowerCase().includes(ingName.toLowerCase()) ||
        ingName.toLowerCase().includes(fItem.item_name?.toLowerCase())
    );
    if (!match) return { have: false, urgent: false };
    const days = getDaysLeft(match.expiry_date);
    return { have: true, urgent: days <= 3, daysLeft: days };
  };

  const ingredients = (r.ingredients || r.requiredIngredients || []).map((ing) => {
    const details = getMatchDetails(ing.name);
    return { 
      name: ing.name, 
      qty: ing.qty || "ตามชอบ", 
      ...details 
    };
  });

  const haveCount = ingredients.filter((i) => i.have).length;
  const totalCount = ingredients.length;
  const foodImg = getRecipeImage(r.title, r.image);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans select-none antialiased">
      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-slate-50/70 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">

          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          {/* ส่วนรูปภาพ Header ของเมนูอาหาร */}
          <div className="relative h-64 shrink-0 w-full overflow-hidden bg-slate-900">
            <img 
              src={foodImg} 
              alt={r.title} 
              className="w-full h-full object-cover brightness-95"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80";
              }}
            />
            {/* Gradient Overlay ป้องกันข้อความและปุ่มจม */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/30 pointer-events-none" />

            <div className="absolute top-14 left-5 right-5 flex items-center justify-between z-30">
              <button type="button" onClick={onBack} className="h-9 w-9 rounded-xl bg-slate-900/50 backdrop-blur-md border border-white/20 grid place-items-center text-white active:scale-90 duration-150 focus:outline-none">
                <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={() => alert("🔗 คัดลอกลิงก์สูตรเมนูนี้แล้ว")} className="h-9 w-9 rounded-xl bg-slate-900/50 backdrop-blur-md border border-white/20 grid place-items-center text-white active:scale-90 duration-150 focus:outline-none">
                  <Share2 className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => alert("❤️ บันทึกเข้าเมนูโปรดแล้ว")} className="h-9 w-9 rounded-xl bg-slate-900/50 backdrop-blur-md border border-white/20 grid place-items-center text-white active:scale-90 duration-150 focus:outline-none">
                  <Heart className="h-4 w-4 fill-rose-500/40" />
                </button>
              </div>
            </div>
          </div>

          <div className="-mt-8 relative bg-slate-50 rounded-t-[32px] px-4.5 pt-5 pb-8 space-y-4 flex-1 style-scrollbar overflow-y-auto z-20 border-t border-white/60 shadow-[0_-15px_30px_rgba(0,0,0,0.06)]">

            <div>
              <h1 className="text-lg font-black text-slate-800 leading-tight tracking-tight">{r.title}</h1>
              <p className="mt-1 text-xs font-medium text-slate-500 leading-relaxed">{r.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <StatCard label="ระยะเวลาทำ" value={r.time} color="text-indigo-600 bg-indigo-50/70 border-indigo-100" />
              <StatCard label="ความยาก" value={r.level} color="text-emerald-600 bg-emerald-50/70 border-emerald-100" />
              <StatCard label="มีในตู้เย็น" value={`${haveCount}/${totalCount}`} color="text-amber-600 bg-amber-50/70 border-amber-100" />
            </div>

            <section className="space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">วัตถุดิบและอัตราส่วนที่ใช้</h3>
              <div className="rounded-[22px] border border-slate-200/70 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
                {ingredients.map((ing) => (
                  <div key={ing.name} className={`flex items-center justify-between p-3 group transition-colors ${ing.urgent ? "bg-rose-50/30" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <FoodIcon
                          name={ing.name}
                          className="h-9.5 w-9.5 rounded-xl bg-slate-50 border border-slate-100 p-1.5 shadow-inner"
                        />
                        <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border grid place-items-center text-[7.5px] font-black ${
                          ing.have ? "bg-emerald-600 border-white text-white shadow-sm" : "bg-slate-200 border-white text-slate-500"
                        }`}>
                          {ing.have ? "✓" : "+"}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-black text-slate-700">{ing.name}</p>
                          {ing.urgent && (
                            <span className="flex items-center gap-0.5 text-[8px] font-black text-white bg-rose-500 px-1.5 py-0.5 rounded text-center animate-pulse">
                              <Zap className="h-2 w-2 fill-white" /> ใกล้เสีย รีบใช้!
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-indigo-600 mt-0.5">ปริมาณ: {ing.qty}</p>
                      </div>
                    </div>
                    {ing.have ? (
                      <span className="text-[9px] font-black tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase">
                        มีในตู้เย็น ✓
                      </span>
                    ) : (
                      <span className="text-[9px] font-black tracking-wide text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md uppercase">
                        ยังไม่มี
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {r.seasonings && r.seasonings.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🧂 เครื่องปรุงรสที่ต้องใช้</span>
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">
                    {r.seasonings.length} รายการ
                  </span>
                </div>

                <div className="rounded-[22px] border border-slate-200/70 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
                  {r.seasonings.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 group hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FoodIcon
                          name={s.name}
                          category="เครื่องปรุง"
                          className="h-9.5 w-9.5 rounded-xl bg-slate-50 border border-slate-100 p-1.5 shadow-inner shrink-0"
                        />
                        <div>
                          <p className="text-xs font-black text-slate-800">{s.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5">เครื่องปรุงรส</p>
                        </div>
                      </div>

                      <span className="text-[10.5px] font-black px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/70 shadow-2xs">
                        {s.qty}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">ขั้นตอนกระบวนการทำ</h3>
              <ol className="space-y-2.5">
                {r.steps && r.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm relative group">
                    <span className="h-5.5 w-5.5 shrink-0 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 text-white text-[10.5px] font-black grid place-items-center shadow-xs">{i + 1}</span>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed flex-1">{s}</p>
                  </li>
                ))}
              </ol>
            </section>

            <button
              type="button"
              onClick={() => typeof onStartCooking === "function" && onStartCooking()}
              className="w-full h-12 mt-3 rounded-2xl text-white font-black text-sm shadow-md shadow-indigo-500/25 hover:brightness-105 active:scale-[0.98] transition-all duration-150 focus:outline-none"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" }}
            >
              เริ่มลงมือทำเมนูนี้เลย
            </button>
          </div>

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/60 z-50 pointer-events-none"></div>
        </div>
      </div>
      <style>{`
        .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-2xl p-2.5 text-center border shadow-xs ${color}`}>
      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">{label}</p>
      <p className="text-xs font-black mt-1.5 tracking-tight leading-none">{value}</p>
    </div>
  );
}

export default RecipeDetail;