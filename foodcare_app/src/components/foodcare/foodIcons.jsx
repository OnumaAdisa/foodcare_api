
// ==========================================
// 🧂 คลังไอคอนเครื่องปรุงรส (แยกแบบแห้ง และ แบบน้ำ)
// ==========================================
export const DRY_SEASONING_ICON = "/icons/foods/dry_seasoning.png"; // ไอคอนเครื่องปรุงแบบแห้ง (เกลือ, น้ำตาล, พริกไทย, ผงปรุงรส)
export const LIQUID_SEASONING_ICON = "/icons/foods/liquid_seasoning.png"; // ไอคอนเครื่องปรุงแบบน้ำ (น้ำปลา, ซอส, ซีอิ๊ว, น้ำมัน)

// ==========================================
// 📦 คลังไอคอนวัตถุดิบ 3D ความละเอียดสูง (โหลดตรงจาก Local ทำงานได้ 100% ไม่เสีย)
// แยกประเภทเฉพาะเจาะจง ไม่ใช้ไอคอนซ้ำกัน เช่น เงาะ, เค้ก, ช็อกโกแลต, ไส้กรอก มีไอคอนตรงตัว
// ==========================================
export const USER_ORIGINAL_ICONS = {
  // สัตว์ปีก / เนื้อไก่
  chicken_breast: "/icons/foods/chicken_breast.png", // อกไก่ / สันในไก่
  poultry: "/icons/foods/poultry.png", // ปีกไก่ / น่องไก่ / ไก่ทอด / ไก่ / เป็ด

  // เนื้อสัตว์
  pork: "/icons/foods/pork.png", // หมู / เบคอน / แฮม
  beef: "/icons/foods/beef.png", // เนื้อวัว / สเต็ก / เนื้อ

  // เนื้อแปรรูป & ติ่มซำ
  sausage: "/icons/foods/sausage.png", // ไส้กรอก / ฮอทดอก / กุนเชียง
  dumpling: "/icons/foods/dumpling.png", // เกี๊ยว / ขนมจีบ / ติ่มซำ / ลูกชิ้น

  // อาหารทะเล
  salmon: "/icons/foods/salmon.png", // แซลมอน
  fish: "/icons/foods/fish.png", // ปลาทั่วไป
  shrimp: "/icons/foods/shrimp.png", // กุ้ง
  crab: "/icons/foods/crab.png", // ปู / ปูอัด
  squid: "/icons/foods/squid.png", // ปลาหมึก / หมึก
  oyster: "/icons/foods/oyster.png", // หอย / หอยนางรม / หอยแมลงภู่ / หอยลาย

  // ไข่ / นม / ชีส / เนย
  egg: "/icons/foods/egg.png", // ไข่ / ไข่ไก่ / ไข่เป็ด
  milk: "/icons/foods/milk.png", // นม / นมสด / นมจืด
  yogurt: "/icons/foods/yogurt.png", // โยเกิร์ต
  cheese: "/icons/foods/cheese.png", // ชีส
  butter: "/icons/foods/butter.png", // เนย

  // ผักสด & สมุนไพร (แยกเฉพาะ ไม่ปนกัน)
  herb: "/icons/foods/herb.png", // กะเพรา / ใบกะเพรา / โหระพา / สะระแหน่ / สมุนไพร
  broccoli: "/icons/foods/broccoli.png", // บรอกโคลี
  corn: "/icons/foods/corn.png", // ข้าวโพด
  eggplant: "/icons/foods/eggplant.png", // มะเขือยาว / มะเขือเปราะ / มะเขือม่วง
  bell_pepper: "/icons/foods/bell_pepper.png", // พริกหวาน / พริกหยวก
  sweet_potato: "/icons/foods/sweet_potato.png", // มันหวาน / มันเผา / มันม่วง
  peanuts: "/icons/foods/peanuts.png", // ถั่ว / ถั่วลิสง / ถั่วฝักยาว
  chestnut: "/icons/foods/chestnut.png", // เกาลัด
  kale: "/icons/foods/kale.png", // คะน้า / กวางตุ้ง / ผักบุ้ง
  cabbage: "/icons/foods/cabbage.png", // กะหล่ำ / ผักกาด / สลัด / ผักกาดหอม
  cucumber: "/icons/foods/cucumber.png", // แตงกวา
  carrot: "/icons/foods/carrot.png", // แครอท
  tomato: "/icons/foods/tomato.png", // มะเขือเทศ
  potato: "/icons/foods/potato.png", // มันฝรั่ง
  onion: "/icons/foods/onion.png", // หัวหอม / หอมใหญ่ / หอมแดง
  chili: "/icons/foods/chili.png", // พริก / พริกขี้หนู / พริกจินดา
  garlic: "/icons/foods/garlic.png", // กระเทียม
  spring_onion: "/icons/foods/spring_onion.png", // ต้นหอม
  coriander: "/icons/foods/coriander.png", // ผักชี
  mushroom: "/icons/foods/mushroom.png", // เห็ด
  tofu: "/icons/foods/tofu.png", // เต้าหู้

  // ผลไม้ (แยกไอคอนเฉพาะทุกชนิด ไม่แสดงแอปเปิ้ลแทนผลไม้อื่น)
  rambutan: "/icons/foods/rambutan.png", // เงาะ
  durian: "/icons/foods/durian.png", // ทุเรียน
  mangosteen: "/icons/foods/mangosteen.png", // มังคุด
  dragonfruit: "/icons/foods/dragonfruit.png", // แก้วมังกร
  papaya: "/icons/foods/papaya.png", // มะละกอ
  guava: "/icons/foods/guava.png", // ฝรั่ง / ชมพู่
  lychee: "/icons/foods/lychee.png", // ลิ้นจี่ / ลำไย
  pineapple: "/icons/foods/pineapple.png", // สับปะรด
  coconut: "/icons/foods/coconut.png", // มะพร้าว
  avocado: "/icons/foods/avocado.png", // อะโวคาโด
  peach: "/icons/foods/peach.png", // ลูกพีช
  cherries: "/icons/foods/cherries.png", // เชอร์รี่
  kiwi: "/icons/foods/kiwi.png", // กีวี่
  pear: "/icons/foods/pear.png", // สาลี่ / ลูกแพร์
  melon: "/icons/foods/melon.png", // เมลอน / แคนตาลูป
  watermelon: "/icons/foods/watermelon.png", // แตงโม
  banana: "/icons/foods/banana.png", // กล้วย
  apple: "/icons/foods/apple.png", // แอปเปิ้ล
  orange: "/icons/foods/orange.png", // ส้ม
  lemon: "/icons/foods/lemon.png", // มะนาว / เลมอน
  strawberry: "/icons/foods/strawberry.png", // สตรอว์เบอร์รี่
  grape: "/icons/foods/grape.png", // องุ่น
  mango: "/icons/foods/mango.png", // มะม่วง

  // เบเกอรี่ ขนม และของหวาน (แยกไอคอนเฉพาะ ไม่แสดงเป็นขนมปังเหมือนกันหมด)
  bread: "/icons/foods/bread.png", // ขนมปัง / โทสต์
  sandwich: "/icons/foods/sandwich.png", // แซนด์วิช
  croissant: "/icons/foods/croissant.png", // ครัวซองต์
  cake: "/icons/foods/cake.png", // เค้ก / เค้กช็อกโกแลต / บราวนี่
  cupcake: "/icons/foods/cupcake.png", // คัพเค้ก
  chocolate: "/icons/foods/chocolate.png", // ช็อกโกแลต / โกโก้
  cookie: "/icons/foods/cookie.png", // คุกกี้ / บิสกิต
  doughnut: "/icons/foods/doughnut.png", // โดนัท
  pie: "/icons/foods/pie.png", // พาย / ทาร์ต
  waffle: "/icons/foods/waffle.png", // วาฟเฟิล
  pancake: "/icons/foods/pancake.png", // แพนเค้ก
  candy: "/icons/foods/candy.png", // ลูกอม / ลูกกวาด / เยลลี่
  lollipop: "/icons/foods/lollipop.png", // อมยิ้ม
  popcorn: "/icons/foods/popcorn.png", // ป๊อปคอร์น
  french_fries: "/icons/foods/french_fries.png", // เฟรนช์ฟรายส์
  hamburger: "/icons/foods/hamburger.png", // แฮมเบอร์เกอร์ / เบอร์เกอร์
  pizza: "/icons/foods/pizza.png", // พิซซ่า
  ice_cream: "/icons/foods/ice_cream.png", // ไอศกรีม / ไอติม

  // เครื่องดื่ม & น้ำแข็ง
  water: "/icons/foods/water.png", // น้ำเปล่า / น้ำดื่ม / น้ำแร่
  ice: "/icons/foods/ice.png", // น้ำแข็ง
  juice: "/icons/foods/juice.png", // น้ำผลไม้
  soda: "/icons/foods/soda.png", // น้ำอัดลม / โคล่า / เป๊ปซี่
  green_tea: "/icons/foods/green_tea.png", // ชาเขียว
  thai_tea: "/icons/foods/thai_tea.png", // ชาไทย / ชาเย็น / ชานม
  coffee: "/icons/foods/coffee.png", // กาแฟ

  // ข้าว / เส้น
  rice: "/icons/foods/rice.png", // ข้าว / ข้าวสวย / ข้าวกล้อง
  noodle: "/icons/foods/noodle.png", // เส้น / บะหมี่ / ก๋วยเตี๋ยว / พาสต้า

  // Fallback หมวดหมู่ทั่วไป
  category_veg: "/icons/foods/category_veg.png",
  category_fruit: "/icons/foods/category_fruit.png",
  category_meat: "/icons/foods/category_meat.png",
  category_egg: "/icons/foods/category_egg.png",
  category_dairy: "/icons/foods/category_dairy.png",
  default_basket: "/icons/foods/default_basket.png"
};

