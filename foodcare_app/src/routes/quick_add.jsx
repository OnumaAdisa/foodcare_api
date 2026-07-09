import { Apple, Carrot, Egg, Fish, Milk, Salad, Plus, Star, Sparkles, X, ArrowLeft } from "lucide-react";
import { useState } from "react";
// 🟢 เพิ่มการอิมพอร์ตฟังก์ชันสำหรับยิงไอเทมเข้าตะกร้าเตรียมซื้อของหน้าบ้าน
import { addShopItem } from "../components/foodcare/store";

const initial = [
  { id: "egg", name: "ไข่ไก่", icon: Egg, defaultQty: "10 ฟอง", useCount: 28, tone: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  { id: "milk", name: "นมสด", icon: Milk, defaultQty: "1 L", useCount: 24, tone: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { id: "carrot", name: "แครอท", icon: Carrot, defaultQty: "500 g", useCount: 18, tone: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  { id: "apple", name: "แอปเปิ้ล", icon: Apple, defaultQty: "6 ผล", useCount: 15, tone: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  { id: "salmon", name: "แซลมอน", icon: Fish, defaultQty: "300 g", useCount: 12, tone: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { id: "salad", name: "สลัดผักรวม", icon: Salad, defaultQty: "200 g", useCount: 9, tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
];

function QuickAddPage({ onNavigate }) {
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");

  const handleBack = () => {
    if (typeof onNavigate === "function") onNavigate("home"); // พากลับไปหน้า Dashboard หลัก
  };

  const toggle = (id) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    const id = `f-${Date.now()}`;
    setItems((p) => [
      ...p,
      {
        id,
        name: name.trim(),
        icon: Sparkles,
        defaultQty: qty.trim() || "1 ชิ้น",
        useCount: 0,
        tone: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
      },
    ]);
    setName("");
    setQty("");
    setShowForm(false);
  };

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

          {/* Header */}
          <header className="px-6 pt-14 pb-4 flex items-center justify-between z-30 relative bg-white/40 backdrop-blur-md border-b border-slate-200/30">
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleBack} className="h-9 w-9 rounded-xl border border-slate-200/50 bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-90 duration-150 focus:outline-none">
                <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
              </button>
              <div>
                <h1 className="text-base font-black text-slate-800 tracking-tight">วัตถุดิบที่ใช้ประจำ</h1>
                <p className="text-[11px] font-bold text-slate-400 mt-0.5">แตะเลือกเพื่อส่งเข้ารายการเตรียมซื้อ</p>
              </div>
            </div>
          </header>

          {/* Core Scroll Content */}
          <div className="flex-1 px-5 space-y-4 pt-4 pb-12 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50 relative">
            
            {/* Top Insight Bento Card */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-500/5 to-emerald-500/5 p-4 flex items-center gap-3.5 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white grid place-items-center shadow-md">
                <Star className="h-4.5 w-4.5 fill-white text-yellow-300 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">วิเคราะห์อ้างอิงจากไลฟ์สไตล์คุณ</p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">ระบบจะจัดเรียงสิ่งที่คุณเติมเข้าตู้เย็นบ่อยที่สุด</p>
              </div>
            </div>

            {/* Quick Select Grid Items */}
            <div className="grid grid-cols-2 gap-3.5">
              {items.map((f) => {
                const active = selected.has(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggle(f.id)}
                    className={`relative p-4 rounded-3xl border text-left transition-all duration-200 focus:outline-none group ${
                      active 
                        ? "border-indigo-500 bg-white shadow-md shadow-indigo-500/5 scale-105" 
                        : "border-slate-200/60 bg-white/50 hover:bg-white"
                    }`}
                  >
                    <div className={`h-11 w-11 rounded-xl border grid place-items-center transition-transform ${f.tone} ${active ? "scale-105" : ""}`}>
                      <f.icon className="h-5 w-5 stroke-[2]" />
                    </div>
                    <p className="mt-3 font-black text-xs text-slate-700 leading-none">{f.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">{f.defaultQty}</p>
                    <div className="mt-3 text-[9px] font-black tracking-wide text-indigo-500 bg-indigo-50/50 border border-indigo-100/30 px-2 py-0.5 rounded-md inline-block">
                      ใช้ {f.useCount} ครั้ง
                    </div>
                    
                    {/* Glowing Checkbox active */}
                    {active && (
                      <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white text-[10px] grid place-items-center font-black shadow-md shadow-indigo-500/20 animate-tabFade">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Form Add Field Block */}
            {showForm ? (
              <div className="rounded-3xl bg-white border border-slate-200/60 p-4.5 space-y-3.5 shadow-md animate-tabFade">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-700">จดลิสต์ไอเทมประจำชิ้นใหม่</p>
                  <button type="button" onClick={() => setShowForm(false)} className="h-7 w-7 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all focus:outline-none">
                    <X className="h-3.5 w-3.5 stroke-[2.5]" />
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ชื่อของใช้บ่อย เช่น อกไก่, สตรอว์เบอร์รี่"
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200/50 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all duration-200"
                  />
                  <input
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="ปริมาณเริ่มต้นมาตรฐาน เช่น 500 g, 1 แพ็ค"
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200/50 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all duration-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!name.trim()}
                  className="w-full h-11 rounded-xl text-white font-black text-xs shadow-md shadow-indigo-500/10 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-40 focus:outline-none"
                  style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" }}
                >
                  บันทึกลงแผงรายการ
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="w-full h-12 rounded-2xl bg-white/40 border border-dashed border-slate-300 text-xs font-black text-slate-400 flex items-center justify-center gap-2 hover:bg-white hover:text-slate-600 transition-all focus:outline-none"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" /> เพิ่มไอเทมประจำชิ้นใหม่
              </button>
            )}

            {/* Sticky Action Submit Button floating */}
            {selected.size > 0 && (
              <div className="pt-4 pb-2 sticky bottom-0 z-40 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent">
                {/* 🟢 แก้ไข: ปรับเปลี่ยนลอจิกปุ่มกดให้วนลูปโยนของเข้าสู่ระบบรายการ Shopping List ปลายทางแทนตู้เย็น */}
                <button
                  type="button"
                  onClick={() => {
                    items.forEach((it) => {
                      if (selected.has(it.id)) {
                        addShopItem({
                          name: it.name,
                          qty: it.defaultQty,
                          reason: "manual"
                        });
                      }
                    });
                    alert(`📥 ยิงรายการด่วนจำนวน ${selected.size} รายการเข้าตะกร้าเตรียมซื้อเรียบร้อยคราบบบ`);
                    if (typeof onNavigate === "function") onNavigate("shopping"); // เซฟเสร็จกระโดดพาสลับมาส่องหน้ารายการซื้อทันที
                  }}
                  className="w-full h-13 rounded-2xl text-white font-black text-sm shadow-[0_8px_25px_rgba(16,185,129,0.35)] hover:brightness-105 active:scale-[0.98] transition-all duration-150 focus:outline-none animate-tabFade"
                  style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                >
                  ยิง {selected.size} รายการด่วนเข้ารายการเตรียมซื้อ
                </button>
              </div>
            )}
          </div>

          {/* Home Bar indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/60 z-50 pointer-events-none"></div>
        </div>
      </div>
      <style>{`
        .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        @keyframes tabFade { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-tabFade { animation: tabFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>
    </div>
  );
}

export default QuickAddPage;