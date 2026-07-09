// routes/shopping.js
// ติดตั้ง: npm install express mysql2
// ใช้งาน: app.use("/api/shopping", require("./routes/shopping"))

const express = require("express");
const router = express.Router();
const db = require("../db"); // สมมติ db.js export pool จาก mysql2

// ─────────────────────────────────────────────
// GET /api/shopping?householdId=1
// ดึงรายการ shopping list ของบ้านนี้ทั้งหมด
// ─────────────────────────────────────────────
router.get("/", async (req, res) => {
  const householdId = parseInt(req.query.householdId) || 1;

  try {
    const [rows] = await db.query(
      `SELECT shop_id, household_id, item_name, quantity, reason, is_checked, created_at
       FROM shopping_items
       WHERE household_id = ?
       ORDER BY created_at DESC`,
      [householdId]
    );

    // 🟢 แก้ไข: แปลง is_checked จาก TINYINT → boolean ที่หลังบ้านเลย ไม่ต้องจัดการฝั่ง frontend
    const data = rows.map((row) => ({
      ...row,
      is_checked: row.is_checked === 1,
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error("GET /shopping error:", err);
    res.status(500).json({ success: false, message: "ดึงข้อมูล shopping list ไม่สำเร็จ" });
  }
});

// ─────────────────────────────────────────────
// POST /api/shopping/add
// เพิ่มรายการใหม่เข้า shopping_items
// Body: { householdId, item_name, quantity, reason }
// ─────────────────────────────────────────────
router.post("/add", async (req, res) => {
  // 🟢 แก้ไข: รับ item_name และ quantity ให้ตรงกับ DB schema
  const { householdId, item_name, quantity, reason } = req.body;

  if (!item_name || !householdId) {
    return res.status(400).json({ success: false, message: "กรุณาส่ง householdId และ item_name มาด้วย" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO shopping_items (household_id, item_name, quantity, reason, is_checked)
       VALUES (?, ?, ?, ?, 0)`,
      [
        parseInt(householdId),
        item_name.trim(),
        quantity?.trim() || "1 ชิ้น",
        reason || "manual",
      ]
    );

    res.json({ success: true, shopId: result.insertId });
  } catch (err) {
    console.error("POST /shopping/add error:", err);
    res.status(500).json({ success: false, message: "เพิ่มรายการไม่สำเร็จ" });
  }
});

// ─────────────────────────────────────────────
// POST /api/shopping/toggle
// สลับสถานะ is_checked ของรายการ
// Body: { shopId, isChecked }  ← isChecked ส่งมาเป็น 0 หรือ 1
// ─────────────────────────────────────────────
router.post("/toggle", async (req, res) => {
  const { shopId, isChecked } = req.body;

  if (shopId === undefined) {
    return res.status(400).json({ success: false, message: "กรุณาส่ง shopId มาด้วย" });
  }

  try {
    // 🟢 แก้ไข: แปลง isChecked เป็น 0/1 ก่อน INSERT เสมอ ไม่ว่า frontend จะส่งมาแบบไหน
    const checkedValue = isChecked ? 1 : 0;

    await db.query(
      `UPDATE shopping_items SET is_checked = ? WHERE shop_id = ?`,
      [checkedValue, parseInt(shopId)]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("POST /shopping/toggle error:", err);
    res.status(500).json({ success: false, message: "อัปเดตสถานะไม่สำเร็จ" });
  }
});

// ─────────────────────────────────────────────
// POST /api/shopping/delete
// ลบรายการออกจาก shopping_items
// Body: { shopId }
// ─────────────────────────────────────────────
router.post("/delete", async (req, res) => {
  const { shopId } = req.body;

  if (!shopId) {
    return res.status(400).json({ success: false, message: "กรุณาส่ง shopId มาด้วย" });
  }

  try {
    await db.query(
      `DELETE FROM shopping_items WHERE shop_id = ?`,
      [parseInt(shopId)]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("POST /shopping/delete error:", err);
    res.status(500).json({ success: false, message: "ลบรายการไม่สำเร็จ" });
  }
});

module.exports = router;