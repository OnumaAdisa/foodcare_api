// นำเข้าไลบรารี mysql2 สำหรับเชื่อมต่อและจัดการฐานข้อมูล MySQL
const mysql = require('mysql2');

// สร้าง Connection เชื่อมต่อไปยังฐานข้อมูล foodcare_db บนเครื่อง localhost
const db = mysql.createConnection({ 
  host: 'localhost', 
  user: 'root', 
  password: '', 
  database: 'foodcare_db' 
});

// ยิงคำสั่ง SQL ตรวจสอบคอลัมน์และโครงสร้างทั้งหมดของตาราง users
db.query('SHOW COLUMNS FROM users', (err, cols) => {
  // หากเกิด Error ขณะ Query ให้แสดงข้อผิดพลาดและปิดการทำงาน
  if (err) {
    console.error('SCHEMA_ERR', err.message);
    process.exit(1);
  }
  // แสดงผลลัพธ์โครงสร้างคอลัมน์ในรูปแบบ JSON ที่อ่านง่าย (Indented 2 spaces)
  console.log(JSON.stringify(cols, null, 2));
  // ปิดการเชื่อมต่อฐานข้อมูล
  db.end();
});

