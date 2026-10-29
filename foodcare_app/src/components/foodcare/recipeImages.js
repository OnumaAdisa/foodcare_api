// คลังภาพเมนูอาหารคุณภาพสูง ตรงปก คมชัด ตรงตามชื่ออาหารจริงทุกเมนู
export const RECIPE_EXACT_IMAGES = {
  // 1. ซุปไก่ใส่มันฝรั่ง: ชามซุปไก่ใส่มันฝรั่งและแครอทต้มสุกอุ่นๆ
  "ซุปไก่ใส่มันฝรั่ง": "https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=700&q=80",

  // 2. สลัดอกไก่ย่าง: สลัดผักสดพร้อมอกไก่ย่างหั่นชิ้นเพื่อสุขภาพ
  "สลัดอกไก่ย่าง": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80",

  // 3. ผัดผักรวมมิตรใส่ไข่: ผัดผักรวมมิตรสีสันสดใสใส่ไข่ขยี้หอมกลิ่นกระทะ
  "ผัดผักรวมมิตรใส่ไข่": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80",
  "ผัดผักรวมไข่": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80",

  // 4. ต้มจืดเต้าหู้ผักรวม: ต้มจืดเต้าหู้ผักรวมมิตรน้ำใส ซดคล่องคอ
  "ต้มจืดเต้าหู้ผักรวม": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=700&q=80",
  "ต้มจืดผักรวม": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=700&q=80",

  // 5. ไข่เจียวกุ้งสับ: ไข่เจียวฟูกรอบสีเหลืองทองใส่เนื้อกุ้งเด้งๆ
  "ไข่เจียวกุ้งสับ": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80",
  "ไข่เจียวกุ้ง": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80",

  // 6. ผัดกะเพราหมูสับ: กะเพราหมูสับหอมกรุ่นใบกะเพรา
  "ผัดกะเพราหมูสับ": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=80",
  "ผัดกะเพรา": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=80",

  // 7. ข้าวผัดไข่ใส่หมู: ข้าวผัดหมูใส่ไข่หอมกลิ่นกระทะ
  "ข้าวผัดไข่ใส่หมู": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",
  "ข้าวผัดหมู": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",
  "ข้าวผัดไข่": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80",

  // 8. เมนูยอดนิยมเพิ่มเติม
  "ต้มยำกุ้ง": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=80",
  "แกงเขียวหวานไก่": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=700&q=80",
  "ผัดไทยกุ้งสด": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=700&q=80",
  "ไก่ทอดกระเทียม": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=700&q=80",
  "สเต็กอกไก่": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80",
  "ลาบหมู": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80",
  "ยำวุ้นเส้น": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80",
  "อกไก่ผัดไข่ใส่กระเทียม": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80",
  "ไข่เจียวอกไก่สับทรงเครื่อง": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80",
};

// ฟังก์ชันดึงภาพอาหารที่ตรงตามชื่อเมนูอย่างแม่นยำ
export const getRecipeImage = (title = "", customImage = null) => {
  const t = (title || "").toLowerCase().trim();

  // 1. ตรวจสอบชื่อเมนูตรงตัวก่อน
  for (const [key, url] of Object.entries(RECIPE_EXACT_IMAGES)) {
    if (t.includes(key.toLowerCase()) || key.toLowerCase().includes(t)) {
      return url;
    }
  }

  // 2. ถ้ามี customImage ที่ไม่ใช่ค่า fallback default ให้ใช้รูปที่ระบุมา
  if (customImage && !customImage.includes("photo-1546069901-ba9599a7e63c")) {
    return customImage;
  }

  // 2. แยกตามประเภทเมนูอาหารเฉพาะเจาะจง (เรียงตามลำดับความเฉพาะเจาะจง)
  // ไข่เจียว / เมนูไข่
  if (t.includes("ไข่เจียว") || t.includes("ไข่ข้น") || t.includes("ออมเล็ต")) {
    return "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80";
  }

  // ผัดผัก / ผัดผักรวม
  if (t.includes("ผัดผัก") || t.includes("ผักรวม") || t.includes("ผัดคะน้า") || t.includes("ผัดกะหล่ำ")) {
    return "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80";
  }

  // สลัด / สลัดผัก / สลัดไก่
  if (t.includes("สลัด")) {
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80";
  }

  // ข้าวผัด
  if (t.includes("ข้าวผัด")) {
    return "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80";
  }

  // ผัดกะเพรา / กะเพรา
  if (t.includes("กะเพรา")) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=80";
  }

  // ต้มจืด / แกงจืด
  if (t.includes("ต้มจืด") || t.includes("แกงจืด")) {
    return "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=700&q=80";
  }

  // ซุป (เช่น ซุปไก่, ซุปมันฝรั่ง, ซุปผัก)
  if (t.includes("ซุป")) {
    return "https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=700&q=80";
  }

  // ต้มยำ / ต้มยำกุ้ง
  if (t.includes("ต้มยำ")) {
    return "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=80";
  }

  // ไก่ทอด / ของทอด
  if (t.includes("ไก่ทอด") || t.includes("ปีกไก่ทอด") || t.includes("ทอดกรอบ")) {
    return "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=700&q=80";
  }

  // แกงกะทิ / แกงเขียวหวาน / แกงเผ็ด / พะแนง
  if (t.includes("แกงเขียวหวาน") || t.includes("พะแนง") || t.includes("มัสมั่น") || t.includes("แกงคั่ว") || t.includes("แกงเผ็ด")) {
    return "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=700&q=80";
  }

  // ผัดไทย / ผัดซีอิ๊ว / ราดหน้า / เมนูเส้น
  if (t.includes("ผัดไทย") || t.includes("ผัดซีอิ๊ว") || t.includes("ราดหน้า") || t.includes("ก๋วยเตี๋ยว") || t.includes("พาสต้า") || t.includes("สปาเก็ตตี้")) {
    return "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=700&q=80";
  }

  // สเต็ก / เนื้อย่าง / ไก่ย่าง
  if (t.includes("สเต็ก") || t.includes("ย่าง") || t.includes("บาร์บีคิว")) {
    return "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80";
  }

  // ยำ / ลาบ
  if (t.includes("ยำ") || t.includes("ลาบ") || t.includes("น้ำตก")) {
    return "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80";
  }

  // เมนูผัดทั่วไป
  if (t.includes("ผัด")) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=80";
  }

  // เมนูต้มทั่วไป
  if (t.includes("ต้ม") || t.includes("แกง")) {
    return "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=700&q=80";
  }

  // เมนูไข่ทั่วไป
  if (t.includes("ไข่")) {
    return "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80";
  }

  // ภาพเริ่มต้นกรณีทั่วไป
  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80";
};
