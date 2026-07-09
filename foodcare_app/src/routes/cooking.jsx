import { ArrowDown, Check, ChefHat, Sparkles, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { recipes } from "../components/foodcare/data";

function CookingPage({ recipeId, onBack, onNavigateAfterDone }) {
  // ดึงข้อมูลสูตรอาหารจำลองแมตช์ตามเมนูที่เลือกมาทำ
  const r = recipes.find((x) => x.id === recipeId) || recipes[0];
  const [done, setDone] = useState(false);

  // กรองเอาเฉพาะวัตถุดิบหลักที่เรามีอยู่ในคลังจริง
  const availableIngredients = r.ingredients ? r.ingredients.filter((i) => i.have) : [];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4 font-sans select-none antialiased">
      <div className="relative z-10 w-full max-w-[390px]">
        {/* Phone Frame */}
        <div className="w-full h-[844px] bg-slate-50/70 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">
          
          {/* Dynamic Island */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          {/* App Header */}
          <header className="px-6 pt-14 pb-4 bg-white/40 backdrop-blur-md border-b border-slate-200/30 z-30 relative">
            <div className="flex items-center gap-2">
              {!done && (
                <button type="button" onClick={onBack} className="h-9 w-9 rounded-xl border border-slate-200/50 bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-90 duration-150 focus:outline-none">
                  <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
                </button>
              )}
              <div>
                <h1 className="text-base font-black text-slate-800 tracking-tight">โหมดเข้าครัวทำอาหาร</h1>
                <p className="text-[11px] font-bold text-indigo-500 mt-0.5 truncate max-w-[220px]">กำลังทำ: {r.title}</p>
              </div>
            </div>
          </header>

          {/* Core Layout Box */}
          <div className="flex-1 px-5 pt-5 pb-10 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50 flex flex-col justify-between">
            {!done ? (
              // 🥣 สถานะที่ 1: กำลังเข้าครัวเตรียมตัดสต็อกของในคลัง
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Info Warning Card */}
                  <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 p-4.5 flex items-center gap-3.5 shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white grid place-items-center shadow-md shadow-indigo-500/10">
                      <ChefHat className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">ระบบหักวัตถุดิบอัตโนมัติ</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">คลังอาหารจะอัปเดตทันทีเมื่อกดยืนยันทำเสร็จ</p>
                    </div>
                  </div>

                  {/* Deducting Inventory Items List */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">รายการสต็อกที่จะโดนหักออก</p>
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-2.5 shadow-sm space-y-1">
                      {availableIngredients.length > 0 ? (
                        availableIngredients.map((ing) => (
                          <div key={ing.name} className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div className="flex-1">
                              <p className="text-xs font-black text-slate-700">{ing.name}</p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] font-bold">
                                <span className="text-slate-400 line-through">มีอยู่ {ing.qty}</span>
                                <ArrowDown className="h-3 w-3 text-rose-500 stroke-[2.5]" />
                                <span className="text-rose-500 font-extrabold">ใช้ไป {ing.qty}</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-black tracking-wide px-2 py-1 rounded-md bg-rose-500/10 text-rose-600 border border-rose-500/10 uppercase">
                              -100%
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs font-bold text-slate-400 text-center py-6">ไม่มีวัตถุดิบที่ต้องหักสต็อกในหน้านี้</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Submit buttons */}
                <div className="space-y-2 pt-6 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDone(true)}
                    className="w-full h-13 rounded-2xl text-white font-black text-sm shadow-[0_8px_25px_rgba(16,185,129,0.3)] hover:brightness-105 active:scale-[0.98] transition-all duration-150 focus:outline-none"
                    style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                  >
                    ปรุงเสร็จเรียบร้อย! ตัดวัตถุดิบ
                  </button>
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full h-11 rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs font-black hover:bg-slate-50 hover:text-slate-700 active:scale-[0.99] transition-all focus:outline-none"
                  >
                    ยกเลิกกระบวนการ
                  </button>
                </div>
              </div>
            ) : (
              // 🌟 สถานะที่ 2: ทำเสร็จสิ้นสมบูรณ์ (Success Interface Screen)
              <div className="flex-1 flex flex-col justify-between text-center pt-8 animate-fade-in">
                <div className="space-y-6">
                  {/* Glowing Success Ring Big Icon */}
                  <div className="h-20 w-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 grid place-items-center relative shadow-sm">
                    <div className="absolute inset-2 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-full grid place-items-center shadow-lg shadow-emerald-500/30">
                      <Check className="h-8 w-8 text-white stroke-[3.5]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">สุดยอดเลยครับ 🍳</h2>
                    <p className="text-xs font-bold text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                      ระบบได้ทำการหักยอดอาหารจำนวน <span className="text-emerald-600 font-black">{availableIngredients.length} รายการ</span> ออกจากตู้เย็นให้เรียบร้อยแล้วครับ
                    </p>
                  </div>

                  {/* Shopping List Auto Trigger Box */}
                  <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4 text-left flex gap-3.5 max-w-[320px] mx-auto shadow-inner">
                    <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    <div className="text-[11px] font-bold">
                      <p className="text-slate-800 font-black">เพิ่มเข้าลิสต์เตรียมซื้อของ?</p>
                      <p className="text-slate-400 mt-0.5 font-bold leading-normal">วัตถุดิบชิ้นไหนที่คุณอ้นใช้จนเกลี้ยงตู้เย็น ระบบจะช่วยนำไปจดใส่กระดาษโน้ตรายการซื้ออัตโนมัติทันทีครับ</p>
                    </div>
                  </div>
                </div>

                {/* Final Route Actions Buttons */}
                <div className="flex gap-3 pt-8 shrink-0">
                  <button
                    type="button"
                    onClick={() => typeof onNavigateAfterDone === "function" && onNavigateAfterDone("fridge")}
                    className="flex-1 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-slate-600 text-xs font-black hover:bg-slate-50 hover:text-slate-800 active:scale-95 transition-all focus:outline-none"
                  >
                    กลับไปดูตู้เย็น
                  </button>
                  <button
                    type="button"
                    onClick={() => typeof onNavigateAfterDone === "function" && onNavigateAfterDone("recipes")}
                    className="flex-1 h-12 rounded-2xl text-white font-black text-xs shadow-[0_8px_25px_rgba(79,70,229,0.3)] hover:brightness-105 active:scale-95 transition-all duration-150 focus:outline-none"
                    style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" }}
                  >
                    หาเมนูแนะนำเพิ่ม
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/60 z-50 pointer-events-none"></div>
        </div>
      </div>
      <style>{`
        .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default CookingPage;