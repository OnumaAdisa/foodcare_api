# 🥦 FoodCare — Smart Refrigerator & Food Waste Reduction System

> ระบบจัดการตู้เย็นอัจฉริยะ ลดขยะอาหาร พร้อมระบบแนะนำเมนูด้วย AI และระบบแชร์ตู้เย็นในครอบครัว

---

## 📌 บทนำและภาพรวมระบบ (System Overview)
**FoodCare** เป็นเว็บแอปพลิเคชันที่พัฒนาขึ้นเพื่อช่วยแก้ปัญหาขยะอาหาร (Food Waste) ภายในครัวเรือน โดยช่วยให้ผู้ใช้งานสามารถ:
1. **ติดตามวันหมดอายุของวัตถุดิบ (Expiry Tracking):** แจ้งเตือนของสดที่ใกล้หมดอายุล่วงหน้า พร้อมระบบวัดความสดคงเหลือ (%)
2. **จัดการตู้เย็นร่วมกันในครอบครัว (Shared Household Fridge):** แชร์ตู้เย็นและซิงค์ข้อมูลของสดแบบ Real-time ร่วมกับสมาชิกในบ้านผ่าน Invite Code
3. **ลดการซื้อซ้ำด้วย Shopping List:** จดรายการของที่ต้องซื้อ และย้ายของที่ซื้อแล้วเข้าสู่ตู้เย็นได้ในคลิกเดียว
4. **AI Chef แนะนำสูตรอาหาร (Google Gemini):** สร้างสรรค์เมนูอาหารไทยและสากลจากวัตถุดิบที่มีจริงในตู้เย็น พร้อมขั้นตอนทำอาหารและรายการเครื่องปรุงครบถ้วน
5. **AI Vision ตรวจจับวัตถุดิบ:** สแกนภาพถ่ายวัตถุดิบและแปลงเป็นข้อมูลเข้าสู่ตู้เย็นโดยอัตโนมัติ

---

## 🛠️ สถาปัตยกรรมและเทคโนโลยีที่ใช้ (Tech Stack)

### Frontend (Client-Side)
- **Framework:** React 19 + Vite 8
- **Routing:** TanStack Router (`@tanstack/react-router`)
- **Styling:** Tailwind CSS v4 + Vanilla CSS Design System
- **Icons:** Lucide React (`lucide-react`)
- **Computer Vision / AI Models:** TensorFlow.js (`@tensorflow/tfjs`, MobileNet)

### Backend (Server-Side)
- **Runtime:** Node.js (CommonJS)
- **Web Framework:** Express.js 5
- **Authentication:** Express Session + Bcrypt Hash + OTP Verification
- **Email Notification:** Nodemailer (SMTP / Gmail App Password)
- **External AI Integration:** Google Generative AI (Google Gemini 2.5 / 3.5 Flash) via REST API

### Database
- **Database Engine:** MySQL / MariaDB (XAMPP / MySQL Server)
- **Database Driver:** `mysql2` (Connection Pool + Promise Client)
- **Database Name:** `foodcare_db`

---

## 🗄️ โครงสร้างฐานข้อมูล (Database Schema)

| ตาราง (Table) | หน้าที่และความสัมพันธ์ | คอลัมน์สำคัญ |
| :--- | :--- | :--- |
| `users` | ข้อมูลบัญชีผู้ใช้งาน | `user_id` (PK), `username`, `email`, `phone`, `password`, `household_id`, `otp_code`, `otp_expires_at`, `is_verified` |
| `households` | ข้อมูลกลุ่มบ้าน/ครอบครัว | `id` (PK), `name`, `invite_code`, `created_by_user_id`, `created_at` |
| `household_members` | สมาชิกในแต่ละกลุ่มบ้าน | `household_id`, `user_id`, `role` ('owner' / 'member'), `joined_at` |
| `fridge_items` | รายการวัตถุดิบในตู้เย็น | `item_id` (PK), `user_id`, `household_id`, `item_name`, `quantity`, `category`, `expiry_date`, `remaining_percent` |
| `shopping_items` | รายการของที่ต้องซื้อ | `shop_id` (PK), `user_id`, `household_id`, `item_name`, `quantity`, `reason`, `is_checked` |
| `notifications` | การแจ้งเตือนระบบ | `id` (PK), `user_id`, `household_id`, `type`, `message`, `is_read`, `created_at` |

---

## 🔌 เอกสารและรายการ API (API Specifications)

### 1. ระบบยืนยันตัวตน (Authentication & User)
- `POST /api/send-otp` — ส่งรหัส OTP 6 หลักไปยังอีเมลเพื่อสมัครสมาชิก
- `POST /api/verify-otp` — ตรวจสอบ OTP และเปิดใช้งานบัญชี
- `POST /api/login` — เข้าสู่ระบบด้วย username & password (สร้าง Session)
- `GET /api/auth/session` — ตรวจสอบสถานะการล็อกอินของผู้ใช้ปัจจุบัน
- `POST /api/auth/logout` — ออกจากระบบและทำลาย Session
- `POST /api/forgot-password/send-otp` — ขอ OTP สำหรับกรณีลืมรหัสผ่าน
- `POST /api/forgot-password/reset` — ตรวจสอบ OTP และตั้งรหัสผ่านใหม่

