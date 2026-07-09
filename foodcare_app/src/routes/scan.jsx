import { Camera, Check, Sparkles, X, Zap, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { addItem } from "../components/foodcare/store";

const mockDetected = [
  { id: "1", name: "มะเขือเทศ", qty: "4 ลูก", category: "ผลไม้", emoji: "🍅", confidence: 96, checked: true },
  { id: "2", name: "หอมหัวใหญ่", qty: "2 หัว", category: "ผัก", emoji: "🧅", confidence: 92, checked: true },
  { id: "3", name: "พริกหวาน", qty: "3 ลูก", category: "ผัก", emoji: "🫑", confidence: 88, checked: true },
  { id: "4", name: "กระเทียม", qty: "1 หัว", category: "ผัก", emoji: "🧄", confidence: 81, checked: false },
];

function ScanPage({ onNavigate }) {
  const setActiveTab = onNavigate || (() => {});
  const [stage, setStage] = useState("capture");
  const [items, setItems] = useState(mockDetected);

  const handleBack = () => {
    setActiveTab("add");
  };

  const toggle = (id) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const handleAddSelected = async () => {
    const selectedItems = items.filter((i) => i.checked);
    if (selectedItems.length === 0) {
      alert("❌ กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการเพื่อเพิ่มเข้าตู้เย็นครับ");
      return;
    }

    try {
      // ✅ ยิง API จริงทุกรายการพร้อมกัน
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const promises = selectedItems.map((it) =>
        fetch("http://127.0.0.1:8080/api/fridge/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemName: it.name,
            quantity: it.qty,
            category: it.category,
            expiryDate: expiryDate,
            householdId: 1
          }),
        }).then((r) => r.json())
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every((r) => r.success);

      if (allSuccess) {
        // ✅ บันทึก local store ด้วย
        selectedItems.forEach((it) => {
          addItem({
            id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: it.name,
            qty: it.qty,
            category: it.category,
            emoji: it.emoji,
            expiry: "7 วัน",
            date: expiryDate,
            percent: 100
          });
        });

        alert(`🎉 บันทึกวัตถุดิบผ่านระบบ AI Vision จำนวน ${selectedItems.length} รายการเข้าตู้เย็นสำเร็จ!`);
        setActiveTab("fridge");
      } else {
        alert("❌ บันทึกบางรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์หลังบ้านได้คราบบบ");
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
                <h1 className="text-base font-black text-slate-800 tracking-tight">สแกนวัตถุดิบอัจฉริยะ</h1>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">AI Computer Vision ตรวจจับคลัง</p>
              </div>
            </div>
          </header>

          <div className="flex-1 px-5 space-y-4 pt-4 pb-8 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50 relative">
            
            {stage === "capture" && (
              <div className="space-y-4 animate-tabFade">
                <div className="relative aspect-[4/5] rounded-[36px] overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
                  <div className="absolute inset-6 rounded-[28px] border-2 border-dashed border-white/30 pointer-events-none" />
                  <div className="absolute top-4 left-4 right-4 flex justify-between text-white text-[10px] font-black tracking-wider uppercase">
                    <span className="px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/5 shadow-sm text-cyan-400">🤖 FoodCare AI Vision</span>
                    <span className="px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/5 shadow-sm flex items-center gap-1 text-emerald-400">
                      <Zap className="h-3 w-3 fill-emerald-400 animate-pulse" /> CAMERA READY
                    </span>
                  </div>
                  <Camera className="h-16 w-16 text-white/20 animate-float" />
                  <p className="absolute bottom-6 text-white/50 text-xs font-bold tracking-tight">วางวัตถุดิบของกินให้อยู่ในกรอบประแล้วกดถ่าย</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStage("scanning");
                    setTimeout(() => setStage("result"), 1400);
                  }}
                  className="w-full h-13 rounded-2xl text-white font-black text-sm shadow-[0_8px_25px_rgba(79,70,229,0.3)] active:scale-[0.98] transition-all duration-150 focus:outline-none"
                  style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" }}
                >
                  ถ่ายภาพประมวลผลวัตถุดิบ
                </button>

                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 p-4 flex gap-3.5 shadow-sm">
                  <Sparkles className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-[11px] font-bold">
                    <p className="text-slate-800 font-black">💡 เคล็ดลับการเพิ่มความแม่นยำให้ตู้เย็น</p>
                    <p className="text-slate-400 leading-normal mt-0.5 font-medium">ควรจัดวางของสดไม่ให้วางซ้อนทับกัน และส่องถ่ายในจุดที่มีแสงสว่างเพียงพอ</p>
                  </div>
                </div>
              </div>
            )}

            {stage === "scanning" && (
              <div className="aspect-[4/5] rounded-[36px] bg-slate-900 text-white flex items-center justify-center p-6 text-center shadow-lg border border-slate-800 animate-tabFade mt-10">
                <div>
                  <div className="h-14 w-16 mx-auto rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <p className="mt-5 font-black text-sm tracking-tight text-white">FoodCare AI Core กำลังวิเคราะห์รูปภาพ…</p>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">โมเดลกำลังจับคู่โครงสร้างพิกัดของกินสแตนบายลงตะกร้า</p>
                </div>
              </div>
            )}

            {stage === "result" && (
              <div className="space-y-4 animate-tabFade">
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 p-3.5 flex items-center gap-3.5 shadow-sm">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white grid place-items-center shadow-md shrink-0">
                    <Check className="h-5 w-5 stroke-[3]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">Computer Vision ตรวจจับเสร็จสิ้น</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">ตรวจพบอาหารทั้งหมด <span className="text-emerald-600 font-black">{items.length} รายการ</span></p>
                  </div>
                </div>

                <div className="space-y-2">
                  {items.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => toggle(it.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-150 focus:outline-none ${
                        it.checked ? "border-indigo-500 bg-white shadow-sm scale-[1.02]" : "border-slate-200/60 bg-white/50 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className={`h-5 w-5 rounded-lg border grid place-items-center text-[10px] font-black transition-all ${
                          it.checked ? "bg-indigo-600 border-transparent text-white" : "bg-slate-50 border-slate-200 text-transparent"
                        }`}>✓</div>
                        <span className="text-xl shrink-0">{it.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-700 truncate">{it.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">ปริมาณวิเคราะห์: {it.qty}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-md border text-indigo-500 bg-indigo-50 border-indigo-100/30 tracking-wide">
                        Match {it.confidence}%
                      </span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStage("capture")}
                    className="h-12 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-black hover:bg-slate-50 flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    <X className="h-4 w-4 stroke-[2.5]" /> ถ่ายใหม่อีกครั้ง
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSelected}
                    className="h-12 rounded-xl text-white font-black text-xs shadow-md shadow-emerald-500/10 focus:outline-none"
                    style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                  >
                    เพิ่มวัตถุดิบเข้าตู้เย็นเลย
                  </button>
                </div>
              </div>
            )}

            <button type="button" onClick={() => setActiveTab("add")} className="w-full text-center text-[11px] font-black text-slate-400 hover:text-slate-600 transition-colors pt-2 block focus:outline-none">
              ❌ ยกเลิกสแกนและกลับไปกรอกข้อมูลเอง
            </button>
          </div>

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-400/60 z-50 pointer-events-none"></div>
        </div>
      </div>
      <style>{`
        .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default ScanPage;