// นำเข้าโมดูล mysql2 สำหรับเชื่อมต่อ MySQL Database
const mysql = require('mysql2');
// นำเข้าโมดูล bcrypt สำหรับเข้ารหัสผ่าน (Password Hashing)
const bcrypt = require('bcrypt');

// ฟังก์ชันหลักสำหรับจำลองผู้ใช้งานจริงลงฐานข้อมูล
async function main(){
  // สร้าง Connection ไปยังฐานข้อมูล foodcare_db
  const db = mysql.createConnection({ 
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'foodcare_db' 
  });

  // กำหนดข้อมูลผู้ใช้ตัวอย่างที่ใช้ทดสอบ
  const username = 'real_browser_user';
  const email = 'real_browser_user@example.com';
  const phone = '0990000123';
  const password = 'Pass123!';

  // เข้ารหัสผ่านด้วย bcrypt โดยกำหนด salt rounds = 10
  const hash = await bcrypt.hash(password, 10);

  // สั่ง INSERT ผู้ใช้เข้าสู่ตาราง users (หากมี user นี้อยู่แล้ว ให้ UPDATE รหัสผ่านใหม่และตั้ง is_verified = 1)
  await new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO users (username, email, phone, password, is_verified, household_id) VALUES (?, ?, ?, ?, 1, NULL) ON DUPLICATE KEY UPDATE password = VALUES(password), is_verified = 1',
      [username, email, phone, hash],
      (err) => err ? reject(err) : resolve()
    );
  });

  // แสดงผลข้อมูลบัญชีผู้ใช้ที่สร้างเสร็จแล้วในคอนโซล
  console.log(JSON.stringify({ username, email, phone, password }, null, 2));

  // ปิดการเชื่อมต่อฐานข้อมูล
  db.end();
}

// เรียกให้ฟังก์ชันทำงาน พร้อมดักจับ Error
main().catch((err) => { 
  console.error(err); 
  process.exit(1); 
});