// ฟังก์ชันตรวจจับเครื่องปรุงแบบแห้ง
export const isDrySeasoning = (name = "") => {
  const n = (name || "").toLowerCase().trim();
  return (
    n.includes("น้ำตาล") ||
    n.includes("เกลือ") ||
    n.includes("พริกไทย") ||
    n.includes("ผงปรุงรส") ||
    n.includes("รสดี") ||
    n.includes("คนอร์") ||
    n.includes("ผงชูรส") ||
    n.includes("พริกป่น") ||
    n.includes("ผงกะหรี่") ||
    n.includes("แป้งมัน") ||
    n.includes("แป้งข้าวโพด") ||
    n.includes("แป้งทอดกรอบ") ||
    n.includes("แป้ง") ||
    n.includes("งาขาว") ||
    n.includes("งาดำ")
  );
};

// ฟังก์ชันตรวจจับเครื่องปรุงแบบน้ำ
export const isLiquidSeasoning = (name = "") => {
  const n = (name || "").toLowerCase().trim();
  return (
    n.includes("น้ำปลา") ||
    n.includes("น้ำสลัด") ||
    n.includes("ซอส") ||
    n.includes("ซีอิ๊ว") ||
    n.includes("ซีอิ้ว") ||
    n.includes("น้ำส้มสายชู") ||
    n.includes("น้ำมันหอย") ||
    n.includes("ซอสหอยนางรม") ||
    n.includes("น้ำมันพืช") ||
    n.includes("น้ำมันหมู") ||
    n.includes("น้ำมันงา") ||
    n.includes("น้ำมันมะกอก") ||
    n.includes("น้ำมัน") ||
    n.includes("กะทิ") ||
    n.includes("น้ำมะนาว") ||
    n.includes("น้ำพริกเผา") ||
    n.includes("น้ำจิ้ม") ||
    n.includes("มายองเนส") ||
    n.includes("น้ำเชื่อม") ||
    n.includes("น้ำผึ้ง")
  );
};

