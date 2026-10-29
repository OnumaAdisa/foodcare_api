// โหลดการตั้งค่า Environment Variables จากไฟล์ .env
require('dotenv').config();

// เลือกรุ่นโมเดล Gemini ที่จะทดสอบ หรือ fallback เป็น 'gemini-2.0-flash'
const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// ข้อมูลรูปภาพตัวอย่าง 1x1 พิกเซลในรูปแบบ Base64
const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAFc0b5AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJ0UkGAAAAAAgIY0UAAAAASUVORK5CYII=';

// กำหนดก้อนข้อมูล Payload สำหรับส่งไปให้ Gemini Vision วิเคราะห์วัตถุดิบอาหารจากภาพ
const payload = {
  contents: [{
    role: 'user', // กำหนดผู้ส่งเป็นผู้ใช้
    parts: [
      // คำสั่ง Prompt ภาษาอังกฤษสั่งให้ระบุวัตถุดิบหลักในภาพและตอบกลับเป็น JSON ไม่เกิน 3 ชนิด
      { text: 'Identify the main food item in this image. Return JSON only with exact format {"items":["name1","name2"]}. Use only the main food item visible in the image, maximum 3 entries, in Thai or English.' },
      // ข้อมูลภาพแบบ inline data
      { inline_data: { mime_type: 'image/jpeg', data: base64 } }
    ]
  }]
};

// ประกอบ URL สำหรับเรียก API ของ Gemini
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
console.log('URL:', url);

// ส่งคำขอแบบ POST ไปยัง Google API
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
}).then(async (r) => {
  // อ่านข้อความผลลัพธ์
  const text = await r.text();
  console.log('status:', r.status);
  console.log(text.slice(0, 2000));
}).catch((err) => {
  // แสดง Error หากมีข้อผิดพลาด
  console.error('fetch error:', err);
  process.exit(1);
});

