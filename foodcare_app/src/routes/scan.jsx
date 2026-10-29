import { 
  Camera, 
  Check, 
  Sparkles, 
  X, 
  ArrowLeft, 
  Calendar, 
  Image as ImageIcon, 
  RefreshCw, 
  Lightbulb, 
  FlipHorizontal, 
  Trash2, 
  Plus, 
  Edit3 
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { addItem } from "../components/foodcare/store";
import { FoodIcon } from "../components/foodcare/foodIcons";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");

// ฟังก์ชันวิเคราะห์สีเบื้องต้นสำหรับเป็น Fallback (กรณีระบบ AI ตอบช้าหรือเน็ตหลุด)
const analyzeCapturedImage = (canvas) => {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  let red = 0, green = 0, yellow = 0, orange = 0, white = 0, total = 0;

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
    palette.redRatio, palette.greenRatio, palette.orangeRatio, palette.yellowRatio, palette.whiteRatio
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
  const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return [
    {
      id: `capture-primary-${Date.now()}`,
      name: "",
      qty: "1 ชิ้น",
      category: suggestedCategory,
      emoji,
      confidence,
      checked: true,
      placeholder: "กรอกชื่อของสดที่เห็นในภาพ",
      expiryDate: defaultExpiry,
      isUnknownExpiry: false
    }
  ];
};

function ScanPage({ onNavigate, user }) {
  const setActiveTab = onNavigate || (() => {});
  const localUser = (() => {
    try {
      const saved = localStorage.getItem("foodcare_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();
  const effectiveUser = user || localUser;
  const activeHouseholdId = effectiveUser?.householdId ?? effectiveUser?.household_id ?? null;
  const safeUserId = effectiveUser?.id ?? effectiveUser?.user_id ?? null;

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isStartingRef = useRef(false);
  const fileInputRef = useRef(null);

  const [stage, setStage] = useState("capture"); // "capture" | "scanning" | "result"
  const [items, setItems] = useState([]);
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // "environment" | "user"

  // ปิด Track ทั้งหมดของกล้อง
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  };

  // เปิดใช้งานกล้อง
  const startCamera = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("เบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง สามารถเลือกรูปภาพจากเครื่องแทนได้ครับ");
      setCameraReady(false);
      isStartingRef.current = false;
      return;
    }

    try {
      setCameraError("");
      setCameraReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        try {
          await videoRef.current.play();
        } catch (playErr) {
          if (playErr.name !== "AbortError") {
            console.warn("Video play interrupted:", playErr);
          }
        }
      }
      setCameraReady(true);
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Camera access error:", error);
        const message = error?.name === "NotAllowedError"
          ? "กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์ หรือเลือกรูปภาพจากเครื่องได้ครับ"
          : "ไม่สามารถเปิดกล้องได้ สามารถกดเปิดใหม่อีกครั้ง หรือเลือกภาพจากเครื่องแทนได้ครับ";
        setCameraError(message);
      }
      setCameraReady(false);
    } finally {
      isStartingRef.current = false;
    }
  };

  useEffect(() => {
    if (stage === "capture") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [stage, facingMode]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleBack = () => {
    stopCamera();
    setActiveTab("add");
  };

  // ฟังก์ชันวิเคราะห์ภาพแบบรวม (ทั้งจากการกดชัตเตอร์และอัปโหลดรูป)
  const processImage = async (imageDataUrl, canvas) => {
    const detectedFromCapture = analyzeCapturedImage(canvas);
    const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    stopCamera();
    setItems(detectedFromCapture);
    setCapturedImage(imageDataUrl);
    setStage("scanning");
    setVisionLoading(true);
    setVisionError(null);

    try {
      const response = await fetch(`${API_BASE}/api/vision/analyze`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl })
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(`เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (${response.status})`);
      }

      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        const mapped = data.items.map((item, index) => ({
          id: `capture-ai-${Date.now()}-${index}`,
          name: String(item.name || "").trim() || `ของสด ${index + 1}`,
          qty: "1 ชิ้น",
          category: String(item.category || "อื่นๆ").trim(),
          emoji: item.emoji || "🧺",
          confidence: Number(item.confidence || 90),
          checked: true,
          placeholder: "ระบุชื่อของสด",
          expiryDate: defaultExpiry,
          isUnknownExpiry: false
        }));
        setItems(mapped);
        setVisionError(null);
      } else {
        throw new Error(data.message || "ไม่สามารถวิเคราะห์ภาพได้ในขณะนี้");
      }
    } catch (error) {
      console.warn("Vision analyze warning, using manual fallback:", error.message);
      const isHighDemand = error.message?.includes("503") || error.message?.includes("high demand") || error.message?.includes("หนาแน่น");
      setVisionError(
        isHighDemand
          ? "ระบบวิเคราะห์อัตโนมัติมีผู้ใช้งานหนาแน่นชั่วคราว คุณสามารถพิมพ์ชื่อวัตถุดิบเอง หรือกดลองอีกครั้งได้ครับ"
          : (error.message || "ไม่สามารถวิเคราะห์ภาพอัตโนมัติได้ กรุณากรอกชื่อวัตถุดิบด้วยตนเอง")
      );
      const fallback = detectedFromCapture.map((item, index) => ({
        ...item,
        id: `capture-manual-${Date.now()}-${index}`,
        name: "",
        checked: true,
        placeholder: "กรอกชื่อของสดที่เห็นในภาพ"
      }));
      setItems(fallback);
    } finally {
      setVisionLoading(false);
      setTimeout(() => setStage("result"), 500);
    }
  };

  // ถ่ายภาพจากกล้อง
  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      alert("กล้องยังไม่พร้อมใช้งาน กรุณารอสักครู่");
      return;
    }

    const canvas = document.createElement("canvas");
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.75);

    processImage(imageDataUrl, canvas);
  };

  // เลือกรูปภาพจากเครื่อง
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSide = 1600;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.75);
        processImage(imageDataUrl, canvas);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRetryVision = async () => {
    if (!capturedImage) return;
    setStage("scanning");
    setVisionLoading(true);
    setVisionError(null);

    const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const response = await fetch(`${API_BASE}/api/vision/analyze`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedImage })
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(`เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (${response.status})`);
      }

      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        const mapped = data.items.map((item, index) => ({
          id: `capture-ai-${Date.now()}-${index}`,
          name: String(item.name || "").trim() || `ของสด ${index + 1}`,
          qty: "1 ชิ้น",
          category: String(item.category || "อื่นๆ").trim(),
          emoji: item.emoji || "🧺",
          confidence: Number(item.confidence || 90),
          checked: true,
          placeholder: "ระบุชื่อของสด",
          expiryDate: defaultExpiry,
          isUnknownExpiry: false
        }));
        setItems(mapped);
        setVisionError(null);
      } else {
        throw new Error(data.message || "วิเคราะห์ภาพไม่สำเร็จ");
      }
    } catch (error) {
      console.warn("Retry vision analyze warning:", error.message);
      const isHighDemand = error.message?.includes("503") || error.message?.includes("high demand") || error.message?.includes("หนาแน่น");
      setVisionError(
        isHighDemand
          ? "ระบบยังคงมีผู้ใช้งานหนาแน่นชั่วคราว คุณสามารถพิมพ์ชื่อวัตถุดิบเองได้เลยครับ"
          : (error.message || "ไม่สามารถวิเคราะห์ภาพอัตโนมัติได้")
      );
    } finally {
      setVisionLoading(false);
      setTimeout(() => setStage("result"), 500);
    }
  };

  const toggle = (id) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const updateItemField = (id, field, value) => {
    setItems((p) => p.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const setExpiryDays = (id, days) => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setItems((p) => p.map((item) => (item.id === id ? { ...item, expiryDate: d, isUnknownExpiry: false } : item)));
  };

  const removeItem = (id) => {
    setItems((p) => p.filter((item) => item.id !== id));
  };

  const addNewItem = () => {
    const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setItems((p) => [
      ...p,
      {
        id: `capture-manual-${Date.now()}`,
        name: "",
        qty: "1 ชิ้น",
        category: "อื่นๆ",
        emoji: "🧺",
        confidence: 100,
        checked: true,
        placeholder: "กรอกชื่อของสด",
        expiryDate: defaultExpiry,
        isUnknownExpiry: false
      }
    ]);
  };

  const handleAddSelected = async () => {
    const selectedItems = items.filter((i) => i.checked);
    if (selectedItems.length === 0) {
      alert("กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการเพื่อเพิ่มเข้าตู้เย็นครับ");
      return;
    }

    const safeSelectedItems = selectedItems.map((it, index) => ({
      ...it,
      name: String(it.name || "").trim() || `ของสด ${index + 1}`,
      qty: String(it.qty || "1 ชิ้น").trim(),
      category: String(it.category || "อื่นๆ").trim(),
      expiryDate: it.isUnknownExpiry ? null : it.expiryDate
    }));

    try {
      const promises = safeSelectedItems.map((it) =>
        fetch(`${API_BASE}/api/fridge/add`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(safeUserId ? { "Authorization": `Bearer ${safeUserId}` } : {})
          },
          body: JSON.stringify({
            itemName: it.name,
            quantity: it.qty,
            category: it.category,
            expiryDate: it.expiryDate,
            householdId: activeHouseholdId ?? null,
            userId: safeUserId
          }),
        })
        .then(async (r) => {
          try {
            const data = await r.json();
            return { ...data, status: r.status };
          } catch {
            return { success: false, message: `เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (${r.status})`, status: r.status };
          }
        })
        .catch((err) => ({ success: false, message: err.message || "เครือข่ายขัดข้อง" }))
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every((r) => r && r.success);

      if (allSuccess) {
        safeSelectedItems.forEach((it) => {
          addItem({
            id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: it.name,
            qty: it.qty,
            category: it.category,
            emoji: it.emoji,
            expiry: it.expiryDate ? "กำหนดเอง" : "ไม่ระบุ",
            date: it.expiryDate,
            percent: 100
          });
        });

        alert(activeHouseholdId ? ` บันทึกของสด ${safeSelectedItems.length} รายการเข้าตู้เย็นเรียบร้อย!` : ` บันทึกของสด ${safeSelectedItems.length} รายการเข้าตู้เย็นเรียบร้อย!`);
        setActiveTab("fridge");
      } else {
        const failedItem = results.find((r) => !r || !r.success);
        const errMsg = failedItem?.message || failedItem?.error || "บันทึกบางรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
        alert(`❌ ไม่สามารถบันทึกได้: ${errMsg}`);
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const selectedCount = items.filter((i) => i.checked).length;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-3 font-sans select-none antialiased text-slate-800">
      <div className="relative z-10 w-full max-w-[400px]">
        {/* Frame จำลองหน้าจอมือถือแบบพรีเมียม */}
        <div className="w-full h-[844px] bg-slate-50 rounded-[48px] border-4 border-slate-800/90 shadow-[0_30px_90px_-20px_rgba(15,23,42,0.25)] flex flex-col relative overflow-hidden ring-1 ring-black/5">
          
          {/* Dynamic Island / Speaker */}
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-slate-950 flex items-center justify-between px-3.5 z-50 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-slate-800"></div>
            <div className="w-10 h-1 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500/50 border border-emerald-400/30"></div>
          </div>

          {/* Header ด้านบน */}
          <header className="px-5 pt-13 pb-3 flex items-center justify-between z-30 relative bg-white/70 backdrop-blur-md border-b border-slate-200/60">
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={handleBack} 
                className="h-9 w-9 rounded-xl border border-slate-200/80 bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all focus:outline-none"
                title="ย้อนกลับ"
              >
                <ArrowLeft className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
              <div>
                <h1 className="text-base font-bold text-slate-800 tracking-tight">สแกนของสดเข้าตู้เย็น</h1>
                <p className="text-[11px] font-medium text-slate-500">ถ่ายรูปเพื่อบันทึกและจัดการวันหมดอายุ</p>
              </div>
            </div>
          </header>

          {/* เนื้อหาหน้าจอ */}
          <div className="flex-1 px-4 space-y-3.5 pt-3 pb-8 style-scrollbar overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/60 relative">
            
            {/* โหมดที่ 1: หน้าจอกล้องถ่ายภาพ */}
            {stage === "capture" && (
              <div className="space-y-4 animate-tabFade">
                
                {/* ช่องแสดงภาพกล้อง (Viewfinder) แบบเรียบหรู */}
                <div className="relative aspect-[3/4] w-full rounded-[30px] overflow-hidden bg-slate-950 border border-slate-800 shadow-xl flex items-center justify-center">
                  
                  {/* Video Stream */}
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`h-full w-full object-cover transition-opacity duration-300 ${cameraReady ? "opacity-100" : "opacity-0"}`}
                  />

                  {/* สถานะเมื่อกล้องยังไม่พร้อม */}
                  {!cameraReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-slate-950">
                      <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                        <Camera className="h-7 w-7 text-white/40 animate-pulse" />
                      </div>
                      <p className="text-white/80 text-xs font-semibold">กำลังเชื่อมต่อกล้อง...</p>
                      <p className="text-white/40 text-[10px] mt-1">กรุณาอนุญาตการเข้าถึงกล้องหากมีแจ้งเตือน</p>
                    </div>
                  )}

                  {/* กรอบเล็งกล้อง (Reticle Corners) ทรงโค้งมนสวยงาม */}
                  <div className="absolute inset-6 pointer-events-none">
                    <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-white/80 rounded-tl-xl shadow-xs" />
                    <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-white/80 rounded-tr-xl shadow-xs" />
                    <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-white/80 rounded-bl-xl shadow-xs" />
                    <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-white/80 rounded-br-xl shadow-xs" />
                    
                    {/* เส้นสแกนจำลองแบบนุ่มนวล */}
                    {cameraReady && (
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scanBeam opacity-75" />
                    )}
                  </div>

                  {/* แถบสถานะด้านบนของช่องกล้อง */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-auto">
                    <div className="px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cameraReady ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-amber-400"}`} />
                      <span className="text-[11px] font-medium text-white/90">
                        {cameraReady ? "กล้องพร้อมถ่าย" : "กำลังเปิด..."}
                      </span>
                    </div>

                    {/* ปุ่มสลับกล้องบนหน้าจอถ่าย */}
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="h-8 px-2.5 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-white/90 hover:bg-black/65 active:scale-95 transition-all text-xs"
                      title="สลับกล้องหน้า/หลัง"
                    >
                      <FlipHorizontal className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium">สลับกล้อง</span>
                    </button>
                  </div>

                  {/* ข้อความบอกตำแหน่งของสดด้านล่าง */}
                  <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 pointer-events-none">
                    <div className="px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-white/90 text-[11px] font-medium text-center shadow-lg whitespace-nowrap">
                      วางของสดให้อยู่ในระยะที่เห็นชัด
                    </div>
                  </div>
                </div>

                {/* ข้อความแสดงข้อผิดพลาดถ้าเปิดกล้องไม่ได้ */}
                {cameraError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-3.5 py-3 text-xs font-semibold text-rose-700 flex items-start gap-2 shadow-xs">
                    <span className="text-base shrink-0">⚠️</span>
                    <div className="flex-1">
                      <p>{cameraError}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition-all"
                        >
                          ลองเปิดกล้องใหม่
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold transition-all"
                        >
                          เลือกรูปจากเครื่อง
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* แผงควบคุมกล้องสไตล์สมาร์ทโฟน (Shutter Bar) */}
                <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-around">
                  
                  {/* ปุ่มเลือกภาพจากเครื่อง / แกลเลอรี */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-12 w-12 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 active:scale-95 transition-all flex items-center justify-center text-slate-700 shadow-xs focus:outline-none"
                      title="เลือกภาพจากคลังรูปภาพ"
                    >
                      <ImageIcon className="h-5 w-5 text-slate-600" />
                    </button>
                    <span className="text-[10px] font-medium text-slate-500 mt-1">คลังรูป</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* ปุ่มชัตเตอร์ถ่ายรูป (Camera Shutter Ring) */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={handleCapture}
                      disabled={!cameraReady}
                      className="h-17 w-17 rounded-full border-4 border-slate-300 hover:border-emerald-500 p-1 flex items-center justify-center transition-all duration-150 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed group focus:outline-none shadow-md"
                      title="กดเพื่อถ่ายรูป"
                    >
                      <div className="h-full w-full rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 group-hover:from-emerald-600 group-hover:to-teal-600 shadow-inner flex items-center justify-center text-white transition-all">
                        <Camera className="h-6 w-6 stroke-[2.2]" />
                      </div>
                    </button>
                    <span className="text-[10px] font-semibold text-slate-700 mt-1">แตะเพื่อถ่าย</span>
                  </div>

                  {/* ปุ่มสลับกล้องหน้า/หลัง */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="h-12 w-12 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 active:scale-95 transition-all flex items-center justify-center text-slate-700 shadow-xs focus:outline-none"
                      title="สลับกล้อง"
                    >
                      <RefreshCw className="h-5 w-5 text-slate-600" />
                    </button>
                    <span className="text-[10px] font-medium text-slate-500 mt-1">สลับกล้อง</span>
                  </div>
                </div>

                {/* การ์ดคำแนะนำที่เป็นมิตร */}
                <div className="rounded-2xl bg-amber-50/80 border border-amber-200/60 p-3.5 flex items-start gap-3 shadow-xs">
                  <div className="h-7 w-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div className="text-[11px] leading-relaxed">
                    <p className="font-bold text-amber-900">แนะนำการถ่าย</p>
                    <p className="text-amber-800/80 font-normal mt-0.5">
                      ถ่ายในที่สว่าง หรือวางเรียงของสดให้เห็นชัดเจน จะช่วยให้ระบุชื่อและแนะนำวันหมดอายุได้แม่นยำยิ่งขึ้น
                    </p>
                  </div>
                </div>

                {/* ปุ่มพิมพ์กรอกข้อมูลด้วยตัวเอง */}
                <button
                  type="button"
                  onClick={() => setActiveTab("add")}
                  className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-white/60 hover:bg-white text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] focus:outline-none"
                >
                  <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                  <span>หรือ พิมพ์กรอกข้อมูลด้วยตนเอง</span>
                </button>
              </div>
            )}

            {/* โหมดที่ 2: ระหว่างกำลังวิเคราะห์ภาพ */}
            {stage === "scanning" && (
              <div className="aspect-[3/4] w-full rounded-[30px] bg-slate-950 text-white flex items-center justify-center p-6 text-center shadow-2xl border border-slate-800 animate-tabFade mt-6 overflow-hidden relative">
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Captured food"
                    className="absolute inset-0 h-full w-full object-cover opacity-35 filter blur-[2px] scale-105"
                  />
                )}
                
                <div className="relative z-10 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl max-w-[280px]">
                  <div className="h-14 w-14 mx-auto rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <p className="mt-4 font-bold text-sm tracking-tight text-white">
                    {visionLoading ? "กำลังตรวจสอบของสดในภาพ..." : "ประมวลผลเสร็จสมบูรณ์"}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed font-normal">
                    {visionLoading 
                      ? "ระบบกำลังระบุชื่อของสดและคำนวณวันหมดอายุอัตโนมัติ" 
                      : "กำลังเตรียมรายการให้คุณตรวจสอบก่อนบันทึก"}
                  </p>
                </div>
              </div>
            )}

            {/* โหมดที่ 3: แสดงรายการของสดที่ตรวจพบ พร้อมให้ตรวจสอบและแก้ไข */}
            {stage === "result" && (
              <div className="space-y-3.5 animate-tabFade">
                
                {/* แถบแจ้งผลการตรวจสอบ */}
                {visionError ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-3.5 shadow-xs space-y-2">
                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-amber-500 text-white grid place-items-center shadow-xs shrink-0 text-sm">
                        ⚠️
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-amber-900">ตรวจพบเบื้องต้น (สามารถพิมพ์ชื่อเองได้)</p>
                        <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">{visionError}</p>
                      </div>
                    </div>
                    {capturedImage && (
                      <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-amber-800 font-medium">ลองส่งวิเคราะห์อีกครั้งโดยไม่ต้องถ่ายใหม่</span>
                        <button
                          type="button"
                          onClick={handleRetryVision}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          ลองวิเคราะห์อีกครั้ง
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200/70 bg-white p-3.5 flex items-center gap-3 shadow-xs">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white grid place-items-center shadow-xs shrink-0">
                      <Check className="h-5 w-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">พบของสดจากภาพถ่าย ({items.length} รายการ)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">ตรวจสอบหรือปรับเปลี่ยนรายละเอียดก่อนนำเข้าตู้เย็น</p>
                    </div>
                  </div>
                )}

                {/* รายการของสดแต่ละชิ้น */}
                <div className="space-y-3">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className={`w-full rounded-2xl border p-3.5 transition-all duration-150 ${
                        it.checked ? "border-emerald-500/80 bg-white shadow-xs" : "border-slate-200/70 bg-white/60 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <button
                          type="button"
                          onClick={() => toggle(it.id)}
                          className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                        >
                          <div className={`h-5 w-5 rounded-lg border grid place-items-center text-[10px] font-black transition-all ${
                            it.checked ? "bg-emerald-600 border-transparent text-white" : "bg-slate-50 border-slate-300 text-transparent"
                          }`}>✓</div>
                          <FoodIcon
                            name={it.name}
                            category={it.category}
                            className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 p-1.5 shrink-0 shadow-inner"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block truncate">
                              {it.name || "ยังไม่ได้ตั้งชื่อ"}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              หมวด{it.category === "other" || it.category === "อื่นๆ" ? "ทั่วไป" : it.category}
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors flex items-center justify-center"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">ชื่อของสด</label>
                          <input
                            value={it.name}
                            onChange={(e) => updateItemField(it.id, "name", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                            placeholder={it.placeholder || "กรอกชื่อของสด"}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">ปริมาณ / จำนวน</label>
                            <input
                              value={it.qty}
                              onChange={(e) => updateItemField(it.id, "qty", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                              placeholder="เช่น 1 ชิ้น, 500 กรัม"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">หมวดหมู่อาหาร</label>
                            <select
                              value={it.category}
                              onChange={(e) => updateItemField(it.id, "category", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                            >
                              <option value="ผัก">ผัก</option>
                              <option value="ผลไม้">ผลไม้</option>
                              <option value="เนื้อสัตว์">เนื้อสัตว์</option>
                              <option value="เครื่องดื่ม">เครื่องดื่ม</option>
                              <option value="ของแห้ง">ของแห้ง</option>
                              <option value="อื่นๆ">อื่นๆ</option>
                            </select>
                          </div>
                        </div>

                        {/* ส่วนจัดการวันหมดอายุ */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-[10px] font-bold">วันหมดอายุ</span>
                            </div>

                            {/* ปุ่มทางลัดกำหนดวันหมดอายุ */}
                            {!it.isUnknownExpiry && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setExpiryDays(it.id, 3)}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-[9px] font-bold text-slate-600 transition-colors"
                                >
                                  +3 วัน
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpiryDays(it.id, 7)}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-[9px] font-bold text-slate-600 transition-colors"
                                >
                                  +7 วัน
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpiryDays(it.id, 14)}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-[9px] font-bold text-slate-600 transition-colors"
                                >
                                  +14 วัน
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => updateItemField(it.id, "isUnknownExpiry", !it.isUnknownExpiry)}
                              className={`w-full py-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                it.isUnknownExpiry 
                                  ? "bg-amber-50 border-amber-200 text-amber-700 shadow-xs" 
                                  : "bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              <span>{it.isUnknownExpiry ? "✓ ไม่ระบุวันหมดอายุ" : "❓ ไม่ทราบวันหมดอายุ"}</span>
                            </button>

                            {!it.isUnknownExpiry && (
                              <input
                                type="date"
                                value={it.expiryDate}
                                onChange={(e) => updateItemField(it.id, "expiryDate", e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none shadow-xs"
                              />
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>

                {/* ปุ่มเพิ่มรายการของสดเพิ่มเติม */}
                <button
                  type="button"
                  onClick={addNewItem}
                  className="w-full py-2.5 rounded-2xl border border-dashed border-slate-300 hover:border-emerald-500 bg-white/70 hover:bg-white text-slate-600 hover:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>เพิ่มของสดอีกรายการ</span>
                </button>

                {/* ปุ่มควบคุมท้ายหน้าจอ */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedImage("");
                      setStage("capture");
                    }}
                    className="h-11 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 active:scale-95 flex items-center justify-center gap-1.5 shadow-xs transition-all focus:outline-none"
                  >
                    <X className="h-4 w-4 stroke-[2.5]" /> ถ่ายใหม่อีกครั้ง
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSelected}
                    disabled={selectedCount === 0}
                    className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="h-4 w-4 stroke-[2.5]" /> บันทึกเข้าตู้เย็น ({selectedCount})
                  </button>
                </div>
              </div>
            )}

            {/* ปุ่มยกเลิกกลับไปหน้าเพิ่มของสด */}
            <button 
              type="button" 
              onClick={() => setActiveTab("add")} 
              className="w-full text-center text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors pt-2 block focus:outline-none"
            >
              ยกเลิกและกลับไปหน้าเดิม
            </button>
          </div>

          {/* ขีดแถบ Home ด้านล่างจอ */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-300/80 z-50 pointer-events-none"></div>
        </div>
      </div>
      <style>{`
        .style-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        
        @keyframes scanBeam {
          0% { top: 12%; opacity: 0; }
          15% { opacity: 0.8; }
          85% { opacity: 0.8; }
          100% { top: 88%; opacity: 0; }
        }
        .animate-scanBeam {
          animation: scanBeam 2.4s ease-in-out infinite;
        }

        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.6;
          transition: 0.2s;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

export default ScanPage;