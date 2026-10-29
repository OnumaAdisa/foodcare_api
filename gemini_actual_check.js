// โหลดการตั้งค่า Environment Variables จากไฟล์ .env
require('dotenv').config();

// ดึงค่า Gemini API Key จากตัวแปร Environment
const key = process.env.GEMINI_API_KEY;

// เลือกรุ่นโมเดล Gemini จากไฟล์ .env หรือใช้ค่าเริ่มต้นเป็น 'gemini-3.6-flash'
const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// ข้อมูลรูปภาพตัวอย่าง 1x1 พิกเซลในรูปแบบ Base64 (ใช้ทดสอบระบบ Vision)
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB4L0mAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJ0UkGAAAAAAgIY0UAAAAASUVORK5CYII=';

// กำหนดก้อนข้อมูล JSON (Payload) สำหรับส่งให้ AI
const payload = {
  contents: [{
    role: 'user', // กำหนดบทบาทเป็น User
    parts: [
      // คำสั่ง Prompt บังคับให้ตอบกลับเป็นโครงสร้าง JSON เท่านั้น
      { text: 'Return JSON only: {"items":["banana"]}' },
      // ข้อมูลภาพแบบ Inline Data
      { inline_data: { mime_type: 'image/png', data: png } }
    ]
  }],
  // บังคับประเภท Content ตอบกลับให้เป็น application/json
  generationConfig: {
    responseMimeType: 'application/json'
  }
};

// สร้าง URL สำหรับเรียก Google Generative Language API
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

// แสดงผลชื่อโมเดลและ URL ที่จะส่ง Request ไปทดสอบ
console.log('MODEL', model);
console.log('URL', url);

// ยิง HTTP POST Request ไปยัง API ของ Google
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
}).then(async (res) => {
  // อ่าน Response กลับมาเป็นข้อความ String
  const text = await res.text();
  // แสดง HTTP Status Code (เช่น 200 คือผ่าน)
  console.log('STATUS', res.status);
  // แสดงเนื้อหาคำตอบ 2000 ตัวอักษรแรก
  console.log(text.slice(0, 2000));
}).catch((err) => {
  // ดักจับและแสดง Error กรณี Request ล้มเหลว พร้อมออกจากโปรแกรม
  console.error('FETCH_ERROR', err && err.message ? err.message : err);
  process.exit(1);
});

