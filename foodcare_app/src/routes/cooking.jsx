import { Check, ChefHat, Sparkles, ArrowLeft, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { recipes as staticRecipes } from "../components/foodcare/data";
import { FoodIcon } from "../components/foodcare/foodIcons";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

function CookingPage({ recipeId, onBack, onNavigateAfterDone, user }) {
  // รวมเมนูจาก AI และเมนูหลักเพื่อค้นหา ID ได้ถูกต้อง
  const aiRecipes = JSON.parse(sessionStorage.getItem('foodcare_ai_recipes') || '[]');
  const allRecipes = [...aiRecipes, ...staticRecipes];
  
  const r = allRecipes.find((x) => x.id === recipeId) || staticRecipes[0];
  
  const [done, setDone] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoSelected, setAutoSelected] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/api/fridge`, { credentials: "include" })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          const items = resData.data || [];

          // จับคู่วัตถุดิบในสูตรกับของในตู้เย็นอัตโนมัติ
          const initialMap = {};
          const recipeIngredients = r.ingredients || r.requiredIngredients || [];
          
          recipeIngredients.forEach((req) => {
            const reqName = req.name.toLowerCase();
            const cleanReq = reqName.replace(/อก|เนื้อ|สด|รวม/g, "").trim();

            let bestMatch = items.find(f => (f.item_name || "").toLowerCase() === reqName);
            
            if (!bestMatch) {
               bestMatch = items.find(f => {
                const fName = (f.item_name || "").toLowerCase();
                return fName.includes(reqName) || reqName.includes(fName) || (cleanReq && fName.includes(cleanReq));
              });
            }

            if (bestMatch) {
              initialMap[req.name] = bestMatch;
            }
          });
          setAutoSelected(initialMap);
        }
      })
      .catch((err) => console.error("Error fetching fridge for cooking:", err));
  }, [user, r]);

  const recipeIngredients = r.ingredients || r.requiredIngredients || [];

  // คำนวณเปอร์เซ็นต์ที่ต้องหักจริงตามปริมาณตัวเลข
  const calculateDeductPercent = (requiredQtyStr, fridgeQtyStr) => {
    const reqMatch = String(requiredQtyStr || "").match(/[\d.]+/);
    const fridgeMatch = String(fridgeQtyStr || "").match(/[\d.]+/);

    if (reqMatch && fridgeMatch) {
      const reqNum = parseFloat(reqMatch[0]);
      const fridgeNum = parseFloat(fridgeMatch[0]);

      if (fridgeNum > 0) {
        if (reqNum >= fridgeNum) {
          return 100; // ใช้หมดเกลี้ยงหรือมากกว่าที่มี ให้หัก 100% (ลบออก)
        }
        return Math.round((reqNum / fridgeNum) * 100); // หักตามสัดส่วนจริง
      }
    }
    return 100; // หากไม่ระบุตัวเลขปริมาณที่ชัดเจน ให้ถือว่าใช้หมดชิ้น
  };

  const handleFinishCooking = async () => {
    setIsProcessing(true);
    try {
      for (const req of recipeIngredients) {
        const targetItem = autoSelected[req.name];
        if (!targetItem) continue;

        const percentToDeduct = calculateDeductPercent(req.qty, targetItem.quantity || targetItem.qty);

        await fetch(`${API_BASE}/api/fridge/deduct/${targetItem.item_id || targetItem.id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deductPercent: percentToDeduct }),
        });
      }
      setDone(true);
    } catch (err) {
      console.error("Error updating inventory:", err);
      alert("เกิดข้อผิดพลาดในการตัดสต็อกสินค้าในตู้เย็น");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans select-none antialiased">
      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-slate-50/70 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          <header className="px-5 pt-13 pb-3 bg-white/40 backdrop-blur-md border-b border-slate-200/30 z-30 relative">
            <div className="flex items-center gap-2.5">
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

          <div className="flex-1 px-4.5 pt-3.5 pb-8 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50 flex flex-col justify-between">
            {!done ? (
              <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="rounded-[22px] border border-indigo-100 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 p-3.5 flex items-center gap-3 shadow-xs">
                    <div className="h-9.5 w-9.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white grid place-items-center shadow-md shadow-indigo-500/10 shrink-0">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">คำนวณการใช้อัตโนมัติ</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">ระบบจะหักลดปริมาณตามสัดส่วนการใช้งานจริงในสูตร</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">สรุปการใช้สต็อกตู้เย็น</p>
                    <div className="rounded-[22px] border border-slate-200/70 bg-white p-2.5 shadow-sm space-y-1.5">
                      {recipeIngredients.map((req, idx) => {
                        const matchedItem = autoSelected[req.name];

                        return (
                          <div key={idx} className="flex flex-col justify-center p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <FoodIcon name={req.name} className="h-7 w-7 rounded-lg bg-white border border-slate-100 p-0.5 shrink-0 shadow-xs" />
                                <p className="text-xs font-black text-slate-800 truncate">{req.name}</p>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">ต้องการ: {req.qty}</span>
                            </div>
                            
                            <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center justify-between">
                              {matchedItem ? (
                                <>
                                  <span className="text-[9.5px] font-bold text-slate-500 flex items-center gap-1.5">
                                    <Check className="h-3 w-3 text-emerald-500 stroke-[3]" /> ดึงจาก: {matchedItem.item_name} ({matchedItem.quantity || matchedItem.qty})
                                  </span>
                                  <span className="text-[8.5px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md uppercase">
                                    หักสต็อกอัตโนมัติ
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[9.5px] font-bold text-rose-400">ไม่พบในตู้เย็น</span>
                                  <span className="text-[8.5px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md uppercase">
                                    ข้ามการตัดสต็อก
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {r.seasonings && r.seasonings.length > 0 && (
                    <div className="space-y-2 pt-0.5">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          🧂 เครื่องปรุงรสที่ต้องเตรียม
                        </p>
                        <span className="text-[9px] font-bold text-slate-400">
                          (เครื่องปรุงประจำครัว)
                        </span>
                      </div>

                      <div className="rounded-[22px] border border-slate-200/70 bg-white p-2.5 shadow-sm space-y-1.5">
                        {r.seasonings.map((s, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                            <div className="flex items-center gap-2 min-w-0">
                              <FoodIcon
                                name={s.name}
                                category="เครื่องปรุง"
                                className="h-7 w-7 rounded-lg bg-white border border-slate-100 p-0.5 shrink-0 shadow-xs"
                              />
                              <p className="text-xs font-black text-slate-800 truncate">{s.name}</p>
                            </div>

                            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-white text-slate-700 border border-slate-200/80 shadow-2xs">
                              {s.qty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleFinishCooking}
                    disabled={isProcessing}
                    className="w-full h-12 rounded-2xl text-white font-black text-xs shadow-md shadow-emerald-500/25 hover:brightness-105 active:scale-[0.98] transition-all duration-150 focus:outline-none disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                  >
                    {isProcessing ? "กำลังตัดสต็อก..." : <><ChefHat className="h-4 w-4" /> ทำอาหารเสร็จแล้ว (หักวัตถุดิบ)</>}
                  </button>
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full h-10.5 rounded-2xl bg-white border border-slate-200/70 text-slate-500 text-xs font-black hover:bg-slate-50 hover:text-slate-700 active:scale-[0.99] transition-all focus:outline-none"
                  >
                    กลับไปหน้าสูตรอาหาร
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between text-center pt-8 animate-fade-in">
                <div className="space-y-5">
                  <div className="h-18 w-18 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 grid place-items-center relative shadow-sm">
                    <div className="absolute inset-2 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-full grid place-items-center shadow-lg shadow-emerald-500/30">
                      <Check className="h-7 w-7 text-white stroke-[3.5]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">ทำอาหารสำเร็จแล้ว! 🍳</h2>
                    <p className="text-xs font-medium text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                      ระบบได้บันทึกและหักลบวัตถุดิบในตู้เย็นตามปริมาณจริงเรียบร้อยแล้วครับ
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-amber-100 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-3.5 text-left flex gap-3 max-w-[320px] mx-auto shadow-inner">
                    <Sparkles className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    <div className="text-[11px] font-bold">
                      <p className="text-slate-800 font-black">อัปเดตสต็อกตามจริง</p>
                      <p className="text-slate-400 mt-0.5 font-medium leading-normal">วัตถุดิบที่ใช้จนหมดจะถูกนำออกจากตู้เย็น ส่วนวัตถุดิบที่เหลือจะลดปริมาณลงตามสัดส่วนครับ</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-8 shrink-0">
                  <button
                    type="button"
                    onClick={() => typeof onNavigateAfterDone === "function" && onNavigateAfterDone("fridge")}
                    className="flex-1 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-slate-600 text-xs font-black hover:bg-slate-50 hover:text-slate-800 active:scale-95 transition-all focus:outline-none"
                  >
                    ดูตู้เย็นของฉัน
                  </button>
                  <button
                    type="button"
                    onClick={() => typeof onNavigateAfterDone === "function" && onNavigateAfterDone("recipes")}
                    className="flex-1 h-12 rounded-2xl text-white font-black text-sm shadow-[0_8px_25px_rgba(79,70,229,0.3)] hover:brightness-105 active:scale-95 transition-all duration-150 focus:outline-none"
                    style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" }}
                  >
                    หาเมนูอื่นต่อ
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