### 2. ระบบกลุ่มครอบครัว (Household)
- `GET /api/household/my` — ดึงข้อมูลกลุ่มบ้าน สมาชิก และรหัสเชิญชวน
- `POST /api/household/create` — สร้างกลุ่มแชร์ตู้เย็นใหม่ พร้อมสร้าง Invite Code อัตโนมัติ
- `POST /api/household/join` — เข้าร่วมกลุ่มบ้านด้วย Invite Code
- `POST /api/household/leave` — ออกจากกลุ่มบ้าน

### 3. ระบบจัดการตู้เย็น (Fridge Management)
- `GET /api/fridge` — ดึงรายการของสดทั้งหมดในตู้เย็น (ส่วนตัว + แชร์ในบ้าน)
- `GET /api/fridge/frequent` — สถิติของสดที่จัดเก็บหรือใช้บ่อย
- `POST /api/fridge/add` — เพิ่มวัตถุดิบเข้าตู้เย็น
- `PUT /api/fridge/update/:id` — อัปเดต % ปริมาณคงเหลือของวัตถุดิบ
- `PUT /api/fridge/deduct/:id` — ตัดสต็อกวัตถุดิบเมื่อทำอาหาร (ลบอัตโนมัติหากหมด 0%)
- `DELETE /api/fridge/delete/:id` — ลบวัตถุดิบออกจากตู้เย็น
- `DELETE /api/fridge/clear` — ล้างข้อมูลตู้เย็นทั้งหมด

### 4. ระบบรายการซื้อของ (Shopping List)
- `GET /api/shopping` — ดึงรายการสินค้าที่ต้องซื้อ
- `POST /api/shopping/add` — เพิ่มสินค้าลงในตะกร้า
- `POST /api/shopping/toggle` — อัปเดตสถานะติ๊กถูกซื้อแล้ว
- `POST /api/shopping/delete` — ลบสินค้าออกจากรายการ

### 5. ระบบปัญญาประดิษฐ์ (AI Features)
- `POST /api/recipes/suggest` — ให้ Google Gemini AI คิดค้นและแนะนำสูตรอาหารจากวัตถุดิบในตู้เย็น
- `POST /api/vision/analyze` — ให้ AI วิเคราะห์ภาพถ่ายวัตถุดิบอาหารและระบุชื่อพร้อมหมวดหมู่

---

## 🚀 วิธีการติดตั้งและรันระบบ (Setup & Execution Guide)

### 1. การเตรียมความพร้อม
- Node.js (เวอร์ชัน 18 ขึ้นไป แนะนำ 20+)
- MySQL Server (ผ่าน XAMPP หรือ MySQL Service)

### 2. ตั้งค่าสภาพแวดล้อม (`.env`)
คัดลอกไฟล์ `.env.example` ไปเป็น `.env` และกำหนดค่า:
```bash
cp .env.example .env
```
กำหนดค่า:
- `SESSION_SECRET`: คีย์ความปลอดภัยเซสชัน
- `SMTP_USER` และ `SMTP_PASS`: อีเมลและรหัสผ่าน App Password สำหรับส่ง OTP
- `GEMINI_API_KEY`: API Key จาก Google AI Studio

### 3. ติดตั้ง Dependencies
```bash
# ติดตั้ง Backend Dependencies
npm install

# ติดตั้ง Frontend Dependencies
cd foodcare_app
npm install
cd ..
```

### 4. เริ่มการทำงานระบบ (Run Development)
```bash
# รัน Backend Server (Port 8080)
node server.js

# รัน Frontend Client (Port 5173) (เปิด terminal อีกหน้าต่าง)
cd foodcare_app
npm run dev
```

### 5. การทดสอบระบบอัตโนมัติ (Automated Testing)
โปรเจกต์มีชุดทดสอบอัตโนมัติครอบคลุมทุก API:
```bash
node test_all_systems.js
```
*ผลการทดสอบ: ผ่าน 23 / 23 ชุดทดสอบ (100% Passed)*

---

## 📋 ข้อมูลสำหรับการนำไปเขียนเล่มรายงาน (Report Checklist)
- **หัวข้อการทดสอบระบบ (บทที่ 4):** นำตารางผลการรันจาก `test_all_systems.js` ไปใช้เป็นตารางผลการทดสอบระบบ (System Test Case Results)
- **ผังโครงสร้างฐานข้อมูล (บทที่ 3):** นำ Schema และตารางทั้ง 6 ตารางไปเขียน Data Dictionary และ ER-Diagram
- **สถาปัตยกรรมระบบ (บทที่ 3):** อธิบายการทำงานแบบ Client-Server Architecture (REST API) เชื่อมโยงกับ Google Gemini AI
