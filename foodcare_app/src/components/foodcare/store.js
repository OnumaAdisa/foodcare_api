// เติมฟังก์ชันส่งสัญญาณสะกิดหน้าจอ (Event Emitter) ให้ UI หน้าบ้านตื่นตัวรีเรนเดอร์อัตโนมัติ
const notifyFridgeObservers = () => {
  window.dispatchEvent(new Event("fridge_store_updated"));
};

const notifyShoppingObservers = () => {
  window.dispatchEvent(new Event("shopping_store_updated"));
};

// =======================================================
// 🧊 1. หน่วยความจำฝั่งตู้เย็นอัจฉริยะ (Fridge Stock Memory) - เวอร์ชันแยกบ้าน
// =======================================================

// ปรับข้อมูลเริ่มต้น (Seed Data) ให้มีคีย์ของบ้านกำกับไว้พยุงลอจิกแรกเริ่ม
let currentItems = [];

// 🟢 ปรับปรุง: Hook ดึงข้อมูลในตู้เย็น สกัดตาม householdId ของผู้ใช้ที่ล็อกอินอยู่จริง
import { useState, useEffect } from "react";

export function useItems(householdId = 1) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const handleUpdate = () => {
      // ดึงมาเฉพาะชิ้นที่มี householdId ตรงกับยูสเซอร์
      const filtered = currentItems.filter((it) => Number(it.householdId) === Number(householdId));
      setItems(filtered);
    };

    handleUpdate();
    window.addEventListener("fridge_store_updated", handleUpdate);
    return () => window.removeEventListener("fridge_store_updated", handleUpdate);
  }, [householdId]);

  return items;
}

// ฟังก์ชันสำหรับบันทึกวัตถุดิบใหม่เข้าตู้เย็น (รองรับ householdId พ่วงมากับไอเทม)
export const addItem = (newItem) => {
  if (!newItem.id) {
    newItem.id = `fridge-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  }
  currentItems.push(newItem);
  console.log("🟢 [Fridge] บันทึกไอเทมลงตู้เย็นของบ้านไอดี:", newItem.householdId, newItem);
  notifyFridgeObservers();
};

// อัปเดต % ปริมาณคงเหลือของวัตถุดิบ 
export const setPercent = (id, newPercent) => {
  currentItems = currentItems.map((it) => 
    it.id === id ? { ...it, percent: newPercent, status: newPercent } : it
  );
  console.log(`🔄 [Fridge] อัปเดตปริมาณไอเทมรหัส ${id} เป็น: ${newPercent}%`);
  notifyFridgeObservers();
};

// ลบวัตถุดิบออกจากตู้เย็น
export const removeItem = (id) => {
  currentItems = currentItems.filter((it) => it.id !== id);
  console.log(`🗑️ [Fridge] ลบไอเทมรหัส ${id} ออกจากตู้เย็นแล้ว`);
  notifyFridgeObservers();
};


// =======================================================
// 🛒 2. หน่วยความจำฝั่งรายการจัดซื้อ (Shopping List Memory) - เวอร์ชันแยกบ้าน
// =======================================================
let shoppingItems = [
  { id: "shop-1", name: "เนื้อหมูบด", qty: "500 g", checked: false, reason: "manual", householdId: 1 },
  { id: "shop-2", name: "บล็อกโคลี่", qty: "1 หัว", checked: true, reason: "low", householdId: 1 }
];

// 🟢 ปรับปรุง: Hook ดึงลิสต์เตรียมซื้อ แยกบ้านใครบ้านมัน
export function useShopping(householdId = 1) {
  const [shopList, setShopList] = useState([]);

  useEffect(() => {
    const handleUpdate = () => {
      const filtered = shoppingItems.filter((it) => Number(it.householdId) === Number(householdId));
      setShopList(filtered);
    };

    handleUpdate();
    window.addEventListener("shopping_store_updated", handleUpdate);
    return () => window.removeEventListener("shopping_store_updated", handleUpdate);
  }, [householdId]);

  return shopList;
}

// 🟢 ปรับปรุง: เพิ่มของเข้าลิสต์จัดซื้อโดยผูก householdId ติดไปด้วย
export const addShopItem = (item, householdId = 1) => {
  const newItem = {
    id: `shop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: item.name,
    qty: item.qty || "1 ชิ้น",
    checked: false,
    reason: item.reason || "manual",
    householdId: item.householdId || householdId // ผูกเข้าไอดีบ้านผู้จด
  };
  shoppingItems.push(newItem);
  console.log("📥 [Shopping] เพิ่มของเข้าลิสต์สำเร็จ ของบ้านไอดี:", newItem.householdId, newItem);
  notifyShoppingObservers();
};

export const toggleShopItem = (id) => {
  shoppingItems = shoppingItems.map((it) => 
    it.id === id ? { ...it, checked: !it.checked } : it
  );
  notifyShoppingObservers();
};

export const removeShopItem = (id) => {
  shoppingItems = shoppingItems.filter((it) => it.id !== id);
  notifyShoppingObservers();
};

export const clearCheckedShop = () => {
  shoppingItems = shoppingItems.filter((it) => !it.checked);
  notifyShoppingObservers();
};


// =======================================================
// 🧠 3. ลอจิกสมองกล AI แนะนำการซื้อเชื่อมโยงระหว่างตู้เย็น
// =======================================================
export const getShoppingSuggestions = () => {
  return [
    { fromItemId: "sug-1", name: "สตรอว์เบอร์รี่ Prarachatan 80", qty: "1 กล่อง", category: "fruit", reason: "out" },
    { fromItemId: "sug-2", name: "เนื้อปลากะพง", qty: "300 g", category: "meat", reason: "low" },
    { fromItemId: "sug-3", name: "ผักกาดหอมหมักเนื้อ", qty: "1 แพ็ค", category: "vegetable", reason: "expiring" }
  ];
};

// 🟢 ปรับปรุง: ย้ายของที่ติ๊กเลือกซื้อเสร็จแล้ว เข้าสู่ตู้เย็นของบ้านตัวเองได้อย่างถูกต้อง
export const moveCheckedToFridge = (householdId = 1, expiryDays = 7) => {
  // กรองเฉพาะของที่เช็คแล้ว และต้องตรงกับบ้านตัวเองด้วย
  const checkedItems = shoppingItems.filter((it) => it.checked && Number(it.householdId) === Number(householdId));
  
  checkedItems.forEach((it) => {
    const today = new Date();
    today.setDate(today.getDate() + expiryDays);
    const expiryDateStr = today.toISOString().split('T')[0];
    
    // โยนเข้าฟังก์ชันตู้เย็นพร้อมระบุ householdId ประจำบ้านคนนั้น
    addItem({
      id: `fridge-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: it.name,
      qty: it.qty,
      daysLeft: expiryDays,
      expiryDate: expiryDateStr,
      category: "other", // มาร์คหมวดหมู่อื่นๆ ไว้ก่อนชั่วคราว
      percent: 100,
      householdId: householdId // ✨ ส่งต่อสิทธิ์บ้านเข้าตู้เย็นตรงเป๊ะ
    });
  });

  const beforeCount = checkedItems.length;
  
  // ล้างเฉพาะรายการของบ้านตัวเองที่เคลียร์เสร็จแล้วออกจากตารางช้อปปิ้ง
  shoppingItems = shoppingItems.filter((it) => !(it.checked && Number(it.householdId) === Number(householdId)));
  
  notifyShoppingObservers();
  notifyFridgeObservers();
  return beforeCount;
};