// คืนค่าประเภทของเครื่องปรุง ('dry' | 'liquid' | null)
export const getSeasoningType = (name = "") => {
  if (isDrySeasoning(name)) return "dry";
  if (isLiquidSeasoning(name)) return "liquid";
  return null;
};

// ==========================================
// 🔍 คืนค่า URL ไอคอนวัตถุดิบ 3D ตรงตามชื่อ 100%
// แยกละเอียด ไม่ใช้ไอคอนคล้ายกันหรือแอปเปิ้ลเหมาผลไม้ทั้งหมด
// ==========================================
export const getIngredientIconUrl = (name = "", category = "") => {
  const n = (name || "").toLowerCase().trim();
  const c = (category || "").toLowerCase().trim();

  // --- 0. ตรวจจับเครื่องปรุงรสก่อน เพื่อป้องกันคำซ้อน (เช่น "น้ำปลา" มีคำว่า "ปลา", "พริกไทย" มีคำว่า "พริก") ---
  if (isDrySeasoning(n)) {
    return DRY_SEASONING_ICON;
  }
  if (isLiquidSeasoning(n)) {
    return LIQUID_SEASONING_ICON;
  }

  // --- 1. น้ำแข็ง (ตรวจก่อนน้ำเปล่าและเครื่องดื่ม) ---
  if (n.includes("น้ำแข็ง")) {
    return USER_ORIGINAL_ICONS.ice;
  }

  // --- 2. ขนม เบเกอรี่ และของหวาน (แยกไอคอนเฉพาะแต่ละชนิดอย่างแม่นยำ ไม่เหมาเป็นก้อนขนมปัง) ---
  if (n.includes("คัพเค้ก")) {
    return USER_ORIGINAL_ICONS.cupcake;
  }
  if (n.includes("เค้ก") || n.includes("บราวนี่") || n.includes("เค็ก")) {
    return USER_ORIGINAL_ICONS.cake;
  }
  if (n.includes("ช็อกโกแลต") || n.includes("ช็อคโกแลต") || n.includes("โกโก้") || n.includes("ช็อกโกแล็ต")) {
    return USER_ORIGINAL_ICONS.chocolate;
  }
  if (n.includes("ครัวซองต์") || n.includes("ครัวซอง")) {
    return USER_ORIGINAL_ICONS.croissant;
  }
  if (n.includes("คุกกี้") || n.includes("คุ๊กกี้") || n.includes("บิสกิต")) {
    return USER_ORIGINAL_ICONS.cookie;
  }
  if (n.includes("โดนัท")) {
    return USER_ORIGINAL_ICONS.doughnut;
  }
  if (n.includes("พาย") || n.includes("ทาร์ต")) {
    return USER_ORIGINAL_ICONS.pie;
  }
  if (n.includes("วาฟเฟิล")) {
    return USER_ORIGINAL_ICONS.waffle;
  }
  if (n.includes("แพนเค้ก")) {
    return USER_ORIGINAL_ICONS.pancake;
  }
  if (n.includes("ไอศกรีม") || n.includes("ไอติม")) {
    return USER_ORIGINAL_ICONS.ice_cream;
  }
  if (n.includes("อมยิ้ม")) {
    return USER_ORIGINAL_ICONS.lollipop;
  }
  if (n.includes("ลูกอม") || n.includes("ลูกกวาด") || n.includes("เยลลี่") || n.includes("กัมมี่")) {
    return USER_ORIGINAL_ICONS.candy;
  }
  if (n.includes("ป๊อปคอร์น") || n.includes("ป็อปคอร์น")) {
    return USER_ORIGINAL_ICONS.popcorn;
  }
  if (n.includes("เฟรนช์ฟรายส์") || n.includes("เฟรนช์ฟราย") || n.includes("เฟร้นฟราย")) {
    return USER_ORIGINAL_ICONS.french_fries;
  }
  if (n.includes("เบอร์เกอร์") || n.includes("แฮมเบอร์เกอร์")) {
    return USER_ORIGINAL_ICONS.hamburger;
  }
  if (n.includes("พิซซ่า")) {
    return USER_ORIGINAL_ICONS.pizza;
  }
  if (n.includes("แซนด์วิช") || n.includes("แซนวิช")) {
    return USER_ORIGINAL_ICONS.sandwich;
  }
  if (n.includes("ขนมปัง") || n.includes("ขนมโทสต์") || n.includes("โทสต์")) {
    return USER_ORIGINAL_ICONS.bread;
  }

  // --- 3. ผลไม้สด (มีไอคอนตรงตัวของแต่ละชนิด ไม่แสดงแอปเปิ้ลแทนผลไม้อื่น) ---
  if (n.includes("เงาะ")) {
    return USER_ORIGINAL_ICONS.rambutan; // ⭐️ ไอคอนเงาะ 3D โดยตรง ไม่ใช่แอปเปิ้ล
  }
  if (n.includes("ทุเรียน")) {
    return USER_ORIGINAL_ICONS.durian;
  }
  if (n.includes("มังคุด")) {
    return USER_ORIGINAL_ICONS.mangosteen;
  }
  if (n.includes("แก้วมังกร")) {
    return USER_ORIGINAL_ICONS.dragonfruit;
  }
  if (n.includes("มะละกอ")) {
    return USER_ORIGINAL_ICONS.papaya;
  }
  if (n.includes("ฝรั่ง") || n.includes("ชมพู่")) {
    return USER_ORIGINAL_ICONS.guava;
  }
  if (n.includes("ลิ้นจี่") || n.includes("ลำไย")) {
    return USER_ORIGINAL_ICONS.lychee;
  }
  if (n.includes("สับปะรด")) {
    return USER_ORIGINAL_ICONS.pineapple;
  }
  if (n.includes("มะพร้าว")) {
    return USER_ORIGINAL_ICONS.coconut;
  }
  if (n.includes("อะโวคาโด") || n.includes("อโวคาโด")) {
    return USER_ORIGINAL_ICONS.avocado;
  }
  if (n.includes("ลูกพีช") || n.includes("พีช")) {
    return USER_ORIGINAL_ICONS.peach;
  }
  if (n.includes("เชอร์รี่") || n.includes("เชอรี่")) {
    return USER_ORIGINAL_ICONS.cherries;
  }
  if (n.includes("กีวี่")) {
    return USER_ORIGINAL_ICONS.kiwi;
  }
  if (n.includes("สาลี่") || n.includes("ลูกแพร์")) {
    return USER_ORIGINAL_ICONS.pear;
  }
  if (n.includes("เมลอน") || n.includes("แคนตาลูป") || n.includes("เมล่อน")) {
    return USER_ORIGINAL_ICONS.melon;
  }
  if (n.includes("แตงโม")) {
    return USER_ORIGINAL_ICONS.watermelon;
  }
  if (n.includes("กล้วย")) {
    return USER_ORIGINAL_ICONS.banana;
  }
  if (n.includes("ส้ม")) {
    return USER_ORIGINAL_ICONS.orange;
  }
  if (n.includes("มะนาว") || n.includes("เลมอน")) {
    return USER_ORIGINAL_ICONS.lemon;
  }
  if (
    n.includes("สตรอว์เบอร์รี") ||
    n.includes("สตรอเบอรี่") ||
    n.includes("สตรอว์เบอร์รี่") ||
    n.includes("สตรอเบอร์รี่")
  ) {
    return USER_ORIGINAL_ICONS.strawberry;
  }
  if (n.includes("องุ่น")) {
    return USER_ORIGINAL_ICONS.grape;
  }
  if (n.includes("มะม่วง")) {
    return USER_ORIGINAL_ICONS.mango;
  }
  if (n.includes("แอปเปิ้ล") || n.includes("แอปเปิล")) {
    return USER_ORIGINAL_ICONS.apple;
  }

  // --- 4. ไข่ (ป้องกัน "ไข่ไก่", "ไข่เป็ด" ไปจับคู่กับ "ไก่") ---
  if (n.includes("ไข่")) {
    return USER_ORIGINAL_ICONS.egg;
  }

  // --- 5. อาหารทะเล & สัตว์น้ำ ---
  if (n.includes("หมึก") || n.includes("ปลาหมึก")) {
    return USER_ORIGINAL_ICONS.squid;
  }
  if (n.includes("หอย") || n.includes("หอยนางรม") || n.includes("หอยแมลงภู่") || n.includes("หอยลาย") || n.includes("หอยแครง")) {
    return USER_ORIGINAL_ICONS.oyster;
  }
  if (n.includes("ปู") || n.includes("ปูอัด")) {
    return USER_ORIGINAL_ICONS.crab;
  }
  if (n.includes("กุ้ง")) {
    return USER_ORIGINAL_ICONS.shrimp;
  }
  if (n.includes("แซลมอน")) {
    return USER_ORIGINAL_ICONS.salmon;
  }
  if (
    n.includes("ปลา") ||
    n.includes("ปลานิล") ||
    n.includes("ปลาทู") ||
    n.includes("ปลาดุก") ||
    n.includes("ปลากระพง") ||
    n.includes("ปลากะพง") ||
    n.includes("ทูน่า") ||
    n.includes("ปลาซาบะ") ||
    n.includes("ดอลลี่")
  ) {
    return USER_ORIGINAL_ICONS.fish;
  }

  // --- 6. สมุนไพร ผักใบ และต้นหอมผักชี ---
  if (n.includes("ต้นหอม")) {
    return USER_ORIGINAL_ICONS.spring_onion;
  }
  if (n.includes("ผักชี") || n.includes("ชี")) {
    return USER_ORIGINAL_ICONS.coriander;
  }
  if (
    n.includes("หัวหอม") ||
    n.includes("หอมใหญ่") ||
    n.includes("หอมแดง") ||
    n.includes("หอมหัวใหญ่") ||
    n.includes("หอมแขก")
  ) {
    return USER_ORIGINAL_ICONS.onion;
  }
  // สมุนไพรไทย (กะเพรา, โหระพา, สะระแหน่) ไม่ให้ปนกับคะน้า
  if (
    n.includes("กะเพรา") ||
    n.includes("ใบกะเพรา") ||
    n.includes("โหระพา") ||
    n.includes("สะระแหน่") ||
    n.includes("ใบเตย") ||
    n.includes("สมุนไพร") ||
    n.includes("โรสแมรี่") ||
    n.includes("ออริกาโน่")
  ) {
    return USER_ORIGINAL_ICONS.herb;
  }

  // --- 7. เนื้อสัตว์ปีก ---
  if (n.includes("อกไก่") || n.includes("สันในไก่")) {
    return USER_ORIGINAL_ICONS.chicken_breast;
  }
  if (
    n.includes("ปีกไก่") ||
    n.includes("น่องไก่") ||
    n.includes("ไก่ทอด") ||
    n.includes("ไก่") ||
    n.includes("เนื้อไก่") ||
    n.includes("เป็ด")
  ) {
    return USER_ORIGINAL_ICONS.poultry;
  }

  // --- 8. เนื้อแปรรูป & หมู ---
  if (n.includes("ไส้กรอก") || n.includes("กุนเชียง") || n.includes("ฮอทดอก") || n.includes("ฮอตดอก")) {
    return USER_ORIGINAL_ICONS.sausage;
  }
  if (n.includes("เกี๊ยว") || n.includes("ขนมจีบ") || n.includes("ติ่มซำ") || n.includes("ลูกชิ้น") || n.includes("หมูยอ")) {
    return USER_ORIGINAL_ICONS.dumpling;
  }
  if (
    n.includes("หมู") ||
    n.includes("หมูสับ") ||
    n.includes("เนื้อหมู") ||
    n.includes("หมูกรอบ") ||
    n.includes("หมูสามชั้น") ||
    n.includes("หมูเด้ง") ||
    n.includes("เบคอน") ||
    n.includes("แฮม")
  ) {
    return USER_ORIGINAL_ICONS.pork;
  }

  // --- 9. เนื้อวัว ---
  if (
    n.includes("เนื้อวัว") ||
    n.includes("สเต็ก") ||
    n.includes("เนื้อสัน") ||
    n.includes("เนื้อบด") ||
    n.includes("ริบอาย") ||
    n.includes("เนื้อ")
  ) {
    return USER_ORIGINAL_ICONS.beef;
  }

  // --- 10. นม / โยเกิร์ต / ชีส / เนย ---
  if (n.includes("โยเกิร์ต")) {
    return USER_ORIGINAL_ICONS.yogurt;
  }
  if (n.includes("ชีส")) {
    return USER_ORIGINAL_ICONS.cheese;
  }
  if (n.includes("เนย")) {
    return USER_ORIGINAL_ICONS.butter;
  }
  if (
    n.includes("นม") ||
    n.includes("นมสด") ||
    n.includes("นมจืด") ||
    n.includes("นมข้น") ||
    n.includes("นมเปรี้ยว") ||
    n.includes("วิปครีม")
  ) {
    return USER_ORIGINAL_ICONS.milk;
  }

  // --- 11. ผักสดเฉพาะชนิด ---
  if (n.includes("บรอกโคลี") || n.includes("บล็อกโคลี่") || n.includes("บล็อคโคลี่") || n.includes("บร็อคโคลี่")) {
    return USER_ORIGINAL_ICONS.broccoli;
  }
  if (n.includes("ข้าวโพด") || n.includes("ข้าวโพดอ่อน")) {
    return USER_ORIGINAL_ICONS.corn;
  }
  if (n.includes("พริกหวาน") || n.includes("พริกหยวก")) {
    return USER_ORIGINAL_ICONS.bell_pepper;
  }
  if (n.includes("มะเขือยาว") || n.includes("มะเขือม่วง") || n.includes("มะเขือเปราะ") || n.includes("มะเขือพวง")) {
    return USER_ORIGINAL_ICONS.eggplant;
  }
  if (n.includes("มันหวาน") || n.includes("มันเผา") || n.includes("มันม่วง") || n.includes("มันญี่ปุ่น")) {
    return USER_ORIGINAL_ICONS.sweet_potato;
  }
  if (n.includes("ถั่ว") || n.includes("ถั่วลิสง") || n.includes("ถั่วฝักยาว") || n.includes("ถั่วลันเตา")) {
    return USER_ORIGINAL_ICONS.peanuts;
  }
  if (n.includes("เกาลัด")) {
    return USER_ORIGINAL_ICONS.chestnut;
  }
  if (n.includes("แตงกวา")) {
    return USER_ORIGINAL_ICONS.cucumber;
  }
  if (n.includes("แครอท")) {
    return USER_ORIGINAL_ICONS.carrot;
  }
  if (n.includes("มะเขือเทศ")) {
    return USER_ORIGINAL_ICONS.tomato;
  }
  if (n.includes("มันฝรั่ง") || n.includes("มันเทศ") || n.includes("เผือก")) {
    return USER_ORIGINAL_ICONS.potato;
  }
  if (
    n.includes("พริก") ||
    n.includes("พริกขี้หนู") ||
    n.includes("พริกชี้ฟ้า") ||
    n.includes("พริกจินดา")
  ) {
    return USER_ORIGINAL_ICONS.chili;
  }
  if (n.includes("กระเทียม")) {
    return USER_ORIGINAL_ICONS.garlic;
  }
  if (
    n.includes("เห็ด") ||
    n.includes("เห็ดหอม") ||
    n.includes("เห็ดเข็มทอง") ||
    n.includes("เห็ดฟาง") ||
    n.includes("เห็ดออรินจิ")
  ) {
    return USER_ORIGINAL_ICONS.mushroom;
  }
  if (n.includes("เต้าหู้")) {
    return USER_ORIGINAL_ICONS.tofu;
  }
  if (
    n.includes("คะน้า") ||
    n.includes("กวางตุ้ง") ||
    n.includes("ผักบุ้ง") ||
    n.includes("ผักโขม") ||
    n.includes("ตำลึง") ||
    n.includes("ชะอม")
  ) {
    return USER_ORIGINAL_ICONS.kale;
  }
  if (
    n.includes("กะหล่ำ") ||
    n.includes("กำหล่ำ") ||
    n.includes("ผักกาด") ||
    n.includes("สลัด") ||
    n.includes("ผักกาดหอม") ||
    n.includes("ผักกาดขาว") ||
    n.includes("กะหล่ำปลี") ||
    n.includes("ถั่วงอก")
  ) {
    return USER_ORIGINAL_ICONS.cabbage;
  }

  // --- 12. เครื่องดื่ม ---
  if (
    n.includes("น้ำเปล่า") ||
    n.includes("น้ำดื่ม") ||
    n.includes("น้ำแร่")
  ) {
    return USER_ORIGINAL_ICONS.water;
  }
  if (n.includes("น้ำผลไม้")) {
    return USER_ORIGINAL_ICONS.juice;
  }
  if (
    n.includes("น้ำอัดลม") ||
    n.includes("โคล่า") ||
    n.includes("เป๊ปซี่") ||
    n.includes("สไปรท์")
  ) {
    return USER_ORIGINAL_ICONS.soda;
  }
  if (n.includes("ชาเขียว")) {
    return USER_ORIGINAL_ICONS.green_tea;
  }
  if (n.includes("ชาไทย") || n.includes("ชาเย็น") || n.includes("ชานม")) {
    return USER_ORIGINAL_ICONS.thai_tea;
  }
  if (n.includes("กาแฟ")) {
    return USER_ORIGINAL_ICONS.coffee;
  }

  // --- 13. ข้าว / เส้น ---
  if (
    n.includes("ข้าว") ||
    n.includes("ข้าวสวย") ||
    n.includes("ข้าวกล้อง") ||
    n.includes("ข้าวผัด") ||
    n.includes("ข้าวต้ม") ||
    n.includes("ข้าวเหนียว") ||
    n.includes("ข้าวหอมมะลิ")
  ) {
    return USER_ORIGINAL_ICONS.rice;
  }
  if (
    n.includes("เส้น") ||
    n.includes("บะหมี่") ||
    n.includes("ก๋วยเตี๋ยว") ||
    n.includes("พาสต้า") ||
    n.includes("สปาเก็ตตี้") ||
    n.includes("วุ้นเส้น") ||
    n.includes("มาม่า") ||
    n.includes("ราเมง")
  ) {
    return USER_ORIGINAL_ICONS.noodle;
  }

  // --- 14. ขนมทั่วไป ---
  if (n.includes("ขนม")) {
    return USER_ORIGINAL_ICONS.cookie;
  }

  // --- 15. แยกตามหมวดหมู่ถ้าไม่พบชื่อตรงๆ ---
  if (c.includes("ผัก") || c === "veg" || c === "vegetable") return USER_ORIGINAL_ICONS.category_veg;
  if (c.includes("ผลไม้") || c === "fruit") return USER_ORIGINAL_ICONS.category_fruit;
  if (c.includes("เนื้อสัตว์") || c === "meat") return USER_ORIGINAL_ICONS.category_meat;
  if (c.includes("ไข่") || c === "egg") return USER_ORIGINAL_ICONS.category_egg;
  if (c.includes("เครื่องดื่ม") || c.includes("นม") || c === "dairy") return USER_ORIGINAL_ICONS.category_dairy;
  if (c.includes("ขนม") || c.includes("เบเกอรี่") || c === "snack" || c === "bakery") return USER_ORIGINAL_ICONS.cake;
  if (c.includes("เครื่องปรุง") || c === "seasoning") return DRY_SEASONING_ICON;

  // ภาพเริ่มต้นกรณีทั่วไป (ตะกร้าของสด)
  return USER_ORIGINAL_ICONS.default_basket;
};

// Component รูปไอคอนอาหารพร้อม fallback อัตโนมัติและสไตล์พรีเมียม
export function FoodIcon({
  name = "",
  category = "",
  className = "h-11 w-11 rounded-2xl bg-slate-50 border border-slate-100 p-2 shrink-0 shadow-inner",
  imgClassName = "w-full h-full object-contain drop-shadow-sm",
  fallbackSrc = USER_ORIGINAL_ICONS.default_basket
}) {
  const iconUrl = getIngredientIconUrl(name, category);

  return (
    <div
      className={`flex items-center justify-center select-none overflow-hidden transition-all duration-200 ${className}`}
    >
      <img
        src={iconUrl}
        alt={name || "วัตถุดิบ"}
        className={imgClassName}
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          if (!e.target.src.endsWith(fallbackSrc) && e.target.src !== fallbackSrc) {
            e.target.src = fallbackSrc;
          }
        }}
      />
    </div>
  );
}
