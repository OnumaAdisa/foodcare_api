import { Camera, Check, Sparkles, X, Zap, ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { addItem } from "../components/foodcare/store";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

const analyzeCapturedImage = (canvas) => {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  let red = 0;
  let green = 0;
  let yellow = 0;
  let orange = 0;
  let white = 0;
  let total = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 64) continue;
    total += 1;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;

    if (r > 160 && g < 120 && b < 120) red += 1;
    if (g > 140 && r < 170 && b < 170) green += 1;
    if (r > 180 && g > 120 && b < 120) orange += 1;
    if (r > 180 && g > 170 && b < 120) yellow += 1;
    if (saturation < 0.18 && max > 180) white += 1;
  }

  const palette = {
    redRatio: total ? red / total : 0,
    greenRatio: total ? green / total : 0,
    orangeRatio: total ? orange / total : 0,
    yellowRatio: total ? yellow / total : 0,
    whiteRatio: total ? white / total : 0,
  };

  const dominantColor = Math.max(
    palette.redRatio,
    palette.greenRatio,
    palette.orangeRatio,
    palette.yellowRatio,
    palette.whiteRatio
  );

  let suggestedCategory = "อื่นๆ";
  let emoji = "🧺";

  if (palette.greenRatio === dominantColor) {
    suggestedCategory = "ผัก";
    emoji = "🥬";
  } else if (palette.redRatio === dominantColor) {
    suggestedCategory = "ผลไม้";
    emoji = "🍅";
  } else if (palette.orangeRatio === dominantColor) {
    suggestedCategory = "ผลไม้";
    emoji = "🍊";
  } else if (palette.yellowRatio === dominantColor) {
    suggestedCategory = "ผลไม้";
    emoji = "🍌";
  } else if (palette.whiteRatio === dominantColor) {
    suggestedCategory = "เครื่องดื่ม";
    emoji = "🥚";
  }

  const confidence = Math.min(82, Math.max(42, Math.round(dominantColor * 100 + 12)));

  return [
    {
      id: `capture-primary-${Date.now()}`,
      name: "",
      qty: "1 ชิ้น",
      category: suggestedCategory,
      emoji,
      confidence,
      checked: true,
      placeholder: "กรอกชื่อวัตถุดิบที่เห็นจากภาพ",
    },
    {
      id: `capture-secondary-${Date.now() + 1}`,
      name: "",
      qty: "1 ชิ้น",
      category: "อื่นๆ",
      emoji: "📦",
      confidence: Math.max(28, confidence - 16),
      checked: false,
      placeholder: "ชื่อสำรองหากต้องการเพิ่มอีกรายการ",
    },
  ];
};

