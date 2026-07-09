import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

function FridgeDetailPage({ itemId, onNavigate }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pct, setPct] = useState(100);

  // ✅ ดึงข้อมูลจาก DB จริงแทน store
  useEffect(() => {
    fetch("http://127.0.0.1:8080/api/fridge")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          const found = resData.data.find(
            (it) => String(it.item_id) === String(itemId) || String(it.id) === String(itemId)
          );
          if (found) {
            const mapped = {
              id: found.item_id || found.id,
              name: found.item_name || found.name,
              qty: found.quantity,
              category: found.category || "อื่นๆ",
              remaining_percent: found.remaining_percent ?? 100,
              expiry_date: found.expiry_date || null,
              emoji: found.emoji || null,
            };
            setItem(mapped);
            setPct(mapped.remaining_percent);
          }
        }
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [itemId]);

  const handleBack = () => {
    if (typeof onNavigate === "function") onNavigate("fridge");
  };

  // ✅ บันทึก % กลับไปที่ DB
  const save = async () => {
    try {
      await fetch(`http://127.0.0.1:8080/api/fridge/update/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remaining_percent: pct }),
      });
    } catch (err) {
      console.error("Error saving:", err);
    }
    handleBack();
  };

  // ✅ ลบออกจาก DB
  const useUp = async () => {
    if (!window.confirm(`คุณใช้ "${item?.name}" หมดเกลี้ยงแล้วใช่ไหมคราบบบ?`)) return;
    try {
      await fetch(`http://127.0.0.1:8080/api/fridge/delete/${item.id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error deleting:", err);
    }
    handleBack();
  };

  const barColor =
    pct <= 25
      ? "from-rose-500 to-red-600 shadow-rose-500/30"
      : pct <= 50
        ? "from-amber-500 to-orange-500 shadow-amber-500/30"
        : "from-emerald-500 to-teal-500 shadow-emerald-500/30";

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-[390px] h-[844px] bg-slate-50/70 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 flex items-center justify-center">
          <p className="text-xs font-bold text-slate-400">🧊 กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-[390px] h-[844px] bg-slate-50/70 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 flex items-center justify-center p-6 text-center">
          <div>
            <p className="text-sm font-black text-slate-400">❌ ไม่พบข้อมูลวัตถุดิบชิ้นนี้ในคลัง</p>
            <button type="button" onClick={handleBack} className="mt-4 text-xs font-black text-indigo-600 underline">กลับไปตรวจสอบตู้เย็น</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4 font-sans select-none antialiased">
      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-slate-50/70 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">

          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          <header className="px-6 pt-14 pb-4 flex items-center gap-3 z-30 relative bg-white/40 backdrop-blur-md border-b border-slate-200/30">
            <button type="button" onClick={handleBack} className="h-9 w-9 rounded-xl border border-slate-200/50 bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-90 duration-150 focus:outline-none">
              <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-800 tracking-tight">บันทึกการใช้งานวัตถุดิบ</h1>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">แดชบอร์ดอัปเดตปริมาณคงเหลือจริง</p>
            </div>
          </header>

          <div className="flex-1 px-5 space-y-4 pt-5 overflow-y-auto style-scrollbar bg-gradient-to-b from-transparent to-slate-50/50">

            <div className="rounded-3xl bg-white border border-slate-100 p-4 shadow-sm flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 grid place-items-center text-2xl shrink-0 shadow-inner">
                {item.emoji || "📦"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-sm text-slate-700 truncate">{item.name}</p>
                <p className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                  <span>ปริมาณ: {item.qty || "ไม่ระบุ"}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="text-indigo-600">{item.category}</span>
                </p>
                {/* ✅ แสดงวันหมดอายุถ้ามี */}
                <p className="text-[10px] font-bold mt-1">
                  {item.expiry_date
                    ? <span className="text-amber-500">หมดอายุ: {new Date(item.expiry_date).toLocaleDateString("th-TH")}</span>
                    : <span className="text-slate-400">ไม่ทราบวันหมดอายุ</span>
                  }
                </p>
              </div>
            </div>

            <div className="rounded-[32px] bg-white border border-slate-200/60 p-6 shadow-sm space-y-6 text-center">
              <div>
                <p className="text-6xl font-black text-slate-800 tracking-tighter tabular-nums">{pct}%</p>
                <p className="text-[11px] font-black text-indigo-500 bg-indigo-50/60 px-3 py-1 rounded-full inline-block mt-2">สัดส่วนที่เหลืออยู่ในตู้เย็น</p>
              </div>

              <div className="h-2.5 rounded-full bg-slate-100 p-[1.5px] border border-slate-200/40 overflow-hidden shadow-inner">
                <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-300 shadow-md`} style={{ width: `${pct}%` }} />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <button type="button" onClick={() => setPct((p) => Math.max(0, p - 5))} className="h-11 w-11 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/40 grid place-items-center text-slate-600 active:scale-95 transition-all focus:outline-none shadow-sm">
                  <Minus className="h-4 w-4 stroke-[2.5]" />
                </button>
                <input
                  type="range" min="0" max="100" step="5" value={pct}
                  onChange={(e) => setPct(Number(e.target.value))}
                  className="flex-1 accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                />
                <button type="button" onClick={() => setPct((p) => Math.min(100, p + 5))} className="h-11 w-11 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/40 grid place-items-center text-slate-600 active:scale-95 transition-all focus:outline-none shadow-sm">
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2 pt-1">
                {[0, 25, 50, 75, 100].map((v) => (
                  <button key={v} type="button" onClick={() => setPct(v)}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all focus:outline-none border ${
                      pct === v ? "bg-slate-800 border-slate-800 text-white shadow-md scale-105" : "bg-slate-50/50 border-slate-200/60 text-slate-400 hover:bg-slate-50"
                    }`}
                  >{v}%</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button type="button" onClick={useUp}
                className="h-13 rounded-2xl border border-rose-100 bg-rose-50/50 text-rose-600 font-black text-xs flex items-center justify-center gap-1.5 hover:bg-rose-50 active:scale-[0.98] transition-all focus:outline-none"
              >
                <Trash2 className="h-4 w-4" /> ใช้หมดเกลี้ยงแล้ว
              </button>
              <button type="button" onClick={save}
                className="h-13 rounded-2xl text-white font-black text-xs shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all focus:outline-none"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
              >
                บันทึกปริมาณล่าสุด
              </button>
            </div>
          </div>

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/60 z-50 pointer-events-none"></div>
        </div>
      </div>
      <style>{` .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; } `}</style>
    </div>
  );
}

export default FridgeDetailPage;