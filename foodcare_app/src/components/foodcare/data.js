export const recipes = [
  {
    id: "1",
    title: "ซุปไก่ใส่มันฝรั่ง",
    time: "30 นาที",
    level: "ง่าย",
    tone: "from-amber-400 to-orange-500",
    description: "ซุปไก่อุ่นใจ หอมกลิ่นสมุนไพร เหมาะสำหรับวันที่อากาศเย็น",
    requiredIngredients: [
      { name: "อกไก่", category: "เนื้อสัตว์" },
      { name: "มันฝรั่ง", category: "ผัก" },
      { name: "หอมหัวใหญ่", category: "ผัก" },
      { name: "แครอท", category: "ผัก" },
      { name: "กระเทียม", category: "ผัก" },
    ],
    // ✅ เพิ่ม ingredients สำหรับ RecipeDetail และ CookingPage
    ingredients: [
      { name: "อกไก่", qty: "300 กรัม", have: false },
      { name: "มันฝรั่ง", qty: "2 หัว", have: false },
      { name: "หอมหัวใหญ่", qty: "1 หัว", have: false },
      { name: "แครอท", qty: "1 หัว", have: false },
      { name: "กระเทียม", qty: "3 กลีบ", have: false },
    ],
    steps: [
      "ต้มน้ำซุปกระดูกไก่ให้เดือด",
      "ใส่อกไก่หั่นชิ้น ต้มจนสุก",
      "ใส่มันฝรั่ง แครอท หอมหัวใหญ่",
      "ปรุงรสด้วยเกลือ พริกไทย",
      "ตักใส่ชาม โรยต้นหอม เสิร์ฟร้อนๆ"
    ]
  },
  {
    id: "2",
    title: "สลัดอกไก่ย่าง",
    time: "15 นาที",
    level: "ง่ายมาก",
    tone: "from-emerald-400 to-teal-500",
    description: "สลัดเพื่อสุขภาพ ไก่ย่างนุ่ม ผักสดกรอบ น้ำสลัดรสเปรี้ยวอมหวาน",
    requiredIngredients: [
      { name: "อกไก่", category: "เนื้อสัตว์" },
      { name: "ผักกาดหอม", category: "ผัก" },
      { name: "มะเขือเทศ", category: "ผลไม้" },
      { name: "แตงกวา", category: "ผัก" },
    ],
    ingredients: [
      { name: "อกไก่", qty: "200 กรัม", have: false },
      { name: "ผักกาดหอม", qty: "1 หัว", have: false },
      { name: "มะเขือเทศ", qty: "2 ลูก", have: false },
      { name: "แตงกวา", qty: "1 ลูก", have: false },
    ],
    steps: [
      "ย่างอกไก่จนสุกทั้งสองด้าน",
      "หั่นไก่เป็นชิ้นพอดีคำ",
      "จัดผักลงในจาน",
      "วางไก่ย่างบนผัก",
      "ราดน้ำสลัดตามชอบ"
    ]
  },
  {
    id: "3",
    title: "ผัดผักรวมไข่",
    time: "10 นาที",
    level: "ง่ายมาก",
    tone: "from-yellow-400 to-orange-400",
    description: "เมนูทำเร็วทานง่าย ผัดผักรวมกับไข่ หอมกระเทียม รสชาติกลมกล่อม",
    requiredIngredients: [
      { name: "ไข่", category: "ไข่" },
      { name: "ผักกาดหอม", category: "ผัก" },
      { name: "แครอท", category: "ผัก" },
      { name: "กระเทียม", category: "ผัก" },
    ],
    ingredients: [
      { name: "ไข่", qty: "2 ฟอง", have: false },
      { name: "ผักกาดหอม", qty: "100 กรัม", have: false },
      { name: "แครอท", qty: "1 หัว", have: false },
      { name: "กระเทียม", qty: "3 กลีบ", have: false },
    ],
    steps: [
      "ตั้งกระทะใส่น้ำมัน ผัดกระเทียมจนหอม",
      "ใส่ผักแข็งก่อน เช่น แครอท ผัดให้สุก",
      "ตอกไข่ลงกระทะ คนให้เข้ากัน",
      "ใส่ผักใบ ปรุงรสด้วยซอสถั่วเหลือง",
      "ผัดให้เข้ากัน ตักเสิร์ฟ"
    ]
  },
  {
    id: "4",
    title: "ต้มจืดผักรวม",
    time: "20 นาที",
    level: "ง่าย",
    tone: "from-green-400 to-emerald-500",
    description: "ต้มจืดเบาๆ สไตล์บ้าน อร่อยได้ทุกวัน",
    requiredIngredients: [
      { name: "เต้าหู้", category: "อื่นๆ" },
      { name: "ผักกาดหอม", category: "ผัก" },
      { name: "แครอท", category: "ผัก" },
      { name: "หอมหัวใหญ่", category: "ผัก" },
    ],
    ingredients: [
      { name: "เต้าหู้", qty: "1 แผ่น", have: false },
      { name: "ผักกาดหอม", qty: "100 กรัม", have: false },
      { name: "แครอท", qty: "1 หัว", have: false },
      { name: "หอมหัวใหญ่", qty: "1 หัว", have: false },
    ],
    steps: [
      "ต้มน้ำซุปให้เดือด",
      "ใส่เต้าหู้และผักแข็งก่อน",
      "ใส่ผักใบตาม ปรุงรสเกลือและซีอิ๊ว",
      "ตักเสิร์ฟขณะร้อน"
    ]
  },
  {
    id: "5",
    title: "ไข่เจียวกุ้ง",
    time: "10 นาที",
    level: "ง่ายมาก",
    tone: "from-rose-400 to-pink-500",
    description: "ไข่เจียวฟูนุ่ม ใส่กุ้งสด หอมกรุ่น ทำง่ายได้ในไม่กี่นาที",
    requiredIngredients: [
      { name: "ไข่", category: "ไข่" },
      { name: "กุ้ง", category: "เนื้อสัตว์" },
      { name: "ต้นหอม", category: "ผัก" },
    ],
    ingredients: [
      { name: "ไข่", qty: "3 ฟอง", have: false },
      { name: "กุ้ง", qty: "100 กรัม", have: false },
      { name: "ต้นหอม", qty: "2 ต้น", have: false },
    ],
    steps: [
      "ตีไข่ใส่ชาม ปรุงรสด้วยซอสถั่วเหลืองเล็กน้อย",
      "ใส่กุ้งและต้นหอมที่หั่นแล้วลงในไข่",
      "ตั้งกระทะน้ำมันให้ร้อน เทไข่ลง",
      "ทอดจนด้านล่างเหลืองกรอบแล้วพลิก",
      "ตักเสิร์ฟพร้อมข้าวสวย"
    ]
  }
];