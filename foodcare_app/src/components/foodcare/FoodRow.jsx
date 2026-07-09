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
    if (daysLeft === null) return "text-slate-400 bg-slate-50 border-slate-100";
    if (daysLeft <= 1) return "text-rose-600 bg-rose-50 border-rose-100";
    if (daysLeft <= 3) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-indigo-600 bg-indigo-50 border-indigo-100";
  };

  const getExpiryLabel = () => {
    if (daysLeft === null) return "ไม่ทราบวันหมดอายุ";
    if (daysLeft < 0) return "หมดอายุแล้ว!";
    if (daysLeft === 0) return "หมดอายุวันนี้!";
    return `เหลืออีก ${daysLeft} วัน`;
  };

  return (
    <div
      onClick={() => {
        if (typeof onNavigate === "function") {
          onNavigate("fridge_detail", item.id);
        }
      }}
      className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100/80 active:scale-[0.99] transition-all duration-150 select-none"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl shrink-0">{item.emoji || "📦"}</span>
        <div className="min-w-0">
          <p className="font-bold text-sm text-slate-800 truncate">{item.name || "วัตถุดิบ"}</p>
          <p className={`text-xs mt-0.5 font-bold ${daysLeft !== null && daysLeft <= 3 ? "text-rose-500" : "text-slate-400"}`}>
            {getExpiryLabel()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs font-black px-2 py-0.5 rounded-md border ${getUrgencyColor()}`}>
          {item.remaining_percent ?? 100}%
        </span>
        <span className="text-slate-300 font-bold text-sm pl-0.5">›</span>
      </div>
    </div>
  );
}