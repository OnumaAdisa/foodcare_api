// นำเข้าโมดูล mysql2 สำหรับติดต่อฐานข้อมูล
const mysql = require('mysql2');
// นำเข้าโมดูล bcrypt สำหรับเข้ารหัสรหัสผ่าน
const bcrypt = require('bcrypt');

// ฟังก์ชันหลักสำหรับทดสอบโฟลว์การล็อกอินและเซสชันจริง
async function main() {
  // สร้าง Connection ไปยังฐานข้อมูล MySQL
  const db = mysql.createConnection({ 
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'foodcare_db' 
  });

  // สร้างชื่อผู้ใช้และอีเมลแบบไดนามิกโดยใช้ Timestamp ป้องกันข้อมูลชนกัน
  const username = 'real_app_test_' + Date.now();
  const email = `real_app_test_${Date.now()}@example.com`;
  const password = 'Pass123!';
  // เข้ารหัสผ่าน Password
  const passwordHash = await bcrypt.hash(password, 10);

  // บันทึก User ทดสอบลงฐานข้อมูล โดยให้ is_verified = 1 (ยืนยันอีเมลแล้ว)
  await new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO users (username, email, phone, password, is_verified, household_id) VALUES (?, ?, ?, ?, 1, NULL)',
      [username, email, '0990000111', passwordHash],
      (err) => (err ? reject(err) : resolve())
    );
  });

  // กำหนด Endpoint สำหรับ Login
  const loginUrl = 'http://127.0.0.1:8080/api/login';
  // ส่ง Request ขอ Login ไปยังเซิร์ฟเวอร์
  const loginRes = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });

  // ดึงค่า Cookie จาก Header (set-cookie) ที่เซิร์ฟเวอร์ตอบกลับมา
  const setCookie = loginRes.headers.get('set-cookie');
  const loginText = await loginRes.text();
  console.log('LOGIN_STATUS', loginRes.status);
  console.log('LOGIN_BODY', loginText);

  // ทดสอบยิงไปตรวจสอบสถานะเซสชัน /api/auth/session โดยแนบ Cookie ไปด้วย
  const sessionRes = await fetch('http://127.0.0.1:8080/api/auth/session', {
    method: 'GET',
    credentials: 'include',
    headers: setCookie ? { Cookie: setCookie.split(';')[0] } : {}
  });

  // อ่านและแสดงผลสถานะเซสชันที่ตรวจสอบได้
  const sessionText = await sessionRes.text();
  console.log('SESSION_STATUS', sessionRes.status);
  console.log('SESSION_BODY', sessionText);

  // ปิดการเชื่อมต่อฐานข้อมูล
  db.end();
}

// เรียกให้ฟังก์ชันทำงาน
main().catch((err) => {
  console.error(err);
  process.exit(1);
});

