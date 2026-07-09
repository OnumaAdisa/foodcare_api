import { createFileRoute } from "@tanstack/react-router";
import { Copy, Crown, LogOut, RefreshCw, Trash2, UserPlus, Users, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/household")({
  component: HouseholdPage,
  head: () => ({ meta: [{ title: "แชร์ตู้เย็นอัจฉริยะ — FoodCare" }] }),
});

function HouseholdPage({ onNavigate, user }) {
  const [tab, setTab] = useState("create"); 
  const [newName, setNewName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // แกะรอยไอดีกลุ่มบ้านให้รองรับทั้ง CamelCase และ snake_case จากฐานข้อมูลจริง
  const myHouseholdId = user?.householdId || user?.household_id;
  const [hh, setHh] = useState(null);

  useEffect(() => {
    if (myHouseholdId && myHouseholdId !== null) {
      setHh({
        name: `บ้านอบอุ่นคุณ${user?.username || "อ้น"} 🏡`,
        inviteCode: `FOOD-${myHouseholdId}026`,
        members: [
          { id: "m1", name: `คุณ${user?.username || "อ้น"}`, role: "owner", avatar: user?.username ? user.username.charAt(0).toUpperCase() : "อ" },
          { id: "m2", name: "คนในบ้าน A", role: "member", avatar: "A" },
          { id: "m3", name: "คนในบ้าน B", role: "member", avatar: "B" },
        ]
      });
    } else {
      setHh(null);
    }
  }, [user, myHouseholdId]);

  const handleBack = () => {
    if (typeof onNavigate === "function") onNavigate("profile"); 
  };

  // 🌐 1. แก้ไขอย่างสมบูรณ์: ดึงสิทธิ์ไอดีจากทุกตัวแปรป้องกันบั๊กเซสชันว่างเปล่า
  const handleCreateHousehold = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      alert("กรุณาระบุชื่อกลุ่มครอบครัวด้วยคราบบบ ⚠️");
      return;
    }

    // ดักจับหาไอดีแท้จริงจาก MySQL (user_id) หรือเซสชันหน้าบ้าน (id / userId)
    const activeUserId = user?.id || user?.userId || user?.user_id;

    if (!activeUserId) {
      alert("ไม่พบข้อมูลเซสชันผู้ใช้ กรุณาล็อกอินใหม่คราบบบ ⚠️");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8080/api/household/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          householdName: trimmedName
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message);
        setNewName("");
        
        // อัปเดตสิทธิ์กลุ่มบ้านลงเซสชันกลางทันทีก่อน Re-render สลับหน้า
        if (user) {
          user.householdId = data.householdId;
          user.household_id = data.householdId;
        }
        if (typeof onNavigate === "function") onNavigate("home");
      } else {
        alert(data.message || "เกิดข้อผิดพลาดในการสร้างกลุ่ม");
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์หลังบ้านได้ครับ");
    }
  };

  // 🌐 2. แก้ไขอย่างสมบูรณ์: ดึงสิทธิ์ไอดีจากทุกตัวแปรตอนกดเข้าร่วมกลุ่มด้วยรหัสเชิญ
  const handleJoinHousehold = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      alert("กรุณาระบุรหัสเชิญเช็คสต็อกด้วยคราบบบ ⚠️");
      return;
    }

    const activeUserId = user?.id || user?.userId || user?.user_id;

    if (!activeUserId) {
      alert("ไม่พบข้อมูลเซสชันผู้ใช้ กรุณาล็อกอินใหม่คราบบบ ⚠️");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8080/api/household/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          inviteCode: trimmedCode
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message);
        setCode("");

        if (user) {
          user.householdId = data.householdId;
          user.household_id = data.householdId;
        }
        if (typeof onNavigate === "function") onNavigate("home");
      } else {
        alert(data.message || "รหัสเชิญไม่ถูกต้องคราบบบ ❌");
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์หลังบ้านได้ครับ");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-emerald-50 flex items-center justify-center p-4 font-sans select-none antialiased relative">
      
      <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-br from-blue-400/15 to-sky-400/0 rounded-full blur-[140px] animate-pulse"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[600px] h-[600px] bg-gradient-to-tr from-emerald-400/10 to-teal-400/0 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }}></div>

      <div className="relative z-10 w-full max-w-[390px]">
        <div className="w-full h-[844px] bg-slate-50/70 backdrop-blur-3xl rounded-[60px] border-4 border-slate-900/90 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.3)] flex flex-col relative overflow-hidden ring-1 ring-white/40">
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-4 z-50 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <div className="w-12 h-1 rounded-full bg-slate-950"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/20"></div>
          </div>

          {!hh ? (
            <div className="flex flex-col h-full">
              <header className="px-6 pt-14 pb-4 flex items-center justify-between z-30 relative bg-white/40 backdrop-blur-md border-b border-slate-200/30">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleBack} className="h-9 w-9 rounded-xl border border-slate-200/50 bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-90 duration-150 focus:outline-none">
                    <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
                  </button>
                  <div>
                    <h1 className="text-base font-black text-slate-800 tracking-tight">แชร์ตู้เย็นอัจฉริยะ</h1>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">คลังของยูสเซอร์: {user?.username || "Guest"}</p>
                  </div>
                </div>
              </header>

              <div className="flex-1 px-5 space-y-4 pt-4 overflow-y-auto style-scrollbar">
                <div className="rounded-3xl p-5 text-white shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-700">
                  <Users className="h-6 w-6 mb-2" />
                  <p className="font-black text-sm">ยังไม่ได้อยู่ในกลุ่มแชร์คลัง</p>
                  <p className="text-[11px] text-white/80 mt-1 leading-normal">เนื่องจากคุณบัญชีคุณ {user?.username || "ผู้ใช้งาน"} พิ่งสมัครสมาชิกเข้ามาใหม่ สามารถกดสร้างกลุ่ม หรือเข้าร่วมตู้เย็นใบเดิมของคนในบ้านได้เลยคราบบบ</p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-200/60">
                  <button type="button" onClick={() => setTab("create")} className={`py-2.5 rounded-xl text-xs font-black transition duration-200 ${tab === "create" ? "bg-white shadow-sm text-slate-800" : "text-slate-400"}`}>สร้างกลุ่มใหม่</button>
                  <button type="button" onClick={() => setTab("join")} className={`py-2.5 rounded-xl text-xs font-black transition duration-200 ${tab === "join" ? "bg-white shadow-sm text-slate-800" : "text-slate-400"}`}>เข้าร่วมกลุ่มเดิม</button>
                </div>

                {tab === "create" ? (
                  <div className="rounded-3xl bg-white border border-slate-200/60 p-4.5 space-y-4 shadow-sm">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">ชื่อกลุ่มครอบครัวของคุณ</label>
                      <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="เช่น บ้านอบอุ่นคุณอ้น, คอนโดชั้น 5" className="mt-1.5 w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200/50 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                    </div>
                    <button type="button" onClick={handleCreateHousehold} className="w-full h-12 rounded-xl text-white font-black text-xs shadow-md shadow-indigo-500/10 active:scale-[0.98] transition focus:outline-none" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" }}>สร้างกลุ่มแชร์คลังตู้เย็นใบนี้</button>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-white border border-slate-200/60 p-4.5 space-y-4 shadow-sm">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">รหัสเข้าร่วมกลุ่ม (Invite Code)</label>
                      <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="FOOD-XXXX" className="mt-1.5 w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200/50 text-xs font-black text-slate-700 text-center tracking-widest font-mono outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                    </div>
                    <button type="button" onClick={handleJoinHousehold} className="w-full h-12 rounded-xl text-white font-black text-xs shadow-md shadow-indigo-500/10 active:scale-[0.98] transition focus:outline-none" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" }}>ยืนยันเข้าร่วมกลุ่ม</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <header className="px-6 pt-14 pb-4 flex items-center justify-between z-30 relative bg-white/40 backdrop-blur-md border-b border-slate-200/30">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleBack} className="h-9 w-9 rounded-xl border border-slate-200/50 bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-90 duration-150 focus:outline-none">
                    <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
                  </button>
                  <div>
                    <h1 className="text-base font-black text-slate-800 tracking-tight">จัดการครอบครัว</h1>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{hh.members.length} สมาชิก · แชร์ตู้เย็นร่วมกัน</p>
                  </div>
                </div>
              </header>

              <div className="flex-1 px-5 space-y-4 pt-4 pb-12 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50 relative">
                <div className="rounded-3xl p-5 text-white shadow-md relative overflow-hidden bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 border border-white/5">
                  <div className="absolute -right-4 -bottom-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
                  <div className="relative">
                    <p className="text-[10px] font-black tracking-widest text-indigo-300 uppercase">กลุ่มแชร์ตู้เย็นปัจจุบัน</p>
                    <p className="text-lg font-black mt-1 text-white">{hh.name}</p>

                    <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-3 flex items-center justify-between gap-2 shadow-inner">
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-indigo-300 tracking-wider uppercase">รหัสเชิญส่งต่อคนในบ้าน</p>
                        <p className="font-mono text-base font-black tracking-widest mt-1 text-cyan-300">{hh.inviteCode}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => { navigator.clipboard.writeText(hh.inviteCode); alert("📋 คัดลอกรหัสเชิญส่งต่อสำเร็จคราบบบ"); }} className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white grid place-items-center transition duration-150 focus:outline-none"><Copy className="h-4 w-4" /></button>
                        <button type="button" onClick={() => { if (window.confirm("คุณแน่ใจนะว่าจะรีเซ็ตรหัสเชิญกลุ่มใหม่?")) alert("🔄 ทำการสลับรีเซ็ตรหัสเชิญกลุ่มใหม่สำเร็จคราบบบ"); }} className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white grid place-items-center transition duration-150 focus:outline-none"><RefreshCw className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">รายชื่อสมาชิกแชร์คลัง</h3>
                    <button type="button" onClick={() => { const name = prompt("พิมพ์ระบุชื่อสมาชิกด่วนที่ต้องการดึงเข้าบ้าน:"); if (name?.trim()) alert(`📥 เพิ่มคุณ "${name.trim()}" เข้าร่วมวงสต็อกสำเร็จคราบบบ`); }} className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 focus:outline-none"><UserPlus className="h-3.5 w-3.5 stroke-[2.5]" /> เพิ่มคนในบ้าน</button>
                  </div>

                  <div className="rounded-3xl border border-slate-200/60 bg-white p-1.5 shadow-sm divide-y divide-slate-100 overflow-hidden">
                    {hh.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-100 grid place-items-center text-indigo-600 text-xs font-black shrink-0 shadow-inner">
                            {m.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-700 truncate">{m.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                              {m.role === "owner" ? <span className="text-amber-500 font-black flex items-center gap-0.5"><Crown className="h-3 w-3 stroke-[2.5]" /> หัวหน้าครอบครัว</span> : "สมาชิกตู้เย็น"}
                            </p>
                          </div>
                        </div>
                        {m.role !== "owner" && (
                          <button type="button" onClick={() => { if (window.confirm(`คุณแน่ใจใช่ไหมที่จะนำคุณ ${m.name} ออกจากกลุ่ม?`)) alert("🗑️ นำสมาชิกท่านนี้ออกจากสต็อกตู้เย็นเสร็จสิ้น"); }} className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg grid place-items-center active:scale-90 transition-all focus:outline-none"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 🌐 3. แก้ไข: ฟังก์ชันปุ่มถอนตัว ดึงไอดีแบบครอบคลุมลื่นไหล */}
                <button 
                  type="button" 
                  onClick={async () => { 
                    if (window.confirm("คุณแน่ใจใช่ไหมที่จะแยกย้ายออกจากกลุ่มตู้เย็นใบนี้?")) {
                      const activeUserId = user?.id || user?.userId || user?.user_id;
                      try {
                        const response = await fetch("http://127.0.0.1:8080/api/household/leave", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: activeUserId })
                        });
                        if (response.ok) {
                          alert("🚶 ออกจากกลุ่มคลังเรียบร้อยคราบบบ");
                          if (user) {
                            user.householdId = null;
                            user.household_id = null;
                          }
                          if (typeof onNavigate === "function") onNavigate("home");
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }
                  }} 
                  className="w-full h-12 mt-4 rounded-2xl border border-rose-100 bg-rose-50/50 text-rose-600 font-black text-xs flex items-center justify-center gap-2 hover:bg-rose-50 active:scale-[0.98] transition-all focus:outline-none"
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