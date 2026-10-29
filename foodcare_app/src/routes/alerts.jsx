import { AlertTriangle, ArrowLeft, Bell, BellOff, ChefHat, Leaf, ShoppingBasket, Refrigerator, UserPlus, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { FoodIcon } from "../components/foodcare/foodIcons";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

function AlertsPage({ onNavigate, user }) {
  // 🗄️ ปรับมาใช้ State รับข้อมูลวัตถุดิบอาหารที่ยิงตรงมาจากฐานข้อมูลจริง
  const [foodItems, setFoodItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlertData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [fridgeRes, notifRes] = await Promise.all([
        fetch(`${API_BASE}/api/fridge`, { credentials: "include" }),
        fetch(`${API_BASE}/api/notifications`, { credentials: "include" }),
      ]);

      const fridgeData = await fridgeRes.json();
      const notifData = await notifRes.json();

      if (fridgeData.success) {
        // Backend /api/fridge ได้จัดการสโคปตู้เย็นของครอบครัว/ส่วนตัวให้เรียบร้อยแล้ว
        setFoodItems(fridgeData.data || []);
      }

      if (notifData.success) {
        const nextNotifications = notifData.data || [];
        setNotifications(nextNotifications);

        if (nextNotifications.some((note) => !note.is_read)) {
          fetch(`${API_BASE}/api/notifications/read`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error("Error fetching items for alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertData();

    const handleUpdate = () => fetchAlertData();
    window.addEventListener("fridge_store_updated", handleUpdate);
    const interval = setInterval(fetchAlertData, 15000);

    return () => {
      window.removeEventListener("fridge_store_updated", handleUpdate);
      clearInterval(interval);
    };
  }, [user]);

  const unreadCount = notifications.filter((note) => !note.is_read).length;

  const alertLeadDays = (() => {
    try {
      const saved = localStorage.getItem("foodcare_alert_settings");
      return saved ? JSON.parse(saved).leadDays || 3 : 3;
    } catch {
      return 3;
    }
  })();

  // แยกวัตถุดิบ: ด่วนมาก (เหลือเวลา <= 1 วัน) และ ใกล้หมดอายุ (ตามการตั้งค่าการแจ้งเตือน)
  const urgent = foodItems.filter((i) => {
    if (!i.expiry_date) return false;
    const diffTime = new Date(i.expiry_date) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1 && diffDays >= 0;
  });

  const soon = foodItems.filter((i) => {
    if (!i.expiry_date) return false;
    const diffTime = new Date(i.expiry_date) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 1 && diffDays <= alertLeadDays;
  });

  const handleBack = () => {
    if (typeof onNavigate === "function") onNavigate("home");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans select-none antialiased">
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
          <header className="px-5 pt-13 pb-3 flex items-center justify-between z-30 relative bg-white/40 backdrop-blur-md border-b border-slate-200/30">
            <div className="flex items-center gap-2.5">
              <button type="button" onClick={handleBack} className="h-9 w-9 rounded-xl border border-slate-200/50 bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-90 duration-150 focus:outline-none">
                <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
              </button>
              <div>
                <h1 className="text-base font-black text-slate-800 tracking-tight">การแจ้งเตือน</h1>
                <p className="text-[10.5px] font-bold text-slate-400 mt-0.5">วัตถุดิบใกล้หมดอายุของคุณ</p>
              </div>
            </div>
            <button type="button" className="relative h-9.5 w-9.5 rounded-xl bg-white border border-slate-200/60 shadow-sm grid place-items-center text-slate-400 hover:text-slate-600 active:scale-95 transition-all focus:outline-none">
              <BellOff className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-[8.5px] font-black text-white flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </header>

          {/* Main Contents Area */}
          <div className="flex-1 px-4.5 space-y-3.5 pt-3.5 pb-8 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50">
            
            {/* Warning Total Panel Box */}
            <div className="rounded-[22px] p-3.5 text-white shadow-md relative overflow-hidden bg-gradient-to-tr from-amber-500 to-rose-500">
              <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
              <div className="relative flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur grid place-items-center shrink-0">
                  <AlertTriangle className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className="text-[13.5px] font-black">
                    {loading ? "กำลังตรวจสอบข้อมูล..." : `มี ${urgent.length + soon.length} รายการที่ต้องดูแลเร่งด่วน`}
                  </p>
                  <p className="text-[11px] text-white/90 mt-0.5 leading-normal">
                    {user?.username ? `ตู้เย็นคุณ ${user.username}: ` : ""}ใช้เมนูแนะนำในการปรุงอาหารก่อนที่วัตถุดิบจะหมดอายุ เพื่อช่วยลดขยะอาหารกันครับ
                  </p>
                </div>
              </div>
            </div>

            <section className="space-y-2">
              <h3 className="text-xs font-black text-slate-700 flex items-center justify-between px-1">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> แจ้งเตือนตู้เย็น & สมาชิก
                </span>
                {notifications.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400">
                    ทั้งหมด {notifications.length} รายการ
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/40 p-4 text-center text-[10.5px] font-bold text-slate-400">
                    ยังไม่มีการแจ้งเตือนจากสมาชิกในตู้เย็นนี้
                  </div>
                ) : (
                  notifications.slice(0, 8).map((note) => {
                    const isJoin = note.type === "household_join";
                    const isCreate = note.type === "household_created";

                    return (
                      <div 
                        key={note.id} 
                        className={`rounded-2xl p-3 shadow-xs border transition-all ${
                          isJoin 
                            ? "bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-white border-indigo-200/80" 
                            : isCreate
                            ? "bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-white border-emerald-200/80"
                            : "bg-white border-slate-100/90"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isJoin
                              ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/30"
                              : isCreate
                              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {isJoin ? (
                              <UserPlus className="h-3.5 w-3.5" />
                            ) : isCreate ? (
                              <Users className="h-3.5 w-3.5" />
                            ) : (
                              <Refrigerator className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                                isJoin
                                  ? "bg-indigo-100 text-indigo-700"
                                  : isCreate
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}>
                                {isJoin ? "สมาชิกใหม่" : isCreate ? "สร้างกลุ่มตู้เย็น" : "วัตถุดิบใหม่"}
                              </span>
                              <span className="text-[9px] font-medium text-slate-400">
                                {new Date(note.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                              </span>
                            </div>
                            <p className="text-[11.5px] font-bold text-slate-800 mt-1 leading-snug">
                              {note.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Section: Urgent Items (1 Day left) */}
            <section className="space-y-2">
              <h3 className="text-xs font-black text-slate-700 flex items-center gap-2 px-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" /> ด่วนมาก — ควรใช้ภายในวันนี้ / 1 วัน
              </h3>
              <div className="space-y-1.5">
                {loading ? (
                  <div className="p-4 text-center text-xs font-bold text-slate-400">กำลังเช็กของสด... 🧊</div>
                ) : urgent.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/40 p-3 text-center text-[10.5px] font-bold text-slate-400">
                    ไม่มีวัตถุดิบที่ต้องรีบใช้เร่งด่วนใน 1 วันครับ
                  </div>
                ) : (
                  urgent.map((it) => (
                    <MiniFoodRow 
                      key={it.item_id} 
                      item={{ name: it.item_name, qty: it.quantity, expiryDate: it.expiry_date }} 
                      badgeColor="bg-rose-500/10 text-rose-600 border-rose-200" 
                    />
                  ))
                )}
              </div>
            </section>

            {/* Section: Soon Expire Items (3 Days left) */}
            <section className="space-y-2">
              <h3 className="text-xs font-black text-slate-700 flex items-center gap-2 px-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> ใกล้หมดอายุ — ภายใน 2-3 วัน
              </h3>
              <div className="space-y-1.5">
                {loading ? (
                  <div className="p-4 text-center text-xs font-bold text-slate-400">กำลังเช็กวันหมดอายุ... 📅</div>
                ) : soon.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/40 p-3 text-center text-[10.5px] font-bold text-slate-400">
                    ไม่มีวัตถุดิบที่กำลังจะหมดอายุใน 3 วันครับ
                  </div>
                ) : (
                  soon.map((it) => (
                    <MiniFoodRow 
                      key={it.item_id} 
                      item={{ name: it.item_name, qty: it.quantity, expiryDate: it.expiry_date }} 
                      badgeColor="bg-amber-500/10 text-amber-600 border-amber-200" 
                    />
                  ))
                )}
              </div>
            </section>

            {/* Zero Waste Tips Box */}
            <div className="rounded-[22px] border border-slate-200/70 bg-white p-3.5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-100 grid place-items-center shrink-0">
                  <Leaf className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-xs text-slate-700">เคล็ดลับลดขยะอาหาร (Zero Waste)</p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5 leading-normal">
                    หากทานวัตถุดิบเนื้อสัตว์หรือผักบางชนิดไม่ทันจริง ๆ แนะนำให้นำเข้าช่องแช่แข็ง (Freezer) ทันที จะช่วยยืดอายุการเก็บรักษาต่อได้สูงสุดถึง 2 เดือนเลยครับ!
                  </p>
                </div>
              </div>
            </div>

            {/* Smart Navigation Settings List */}
            <div className="rounded-[22px] border border-slate-200/70 bg-white overflow-hidden shadow-sm">
              <SettingRow icon={<Bell className="h-4 w-4 text-indigo-500" />} title="ตั้งค่าการแจ้งเตือนล่วงหน้า" desc="แจ้งเตือนล่วงหน้า 3 วันก่อนของหมดอายุ" onClick={() => {}} />
              <div className="h-px bg-slate-100" />
              <SettingRow icon={<ShoppingBasket className="h-4 w-4 text-emerald-500" />} title="เช็กรายการต้องซื้อเพิ่ม" desc="ระบบเติมของเข้าตะกร้าให้อัตโนมัติเมื่อของในตู้เย็นหมด" onClick={() => onNavigate("shopping")} />
              <div className="h-px bg-slate-100" />
              <SettingRow icon={<ChefHat className="h-4 w-4 text-amber-500" />} title="ค้นหาเมนูจากวัตถุดิบเหล่านี้" desc="ดูสูตรอาหารแนะนำที่ช่วยเคลียร์วัตถุดิบใกล้หมดอายุของคุณ" onClick={() => onNavigate("recipes")} />
            </div>

          </div>

          {/* Home indicator bar */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/60 z-50 pointer-events-none"></div>
        </div>
      </div>
      <style>{` .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; } `}</style>
    </div>
  );
}

// Component ย่อยสำหรับการแสดงแถวรายการของกินในหน้าแจ้งเตือน
function MiniFoodRow({ item, badgeColor }) {
  const getDaysLeft = (dateStr) => {
    if (!dateStr) return "";
    const diff = new Date(dateStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days <= 0 ? "หมดอายุวันนี้" : `เหลือ ${days} วัน`;
  };

  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <FoodIcon
          name={item.name}
          className="h-8.5 w-8.5 rounded-xl bg-slate-50 border border-slate-100 p-1 shrink-0 shadow-inner"
        />
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-700 truncate">{item.name}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">คงเหลือ: {item.qty || "1 ชิ้น"}</p>
        </div>
      </div>
      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${badgeColor}`}>
        {getDaysLeft(item.expiryDate)}
      </span>
    </div>
  );
}

function SettingRow({ icon, title, desc, onClick }) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 active:bg-slate-100 transition-all focus:outline-none">
      <div className="h-8.5 w-8.5 rounded-xl bg-slate-50 border border-slate-100 grid place-items-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-slate-700 truncate">{title}</p>
        <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{desc}</p>
      </div>
      <span className="text-slate-300 font-medium text-sm px-1">›</span>
    </button>
  );
}

export default AlertsPage;