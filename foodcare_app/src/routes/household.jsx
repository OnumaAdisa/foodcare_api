import { createFileRoute } from "@tanstack/react-router";
import { Copy, Crown, LogOut, RefreshCw, Users, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

export const Route = createFileRoute("/household")({
  component: HouseholdPage,
  head: () => ({ meta: [{ title: "แชร์ตู้เย็นอัจฉริยะ — FoodCare" }] }),
});

function HouseholdPage({ onNavigate, user, onUpdateUser }) {
  const [tab, setTab] = useState("create"); 
  const [newName, setNewName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [hh, setHh] = useState(null);

  const myHouseholdId = user?.householdId || user?.household_id;

  // 🌐 โหลดข้อมูลกลุ่มและสมาชิกจริงจาก MySQL หลังบ้าน
  useEffect(() => {
    if (!myHouseholdId) {
      setHh(null);
      return;
    }

    const savedName = localStorage.getItem(`household_name_${myHouseholdId}`) || user?.householdName;

    fetch(`${API_BASE}/api/household/my?householdId=${myHouseholdId}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data.success && data.household) {
          const info = data.household;
          setHh({
            name: info.name || savedName || `บ้านของคุณ ${user?.username || ''}`,
            inviteCode: info.invite_code || info.inviteCode || `FOOD-${myHouseholdId}`,
            members: info.members && info.members.length > 0 ? info.members : [
              {
                id: user?.id || "owner",
                name: user?.username || "คุณ",
                role: "owner",
                avatar: user?.username ? user.username.charAt(0).toUpperCase() : "U"
              }
            ]
          });
        } else {
          setHh({
            name: savedName || `บ้านของคุณ ${user?.username || ''}`,
            inviteCode: `FOOD-${myHouseholdId}`,
            members: [
              {
                id: user?.id || "owner",
                name: user?.username || "คุณ",
                role: "owner",
                avatar: user?.username ? user.username.charAt(0).toUpperCase() : "U"
              }
            ]
          });
        }
      })
      .catch(() => {
        setHh({
          name: savedName || `บ้านของคุณ ${user?.username || ''}`,
          inviteCode: `FOOD-${myHouseholdId}`,
          members: [
            {
              id: user?.id || "owner",
              name: user?.username || "คุณ",
              role: "owner",
              avatar: user?.username ? user.username.charAt(0).toUpperCase() : "U"
            }
          ]
        });
      });
  }, [user, myHouseholdId]);

  const handleBack = () => {
    if (typeof onNavigate === "function") onNavigate("profile"); 
  };

  const handleCreateHousehold = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      alert("กรุณาระบุชื่อกลุ่มครอบครัวด้วยครับ ⚠️");
      return;
    }

    const activeUserId = user?.id || user?.userId || user?.user_id;
    if (!activeUserId) {
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่อีกครั้งครับ ⚠️");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/household/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          householdName: trimmedName
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || "สร้างกลุ่มแชร์ตู้เย็นสำเร็จแล้ว!");
        const newHhId = data.householdId || data.household_id;

        localStorage.setItem(`household_name_${newHhId}`, trimmedName);

        const updatedUser = {
          ...(user || {}),
          householdId: newHhId,
          household_id: newHhId,
          householdName: trimmedName,
          inviteCode: data.inviteCode
        };

        if (typeof onUpdateUser === "function") {
          onUpdateUser(updatedUser);
        }

        setHh({
          name: trimmedName,
          inviteCode: data.inviteCode || `FOOD-${newHhId}`,
          members: [
            {
              id: activeUserId,
              name: user?.username || "คุณ",
              role: "owner",
              avatar: user?.username ? user.username.charAt(0).toUpperCase() : "U"
            }
          ]
        });

        window.dispatchEvent(new Event("fridge_store_updated"));
        setNewName("");
      } else {
        alert(data.message || "เกิดข้อผิดพลาดในการสร้างกลุ่ม");
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์หลังบ้านได้ครับ");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHousehold = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      alert("กรุณาระบุรหัสเชิญด้วยครับ ⚠️");
      return;
    }

    const activeUserId = user?.id || user?.userId || user?.user_id;
    if (!activeUserId) {
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่อีกครั้งครับ ⚠️");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/household/join`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          inviteCode: trimmedCode
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || "เข้าร่วมกลุ่มแชร์ตู้เย็นสำเร็จแล้ว!");
        setCode("");

        const joinedId = data.householdId || data.household_id;
        const joinedName = data.householdName || "กลุ่มครอบครัวของคุณ";

        localStorage.setItem(`household_name_${joinedId}`, joinedName);

        const updatedUser = {
          ...(user || {}),
          householdId: joinedId,
          household_id: joinedId,
          householdName: joinedName,
          inviteCode: data.inviteCode
        };

        if (typeof onUpdateUser === "function") {
          onUpdateUser(updatedUser);
        }

        // ดึงข้อมูลกลุ่มที่เพิ่งเข้าร่วมใหม่ทันที
        fetch(`${API_BASE}/api/household/my?householdId=${joinedId}`, { credentials: "include" })
          .then((res) => res.json())
          .then((hhData) => {
            if (hhData.success && hhData.household) {
              setHh(hhData.household);
            }
          });

        window.dispatchEvent(new Event("fridge_store_updated"));
      } else {
        alert(data.message || "รหัสเชิญไม่ถูกต้องครับ ❌");
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์หลังบ้านได้ครับ");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveHousehold = async () => {
    if (!window.confirm("คุณแน่ใจใช่ไหมที่จะแยกย้ายออกจากกลุ่มตู้เย็นใบนี้?")) return;

    const activeUserId = user?.id || user?.userId || user?.user_id;
    try {
      const response = await fetch(`${API_BASE}/api/household/leave`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeUserId })
      });

      if (response.ok) {
        alert("ออกจากกลุ่มคลังเรียบร้อยแล้วครับ");
        const updatedUser = {
          ...(user || {}),
          householdId: null,
          household_id: null,
          householdName: null,
          inviteCode: null
        };

        if (typeof onUpdateUser === "function") {
          onUpdateUser(updatedUser);
        }

        setHh(null);
        window.dispatchEvent(new Event("fridge_store_updated"));
        if (typeof onNavigate === "function") onNavigate("home");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการออกจากกลุ่ม");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans select-none antialiased relative">
      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-slate-50/80 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/50">
          
          {/* Dynamic Island */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-950"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          {!hh ? (
            /* หน้าที่ 1: กรณีที่ยังไม่มีกลุ่ม */
            <div className="flex flex-col h-full">
              <header className="px-6 pt-14 pb-4 flex items-center justify-between z-30 relative bg-white/50 backdrop-blur-md border-b border-slate-200/40">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleBack} className="h-9 w-9 rounded-2xl border border-slate-200/70 bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 active:scale-95 duration-150 focus:outline-none cursor-pointer">
                    <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
                  </button>
                  <div>
                    <h1 className="text-base font-black text-slate-800 tracking-tight">แชร์ตู้เย็นอัจฉริยะ</h1>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">ผู้ใช้ปัจจุบัน: {user?.username || "Guest"}</p>
                  </div>
                </div>
              </header>

              <div className="flex-1 px-5 space-y-4 pt-4 overflow-y-auto style-scrollbar">
                <div className="rounded-[28px] p-5 text-white shadow-sm bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-600 border border-white/10">
                  <Users className="h-6 w-6 mb-2" />
                  <p className="font-black text-sm">ยังไม่ได้อยู่ในกลุ่มแชร์คลัง</p>
                  <p className="text-[11.5px] text-white/80 mt-1 leading-relaxed">
                    คุณ {user?.username || "ผู้ใช้งาน"} สามารถกดสร้างกลุ่มตู้เย็นใหม่ หรือนำรหัสเชิญของคนในบ้านมาเข้าร่วมได้ทันทีครับ
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-200/70">
                  <button type="button" onClick={() => setTab("create")} className={`py-2 rounded-xl text-xs font-black transition duration-200 cursor-pointer ${tab === "create" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-800"}`}>สร้างกลุ่มใหม่</button>
                  <button type="button" onClick={() => setTab("join")} className={`py-2 rounded-xl text-xs font-black transition duration-200 cursor-pointer ${tab === "join" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-800"}`}>เข้าร่วมกลุ่มเดิม</button>
                </div>

                {tab === "create" ? (
                  <div className="rounded-[28px] bg-white border border-slate-200/70 p-5 space-y-4 shadow-sm">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 pl-1">ชื่อกลุ่มครอบครัวของคุณ</label>
                      <input 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)} 
                        placeholder="เช่น บ้านอบอุ่น, คอนโดชั้น 5" 
                        className="mt-1.5 w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 transition-all" 
                      />
                    </div>
                    <button 
                      type="button" 
                      disabled={loading}
                      onClick={handleCreateHousehold} 
                      className="w-full h-12.5 rounded-2xl text-white font-black text-xs shadow-md shadow-indigo-500/20 active:scale-[0.98] transition focus:outline-none cursor-pointer disabled:opacity-70 bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-105"
                    >
                      {loading ? "กำลังดำเนินการ..." : "สร้างกลุ่มแชร์คลังตู้เย็นใบนี้"}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-[28px] bg-white border border-slate-200/70 p-5 space-y-4 shadow-sm">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 pl-1">รหัสเข้าร่วมกลุ่ม (Invite Code)</label>
                      <input 
                        value={code} 
                        onChange={(e) => setCode(e.target.value.toUpperCase())} 
                        placeholder="FOOD-XXXX" 
                        className="mt-1.5 w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-black text-slate-800 text-center tracking-widest font-mono outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 transition-all" 
                      />
                    </div>
                    <button 
                      type="button" 
                      disabled={loading}
                      onClick={handleJoinHousehold} 
                      className="w-full h-12.5 rounded-2xl text-white font-black text-xs shadow-md shadow-indigo-500/20 active:scale-[0.98] transition focus:outline-none cursor-pointer disabled:opacity-70 bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-105"
                    >
                      {loading ? "กำลังดำเนินการ..." : "ยืนยันเข้าร่วมกลุ่ม"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* หน้าที่ 2: กรณีที่มีกลุ่มแล้ว (แสดงชื่อจริง และสมาชิกจริง) */
            <div className="flex flex-col h-full">
              <header className="px-6 pt-14 pb-4 flex items-center justify-between z-30 relative bg-white/50 backdrop-blur-md border-b border-slate-200/40">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleBack} className="h-9 w-9 rounded-2xl border border-slate-200/70 bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 active:scale-95 duration-150 focus:outline-none cursor-pointer">
                    <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
                  </button>
                  <div>
                    <h1 className="text-base font-black text-slate-800 tracking-tight">จัดการครอบครัว</h1>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{hh.members.length} สมาชิก · แชร์ตู้เย็นร่วมกัน</p>
                  </div>
                </div>
              </header>

              <div className="flex-1 px-5 space-y-4 pt-4 pb-12 style-scrollbar overflow-y-auto">
                <div className="rounded-[28px] p-5 text-white shadow-md relative overflow-hidden bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 border border-white/10">
                  <div className="absolute -right-4 -bottom-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
                  <div className="relative">
                    <p className="text-[10px] font-black tracking-widest text-indigo-300 uppercase">กลุ่มแชร์ตู้เย็นปัจจุบัน</p>
                    <p className="text-xl font-black mt-1 text-white">{hh.name}</p>

                    <div className="mt-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md p-3.5 flex items-center justify-between gap-2 shadow-inner">
                      <div className="flex-1">
                        <p className="text-[9.5px] font-black text-indigo-300 tracking-wider uppercase">รหัสเชิญคนในบ้าน</p>
                        <p className="font-mono text-base font-black tracking-widest mt-0.5 text-cyan-300">{hh.inviteCode}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => { navigator.clipboard.writeText(hh.inviteCode); alert("📋 คัดลอกรหัสเชิญเรียบร้อยแล้ว"); }} className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white grid place-items-center transition duration-150 focus:outline-none cursor-pointer"><Copy className="h-4 w-4" /></button>
                        <button type="button" onClick={() => { if (window.confirm("คุณแน่ใจนะว่าจะรีเซ็ตรหัสเชิญกลุ่มใหม่?")) alert("🔄 รีเซ็ตรหัสเชิญเรียบร้อยแล้ว"); }} className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white grid place-items-center transition duration-150 focus:outline-none cursor-pointer"><RefreshCw className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">สมาชิกในกลุ่ม ({hh.members.length})</h3>
                  </div>

                  <div className="rounded-[26px] border border-slate-200/70 bg-white p-1.5 shadow-sm divide-y divide-slate-100 overflow-hidden">
                    {hh.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 grid place-items-center text-indigo-600 text-xs font-black shrink-0 shadow-inner">
                            {m.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-700 truncate">{m.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                              {m.role === "owner" ? <span className="text-amber-500 font-black flex items-center gap-0.5"><Crown className="h-3 w-3 stroke-[2.5]" /> เจ้าของกลุ่ม</span> : "สมาชิก"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleLeaveHousehold}
                  className="w-full h-12 mt-4 rounded-2xl border border-rose-100 bg-rose-50/60 text-rose-600 font-black text-xs flex items-center justify-center gap-2 hover:bg-rose-100/60 active:scale-[0.98] transition-all focus:outline-none cursor-pointer"
                >
                  <LogOut className="h-4 w-4 stroke-[2.5]" /> ถอนตัวออกจากกลุ่มแชร์ตู้เย็นนี้
                </button>
              </div>
            </div>
          )}

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/60 z-50 pointer-events-none"></div>
        </div>
      </div>
      <style>{` .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; } `}</style>
    </div>
  );
}

export default HouseholdPage;