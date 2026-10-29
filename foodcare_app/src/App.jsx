import { useEffect, useState } from "react";
import Login from "./routes/login";
import Signup from "./routes/signup";

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "http://127.0.0.1:8080");
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
  const [screen, setScreen] = useState(() => {
    // ถ้ามีข้อมูลเซฟไว้ในเครื่อง ให้เริ่มที่หน้า main_app ทันที
    return localStorage.getItem("foodcare_user") ? "main_app" : "login";
  }); 
  const [currentTab, setCurrentTab] = useState("home");
  const [selectedRecipeId, setSelectedRecipeId] = useState(null); 
  const [selectedFridgeItemId, setSelectedFridgeItemId] = useState(null); 

  // ดึงข้อมูลผู้ใช้จาก localStorage มาเป็นค่าเริ่มต้น ป้องกันค่าหลุดตอน F5
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("foodcare_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }); 

  const saveUserData = (userData) => {
    const normalizedUser = {
      ...userData,
      id: userData?.id ?? userData?.user_id ?? userData?.userId,
      user_id: userData?.user_id ?? userData?.id ?? userData?.userId,
      householdId: userData?.householdId ?? userData?.household_id ?? null,
      household_id: userData?.household_id ?? userData?.householdId ?? null,
    };
    setCurrentUser(normalizedUser);
    localStorage.setItem("foodcare_user", JSON.stringify(normalizedUser));
  };

  useEffect(() => {
    // ตรวจสอบเซสชันกับหลังบ้าน (ตรวจทั้ง /api/auth/session และ /api/me)
    fetch(`${API_BASE}/api/auth/session`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data.success && data.user) {
          saveUserData(data.user);
          setScreen("main_app");
        }
      })
      .catch(() => {
        // หากไม่มี session ในเซิร์ฟเวอร์ ให้เคลียร์ค่าออก
        if (!localStorage.getItem("foodcare_user")) {
          setCurrentUser(null);
          setScreen("login");
        }
      });
  }, []);

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

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch (error) {
      console.warn("Logout request failed:", error);
    }
    localStorage.removeItem("foodcare_user");
    setCurrentUser(null);
    setScreen("login");
    setCurrentTab("home");
  };

  // หน้า Login
  if (screen === "login") {
    return (
      <Login 
        onLogin={(userData) => { 
          saveUserData(userData);
          setScreen("main_app"); 
          setCurrentTab("home"); 
        }} 
        onSwitchToSignup={() => setScreen("signup")} 
      />
    );
  }

  // หน้า Signup
  if (screen === "signup") {
    return (
      <Signup
        onSwitchToLogin={() => setScreen("login")}
        onLogin={(userData) => {
          saveUserData(userData);
          setScreen("main_app");
          setCurrentTab("home");
        }}
      />
    );
  }
  
  // หน้าจอหลักของแอป
  if (screen === "main_app") {
    if (currentTab === "fridge") return <Fridge currentTab={currentTab} onNavigate={handleNavigate} onLogout={handleLogout} user={currentUser} />;
    if (currentTab === "recipes") return <Recipes currentTab={currentTab} onNavigate={handleNavigate} onSelectRecipe={handleSelectRecipe} user={currentUser} />;
    if (currentTab === "shopping") return <ShoppingPage currentTab={currentTab} onNavigate={handleNavigate} user={currentUser} />;
    if (currentTab === "alerts") return <AlertsPage onNavigate={handleNavigate} user={currentUser} />;
    if (currentTab === "quick-add") return <QuickAddPage onNavigate={handleNavigate} user={currentUser} />;

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
  if (screen === "household") return <HouseholdPage onNavigate={handleNavigate} user={currentUser} onUpdateUser={saveUserData} />;
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