import { createFileRoute } from "@tanstack/react-router";
import { Calendar as CalendarIcon, Camera, Apple, Carrot, Egg, Fish, Milk, Salad, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { addItem } from "../components/foodcare/store";

export const Route = createFileRoute("/add")({
  component: AddItemPage,
  head: () => ({ meta: [{ title: "เพิ่มวัตถุดิบ — FoodCare" }] }),
});

const categories = [
  { id: "veg", label: "ผัก", icon: Carrot, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { id: "fruit", label: "ผลไม้", icon: Apple, color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  { id: "meat", label: "เนื้อสัตว์", icon: Fish, color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { id: "egg", label: "ไข่", icon: Egg, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  { id: "dairy", label: "เครื่องดื่ม", icon: Milk, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { id: "other", label: "อื่นๆ", icon: Salad, color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
];

function AddItemPage({ onNavigate }) {
  const handleBack = () => {
    if (typeof onNavigate === "function") onNavigate("fridge");
  };

  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [cat, setCat] = useState("veg");
  const [unknownExpiry, setUnknownExpiry] = useState(false); // ✅ เพิ่ม
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const monthLabel = viewMonth.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedDay = (() => {
    const d = new Date(date);
    if (d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth()) return d.getDate();
    return null;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !qty) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วนด้วย ⚠️");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8080/api/fridge/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: name,
          quantity: qty,
          category: categories.find(c => c.id === cat)?.label || "อื่นๆ",
          expiryDate: unknownExpiry ? null : date, // ✅ ส่ง null ถ้าไม่ทราบ
          householdId: 1
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addItem({ id: Date.now().toString(), name, qty, category: cat, expiryDate: unknownExpiry ? null : date });
        handleBack();
      } else {
        alert(data.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์หลังบ้านได้คราบบบ (Failed to fetch)");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4 font-sans select-none antialiased">
      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-slate-50/70 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">

          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          <header className="px-6 pt-14 pb-4 flex items-center justify-between z-30 relative bg-white/40 backdrop-blur-md border-b border-slate-200/30">
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleBack} className="h-9 w-9 rounded-xl border border-slate-200/50 bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-90 duration-150 focus:outline-none">
                <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
              </button>
              <div>
                <h1 className="text-base font-black text-slate-800 tracking-tight">เพิ่มวัตถุดิบใหม่</h1>
                <p className="text-[11px] font-bold text-slate-400 mt-0.5">กรอกข้อมูลวัตถุดิบและวันหมดอายุ</p>
              </div>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="flex-1 px-5 space-y-4 pt-4 pb-10 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50">

            <div>
              <button
                type="button"
                onClick={() => onNavigate("scan")}
                className="w-full rounded-2xl border border-dashed border-indigo-200 p-4 flex flex-col items-center bg-white/60 hover:bg-white active:scale-[0.99] transition-all focus:outline-none group"
              >
                <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white grid place-items-center shadow-md shadow-indigo-500/20">
                  <Camera className="h-5 w-5 animate-pulse" />
                </div>
                <p className="mt-2 text-sm font-black text-slate-700">สแกนภาพด้วย AI</p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 text-center">ถ่ายรูปวัตถุดิบของกินเพื่อกรอกข้อมูลอัตโนมัติ</p>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide px-1">ชื่อวัตถุดิบ</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น มะเขือเทศ, อกไก่" className="mt-1.5 w-full px-4 h-12 rounded-2xl bg-white border border-slate-200/60 shadow-sm outline-none text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-200" />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide px-1">ปริมาณ (หน่วย)</label>
                <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="เช่น 500 กรัม, 3 ลูก" className="mt-1.5 w-full px-4 h-12 rounded-2xl bg-white border border-slate-200/60 shadow-sm outline-none text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-200" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide px-1">หมวดหมู่</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {categories.map((c) => {
                  const active = cat === c.id;
                  return (
                    <button type="button" key={c.id} onClick={() => setCat(c.id)} className={`flex flex-col items-center gap-1.5 py-2.5 rounded-2xl border transition-all duration-200 focus:outline-none ${active ? "border-indigo-500 bg-white shadow-md shadow-indigo-500/5 scale-105" : "border-slate-200/60 bg-white/50 hover:bg-white"}`}>
                      <div className={`h-8 w-8 rounded-xl grid place-items-center border ${c.color} ${active ? "scale-105" : ""}`}>
                        <c.icon className="h-4 w-4 stroke-[2.5]" />
                      </div>
                      <span className={`text-[11px] font-extrabold ${active ? "text-slate-800" : "text-slate-500"}`}>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ✅ ส่วนวันหมดอายุพร้อมปุ่มไม่ทราบ */}
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide px-1 flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5 text-indigo-500" /> วันหมดอายุผลิตภัณฑ์
              </label>

              <button
                type="button"
                onClick={() => setUnknownExpiry(!unknownExpiry)}
                className={`mt-2 w-full py-2.5 rounded-2xl border text-xs font-black transition-all duration-200 focus:outline-none ${
                  unknownExpiry
                    ? "border-amber-400 bg-amber-50 text-amber-600"
                    : "border-slate-200/60 bg-white/50 text-slate-400 hover:bg-white"
                }`}
              >
                {unknownExpiry ? "⚠️ ไม่ทราบวันหมดอายุ (กดเพื่อระบุวันเอง)" : "❓ ไม่ทราบวันหมดอายุ"}
              </button>

              {!unknownExpiry && (
                <div className="mt-2 rounded-3xl bg-white border border-slate-200/60 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <button type="button" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} className="h-7 w-7 rounded-lg border border-slate-100 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all">‹</button>
                    <span className="text-xs font-black text-slate-700">{monthLabel}</span>
                    <button type="button" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} className="h-7 w-7 rounded-lg border border-slate-100 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all">›</button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-400 mb-1 uppercase tracking-wider">
                    {["อา","จ","อ","พ","พฤ","ศ","ส"].map((d) => <div key={d} className="py-1">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((d, i) => {
                      if (d === null) return <div key={i} />;
                      const isSelected = d === selectedDay;
                      const isToday = d === today.getDate() && viewMonth.getMonth() === today.getMonth() && viewMonth.getFullYear() === today.getFullYear();
                      return (
                        <button type="button" key={i} onClick={() => setDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d).toISOString().slice(0, 10))} className={`aspect-square rounded-xl text-xs font-extrabold transition-all ${isSelected ? "bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20 scale-105" : isToday ? "bg-amber-100 text-amber-700 border border-amber-200/50" : "hover:bg-slate-50 text-slate-600"}`}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="w-full h-13 mt-4 rounded-2xl text-white font-black text-sm shadow-[0_8px_25px_rgba(79,70,229,0.35)] hover:brightness-105 active:scale-[0.98] transition-all duration-150 focus:outline-none" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" }}>
              บันทึกเข้าตู้เย็นอัจฉริยะ
            </button>
          </form>

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/60 z-50 pointer-events-none"></div>
        </div>
      </div>
      <style>{` .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; } `}</style>
    </div>
  );
}

export default AddItemPage;