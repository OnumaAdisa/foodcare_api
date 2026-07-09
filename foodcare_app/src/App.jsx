import { useState } from "react";
import Login from "./routes/login";
import Signup from "./routes/signup";
import Dashboard from "./routes/dashboard"; 
import Fridge from "./routes/fridge";       
import AddItemPage from "./routes/add";     
import Recipes from "./routes/recipes";       
import RecipeDetail from "./routes/recipe_detail";  
import CookingPage from "./routes/cooking";      
import QuickAddPage from "./routes/quick_add";   
import ShoppingPage from "./routes/shopping.jsx";    
import AlertsPage from "./routes/alerts";        
import HouseholdPage from "./routes/household";  
import FridgeDetailPage from "./routes/fridge_detail"; 
import ScanPage from "./routes/scan";            

function App() {
  const [screen, setScreen] = useState("login"); 
  const [currentTab, setCurrentTab] = useState("home");
  const [selectedRecipeId, setSelectedRecipeId] = useState(null); 
  const [selectedFridgeItemId, setSelectedFridgeItemId] = useState(null); 

  // 🟢 1. เพิ่มสเตทส่วนกลางสำหรับเก็บข้อมูลผู้ใช้งานที่ทำการล็อกอินสำเร็จ
  const [currentUser, setCurrentUser] = useState(null); 

  const handleNavigate = (tabName, itemId = null) => {
    setCurrentTab(tabName);
    
    if (itemId) {
      setSelectedFridgeItemId(itemId);
    }
    
    if (
      tabName === "home" || 
      tabName === "profile" || 
      tabName === "fridge" || 
      tabName === "recipes" || 
      tabName === "shopping" || 
      tabName === "alerts"
    ) {
      setScreen("main_app"); 
    } else if (tabName === "add") {
      setScreen("add");       
    } else if (tabName === "quick-add") {
      setScreen("quick-add"); 
    } else if (tabName === "household") {
      setScreen("household"); 
    } else if (tabName === "fridge_detail") {
      setScreen("fridge_detail"); 
    } else if (tabName === "scan") {
      setScreen("scan");      
    }
  };

  const handleSelectRecipe = (id) => {
    setSelectedRecipeId(id);
    setScreen("recipe_detail");
  };

  // 🟢 2. ตอนออกจากระบบ ให้เคลียร์ข้อมูลผู้ใช้ทิ้งเพื่อความปลอดภัย
  const handleLogout = () => {
    setCurrentUser(null);
    setScreen("login");
    setCurrentTab("home");
  };

  // 🟢 3. หน้า Login: รับข้อมูลยูสเซอร์จริงจากหลังบ้าน (แกะมาจากคำสั่ง res.json()) มาเก็บในสเตทกลาง
  if (screen === "login") {
    return (
      <Login 
        onLogin={(userData) => { 
          setCurrentUser(userData); // 🟢 บันทึกข้อมูล { id, username, householdId } ลงหน่วยความจำแอป
          setScreen("main_app"); 
          setCurrentTab("home"); 
        }} 
        onSwitchToSignup={() => setScreen("signup")} 
      />
    );
  }

  if (screen === "signup") return <Signup onSwitchToLogin={() => setScreen("login")} />;
  
  if (screen === "main_app") {
    if (currentTab === "fridge") return <Fridge currentTab={currentTab} onNavigate={handleNavigate} onLogout={handleLogout} user={currentUser} />;
    if (currentTab === "recipes") return <Recipes currentTab={currentTab} onNavigate={handleNavigate} onSelectRecipe={handleSelectRecipe} user={currentUser} />;
    if (currentTab === "shopping") return <ShoppingPage currentTab={currentTab} onNavigate={handleNavigate} user={currentUser} />;
    if (currentTab === "alerts") return <AlertsPage onNavigate={handleNavigate} user={currentUser} />;
    if (currentTab === "quick-add") return <QuickAddPage onNavigate={handleNavigate} user={currentUser} />;

    // default หน้าแรก (home หรือ profile): 🟢 ยิง Props ตัวแปร user ส่งต่อไปยังหน้าจอ Dashboard
    return (
      <Dashboard 
        currentTab={currentTab} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout} 
        user={currentUser} 
      />
    );
  }

  if (screen === "add") return <AddItemPage onNavigate={handleNavigate} user={currentUser} />;
  if (screen === "recipe_detail") return <RecipeDetail recipeId={selectedRecipeId} onBack={() => { setScreen("main_app"); setCurrentTab("recipes"); }} onStartCooking={() => setScreen("cooking")} user={currentUser} />;
  if (screen === "cooking") return <CookingPage recipeId={selectedRecipeId} onBack={() => setScreen("recipe_detail")} onNavigateAfterDone={(targetTab) => handleNavigate(targetTab)} user={currentUser} />;
  if (screen === "quick-add") return <QuickAddPage onNavigate={handleNavigate} user={currentUser} />;
  if (screen === "household") return <HouseholdPage onNavigate={handleNavigate} user={currentUser} />;
  if (screen === "fridge_detail") return <FridgeDetailPage itemId={selectedFridgeItemId} onNavigate={handleNavigate} user={currentUser} />;

  if (screen === "scan") {
    return (
      <ScanPage 
        onNavigate={handleNavigate}
        user={currentUser}
      />
    );
  }

  return null;
}

export default App;