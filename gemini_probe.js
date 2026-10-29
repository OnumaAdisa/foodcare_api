// โหลดการตั้งค่า Environment Variables จากไฟล์ .env (เพื่อให้เรียกใช้ GEMINI_API_KEY ได้)
require('dotenv').config();

// ดึงค่า API Key ของ Google Gemini จากตัวแปร Environment
const key = process.env.GEMINI_API_KEY;

// รายชื่อโมเดล Gemini เวอร์ชันต่างๆ ที่ต้องการส่ง request ไปทดสอบ (Probe) ว่าใช้งานได้จริงหรือไม่
const models = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-lite'];

// ข้อมูลรูปภาพตัวอย่างจำลองขนาด 1x1 พิกเซล แปลงเป็น Base64 (เพื่อทดสอบส่งภาพให้ AI Vision)
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB4L0mAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJ0UkGAAAAAAgIY0UAAAAASUVORK5CYII=';

// ฟังก์ชันแบบ Asynchronous ทำงานทันที (IIFE: Immediately Invoked Function Expression)
(async () => {
  // วนลูปทดสอบเรียก API ของแต่ละโมเดลทีละรายการ
  for (const model of models) {
    // โครงสร้าง Payload ข้อมูลที่จัดรูปแบบส่งให้ Gemini API
    const payload = {
      contents: [{
        role: 'user', // กำหนดบทบาทผู้ส่งข้อความว่าเป็นผู้ใช้งาน (user)
        parts: [
          // Prompt คำสั่งข้อความที่ส่งให้ AI วิเคราะห์
          { text: 'Return JSON only: {"items":["banana"]}' },
          // ส่งไฟล์รูปภาพจำลองแบบ inline data ระบุ mime type เป็น image/png
          { inline_data: { mime_type: 'image/png', data: png } }
        ]
      }],
      // กำหนดค่าการตอบกลับของ AI ให้ส่งกลับมาในรูปแบบ JSON เสมอ
      generationConfig: { responseMimeType: 'application/json' }
    };

    // URL Endpoint ของ Google Generative Language API สำหรับโมเดลและ API Key นั้นๆ
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    try {
      // ส่ง HTTP Request แบบ POST ไปยัง Gemini API พร้อมแนบ headers และ payload
      const res = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });

      // อ่านข้อความผลลัพธ์ตอบกลับ (Response text) จากเซิร์ฟเวอร์
      const text = await res.text();

      // พิมพ์ชื่อโมเดล และ HTTP Status Code ที่ได้รับกลับมา (เช่น 200 = สำเร็จ, 404 = ไม่พบโมเดล)
      console.log('MODEL', model, 'STATUS', res.status);

      // ตัดข้อความผลลัพธ์มาแสดง 500 ตัวอักษรแรกเพื่อดูตัวอย่างคำตอบ
      console.log(text.slice(0, 500));
    } catch (err) {
      // ดักจับข้อผิดพลาดกรณีการเชื่อมต่ออินเทอร์เน็ตล้มเหลว หรือเกิดข้อยกเว้นขณะ fetch
      console.log('MODEL', model, 'ERROR', err && err.message ? err.message : err);
    }
  }
})();

