import { createFileRoute } from "@tanstack/react-router";
import { 
  Bell, ChefHat, Refrigerator, AlertTriangle, Sparkles, Plus, Search, Clock, Star, 
  ChevronRight, User as UserIcon, Users, Settings, Award, Shield, HelpCircle, 
  Trash2, LogOut, ShoppingBasket, Home, X, Check, Lock, Mail, CheckCircle2, 
  ChevronDown, ChevronUp, Copy, AlertCircle, Info, Volume2, ShieldCheck, Key 
} from "lucide-react";
import { useState, useEffect } from "react";
import { FoodRow } from "../components/foodcare/FoodRow";
import { FridgeItemModal } from "../components/foodcare/FridgeItemModal";
import { recipes } from "../components/foodcare/data";
import { getRecipeImage } from "../components/foodcare/recipeImages";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");


export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "FoodCare — ตู้เย็นอัจฉริยะ ลดขยะอาหาร" },
      { name: "description", content: "FoodCare แอปจัดการตู้เย็น แจ้งเตือนวันหมดอายุ และแนะนำเมนูเพื่อลดขยะอาหาร" },
    ],
  }),
});

function Dashboard({ currentTab, onNavigate, onLogout, user }) {
  const [dbItems, setDbItems] = useState([]);
  const [greeting, setGreeting] = useState("สวัสดี");
  const [isLoading, setIsLoading] = useState(true);
  const [matchedRecipeCount, setMatchedRecipeCount] = useState(0);
  const [frequentCount, setFrequentCount] = useState(0);

  const activeTab = currentTab || "home";
  const setActiveTab = onNavigate || (() => { });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("สวัสดีตอนเช้า ✨");
    else if (hour < 17) setGreeting("สวัสดีตอนบ่าย 🔥");
    else setGreeting("สวัสดีตอนเย็น 🌙");
  }, []);

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [householdInfo, setHouseholdInfo] = useState({ id: null, name: "" });

  // Modal & Profile settings state
  const [activeModal, setActiveModal] = useState(null); // 'notification' | 'dietary' | 'security' | 'help' | 'reset' | null
  const [toastMessage, setToastMessage] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const [alertSettings, setAlertSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("foodcare_alert_settings");
      return saved ? JSON.parse(saved) : { enabled: true, leadDays: 3, sound: true, time: "09:00" };
    } catch {
      return { enabled: true, leadDays: 3, sound: true, time: "09:00" };
    }
  });

  const saveAlertSettings = (newSettings) => {
    setAlertSettings(newSettings);
    localStorage.setItem("foodcare_alert_settings", JSON.stringify(newSettings));
    showToast("บันทึกการตั้งค่าแจ้งเตือนแล้ว 🔔");
    setActiveModal(null);
  };

  const [dietarySettings, setDietarySettings] = useState(() => {
    try {
      const saved = localStorage.getItem("foodcare_dietary_settings");
      return saved ? JSON.parse(saved) : { dietType: "ทั่วไป", allergies: [] };
    } catch {
      return { dietType: "ทั่วไป", allergies: [] };
    }
  });

  const saveDietarySettings = (newSettings) => {
    setDietarySettings(newSettings);
    localStorage.setItem("foodcare_dietary_settings", JSON.stringify(newSettings));
    showToast("บันทึกข้อมูลโภชนาการแล้ว 🥗");
    setActiveModal(null);
  };

  const handleClearFridge = async () => {
    setIsResetting(true);
    try {
      const res = await fetch(`${API_BASE}/api/fridge/clear`, {
        method: "DELETE",
        credentials: "include"
      }).then(r => r.json()).catch(() => null);

      if (!res?.success) {
        await Promise.all(
          dbItems.map((item) =>
            fetch(`${API_BASE}/api/fridge/delete/${item.item_id || item.id}`, {
              method: "DELETE",
              credentials: "include"
            })
          )
        );
      }

      await loadDashboardData();
      window.dispatchEvent(new Event("fridge_store_updated"));
      showToast("ล้างข้อมูลตู้เย็นเรียบร้อยแล้ว 🧊");
      setActiveModal(null);
    } catch (err) {
      console.error("Clear fridge error:", err);
      showToast("เกิดข้อผิดพลาดในการล้างข้อมูล");
    } finally {
      setIsResetting(false);
    }
  };

  const loadDashboardData = () => {
    setIsLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/fridge`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${API_BASE}/api/notifications`, { credentials: "include" }).then((r) => r.json()).catch(() => ({ success: false })),
      fetch(`${API_BASE}/api/fridge/frequent`, { credentials: "include" }).then((r) => r.json()).catch(() => ({ success: false }))
    ])
      .then(([resData, notifData, freqData]) => {
        if (resData.success) {
          const myItems = resData.data || [];
          setDbItems(myItems);
          if (resData.householdId) {
            setHouseholdInfo({ id: resData.householdId, name: resData.householdName || "" });
          } else {
            setHouseholdInfo({ id: null, name: "" });
          }

          const matched = recipes.filter((recipe) =>
            recipe.requiredIngredients?.some((req) =>
              myItems.some(
                (fItem) =>
                  fItem.item_name?.toLowerCase().includes(req.name.toLowerCase()) ||
                  req.name.toLowerCase().includes(fItem.item_name?.toLowerCase())
              )
            )
          );
          setMatchedRecipeCount(matched.length);
        }

        if (notifData && notifData.success) {
          const count = typeof notifData.unreadCount === "number" 
            ? notifData.unreadCount 
            : (notifData.data || []).filter((n) => !n.is_read).length;
          setUnreadNotifCount(count);
        }

        if (freqData && freqData.success && Array.isArray(freqData.data)) {
          setFrequentCount(freqData.data.length);
        } else {
          setFrequentCount(0);
        }
      })
      .catch((err) => console.error("Error fetching dashboard data:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDashboardData();
    window.addEventListener("fridge_store_updated", loadDashboardData);
    const interval = setInterval(loadDashboardData, 8000);
    return () => {
      window.removeEventListener("fridge_store_updated", loadDashboardData);
      clearInterval(interval);
    };
  }, [user]);

  const totalItems = dbItems.length;

  const expiringItems = dbItems.filter(item => {
    if (!item.expiry_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(item.expiry_date);
    expiry.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diff <= 3;
  });

  const sortedExpiringItems = [...expiringItems].sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  const expiringCount = expiringItems.length;

  const freshnessRate = totalItems > 0
    ? Math.round(dbItems.reduce((acc, curr) => acc + (curr.remaining_percent || 100), 0) / totalItems)
    : 100;

  const isShared = Boolean(householdInfo.id || user?.householdId || user?.household_id);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans select-none antialiased">
      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-slate-50/70 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">

          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-950"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          {/* TAB 1: หน้าหลัก */}
          {activeTab === "home" && (
            <div className="flex flex-col h-full animate-tabFade">
              <header className="px-5 pt-13 pb-3 flex items-center justify-between z-30 relative bg-white/40 backdrop-blur-md border-b border-slate-200/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 p-[2px] shadow-md shadow-blue-500/20">
                    <div className="w-full h-full bg-white rounded-[14px] grid place-items-center text-blue-600">
                      <Refrigerator className="h-4.5 w-4.5 text-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{greeting}</p>
                    <h1 className="text-sm font-black text-slate-800 leading-tight tracking-tight flex items-center gap-1">
                      คุณ{user?.username || "ผู้ใช้งาน"} 🌟
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
                    </h1>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("alerts")}
                  className="relative h-9.5 w-9.5 rounded-xl bg-white border border-slate-200/60 shadow-sm grid place-items-center text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all duration-150 active:scale-95 focus:outline-none"
                >
                  <Bell className="h-4.5 w-4.5 text-slate-700" />
                  {unreadNotifCount > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-[8.5px] font-black text-white flex items-center justify-center shadow-sm">
                      {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                    </span>
                  ) : expiringCount > 0 ? (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
                  ) : null}
                </button>
              </header>

              <div className="flex-1 px-4.5 space-y-4 pt-3.5 pb-32 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50">

                {/* Hero Card ดีไซน์มินิมอล */}
                <div 
                  className="relative overflow-hidden rounded-[26px] p-4.5 border border-white/10 shadow-[0_16px_36px_-12px_rgba(15,23,42,0.25)]"
                  style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #172554 100%)" }}
                >
                  <div className="absolute right-[-30px] top-[-30px] h-36 w-36 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
                  <div className="absolute left-[-20px] bottom-[-30px] h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-1 pr-2">
                      <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-cyan-300">
                        <Sparkles className="h-3 w-3" /> {isShared ? "ตู้เย็นครอบครัว" : "AI วิเคราะห์คลัง"}
                      </span>

                      <h2 className="text-lg font-black text-white leading-tight tracking-tight pt-0.5">
                        {isShared 
                          ? `ตู้เย็นกลุ่ม ${householdInfo.name ? `"${householdInfo.name}"` : ""}`
                          : "ตู้เย็นของคุณ"}
                      </h2>

                      <p className="text-[11.5px] font-medium text-slate-300 leading-normal">
                        {totalItems > 0 ? (
                          expiringCount > 0 ? (
                            <span className="text-amber-300 font-semibold">มี {expiringCount} รายการควรทำเมนูก่อนหมดอายุ</span>
                          ) : (
                            <span className="text-emerald-300 font-semibold">
                              {isShared ? `แชร์ร่วมกัน ${totalItems} รายการในบ้าน 🏡` : "วัตถุดิบทั้งหมดอยู่ในเกณฑ์สดใหม่"}
                            </span>
                          )
                        ) : (
                          "ตู้เย็นว่างเปล่า เริ่มเพิ่มของได้เลย"
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center h-18 w-18 shrink-0 rounded-[20px] bg-white/[0.07] border border-white/15 backdrop-blur-md shadow-inner">
                      <span className="text-2xl font-black tracking-tight text-cyan-300 leading-none">
                        {freshnessRate}%
                      </span>
                      <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-slate-300 mt-1">
                        ความสด
                      </span>
                    </div>
                  </div>
                </div>

                {/* ✅ ส่วน Search & ปุ่ม "เพิ่มของ" สไตล์คลีนตามแบบ */}
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 flex items-center gap-2.5 px-3.5 h-11.5 rounded-2xl bg-white border border-slate-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-200 group">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors shrink-0" />
                    <input
                      placeholder="ค้นหาวัตถุดิบ หรือเมนูแนะนำ..."
                      className="w-full bg-transparent outline-none text-xs font-semibold text-slate-700 placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("add")}
                    className="h-11.5 px-4 rounded-2xl text-white font-bold text-xs shadow-md shadow-indigo-500/30 bg-[#5c67f5] hover:bg-[#4f5bd5] active:scale-95 transition-all duration-150 flex items-center gap-1.5 shrink-0 focus:outline-none"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span>เพิ่มของ</span>
                  </button>
                </div>

                {/* ✅ การ์ด 4 ช่องแบบที่ 3: สไตล์ไอคอนการ์ตูน + พื้นหลังพาสเทลลายนุ่มตามรูป */}
                <div className="grid grid-cols-2 gap-3">
                  {/* การ์ด 1: ฟ้าพาสเทล (วัตถุดิบทั้งหมด) */}
                  <div 
                    onClick={() => setActiveTab("fridge")}
                    className="rounded-[24px] bg-[#edf6fd] border border-[#dbeafc] p-3.5 shadow-sm hover:shadow-md active:scale-[0.97] transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between h-[105px]"
                  >
                    {/* ลวดลายตกแต่งด้านขวา */}
                    <div className="absolute right-3.5 top-7 flex flex-col gap-1 opacity-40 pointer-events-none">
                      <div className="w-1.5 h-2 bg-blue-400 rounded-full rotate-45 transform"></div>
                      <div className="w-2.5 h-1 bg-blue-300 rounded-full translate-x-1"></div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-400/30">
                        <Refrigerator className="h-5 w-5 stroke-[2.5]" />
                      </div>
                      <span className="text-2xl font-black text-slate-800 leading-none">{totalItems}</span>
                    </div>
                    <p className="text-[11.5px] font-bold text-slate-600 mt-2">วัตถุดิบทั้งหมด</p>
                  </div>

                  {/* การ์ด 2: ส้มชมพูพีชพาสเทล (ใกล้หมดอายุ) */}
                  <div 
                    onClick={() => setActiveTab("alerts")}
                    className="rounded-[24px] bg-[#fef1f0] border border-[#fcdcd9] p-3.5 shadow-sm hover:shadow-md active:scale-[0.97] transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between h-[105px]"
                  >
                    {/* ลวดลายตกแต่งด้านขวา */}
                    <div className="absolute right-3.5 top-7 flex flex-col gap-1 opacity-40 pointer-events-none">
                      <div className="w-1.5 h-2 bg-rose-400 rounded-full rotate-12"></div>
                      <div className="w-3 h-1 bg-rose-300 rounded-full -translate-x-1"></div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-b from-rose-400 to-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-400/30">
                        <AlertTriangle className="h-5 w-5 stroke-[2.5]" />
                      </div>
                      <span className="text-2xl font-black text-slate-800 leading-none">{expiringCount}</span>
                    </div>
                    <p className="text-[11.5px] font-bold text-slate-600 mt-2">ใกล้หมดอายุ</p>
                  </div>

                  {/* การ์ด 3: เขียวมินต์พาสเทล (เมนูแนะนำวันนี้) */}
                  <div 
                    onClick={() => setActiveTab("recipes")}
                    className="rounded-[24px] bg-[#edfbf3] border border-[#d5f5e2] p-3.5 shadow-sm hover:shadow-md active:scale-[0.97] transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between h-[105px]"
                  >
                    {/* ลวดลายตกแต่งด้านขวา */}
                    <div className="absolute right-3.5 top-7 flex flex-col gap-1 opacity-45 pointer-events-none">
                      <div className="w-2 h-2.5 bg-emerald-400 rounded-full rotate-45"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full translate-x-2"></div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-b from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-400/30">
                        <ChefHat className="h-5 w-5 stroke-[2.5]" />
                      </div>
                      <span className="text-2xl font-black text-slate-800 leading-none">{matchedRecipeCount}</span>
                    </div>
                    <p className="text-[11.5px] font-bold text-slate-600 mt-2">เมนูแนะนำวันนี้</p>
                  </div>

                  {/* การ์ด 4: ม่วงลาเวนเดอร์พาสเทล (วัตถุดิบที่ใช้ประจำ) */}
                  <div 
                    onClick={() => setActiveTab("quick-add")}
                    className="rounded-[24px] bg-[#f4effe] border border-[#e6dbfd] p-3.5 shadow-sm hover:shadow-md active:scale-[0.97] transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between h-[105px]"
                  >
                    {/* ลวดลายตกแต่งด้านขวา */}
                    <div className="absolute right-3.5 top-7 flex flex-col gap-1 opacity-40 pointer-events-none">
                      <div className="w-2 h-2 bg-purple-400 rounded-full rotate-45"></div>
                      <div className="w-2 h-1 bg-purple-300 rounded-full translate-x-1"></div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-b from-purple-400 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-400/30">
                        <Star className="h-5 w-5 stroke-[2.5] fill-white/30" />
                      </div>
                      <span className="text-2xl font-black text-slate-800 leading-none">{frequentCount}</span>
                    </div>
                    <p className="text-[11.5px] font-bold text-slate-600 mt-2">วัตถุดิบที่ใช้ประจำ</p>
                  </div>
                </div>

                {/* วัตถุดิบใกล้หมดอายุ */}
                <div className="space-y-2.5">
                  <Section title="วัตถุดิบใกล้หมดอายุ" actionLabel="จัดการทั้งหมด" onClick={() => setActiveTab("alerts")} />
                  {isLoading ? (
                    <div className="p-6 text-center text-xs font-bold text-slate-400">กำลังเปิดตู้เย็นหาข้อมูล... 🧊</div>
                  ) : totalItems === 0 ? (
                    <div className="p-6 border border-dashed border-slate-200 bg-white/50 rounded-2xl text-center">
                      <Refrigerator className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-extrabold text-slate-600">ตู้เย็นของคุณยังไม่มีวัตถุดิบอาหาร</p>
                      <p className="text-[11px] font-semibold text-slate-400 mt-1">กดปุ่ม "เพิ่มของ" ด้านบนเพื่อเริ่มเพิ่มชิ้นแรกเลยครับ</p>
                    </div>
                  ) : expiringCount === 0 ? (
                    <div className="p-6 border border-dashed border-slate-200 bg-white/50 rounded-2xl text-center">
                      <Sparkles className="h-7 w-7 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs font-extrabold text-emerald-600">เยี่ยมมาก! ไม่มีของใกล้หมดอายุ</p>
                      <p className="text-[11px] font-semibold text-slate-400 mt-0.5">คุณจัดการตู้เย็นได้ดีเยี่ยมเลยครับ</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sortedExpiringItems.slice(0, 3).map((it) => (
                        <FoodRow
                          key={it.item_id}
                          item={{
                            id: it.item_id,
                            name: it.item_name,
                            quantity: it.quantity,
                            remaining_percent: it.remaining_percent,
                            category: it.category,
                            expiry_date: it.expiry_date
                          }}
                          onNavigate={(tab, id) => {
                            if (tab === "fridge_detail") {
                              setSelectedItemForModal({
                                id: it.item_id,
                                name: it.item_name,
                                quantity: it.quantity,
                                remaining_percent: it.remaining_percent,
                                category: it.category,
                                expiry_date: it.expiry_date
                              });
                            } else {
                              setActiveTab(tab, id);
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* เมนูสร้างสรรค์อัจฉริยะ (แสดงรูปภาพอาหารจริง) */}
                <div className="space-y-2.5">
                  <Section title="เมนูสร้างสรรค์อัจฉริยะ" actionLabel="ดูเพิ่ม" onClick={() => setActiveTab("recipes")} />
                  <div className="flex gap-3 overflow-x-auto -mx-4.5 px-4.5 pb-2 snap-x hide-scrollbar">
                    {totalItems === 0 ? (
                      <div className="w-full text-center p-4 text-[11px] font-bold text-slate-400 bg-slate-100/40 rounded-2xl">
                        🍳 เพิ่มวัตถุดิบในตู้เย็นก่อน เพื่อให้ AI แกะสูตรเมนูแนะนำครับ
                      </div>
                    ) : matchedRecipeCount === 0 ? (
                      <div className="w-full text-center p-4 text-[11px] font-bold text-slate-400 bg-slate-100/40 rounded-2xl">
                        🍳 ยังไม่มีเมนูที่แมตช์วัตถุดิบในตู้เย็นของคุณ ลองกด "ดูเพิ่ม" ให้ AI ช่วยคิดครับ
                      </div>
                    ) : (
                      recipes
                        .filter((recipe) =>
                          recipe.requiredIngredients?.some((req) =>
                            dbItems.some(
                              (fItem) =>
                                fItem.item_name?.toLowerCase().includes(req.name.toLowerCase()) ||
                                req.name.toLowerCase().includes(fItem.item_name?.toLowerCase())
                            )
                          )
                        )
                        .slice(0, 5)
                        .map((r) => {
                          const foodImg = getRecipeImage(r.title, r.image);

                          return (
                            <div
                              key={r.id}
                              onClick={() => setActiveTab("recipes")}
                              className="snap-start min-w-[200px] max-w-[200px] rounded-[24px] overflow-hidden border border-slate-200/70 shadow-sm bg-white block active:scale-[0.97] hover:shadow-md transition-all duration-200 group cursor-pointer"
                            >
                              <div className="h-26 relative overflow-hidden bg-slate-100">
                                <img
                                  src={foodImg}
                                  alt={r.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[8.5px] font-black text-white tracking-wider uppercase">
                                  แมตช์วัตถุดิบ
                                </div>
                              </div>

                              <div className="p-3">
                                <p className="font-black text-[13px] text-slate-800 leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                  {r.title}
                                </p>
                                <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] font-bold text-slate-400">
                                  <Clock className="h-3 w-3 text-slate-300" /> {r.time} · <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md text-[9.5px] font-black">{r.level}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Shopping List shortcut */}
                <div onClick={() => setActiveTab("shopping")} className="block rounded-[22px] p-3.5 border border-slate-200/60 bg-gradient-to-r from-white via-white to-slate-50/50 shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200 group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl grid place-items-center text-white shrink-0 shadow-md shadow-teal-500/20 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-400">
                        <ShoppingBasket className="h-4.5 w-4.5 stroke-[2.5]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-slate-800">รายการซื้อของเข้าบ้าน</p>
                        <p className="text-[10.5px] font-bold text-slate-400 mt-0.5 truncate max-w-[200px]">จัดการและดึงของใกล้หมดเข้าตะกร้า</p>
                      </div>
                    </div>
                    <div className="h-7 w-7 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center shadow-sm group-hover:bg-white group-hover:translate-x-0.5 transition-all shrink-0">
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500 stroke-[2.5]" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: โปรไฟล์ */}
          {activeTab === "profile" && (
            <div className="flex flex-col h-full animate-tabFade">
              <header className="px-5 pt-13 pb-3.5 flex items-center justify-between z-30 relative bg-white/40 backdrop-blur-md border-b border-slate-200/30">
                <h1 className="text-base font-black text-slate-800 tracking-tight">โปรไฟล์ของฉัน</h1>
                <button 
                  type="button" 
                  onClick={() => setActiveModal("notification")}
                  title="การตั้งค่า"
                  className="h-9.5 w-9.5 rounded-xl bg-white border border-slate-200/60 shadow-sm grid place-items-center text-slate-600 hover:text-indigo-600 hover:bg-slate-50 focus:outline-none active:scale-95 duration-150 cursor-pointer"
                >
                  <Settings className="h-4.5 w-4.5 text-slate-700" />
                </button>
              </header>

              <div className="flex-1 px-4.5 space-y-4 pt-3.5 pb-32 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50">
                {/* Profile User Card */}
                <div className="relative overflow-hidden rounded-[26px] p-4.5 text-white border border-white/20 shadow-[0_16px_36px_-12px_rgba(30,58,138,0.25)]" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a8a 100%)" }}>
                  <div className="absolute right-[-20px] bottom-[-40px] h-40 w-40 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 opacity-30 blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex items-center gap-3.5">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-400/30 via-white/20 to-blue-500/30 backdrop-blur-md border border-white/20 grid place-items-center text-xl font-black text-white shadow-inner animate-float shrink-0">
                      {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-black tracking-tight truncate">คุณ {user?.username || "ผู้ใช้งาน"}</p>
                      <p className="text-xs font-medium text-slate-300/90 truncate mt-0.5">{user?.email || (user?.username ? `${user.username}@foodcare.app` : "user@foodcare.app")}</p>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/20 shadow-sm">
                          <Award className="h-3 w-3" /> นักลดขยะระดับ Gold
                        </span>
                        {householdInfo.id && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-xl bg-indigo-500/25 text-cyan-300 border border-indigo-400/20 shadow-sm truncate max-w-[130px]">
                            🏠 {householdInfo.name || "บ้านของฉัน"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <MetricCard emoji="🌱" value={(totalItems * 0.4).toFixed(1)} unit="kg" label="ลดขยะสะสม" grad="from-emerald-500 to-teal-400" color="text-emerald-600" />
                  <MetricCard emoji="🍲" value={matchedRecipeCount} unit="เมนู" label="แนะนำวันนี้" grad="from-indigo-600 to-blue-500" color="text-indigo-600" />
                  <MetricCard emoji="🧊" value={totalItems} unit="ชิ้น" label="ในตู้เย็น" grad="from-purple-600 to-pink-500" color="text-purple-600" />
                </div>

                {/* Account & Settings Menu */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">การจัดการบัญชี</h3>
                    <div className="rounded-[22px] border border-slate-100 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
                      <div onClick={() => setActiveTab("household")} className="w-full cursor-pointer">
                        <ProfileMenuRow 
                          icon={Users} 
                          label="จัดการครอบครัว (Hybrid Fridge)" 
                          iconGrad="from-blue-600 to-cyan-500" 
                          badge={householdInfo.id ? (householdInfo.name || "มีกลุ่มแล้ว") : "ตู้เย็นเดี่ยว"}
                        />
                      </div>
                      <ProfileMenuRow 
                        icon={Bell} 
                        label="ตั้งค่าการแจ้งเตือนวันหมดอายุ" 
                        iconGrad="from-amber-500 to-orange-500" 
                        badge={alertSettings.enabled ? `เตือนล่วงหน้า ${alertSettings.leadDays} วัน` : "ปิดแจ้งเตือน"}
                        onClick={() => setActiveModal("notification")}
                      />
                      <ProfileMenuRow 
                        icon={Sparkles} 
                        label="ความชอบอาหารและภูมิแพ้" 
                        iconGrad="from-purple-600 to-pink-500" 
                        badge={dietarySettings.dietType !== "ทั่วไป" ? dietarySettings.dietType : (dietarySettings.allergies?.length ? `แพ้ ${dietarySettings.allergies.length} อย่าง` : "ทั่วไป")}
                        onClick={() => setActiveModal("dietary")}
                      />
                      <ProfileMenuRow 
                        icon={Shield} 
                        label="ความปลอดภัยและความเป็นส่วนตัว" 
                        iconGrad="from-indigo-600 to-blue-500" 
                        badge="ปลอดภัย"
                        onClick={() => setActiveModal("security")}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">การสนับสนุนระบบ</h3>
                    <div className="rounded-[22px] border border-slate-100 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
                      <ProfileMenuRow 
                        icon={HelpCircle} 
                        label="ศูนย์ช่วยเหลือและติดต่อทีมงาน" 
                        iconGrad="from-slate-600 to-slate-400" 
                        badge="FAQ"
                        onClick={() => setActiveModal("help")}
                      />
                      <ProfileMenuRow 
                        icon={Trash2} 
                        label="ล้างข้อมูลระบบตู้เย็นทั้งหมด" 
                        iconGrad="from-rose-600 to-red-500" 
                        danger 
                        badge={totalItems > 0 ? `${totalItems} รายการ` : "ว่าง"}
                        onClick={() => setActiveModal("reset")}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-600 font-bold text-xs shadow-sm active:scale-[0.98] transition-all duration-150 focus:outline-none cursor-pointer"
                >
                  <LogOut className="h-4 w-4 stroke-[2.5]" /> ออกจากระบบผู้ใช้งาน
                </button>
              </div>
            </div>
          )}

          {/* Bottom Nav */}
          <div className="absolute bottom-3 left-4 right-4 h-16 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[26px] px-2 flex items-center justify-between z-40 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
            <NavItem icon={Home} label="หน้าหลัก" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
            <NavItem icon={Refrigerator} label="ตู้เย็น" active={activeTab === "fridge"} onClick={() => setActiveTab("fridge")} />
            <NavItem icon={ChefHat} label="เมนูแนะนำ" active={activeTab === "recipes"} onClick={() => setActiveTab("recipes")} />
            <NavItem icon={UserIcon} label="โปรไฟล์" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
          </div>

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/60 z-50 pointer-events-none"></div>

          {/* ✅ Modal Overlay & iOS-style Bottom Sheet (Contained inside the mobile frame) */}
          {activeModal && (
            <div 
              className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex flex-col justify-end animate-fadeIn"
              onClick={() => setActiveModal(null)}
            >
              <div 
                className="bg-white rounded-t-[32px] p-5 shadow-2xl border-t border-slate-100 max-h-[85%] flex flex-col animate-slideUp overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3 shrink-0" />
                {activeModal === "notification" && (
                  <NotificationModal 
                    settings={alertSettings} 
                    onSave={saveAlertSettings} 
                    onClose={() => setActiveModal(null)} 
                  />
                )}
                {activeModal === "dietary" && (
                  <DietaryModal 
                    settings={dietarySettings} 
                    onSave={saveDietarySettings} 
                    onClose={() => setActiveModal(null)} 
                  />
                )}
                {activeModal === "security" && (
                  <SecurityModal 
                    user={user} 
                    householdInfo={householdInfo} 
                    onClose={() => setActiveModal(null)} 
                    showToast={showToast} 
                  />
                )}
                {activeModal === "help" && (
                  <HelpCenterModal 
                    onClose={() => setActiveModal(null)} 
                    showToast={showToast} 
                  />
                )}
                {activeModal === "reset" && (
                  <ResetFridgeModal 
                    totalItems={totalItems} 
                    isShared={isShared} 
                    householdName={householdInfo.name} 
                    onConfirm={handleClearFridge} 
                    onClose={() => setActiveModal(null)} 
                    isResetting={isResetting} 
                  />
                )}
              </div>
            </div>
          )}

          {/* Modal ปรับปริมาณของสด (Bottom Sheet) */}
          {selectedItemForModal && (
            <FridgeItemModal
              item={selectedItemForModal}
              onClose={() => setSelectedItemForModal(null)}
              onUpdated={() => loadDashboardData()}
            />
          )}

          {/* Floating Toast Notification */}
          {toastMessage && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-xl border border-white/20 flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { width: 0px; height: 0px; background: transparent; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes tabFade { from { opacity: 0; transform: scale(0.99); } to { opacity: 1; transform: scale(1); } }
        .animate-tabFade { animation: tabFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out both; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-center gap-0.5 flex-1 py-1 transition-all duration-300 focus:outline-none cursor-pointer ${active ? "text-indigo-600 scale-105" : "text-slate-400 hover:text-slate-600"}`}
    >
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? "bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/25" : "bg-transparent"}`}>
        <Icon className={`h-4.5 w-4.5 transition-transform ${active ? "stroke-[2.5]" : "stroke-[2]"}`} />
      </div>
      <span className={`text-[9.5px] font-black tracking-tight mt-0.5 transition-all ${active ? "text-indigo-600 opacity-100" : "text-slate-400 opacity-80"}`}>
        {label}
      </span>
    </button>
  );
}

function MetricCard({ value, unit, label, grad, color, emoji }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-3 text-center shadow-sm relative overflow-hidden border-b-[3px] flex flex-col items-center justify-center">
      <div className={`absolute -right-4 -bottom-4 h-12 w-12 bg-gradient-to-br ${grad} opacity-5 rounded-full`} />
      {emoji && <span className="text-sm mb-1">{emoji}</span>}
      <p className={`text-lg font-black ${color || 'text-slate-800'} tracking-tight leading-none`}>
        {value}
        <span className="text-[9.5px] text-slate-400 font-bold ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] font-bold text-slate-400 mt-1.5 truncate tracking-wide">{label}</p>
    </div>
  );
}

function ProfileMenuRow({ icon: Icon, label, danger, iconGrad, badge, onClick }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className="w-full text-left bg-transparent hover:bg-slate-50/70 active:bg-slate-100/70 transition-all duration-150 focus:outline-none group cursor-pointer"
    >
      <div className="flex items-center gap-3 p-3">
        <div className={`h-8.5 w-8.5 rounded-xl grid place-items-center text-white shadow-sm bg-gradient-to-tr ${iconGrad} ${danger ? "shadow-rose-500/20" : "shadow-slate-400/10"} shrink-0`}>
          <Icon className="h-4 w-4 stroke-[2.5]" />
        </div>
        <p className={`flex-1 text-[13px] font-bold ${danger ? "text-rose-600" : "text-slate-700 group-hover:text-slate-900 transition-colors"}`}>{label}</p>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${danger ? "bg-rose-50 text-rose-500 border border-rose-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
            {badge}
          </span>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </button>
  );
}

function Section({ title, actionLabel, onClick }) {
  return (
    <div className="flex items-center justify-between pt-0.5 px-0.5">
      <h3 className="text-[14px] font-black text-slate-800 tracking-tight">{title}</h3>
      <button type="button" onClick={onClick} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5 transition-all focus:outline-none cursor-pointer">
        {actionLabel} <ChevronRight className="h-3 w-3 stroke-[3]" />
      </button>
    </div>
  );
}

/* =========================================================================
   MODAL DIALOGS
========================================================================= */

function NotificationModal({ settings, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...settings });

  return (
    <div className="flex flex-col h-full max-h-[75vh]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">ตั้งค่าการแจ้งเตือนวันหมดอายุ</h3>
            <p className="text-[11px] font-semibold text-slate-400">ปรับแต่งการเตือนก่อนของในตู้เย็นจะเสีย</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 grid place-items-center text-slate-500 cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="py-4 space-y-4 overflow-y-auto style-scrollbar flex-1 pr-1">
        {/* Toggle On/Off */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-xs font-black text-slate-800">เปิดระบบแจ้งเตือน</p>
            <p className="text-[10.5px] font-medium text-slate-400">รับการแจ้งเตือนเมื่อวัตถุดิบใกล้หมดอายุ</p>
          </div>
          <button
            type="button"
            onClick={() => setDraft(d => ({ ...d, enabled: !d.enabled }))}
            className={`w-12 h-6.5 rounded-full transition-colors p-1 relative flex items-center cursor-pointer ${draft.enabled ? "bg-indigo-600" : "bg-slate-300"}`}
          >
            <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transition-transform ${draft.enabled ? "translate-x-5.5" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Lead Days */}
        <div className="space-y-2">
          <label className="text-[11.5px] font-bold text-slate-700 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-indigo-500" /> แจ้งเตือนล่วงหน้า (วัน)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 5].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setDraft(d => ({ ...d, leadDays: days }))}
                className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  draft.leadDays === days
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 scale-[1.02]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {days} วัน
              </button>
            ))}
          </div>
        </div>

        {/* Notification Sound */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2.5">
            <Volume2 className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs font-bold text-slate-700">เสียงแจ้งเตือนและสั่น</p>
              <p className="text-[10px] text-slate-400">ส่งเสียงเตือนเมื่อถึงกำหนด</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDraft(d => ({ ...d, sound: !d.sound }))}
            className={`w-10 h-5.5 rounded-full transition-colors p-0.5 relative flex items-center cursor-pointer ${draft.sound ? "bg-emerald-500" : "bg-slate-300"}`}
          >
            <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transition-transform ${draft.sound ? "translate-x-4.5" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Time of day */}
        <div className="space-y-2">
          <label className="text-[11.5px] font-bold text-slate-700">เวลาส่งแจ้งเตือนประจำวัน</label>
          <div className="grid grid-cols-4 gap-2">
            {["08:00", "09:00", "12:00", "18:00"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDraft(d => ({ ...d, time: t }))}
                className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  draft.time === t
                    ? "bg-indigo-50 text-indigo-600 border-indigo-300 font-black"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {t} น.
              </button>
            ))}
          </div>
        </div>

        {/* Preview Info */}
        <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
          <p>
            {draft.enabled
              ? `ระบบจะแจ้งเตือนคุณเวลา ${draft.time || "09:00"} น. ก่อนอาหารหมดอายุ ${draft.leadDays} วัน 🔔`
              : "การแจ้งเตือนถูกปิดไว้ คุณสามารถเข้ามาเปิดได้ทุกเมื่อ"}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-500/25 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
        >
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}

function DietaryModal({ settings, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...settings, allergies: settings.allergies || [] });

  const dietOptions = [
    { id: "ทั่วไป", label: "ทั่วไป (ปกติ)", icon: "🥗" },
    { id: "คุมน้ำหนัก", label: "คุมน้ำหนัก / แคลต่ำ", icon: "⚖️" },
    { id: "มังสวิรัติ", label: "มังสวิรัติ (Veggie)", icon: "🥦" },
    { id: "คีโต", label: "คีโตเจนิก (Keto)", icon: "🥑" },
    { id: "ฮาลาล", label: "อาหารฮาลาล (Halal)", icon: "🌙" }
  ];

  const allergyOptions = [
    { id: "กุ้ง/อาหารทะเล", label: "🦐 กุ้ง / อาหารทะเล" },
    { id: "ถั่วลิสง", label: "🥜 ถั่วลิสง / ถั่วเปลือกแข็ง" },
    { id: "นมวัว", label: "🥛 นมวัว / ผลิตภัณฑ์นม" },
    { id: "ไข่ไก่", label: "🥚 ไข่ไก่" },
    { id: "กลูเตน", label: "🌾 กลูเตน / ข้าวสาลี" },
    { id: "ถั่วเหลือง", label: "🫘 ถั่วเหลือง" },
    { id: "เผ็ดจัด", label: "🌶️ ไม่ทานเผ็ด" }
  ];

  const toggleAllergy = (id) => {
    setDraft(d => {
      const exists = d.allergies.includes(id);
      return {
        ...d,
        allergies: exists ? d.allergies.filter(x => x !== id) : [...d.allergies, id]
      };
    });
  };

  return (
    <div className="flex flex-col h-full max-h-[75vh]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">ความชอบอาหารและภูมิแพ้</h3>
            <p className="text-[11px] font-semibold text-slate-400">ช่วยให้ AI คัดสรรสูตรเมนูที่ตรงกับคุณ</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 grid place-items-center text-slate-500 cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="py-4 space-y-4 overflow-y-auto style-scrollbar flex-1 pr-1">
        {/* Diet Style */}
        <div className="space-y-2">
          <label className="text-[11.5px] font-bold text-slate-700 flex items-center justify-between">
            <span>สไตล์การรับประทานอาหาร</span>
            <span className="text-[10px] text-purple-600 font-black">{draft.dietType}</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {dietOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDraft(d => ({ ...d, dietType: opt.id }))}
                className={`p-2.5 rounded-xl text-left border flex items-center gap-2 transition-all cursor-pointer ${
                  draft.dietType === opt.id
                    ? "bg-purple-50 text-purple-900 border-purple-300 font-black shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span className="text-base">{opt.icon}</span>
                <span className="text-[11.5px] leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Allergies Multi-select */}
        <div className="space-y-2">
          <label className="text-[11.5px] font-bold text-slate-700 flex items-center justify-between">
            <span>วัตถุดิบที่แพ้ / หลีกเลี่ยง</span>
            <span className="text-[10px] text-rose-500 font-bold">
              {draft.allergies.length > 0 ? `เลือก ${draft.allergies.length} อย่าง` : "ไม่มี"}
            </span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {allergyOptions.map((allg) => {
              const isSelected = draft.allergies.includes(allg.id);
              return (
                <button
                  key={allg.id}
                  type="button"
                  onClick={() => toggleAllergy(allg.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/25 scale-[1.02]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>{allg.label}</span>
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Info box */}
        <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-[11px] text-purple-900 flex items-start gap-2">
          <Info className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
          <p>
            AI ของ FoodCare จะใช้ข้อมูลนี้แนะนำเมนูในแท็บ "เมนูแนะนำ" และแจ้งเตือนเมื่อตรวจพบส่วนผสมที่แพ้
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-xs font-black shadow-md shadow-purple-500/25 hover:bg-purple-700 active:scale-95 transition-all cursor-pointer"
        >
          บันทึกความชอบ
        </button>
      </div>
    </div>
  );
}

function SecurityModal({ user, householdInfo, onClose, showToast }) {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdatePassword = () => {
    if (!newPassword || newPassword.length < 4) {
      showToast("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    showToast("อัปเดตรหัสผ่านใหม่เรียบร้อยแล้ว 🔒");
    setShowPasswordChange(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="flex flex-col h-full max-h-[75vh]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">ความปลอดภัยและความเป็นส่วนตัว</h3>
            <p className="text-[11px] font-semibold text-slate-400">ข้อมูลบัญชีและการปกป้องข้อมูลส่วนตัว</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 grid place-items-center text-slate-500 cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="py-4 space-y-3.5 overflow-y-auto style-scrollbar flex-1 pr-1">
        {/* Account Details */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500">ชื่อผู้ใช้งาน:</span>
            <span className="font-black text-slate-800">{user?.username || "ผู้ใช้งาน"}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500">อีเมลผูกบัญชี:</span>
            <span className="font-bold text-slate-800">{user?.email || (user?.username ? `${user.username}@foodcare.app` : "user@foodcare.app")}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500">สถานะการยืนยัน:</span>
            <span className="inline-flex items-center gap-1 font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-[10.5px]">
              <CheckCircle2 className="h-3 w-3" /> ยืนยันแล้ว
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500">ระบบตู้เย็น:</span>
            <span className="font-bold text-indigo-600">
              {householdInfo.id ? `กลุ่ม "${householdInfo.name || householdInfo.id}"` : "ตู้เย็นส่วนตัว"}
            </span>
          </div>
        </div>

        {/* Security badges */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <Lock className="h-4 w-4 text-indigo-600 mb-1" />
            <p className="text-[11px] font-black text-indigo-900">การเข้ารหัส bcrypt</p>
            <p className="text-[9.5px] text-slate-500 mt-0.5">รหัสผ่านปลอดภัยสูงสุด</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
            <Shield className="h-4 w-4 text-emerald-600 mb-1" />
            <p className="text-[11px] font-black text-emerald-900">เซสชันปลอดภัย</p>
            <p className="text-[9.5px] text-slate-500 mt-0.5">เชื่อมต่อผ่านโทเค็นส่วนตัว</p>
          </div>
        </div>

        {/* Change Password Dropdown */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="w-full p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-slate-500" />
              <span>เปลี่ยนรหัสผ่านผู้ใช้งาน</span>
            </div>
            {showPasswordChange ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {showPasswordChange && (
            <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-2.5">
              <input
                type="password"
                placeholder="รหัสผ่านใหม่ (อย่างน้อย 4 ตัวอักษร)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs outline-none focus:border-indigo-500"
              />
              <input
                type="password"
                placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleUpdatePassword}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                บันทึกรหัสผ่านใหม่
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
        >
          เรียบร้อย
        </button>
      </div>
    </div>
  );
}

function HelpCenterModal({ onClose, showToast }) {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "FoodCare คำนวณวันหมดอายุอย่างไร?",
      a: "FoodCare ใช้ฐานข้อมูลมาตรฐานประเภทอาหาร ผสานการวิเคราะห์จากรูปถ่ายและใบเสร็จด้วย AI โดยจะคำนวณวันหมดอายุแนะนำ และแจ้งเตือนล่วงหน้าตามที่คุณตั้งค่า"
    },
    {
      q: "จะเชื่อมต่อตู้เย็นร่วมกับคนในบ้านอย่างไร?",
      a: "ไปที่แท็บ 'โปรไฟล์' > เลือก 'จัดการครอบครัว' > กดสร้างบ้านและนำรหัสเชิญ (Invite Code) 6 หลักให้สมาชิกเพื่อแชร์วัตถุดิบร่วมกัน"
    },
    {
      q: "ถ่ายรูปหรือสแกนใบเสร็จแล้วไม่ติด?",
      a: "แนะนำให้ถ่ายในที่สว่าง ไม่ย้อนแสง หรือวางวัตถุดิบบนพื้นโต๊ะให้ชัดเจน หรือสามารถกดปุ่ม 'เพิ่มของ' เพื่อพิมพ์ชื่อด้วยตนเองได้ทันที"
    },
    {
      q: "สูตรอาหารแนะนำคำนวณจากอะไร?",
      a: "ระบบจะนำวัตถุดิบที่คุณมีในตู้เย็นมาจับคู่กับสูตรเมนูที่สามารถทำได้ เพื่อช่วยให้คุณใช้วัตถุดิบก่อนหมดอายุและลดขยะอาหาร"
    }
  ];

  const copyToClipboard = (text, label) => {
    navigator.clipboard?.writeText(text);
    showToast(`คัดลอก ${label} แล้ว 📋`);
  };

  return (
    <div className="flex flex-col h-full max-h-[75vh]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-slate-500/10 text-slate-700 flex items-center justify-center">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">ศูนย์ช่วยเหลือ & คำถามพบบ่อย</h3>
            <p className="text-[11px] font-semibold text-slate-400">คำถามยอดนิยมและช่องทางติดต่อ</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 grid place-items-center text-slate-500 cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="py-4 space-y-3.5 overflow-y-auto style-scrollbar flex-1 pr-1">
        {/* FAQs */}
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/70 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-3 text-left flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100/60 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="h-3.5 w-3.5 text-slate-400 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
              </button>
              {openFaq === idx && (
                <div className="px-3 pb-3 pt-1 text-[11.5px] font-medium text-slate-600 border-t border-slate-100 bg-white">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2.5">
          <p className="text-xs font-black text-indigo-900">ติดต่อทีมงาน FoodCare</p>
          <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-indigo-100 text-xs">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5 truncate mr-2">
              <Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> support@foodcare.app
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard("support@foodcare.app", "อีเมลทีมงาน")}
              className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-[10.5px] flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Copy className="h-3 w-3" /> คัดลอก
            </button>
          </div>
          <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-indigo-100 text-xs">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5 truncate mr-2">
              💬 LINE Official: @foodcare
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard("@foodcare", "LINE ID")}
              className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-[10.5px] flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Copy className="h-3 w-3" /> คัดลอก
            </button>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
        >
          เข้าใจแล้ว
        </button>
      </div>
    </div>
  );
}

function ResetFridgeModal({ totalItems, isShared, householdName, onConfirm, onClose, isResetting }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-rose-600">ล้างข้อมูลระบบตู้เย็น</h3>
            <p className="text-[11px] font-semibold text-slate-400">ลบวัตถุดิบทั้งหมดในตู้เย็น</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 grid place-items-center text-slate-500 cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="py-4 space-y-3.5">
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 space-y-1.5">
          <p className="text-xs font-black flex items-center gap-1.5 text-rose-700">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" /> โปรดระวัง: การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </p>
          <p className="text-[11px] text-rose-600/90 leading-relaxed">
            รายการอาหารและวัตถุดิบทั้งหมด <span className="font-black text-rose-800">{totalItems} รายการ</span> จะถูกลบออกจาก
            {isShared ? `ตู้เย็นครอบครัว "${householdName}"` : "ตู้เย็นของคุณ"} อย่างถาวร
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>ตู้เย็นเป้าหมาย:</span>
            <span className="font-bold text-slate-800">{isShared ? `ครอบครัว (${householdName})` : "ตู้เย็นส่วนตัว"}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>จำนวนรายการที่จะถูกลบ:</span>
            <span className="font-black text-rose-600">{totalItems} ชิ้น</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={isResetting}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isResetting}
          className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-xs font-black shadow-md shadow-rose-500/25 hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isResetting ? (
            <span>กำลังล้างข้อมูล...</span>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              <span>ยืนยันล้างตู้เย็น</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Dashboard;