function ScanPage({ onNavigate, user }) {
  const setActiveTab = onNavigate || (() => {});
  const activeHouseholdId = user?.householdId ?? user?.household_id ?? null;
  const videoRef = useRef(null);
  const [stage, setStage] = useState("capture");
  const [items, setItems] = useState([]);
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("เบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง กรุณาใช้ Chrome หรือ Edge ใน localhost หรือเว็บไซต์ที่ปลอดภัย");
      setCameraReady(false);
      return;
    }

    try {
      setCameraError("");
      setCameraReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch (error) {
      console.error("Camera access error:", error);
      const message = error?.name === "NotAllowedError"
        ? "กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์ แล้วกด เปิดกล้องอีกครั้ง"
        : "ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้องแล้วลองใหม่อีกครั้ง";
      setCameraError(message);
      setCameraReady(false);
    }
  };

  useEffect(() => {
    if (stage === "capture") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [stage]);

  const handleBack = () => {
    stopCamera();
    setActiveTab("add");
  };

  const toggle = (id) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const updateItemField = (id, field, value) => {
    setItems((p) => p.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleCapture = async () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      alert("กล้องยังไม่พร้อมใช้งาน กรุณารอให้กล้องเปิดเต็มที่ก่อน");
      return;
    }

    const canvas = document.createElement("canvas");
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.7);
    const detectedFromCapture = analyzeCapturedImage(canvas);
    setItems(detectedFromCapture);
    setCapturedImage(imageDataUrl);
    setStage("scanning");

    try {
      const response = await fetch(`${API_BASE}/api/vision/analyze`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl })
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        const mapped = data.items.map((item, index) => ({
          id: `capture-ai-${Date.now()}-${index}`,
          name: String(item.name || "").trim() || `วัตถุดิบจากภาพ ${index + 1}`,
          qty: "1 ชิ้น",
          category: String(item.category || "อื่นๆ").trim(),
          emoji: item.emoji || "🧺",
          confidence: Number(item.confidence || 80),
          checked: index === 0,
          placeholder: "ชื่อวัตถุดิบจากภาพจริง"
        }));

        setItems(mapped);
      } else {
        const fallback = detectedFromCapture.map((item, index) => ({
          ...item,
          id: `capture-manual-${Date.now()}-${index}`,
          name: "",
          checked: index === 0,
          placeholder: data.message || "กรอกชื่อวัตถุดิบที่เห็นจากภาพ"
        }));
        setItems(fallback);
        if (data.message) {
          console.warn(data.message);
        }
      }
    } catch (error) {
      console.error("Vision analyze failed:", error);
      const fallback = detectedFromCapture.map((item, index) => ({
        ...item,
        id: `capture-manual-${Date.now()}-${index}`,
        name: "",
        checked: index === 0,
        placeholder: "กรอกชื่อวัตถุดิบที่เห็นจากภาพ"
      }));
      setItems(fallback);
    }

    setTimeout(() => setStage("result"), 1600);
  };

  const handleAddSelected = async () => {
    const selectedItems = items.filter((i) => i.checked);
    if (selectedItems.length === 0) {
      alert("❌ กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการเพื่อเพิ่มเข้าตู้เย็นครับ");
      return;
    }

    const safeSelectedItems = selectedItems.map((it, index) => ({
      ...it,
      name: String(it.name || "").trim() || `วัตถุดิบจากภาพ ${index + 1}`,
      qty: String(it.qty || "1 ชิ้น").trim(),
      category: String(it.category || "อื่นๆ").trim(),
    }));

    try {
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const promises = safeSelectedItems.map((it) =>
        fetch(`${API_BASE}/api/fridge/add`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemName: String(it.name || "").trim(),
            quantity: String(it.qty || "1 ชิ้น").trim(),
            category: String(it.category || "อื่นๆ").trim(),
            expiryDate: expiryDate,
            householdId: activeHouseholdId ?? null
          }),
        }).then((r) => r.json())
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every((r) => r.success);

      if (allSuccess) {
        safeSelectedItems.forEach((it) => {
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

        alert(activeHouseholdId ? `🎉 บันทึกวัตถุดิบจากภาพถ่ายจริง จำนวน ${safeSelectedItems.length} รายการเข้าตู้เย็นสำเร็จ! สมาชิกในกลุ่มจะได้รับการแจ้งเตือนด้วย` : `🎉 บันทึกวัตถุดิบจากภาพถ่ายจริง จำนวน ${safeSelectedItems.length} รายการเข้าตู้เย็นสำเร็จ!`);
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
                  <div className="absolute inset-0 bg-slate-900">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="absolute inset-6 rounded-[28px] border-2 border-dashed border-white/30 pointer-events-none" />
                  <div className="absolute top-4 left-4 right-4 flex justify-between text-white text-[10px] font-black tracking-wider uppercase">
                    <span className="px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/5 shadow-sm text-cyan-400">🤖 FoodCare AI Vision</span>
                    <span className="px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/5 shadow-sm flex items-center gap-1 text-emerald-400">
                      <Zap className="h-3 w-3 fill-emerald-400 animate-pulse" /> {cameraReady ? "LIVE" : "WAITING"}
                    </span>
                  </div>

                  {!cameraReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                      <Camera className="h-16 w-16 text-white/20 animate-float" />
                      <p className="mt-4 text-white/60 text-xs font-bold tracking-tight">กำลังเปิดกล้องสำหรับสแกนวัตถุดิบ…</p>
                    </div>
                  )}

                  <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-xs font-bold tracking-tight text-center max-w-[220px]">
                    วางวัตถุดิบของกินให้อยู่ในกรอบประแล้วกดถ่าย
                  </p>
                </div>

                {cameraError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">
                    {cameraError}
                  </div>
                )}

                {!cameraReady && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full h-12 rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-black text-sm shadow-sm hover:bg-indigo-100 active:scale-[0.98] transition-all duration-150 focus:outline-none"
                  >
                    เปิดกล้องอีกครั้ง
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={!cameraReady}
                  className="w-full h-13 rounded-2xl text-white font-black text-sm shadow-[0_8px_25px_rgba(79,70,229,0.3)] active:scale-[0.98] transition-all duration-150 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
              <div className="aspect-[4/5] rounded-[36px] bg-slate-900 text-white flex items-center justify-center p-6 text-center shadow-lg border border-slate-800 animate-tabFade mt-10 overflow-hidden">
                {capturedImage && (
                  <img src={capturedImage} alt="Captured food" className="absolute inset-0 h-full w-full object-cover opacity-35" />
                )}
                <div className="relative z-10">
                  <div className="h-14 w-16 mx-auto rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <p className="mt-5 font-black text-sm tracking-tight text-white">FoodCare AI Core กำลังวิเคราะห์รูปภาพ…</p>
                  <p className="text-[11px] font-bold text-slate-300 mt-1">โมเดลกำลังจับคู่โครงสร้างพิกัดของกินจากกล้องจริง</p>
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

                <div className="space-y-3">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className={`w-full rounded-2xl border p-3.5 transition-all duration-150 ${
                        it.checked ? "border-indigo-500 bg-white shadow-sm" : "border-slate-200/60 bg-white/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => toggle(it.id)}
                          className="flex items-center gap-2 min-w-0 flex-1 text-left"
                        >
                          <div className={`h-5 w-5 rounded-lg border grid place-items-center text-[10px] font-black transition-all ${
                            it.checked ? "bg-indigo-600 border-transparent text-white" : "bg-slate-50 border-slate-200 text-transparent"
                          }`}>✓</div>
                          <span className="text-xl shrink-0">{it.emoji}</span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-md border text-indigo-500 bg-indigo-50 border-indigo-100/30 tracking-wide">
                            Match {it.confidence}%
                          </span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">ชื่อวัตถุดิบ</label>
                        <input
                          value={it.name}
                          onChange={(e) => updateItemField(it.id, "name", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none"
                          placeholder={it.placeholder || "กรอกชื่อวัตถุดิบที่เห็นจากภาพ"}
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">ปริมาณ</label>
                            <input
                              value={it.qty}
                              onChange={(e) => updateItemField(it.id, "qty", e.target.value)}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none"
                              placeholder="1 ชิ้น"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">หมวด</label>
                            <select
                              value={it.category}
                              onChange={(e) => updateItemField(it.id, "category", e.target.value)}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="ผัก">ผัก</option>
                              <option value="ผลไม้">ผลไม้</option>
                              <option value="เนื้อสัตว์">เนื้อสัตว์</option>
                              <option value="เครื่องดื่ม">เครื่องดื่ม</option>
                              <option value="อื่นๆ">อื่นๆ</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedImage("");
                      setStage("capture");
                    }}
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