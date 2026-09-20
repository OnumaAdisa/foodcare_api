import { ArrowLeft, Share2, AlertCircle, Plus, ShoppingBasket, Trash2, Calendar as CalendarIcon, Sparkles, Check } from "lucide-react";
import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

function ShoppingPage({ currentTab, onNavigate, user }) {
  const setActiveTab = onNavigate || (() => {});

  const [shoppingList, setShoppingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [inputName, setInputName] = useState("");
  const [inputQty, setInputQty] = useState("");

  // 🟢 ดึงข้อมูลแยกบ้านตาม householdId ที่ล็อกอินเข้ามาจริง
  const myHouseholdId = user?.householdId || user?.household_id || 1;

  const [expiryDate, setExpiryDate] = useState(() => {
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
    const d = new Date(expiryDate);
    if (d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth()) return d.getDate();
    return null;
  })();

  // 🌐 ฟังก์ชันยิง fetch ดึงข้อมูลรายการซื้อของจริง ๆ จาก Node.js หลังบ้านของคุณอ้น
  const fetchShoppingList = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/shopping?householdId=${myHouseholdId}`, { credentials: "include" })
      .then((res) => res.json())
      .then((resData) => {
        const list = resData.success ? resData.data : [];
        setShoppingList(list.map(it => ({
          id: it.shop_id,
          name: it.item_name,
          qty: it.quantity,
          checked: it.is_checked === 1 || it.is_checked === true,
          reason: it.reason,
        })));
      })
      .catch((err) => console.error("Error loading shopping list:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchShoppingList();
    setSuggestions([
      { fromItemId: 99, name: "ไข่ไก่", qty: "1 แผง", reason: "ai_suggest" },
      { fromItemId: 98, name: "หมูบด", qty: "300 กรัม", reason: "ai_suggest" },
    ]);
  }, [user]);

  const handleBack = () => setActiveTab("home");

  const handleToggleCheck = async (id, currentStatus) => {
    try {
      await fetch(`${API_BASE}/api/shopping/toggle`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: id, isChecked: currentStatus ? 0 : 1 }),
      });
      fetchShoppingList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      await fetch(`${API_BASE}/api/shopping/delete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: id }),
      });
      fetchShoppingList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSuggestion = async (sug) => {
    try {
      await fetch(`${API_BASE}/api/shopping/add`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: myHouseholdId,
          item_name: sug.name,
          quantity: sug.qty,
          reason: sug.reason,
        }),
      });
      setSuggestions((p) => p.filter((item) => item.fromItemId !== sug.fromItemId));
      fetchShoppingList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddManual = async (e) => {
    e.preventDefault();
    const name = inputName.trim();
    if (!name) return;
    try {
      await fetch(`${API_BASE}/api/shopping/add`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: myHouseholdId,
          item_name: name,
          quantity: inputQty.trim() || "1 ชิ้น",
          reason: "manual",
        }),
      });
      setInputName("");
      setInputQty("");
      fetchShoppingList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToFridge = async () => {
    const checkedItems = shoppingList.filter((it) => it.checked);
    if (checkedItems.length === 0) {
      alert("❌ กรุณาติ๊กเลือกรายการสินค้าที่คุณซื้อมาเรียบร้อยแล้วอย่างน้อย 1 รายการก่อนคราบบบ");
      return;
    }
    try {
      for (const item of checkedItems) {
        await fetch(`${API_BASE}/api/fridge/add`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            qty: item.qty,
            category: "other",
            expiryDate: expiryDate,
            householdId: myHouseholdId,
          }),
        });
        await fetch(`${API_BASE}/api/shopping/delete`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId: item.id }),
        });
      }
      alert(`🎉 นำของสดจำนวน ${checkedItems.length} รายการ ยัดเข้าคลังตู้เย็นเรียบร้อยแล้วคราบบบ!`);
      setActiveTab("fridge");
    } catch (err) {
      console.error(err);
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
                <h1 className="text-base font-black text-slate-800 tracking-tight">ตะกร้าเตรียมซื้อของ</h1>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {shoppingList.filter((i) => !i.checked).length} ต้องซื้อ · {shoppingList.filter((i) => i.checked).length} ใส่ตะกร้าแล้ว
                </p>
              </div>
            </div>
            <button type="button" className="h-10 w-10 rounded-xl bg-white border border-slate-200/60 shadow-sm grid place-items-center text-slate-600 hover:text-blue-600 active:scale-95 transition-all focus:outline-none">
              <Share2 className="h-4.5 w-4.5 text-slate-700" />
            </button>
          </header>

          <div className="flex-1 px-5 space-y-4 pt-4 pb-32 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50">

            <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-3.5 flex gap-3 shadow-sm relative overflow-hidden">
              <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-rose-950">ระบบแจ้งเตือนลิสต์อัตโนมัติ</p>
                <p className="text-[10px] font-bold text-slate-400 leading-normal mt-0.5">ของกินชิ้นไหนหมดอายุหรือปริมาณเหลือน้อย ระบบจะคัดลอกลิสต์สแตนบายรอให้กดแอดตรงนี้ได้ทันทีครับ</p>
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="rounded-3xl border border-slate-200/60 bg-white p-4 shadow-sm space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600 px-0.5">
                  <Sparkles className="h-3.5 w-3.5 fill-indigo-100" /> แนะนำดึงเข้าลิสต์เพิ่มจากคลังตู้เย็น ({suggestions.length})
                </div>
                <div className="space-y-2">
                  {suggestions.map((sug) => (
                    <div key={sug.fromItemId} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 border border-slate-100">
                      <div className="flex items-center gap-2 min-w-0 pl-1">
                        <span className="text-xs font-black text-slate-700 truncate max-w-[140px]">{sug.name}</span>
                        <span className="text-[9px] font-bold text-slate-400">({sug.qty})</span>
                      </div>
                      <button type="button" onClick={() => handleAddSuggestion(sug)} className="h-7 px-3 rounded-lg bg-white border border-slate-200 text-[10px] font-black text-indigo-600 shadow-sm active:scale-95 transition-all flex items-center gap-1 focus:outline-none">
                        <Plus className="h-3 w-3 stroke-[2.5]" /> ดึงเข้าลิสต์
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-slate-200/60 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 tracking-wider uppercase mb-2 pl-0.5">จดรายการซื้อของเพิ่มเติมเอง</p>
              <form onSubmit={handleAddManual} className="flex items-center gap-2">
                <input value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="ชื่อของกิน เช่น เนื้อหมูบด" className="flex-1 h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                <input value={inputQty} onChange={(e) => setInputQty(e.target.value)} placeholder="จำนวน" className="w-16 h-11 px-2 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-bold text-slate-700 text-center outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                <button type="submit" className="h-11 w-11 rounded-xl text-white grid place-items-center bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-md active:scale-90 transition-all focus:outline-none">
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                </button>
              </form>
            </div>

            <div className="space-y-2">
              {shoppingList.map((it) => (
                <div
                  key={it.id}
                  onClick={() => handleToggleCheck(it.id, it.checked)}
                  className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer text-left ${
                    it.checked ? "border-indigo-400 bg-indigo-50/20 shadow-sm" : "border-slate-100 bg-white"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-md border grid place-items-center text-[10px] font-black shrink-0 transition-all ${
                    it.checked ? "bg-indigo-600 border-transparent text-white" : "bg-slate-50 border-slate-200 text-transparent"
                  }`}>{it.checked ? "✓" : ""}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black truncate ${it.checked ? "text-slate-400 line-through" : "text-slate-700"}`}>{it.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">ปริมาณ: {it.qty}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveItem(it.id); }}
                    className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200/40 text-slate-300 hover:text-rose-500 hover:bg-rose-50 grid place-items-center active:scale-90 transition-all focus:outline-none"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide px-1 flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-indigo-500" /> ตั้งวันหมดอายุเริ่มต้นของที่เพิ่งซื้อมา
              </label>
              <div className="rounded-3xl bg-white border border-slate-200/60 p-3.5 shadow-sm">
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
                      <button
                        type="button"
                        key={i}
                        onClick={() => setExpiryDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d).toISOString().slice(0, 10))}
                        className={`aspect-square rounded-xl text-xs font-extrabold transition-all focus:outline-none ${
                          isSelected ? "bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20 scale-105" : isToday ? "bg-amber-100 text-amber-700 border border-amber-200/50" : "hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          <div className="absolute bottom-5 left-5 right-5 z-40">
            <button
              type="button"
              onClick={handleMoveToFridge}
              className="w-full h-13 rounded-2xl text-white font-black text-xs shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-1.5 focus:outline-none"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
            >
              <Check className="h-4 w-4 stroke-[3]" /> ซื้อของสดเรียบร้อย ยกเข้าตู้เย็นเลย ({shoppingList.filter((it) => it.checked).length})
            </button>
          </div>

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/60 z-50 pointer-events-none"></div>
        </div>
      </div>
      <style>{` .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; } `}</style>
    </div>
  );
}

export default ShoppingPage;