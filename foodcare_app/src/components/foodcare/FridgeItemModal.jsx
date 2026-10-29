import { useState, useEffect } from "react";
import { 
  X, 
  Minus, 
  Plus, 
  Trash2, 
  Check, 
  Scale, 
  AlertTriangle, 
  Calendar, 
  Package 
} from "lucide-react";
import { FoodIcon } from "./foodIcons";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

// ✅ ฟังก์ชันแปลงหมวดหมู่อาหารเป็นภาษาไทย พร้อม Emoji และชุดสีสวยงาม
export const formatCategoryThai = (cat, name) => {
  const c = String(cat || "").trim().toLowerCase();
  const n = String(name || "").trim().toLowerCase();

  if (c === "meat" || c === "เนื้อสัตว์" || c === "เนื้อ") {
    return { label: "เนื้อสัตว์", emoji: "🥩", pillClass: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  if (c === "vegetable" || c === "ผัก" || c === "ผักสด") {
    return { label: "ผักสด", emoji: "🥬", pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (c === "fruit" || c === "ผลไม้") {
    return { label: "ผลไม้", emoji: "🍎", pillClass: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (c === "dairy" || c === "นม" || c === "ผลิตภัณฑ์นม") {
    return { label: "ผลิตภัณฑ์นม", emoji: "🥛", pillClass: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  if (c === "drink" || c === "beverage" || c === "เครื่องดื่ม") {
    return { label: "เครื่องดื่ม", emoji: "🧃", pillClass: "bg-cyan-50 text-cyan-700 border-cyan-200" };
  }
  if (c === "bakery" || c === "ขนม" || c === "เบเกอรี่") {
    return { label: "เบเกอรี่ / ของหวาน", emoji: "🍰", pillClass: "bg-pink-50 text-pink-700 border-pink-200" };
  }
  if (c === "dry" || c === "seasoning" || c === "ของแห้ง" || c === "เครื่องปรุง") {
    return { label: "ของแห้ง / เครื่องปรุง", emoji: "🧂", pillClass: "bg-orange-50 text-orange-700 border-orange-200" };
  }

  // ถ้าหมวดเดิมส่งมาเป็น "other" หรือ "อื่นๆ" ให้ตรวจจับฉลาดขึ้นจากชื่ออาหาร
  if (n.includes("เค้ก") || n.includes("ขนม") || n.includes("ปัง") || n.includes("พาย") || n.includes("คุ้กกี้") || n.includes("ช็อกโกแลต") || n.includes("บราวนี่") || n.includes("โดนัท") || n.includes("ไอศกรีม") || n.includes("หวาน")) {
    return { label: "เบเกอรี่ / ของหวาน", emoji: "🍰", pillClass: "bg-pink-50 text-pink-700 border-pink-200" };
  }
  if (n.includes("หมู") || n.includes("ไก่") || n.includes("เนื้อ") || n.includes("ปลา") || n.includes("กุ้ง") || n.includes("หมึก") || n.includes("ไข่") || n.includes("ไส้กรอก") || n.includes("เบคอน") || n.includes("ลูกชิ้น")) {
    return { label: "เนื้อสัตว์", emoji: "🥩", pillClass: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  if (n.includes("ผัก") || n.includes("กะหล่ำ") || n.includes("แครอท") || n.includes("เห็ด") || n.includes("หอม") || n.includes("พริก") || n.includes("มะนาว") || n.includes("แตงกวา") || n.includes("มะเขือ") || n.includes("คะน้า")) {
    return { label: "ผักสด", emoji: "🥬", pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (n.includes("ส้ม") || n.includes("แอปเปิ้ล") || n.includes("กล้วย") || n.includes("แตงโม") || n.includes("มะม่วง") || n.includes("องุ่น") || n.includes("สับปะรด") || n.includes("ผลไม้") || n.includes("ฝรั่ง")) {
    return { label: "ผลไม้", emoji: "🍎", pillClass: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (n.includes("นม") || n.includes("เนย") || n.includes("ชีส") || n.includes("โยเกิร์ต") || n.includes("วิปครีม")) {
    return { label: "ผลิตภัณฑ์นม", emoji: "🥛", pillClass: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  if (n.includes("น้ำ") || n.includes("ชา") || n.includes("กาแฟ") || n.includes("โค้ก") || n.includes("เป๊ปซี่") || n.includes("น้ำหวาน") || n.includes("โซดา") || n.includes("น้ำผลไม้")) {
    return { label: "เครื่องดื่ม", emoji: "🧃", pillClass: "bg-cyan-50 text-cyan-700 border-cyan-200" };
  }

  return { label: "ของสดทั่วไป", emoji: "🧺", pillClass: "bg-slate-100 text-slate-700 border-slate-200" };
};

// แปลงวันที่เป็นรูปแบบภาษาไทยสากล (เช่น 7 ต.ค. 69)
const formatThaiDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = (d.getFullYear() + 543) % 100;
  return `${day} ${month} ${year}`;
};

const getDaysDiff = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr);
  exp.setHours(0, 0, 0, 0);
  if (isNaN(exp.getTime())) return null;
  return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
};

export function FridgeItemModal({ item, onClose, onUpdated }) {
  const [pct, setPct] = useState(item ? (item.remaining_percent ?? item.percent ?? 100) : 100);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (item) {
      setPct(item.remaining_percent ?? item.percent ?? 100);
      setConfirmDelete(false);
    }
  }, [item]);

  if (!item) return null;

  const originalQty = item.quantity || item.qty || "1 ชิ้น";

  const categoryInfo = formatCategoryThai(item.category, item.name);
  const thaiExpiry = formatThaiDate(item.expiry_date);
  const daysDiff = getDaysDiff(item.expiry_date);

  // คำนวณปริมาณคงเหลือตามเปอร์เซ็นต์แบบ Real-time
  const getCalculatedQty = (qtyText, percent) => {
    if (!qtyText) return `${percent}%`;
    const numMatch = String(qtyText).match(/[\d.]+/);
    if (numMatch) {
      const num = parseFloat(numMatch[0]);
      const unit = String(qtyText).replace(/[\d.]+/g, "").trim();
      const calculated = num * (percent / 100);
      const formattedNum = Number.isInteger(calculated) ? calculated : calculated.toFixed(1);

      if (percent <= 0) return "ใช้หมดเกลี้ยงแล้ว";
      if (percent === 100) return `คงเหลือเต็มจำนวน (${qtyText})`;
      return `เหลือประมาณ ${formattedNum} ${unit}`;
    }

    if (percent <= 0) return "ใช้หมดเกลี้ยงแล้ว";
    if (percent === 100) return `คงเหลือ ${qtyText}`;
    return `คงเหลือ ${percent}%`;
  };

  const itemId = item.id || item.item_id;

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/fridge/update/${itemId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remaining_percent: pct }),
      });
      window.dispatchEvent(new Event("fridge_store_updated"));
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error("Error updating item percentage:", err);
      alert("ไม่สามารถบันทึกได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  const handleUseUp = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/fridge/delete/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      window.dispatchEvent(new Event("fridge_store_updated"));
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  const getThemeColor = () => {
    if (pct <= 25) return {
      text: "text-rose-600",
      bgPill: "bg-rose-50 text-rose-700 border-rose-200",
      bar: "from-rose-500 to-red-600",
      accent: "#e11d48",
      label: pct === 0 ? "ใช้หมดเกลี้ยงแล้ว" : "เหลือน้อยมาก (ใกล้หมด)",
      badgeEmoji: pct === 0 ? "📭" : "⚠️",
    };
    if (pct <= 50) return {
      text: "text-amber-600",
      bgPill: "bg-amber-50 text-amber-700 border-amber-200",
      bar: "from-amber-500 to-orange-500",
      accent: "#f59e0b",
      label: "เหลือประมาณครึ่งหนึ่ง",
      badgeEmoji: "⚡",
    };
    if (pct <= 75) return {
      text: "text-teal-600",
      bgPill: "bg-teal-50 text-teal-700 border-teal-200",
      bar: "from-teal-500 to-emerald-500",
      accent: "#0d9488",
      label: "ยังเหลือปริมาณพอดี",
      badgeEmoji: "✨",
    };
    return {
      text: "text-emerald-600",
      bgPill: "bg-emerald-50 text-emerald-700 border-emerald-200",
      bar: "from-emerald-500 to-teal-500",
      accent: "#10b981",
      label: "เต็มเปี่ยมสมบูรณ์",
      badgeEmoji: "🟢",
    };
  };

  const theme = getThemeColor();

  return (
    <div 
      className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex flex-col justify-end animate-fadeIn select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-[36px] px-5 pt-3 pb-6 shadow-2xl border-t border-slate-100 max-h-[92%] flex flex-col animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-3 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
              <Scale className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">บันทึกปริมาณของสด</h3>
              <p className="text-[11px] font-medium text-slate-500">ปรับลดสัดส่วนคงเหลือในตู้เย็น</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-95 transition-all focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-3.5 space-y-3.5 overflow-y-auto style-scrollbar flex-1 pr-0.5">
          
          {/* ข้อมูลของสดชิ้นนี้ (Item Card) */}
          <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <FoodIcon
                name={item.name}
                category={item.category}
                className="h-14 w-14 rounded-2xl bg-white border border-slate-100 p-2 shrink-0 shadow-xs"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <h4 className="font-extrabold text-sm text-slate-800 truncate leading-tight">
                    {item.name}
                  </h4>
                  {/* แสดงหมวดหมู่ภาษาไทยพร้อม Emoji และชุดสีสวยงาม */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 flex items-center gap-1 ${categoryInfo.pillClass}`}>
                    <span>{categoryInfo.emoji}</span>
                    <span>{categoryInfo.label}</span>
                  </span>
                </div>

                {/* แถวข้อมูลย่อย: ปริมาณเดิม และวันหมดอายุ */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px]">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200/70 text-slate-600 font-semibold shadow-2xs">
                    <Package className="h-3 w-3 text-slate-400" />
                    <span>ปริมาณเดิม: {originalQty}</span>
                  </div>

                  {thaiExpiry ? (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border shadow-2xs ${
                      daysDiff !== null && daysDiff <= 0 
                        ? "bg-rose-50 text-rose-600 border-rose-200" 
                        : daysDiff !== null && daysDiff <= 3 
                        ? "bg-amber-50 text-amber-700 border-amber-200" 
                        : "bg-white text-slate-600 border-slate-200/70"
                    }`}>
                      <Calendar className="h-3 w-3 opacity-60" />
                      <span>หมดอายุ {thaiExpiry}</span>
                      {daysDiff !== null && (
                        <span className="text-[10px] font-bold opacity-85">
                          ({daysDiff <= 0 ? "หมดแล้ว" : `อีก ${daysDiff} วัน`})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="px-2 py-0.5 rounded-md bg-white border border-slate-200/60 text-slate-400 font-medium">
                      ไม่ระบุวันหมดอายุ
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* แผงปรับสัดส่วนเปอร์เซ็นต์ (Hero Controller) */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-50/90 to-white border border-slate-200/90 p-5 shadow-xs space-y-3.5 text-center relative overflow-hidden">
            
            {/* ตัวเลขเปอร์เซ็นต์ขนาดใหญ่ */}
            <div>
              <div className="flex items-baseline justify-center gap-1">
                <span className={`text-6xl font-black tracking-tight tabular-nums transition-colors duration-200 ${theme.text}`}>
                  {pct}
                </span>
                <span className={`text-2xl font-bold transition-colors duration-200 ${theme.text}`}>%</span>
              </div>

              {/* ป้ายแสดงปริมาณคงเหลือจริงแบบ Real-time */}
              <div className="mt-2 flex items-center justify-center">
                <div className={`px-3 py-1 rounded-full text-xs font-bold border shadow-2xs flex items-center gap-1.5 transition-all duration-200 ${theme.bgPill}`}>
                  <span>{theme.badgeEmoji}</span>
                  <span>{getCalculatedQty(originalQty, pct)}</span>
                </div>
              </div>
            </div>

            {/* แถบ Progress Bar พร้อมสเกลบอกตำแหน่ง */}
            <div className="pt-1 pb-1">
              <div className="h-3.5 rounded-full bg-slate-200/80 p-[2px] border border-slate-200/60 overflow-hidden shadow-inner">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${theme.bar} transition-all duration-200 shadow-xs`}
                  style={{ width: `${pct}%` }} 
                />
              </div>

              <div className="flex justify-between px-1 text-[9.5px] font-bold text-slate-400 mt-1.5">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* ปุ่ม - และ + และ Slider สไตล์ iOS */}
            <div className="flex items-center gap-3 pt-0.5">
              <button 
                type="button" 
                onClick={() => setPct((p) => Math.max(0, p - 5))}
                className="h-11 w-11 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200/90 shadow-xs flex items-center justify-center text-slate-700 active:scale-90 transition-transform focus:outline-none"
                title="ลด 5%"
              >
                <Minus className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
              
              <div className="flex-1 px-1">
                <input
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5" 
                  value={pct}
                  onChange={(e) => setPct(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200/80 rounded-lg cursor-pointer accent-emerald-600 transition-all"
                />
              </div>
              
              <button 
                type="button" 
                onClick={() => setPct((p) => Math.min(100, p + 5))}
                className="h-11 w-11 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200/90 shadow-xs flex items-center justify-center text-slate-700 active:scale-90 transition-transform focus:outline-none"
                title="เพิ่ม 5%"
              >
                <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            </div>

            {/* ปุ่มลัด 5 ระดับยอดนิยม */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[
                { val: 0, label: "0% หมด" },
                { val: 25, label: "25%" },
                { val: 50, label: "50% ครึ่ง" },
                { val: 75, label: "75%" },
                { val: 100, label: "100% เต็ม" },
              ].map(({ val, label }) => (
                <button 
                  key={val} 
                  type="button" 
                  onClick={() => setPct(val)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border focus:outline-none cursor-pointer ${
                    pct === val 
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs scale-102 font-black" 
                      : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

          </div>

          {/* กล่องยืนยันการลบแบบนุ่มนวล (ถ้ากดใช้หมดแล้ว) */}
          {confirmDelete && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 space-y-2.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>ยืนยันว่าใช้วัตถุดิบ "{item.name}" หมดเกลี้ยงแล้วใช่ไหม?</span>
              </div>
              <p className="text-[11px] text-rose-700/80 pl-6 leading-relaxed">
                ระบบจะนำรายการนี้ออกจากตู้เย็นของคุณทันที
              </p>
              <div className="flex gap-2 pt-1 pl-6">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-rose-200 text-slate-600 text-xs font-semibold hover:bg-rose-50/50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleUseUp}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                >
                  {saving ? "กำลังนำออก..." : "ใช่, ใช้หมดแล้ว"}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Action Buttons ด้านล่าง */}
        {!confirmDelete && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-5 gap-2.5">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              className="col-span-2 h-11 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 focus:outline-none"
            >
              <Trash2 className="h-3.5 w-3.5" /> ใช้หมดแล้ว
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="col-span-3 h-11 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all focus:outline-none"
            >
              <Check className="h-4 w-4 stroke-[2.5]" /> {saving ? "กำลังบันทึก..." : "บันทึกปริมาณคงเหลือ"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default FridgeItemModal;
