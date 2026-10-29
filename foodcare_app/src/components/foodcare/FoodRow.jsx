import { ChevronRight } from "lucide-react";
import { FoodIcon } from "./foodIcons";

export function FoodRow({ item, onNavigate }) {
  const getDaysLeft = () => {
    if (!item.expiry_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(item.expiry_date);
    expiry.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysLeft = getDaysLeft();

  const getUrgencyColor = () => {
    if (daysLeft === null) return "text-slate-500 bg-slate-50 border-slate-200/60";
    if (daysLeft <= 0) return "text-rose-600 bg-rose-50 border-rose-200";
    if (daysLeft <= 3) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-indigo-600 bg-indigo-50 border-indigo-200";
  };

  const getExpiryLabel = () => {
    if (daysLeft === null) return "ไม่ทราบวันหมดอายุ";
    if (daysLeft < 0) return "หมดอายุแล้ว!";
    if (daysLeft === 0) return "หมดอายุวันนี้!";
    if (daysLeft === 1) return "เหลืออีก 1 วัน";
    return `เหลืออีก ${daysLeft} วัน`;
  };

  const itemName = item.name || item.item_name || "วัตถุดิบ";
  const itemQty = item.quantity || item.qty;

  return (
    <div
      onClick={() => {
        if (typeof onNavigate === "function") {
          onNavigate("fridge_detail", item.id || item.item_id);
        }
      }}
      className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100/90 cursor-pointer hover:bg-slate-50/70 hover:border-slate-200/80 active:scale-[0.99] transition-all duration-150 select-none shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] group"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* กรอบไอคอนรูปภาพอาหารจริง */}
        <FoodIcon
          name={itemName}
          category={item.category}
          className="h-11 w-11 rounded-2xl bg-slate-50/80 border border-slate-100 p-2 shrink-0 shadow-inner group-hover:scale-105 transition-transform"
        />

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-extrabold text-[13.5px] text-slate-800 truncate leading-snug group-hover:text-indigo-600 transition-colors">
              {itemName}
            </p>
            {item.added_by_name && (
              <span className="text-[9.5px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/80 px-1.5 py-0.2 rounded-md shrink-0">
                👤 {item.added_by_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs">
            {itemQty && (
              <span className="font-semibold text-slate-500 truncate max-w-[85px]">
                {itemQty}
              </span>
            )}
            {itemQty && <span className="text-slate-300 text-[10px]">·</span>}
            <span
              className={`font-bold ${
                daysLeft !== null && daysLeft <= 0
                  ? "text-rose-600 font-extrabold"
                  : daysLeft !== null && daysLeft <= 3
                  ? "text-amber-600 font-bold"
                  : "text-slate-400 font-medium"
              }`}
            >
              {getExpiryLabel()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-[11px] font-black px-2 py-0.5 rounded-lg border ${getUrgencyColor()}`}
        >
          {item.remaining_percent ?? 100}%
        </span>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}