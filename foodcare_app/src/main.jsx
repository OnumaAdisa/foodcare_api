import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ✅ Global API Fetch Interceptor: ป้องกันปัญหาเซสชันหลุดหรือข้อมูลหายเมื่อรีสตาร์ทเซิร์ฟเวอร์
const originalFetch = window.fetch;
window.fetch = async function (resource, config = {}) {
  let url = typeof resource === 'string' ? resource : (resource?.url || '');

  if (url && (url.includes('/api/') || url.startsWith('/api'))) {
    try {
      const savedUserStr = localStorage.getItem('foodcare_user');
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        const userId = savedUser?.id ?? savedUser?.user_id ?? savedUser?.userId;
        const householdId = savedUser?.householdId ?? savedUser?.household_id;

        if (userId) {
          const nextConfig = { ...config };
          const headers = new Headers(nextConfig.headers || (resource instanceof Request ? resource.headers : {}));

          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${userId}`);
          }
          if (!headers.has('X-User-Id')) {
            headers.set('X-User-Id', String(userId));
          }
          if (householdId && !headers.has('X-Household-Id')) {
            headers.set('X-Household-Id', String(householdId));
          }

          nextConfig.headers = headers;
          if (!nextConfig.credentials) {
            nextConfig.credentials = 'include';
          }

          if (resource instanceof Request) {
            return originalFetch.call(this, new Request(resource, nextConfig));
          }
          return originalFetch.call(this, resource, nextConfig);
        }
      }
    } catch {
      // Continue to originalFetch if any parse error
    }
  }

  return originalFetch.call(this, resource, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

