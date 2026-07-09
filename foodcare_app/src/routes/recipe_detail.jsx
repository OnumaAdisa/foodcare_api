import { ChefHat, Check, Heart, Share2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { recipes } from "../components/foodcare/data";

function RecipeDetail({ recipeId, onBack, onStartCooking, user }) {
  const r = recipes.find((x) => x.id === recipeId) || recipes[0];
  const [fridgeItems, setFridgeItems] = useState([]);

  // ✅ ดึงวัตถุดิบในตู้เย็นจริงมาเช็ค
  useEffect(() => {
    fetch("http://127.0.0.1:8080/api/fridge")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          const myHouseholdId = user?.householdId || 0;
          const myItems = resData.data.filter(item => item.household_id === myHouseholdId);
          setFridgeItems(myItems);
        }
      })
      .catch((err) => console.error(err));
  }, [user]);

  // ✅ เช็คว่าวัตถุดิบแต่ละอันมีในตู้เย็นไหม
  const checkHave = (ingName) => {
    return fridgeItems.some(
      (fItem) =>
        fItem.item_name?.toLowerCase().includes(ingName.toLowerCase()) ||
        ingName.toLowerCase().includes(fItem.item_name?.toLowerCase())
    );
  };

  // ✅ สร้าง ingredients พร้อม have จากข้อมูลตู้เย็นจริง
  const ingredients = (r.ingredients || []).map((ing) => ({
    ...ing,
    have: checkHave(ing.name),
  }));

  const haveCount = ingredients.filter((i) => i.have).length;
  const totalCount = ingredients.length;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4 font-sans select-none antialiased">
      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-slate-50/70 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">

          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          <div className={`relative h-60 bg-gradient-to-br ${r.tone} shrink-0 w-full`}>
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat className="h-20 w-20 text-white/50 animate-bounce-slow" />
            </div>
            <div className="absolute top-14 left-5 right-5 flex items-center justify-between z-30">
              <button type="button" onClick={onBack} className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 grid place-items-center text-white active:scale-90 duration-150 focus:outline-none">
                <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={() => alert("🔗 คัดลอกลิงก์สูตรเมนูนี้แล้วคราบบบ")} className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 grid place-items-center text-white active:scale-90 duration-150 focus:outline-none">
                  <Share2 className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => alert("❤️ บันทึกเข้าเมนูโปรดแล้ว")} className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 grid place-items-center text-white active:scale-90 duration-150 focus:outline-none">
                  <Heart className="h-4 w-4 fill-rose-500/20" />
                </button>
              </div>
            </div>
          </div>

          <div className="-mt-10 relative bg-slate-50 rounded-t-[40px] px-5 pt-6 pb-10 space-y-5 flex-1 style-scrollbar overflow-y-auto z-20 border-t border-white/40 shadow-[0_-15px_30px_rgba(0,0,0,0.03)]">

            <div>
              <h1 className="text-xl font-black text-slate-800 leading-tight tracking-tight">{r.title}</h1>
              <p className="mt-2 text-xs font-bold text-slate-400 leading-relaxed">{r.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <StatCard label="ระยะเวลาทำ" value={r.time} color="text-indigo-600 bg-indigo-50 border-indigo-100" />
              <StatCard label="ความยาก" value={r.level} color="text-emerald-600 bg-emerald-50 border-emerald-100" />
              {/* ✅ แสดงจำนวนที่มีจริง */}
              <StatCard label="มีในตู้เย็น" value={`${haveCount}/${totalCount}`} color="text-amber-600 bg-amber-50 border-amber-100" />
            </div>

            <section className="space-y-2.5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">วัตถุดิบที่ต้องใช้</h3>
              <div className="rounded-3xl border border-slate-200/60 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
                {ingredients.map((ing) => (
                  <div key={ing.name} className="flex items-center justify-between p-3.5 group">
                    <div className="flex items-center gap-3">
                      {/* ✅ ติ๊กถ้ามีในตู้เย็น ขึ้น + ถ้าไม่มี */}
                      <div className={`h-8 w-8 rounded-xl border grid place-items-center text-sm font-extrabold transition-all ${
                        ing.have
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-inner"
                          : "bg-slate-50 border-slate-200/50 text-slate-400"
                      }`}>
                        {ing.have ? <Check className="h-4 w-4 stroke-[3]" /> : <span className="text-xs font-black">+</span>}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700">{ing.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{ing.qty}</p>
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

            <section className="space-y-2.5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">ขั้นตอนกระบวนการทำ</h3>
              <ol className="space-y-3">
                {r.steps && r.steps.map((s, i) => (
                  <li key={i} className="flex gap-3.5 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm relative group">
                    <span className="h-6 w-6 shrink-0 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 text-white text-[11px] font-black grid place-items-center shadow-md shadow-indigo-500/10">{i + 1}</span>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed flex-1">{s}</p>
                  </li>
                ))}
              </ol>
            </section>

            <button
              type="button"
              onClick={() => typeof onStartCooking === "function" && onStartCooking()}
              className="w-full h-13 mt-4 rounded-2xl text-white font-black text-sm shadow-[0_8px_25px_rgba(79,70,229,0.35)] hover:brightness-105 active:scale-[0.98] transition-all duration-150 focus:outline-none"
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
        @keyframes bounceSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .animate-bounce-slow { animation: bounceSlow 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-xl p-2.5 text-center border shadow-inner ${color}`}>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">{label}</p>
      <p className="text-xs font-black mt-1.5 tracking-tight leading-none">{value}</p>
    </div>
  );
}

export default RecipeDetail;