-- สร้างตาราง users สำหรับเก็บข้อมูลผู้ใช้
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- สร้าง index สำหรับ email เพื่อให้การค้นหาเร็วขึ้น
CREATE INDEX idx_email ON users(email);
