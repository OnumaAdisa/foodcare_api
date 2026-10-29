import { useState, useEffect } from "react";
import { FridgeItemModal } from "../components/foodcare/FridgeItemModal";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

function FridgeDetailPage({ itemId, onNavigate }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/fridge`, { credentials: "include" })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          const found = resData.data.find(
            (it) => String(it.item_id) === String(itemId) || String(it.id) === String(itemId)
          );
          if (found) {
            setItem({
              id: found.item_id || found.id,
              name: found.item_name || found.name,
              qty: found.quantity,
              category: found.category || "อื่นๆ",
              remaining_percent: found.remaining_percent ?? 100,
              expiry_date: found.expiry_date || null,
              emoji: found.emoji || null,
            });
          }
        }
      })
      .catch((err) => console.error("Error loading fridge detail:", err))
      .finally(() => setLoading(false));
  }, [itemId]);

  const handleBack = () => {
    if (typeof onNavigate === "function") onNavigate("fridge");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans select-none antialiased">
      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-slate-100 rounded-[52px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">
          
          {/* Dynamic Island */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500/40 border border-emerald-400/20"></div>
          </div>

          {/* Frosted Fridge Preview in the background */}
          <div className="p-6 pt-16 opacity-40 filter blur-[1px] space-y-4">
            <div className="h-6 w-32 bg-slate-300 rounded-lg"></div>
            <div className="space-y-2.5">
              <div className="h-16 bg-white rounded-2xl border border-slate-200 shadow-xs"></div>
              <div className="h-16 bg-white rounded-2xl border border-slate-200 shadow-xs"></div>
              <div className="h-16 bg-white rounded-2xl border border-slate-200 shadow-xs"></div>
              <div className="h-16 bg-white rounded-2xl border border-slate-200 shadow-xs"></div>
            </div>
          </div>

          {loading ? (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs">
              <div className="bg-white rounded-2xl px-5 py-3.5 shadow-xl text-xs font-bold text-slate-700 flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <span>กำลังโหลดข้อมูลวัตถุดิบ...</span>
              </div>
            </div>
          ) : item ? (
            <FridgeItemModal
              item={item}
              onClose={handleBack}
              onUpdated={handleBack}
            />
          ) : (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 text-center shadow-xl space-y-3 max-w-[280px]">
                <p className="text-sm font-bold text-slate-700">ไม่พบข้อมูลวัตถุดิบชิ้นนี้ในตู้เย็น</p>
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold active:scale-95 transition-all"
                >
                  กลับไปที่ตู้เย็น
                </button>
              </div>
            </div>
          )}

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/60 z-50 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}

export default FridgeDetailPage;