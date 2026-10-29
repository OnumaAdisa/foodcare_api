const mysql = require('mysql2/promise');

const BASE_URL = 'http://127.0.0.1:8080';

// Simple cookie jar helper
class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  update(headers) {
    const raw = headers.get('set-cookie');
    if (!raw) return;
    const parts = raw.split(/,(?=[^;]+=[^;]+)/);
    for (const p of parts) {
      const first = p.split(';')[0].trim();
      const eqIdx = first.indexOf('=');
      if (eqIdx !== -1) {
        const name = first.slice(0, eqIdx);
        const val = first.slice(eqIdx + 1);
        this.cookies.set(name, val);
      }
    }
  }

  get header() {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }
}

async function api(path, options = {}, jar = null) {
  const headers = { ...(options.headers || {}) };
  if (jar && jar.cookies.size > 0) {
    headers['Cookie'] = jar.header;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (jar) jar.update(res.headers);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, data: json };
}

const testResults = [];
function record(testName, passed, details = '') {
  testResults.push({ name: testName, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${testName}] - ${passed ? 'PASSED' : 'FAILED'}${details ? ` (${details})` : ''}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 เริ่มต้นการทดสอบระบบ FoodCare ทั้งหมด (Full System Test)');
  console.log('====================================================\n');

  let db;
  try {
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'foodcare_db',
    });
    record('Database Connection (MySQL)', true, 'Connected to foodcare_db');
  } catch (err) {
    record('Database Connection (MySQL)', false, err.message);
    return;
  }

  const jar = new CookieJar();
  const testRunId = Date.now();
  const testUser = {
    username: `test_user_${testRunId}`,
    email: `test_${testRunId}@gmail.com`,
    phone: `089${String(testRunId).slice(-7)}`,
    password: 'TestPassword123!',
  };

  try {
    // 1. Session check on unauthenticated state (or default fallback)
    const initialSession = await api('/api/auth/session', { method: 'GET' }, jar);
    record('Auth: Check Initial Session', initialSession.ok, `Status: ${initialSession.status}`);

    // 2. Registration Flow: Send OTP
    const sendOtpRes = await api('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    }, jar);
    record('Auth: Register Send OTP', sendOtpRes.ok, `Status: ${sendOtpRes.status}, Msg: ${sendOtpRes.data?.message || ''}`);

    // Fetch OTP from database
    const [userRows] = await db.execute(
      'SELECT user_id, otp_code FROM users WHERE email = ? LIMIT 1',
      [testUser.email]
    );
    const otpCode = userRows[0]?.otp_code;
    const newUserId = userRows[0]?.user_id;
    record('Auth: Retrieve OTP from DB', !!otpCode, `OTP: ${otpCode}, User ID: ${newUserId}`);

    if (otpCode) {
      // 3. Verify OTP
      const verifyRes = await api('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          otp: otpCode,
          username: testUser.username
        })
      }, jar);
      record('Auth: Verify OTP & Activate Account', verifyRes.ok, `Status: ${verifyRes.status}`);

      // 4. Session check after verify
      const afterVerifySession = await api('/api/auth/session', { method: 'GET' }, jar);
      const isVerifiedUser = afterVerifySession.data?.user?.email === testUser.email;
      record('Auth: Session Updated After Verification', isVerifiedUser, `Logged in as ${afterVerifySession.data?.user?.username || 'none'}`);
    }

    // 5. Logout
    const logoutRes = await api('/api/auth/logout', { method: 'POST' }, jar);
    record('Auth: Logout', logoutRes.ok, `Status: ${logoutRes.status}`);

    // 6. Login
    const loginRes = await api('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    }, jar);
    record('Auth: Login with Credentials', loginRes.ok, `Status: ${loginRes.status}`);

    // 7. Household API: Get current household
    const myHhRes = await api('/api/household/my', { method: 'GET' }, jar);
    record('Household: Get My Household', myHhRes.ok, `Status: ${myHhRes.status}, HasHousehold: ${!!myHhRes.data?.household}`);

    // 8. Household API: Create household
    const createHhRes = await api('/api/household/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `บ้านทดสอบ ${testRunId}` })
    }, jar);
    const createdHh = createHhRes.data?.household;
    record('Household: Create New Household', createHhRes.ok && !!createdHh, `Created ID: ${createdHh?.id || createHhRes.data?.household_id}`);

    // 9. Fridge: Get items
    const fridgeGetRes = await api('/api/fridge', { method: 'GET' }, jar);
    record('Fridge: Get Fridge Items', fridgeGetRes.ok, `Items count: ${Array.isArray(fridgeGetRes.data) ? fridgeGetRes.data.length : 'N/A'}`);

    // 10. Fridge: Add item
    const addItemRes = await api('/api/fridge/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'แครอทสดทดสอบ',
        category: 'ผัก',
        qty: 3,
        unit: 'หัว',
        exp_date: '2026-10-25'
      })
    }, jar);
    const addedItemId = addItemRes.data?.item?.id || addItemRes.data?.id || addItemRes.data?.itemId;
    record('Fridge: Add Item', addItemRes.ok, `Status: ${addItemRes.status}, Item ID: ${addedItemId}`);

    // 11. Fridge: Update item
    if (addedItemId) {
      const updateRes = await api(`/api/fridge/update/${addedItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'แครอทสดทดสอบ (อัปเดต)',
          category: 'ผัก',
          qty: 5,
          unit: 'หัว',
          exp_date: '2026-10-30'
        })
      }, jar);
      record('Fridge: Update Item', updateRes.ok, `Status: ${updateRes.status}`);

      // 12. Fridge: Deduct item
      const deductRes = await api(`/api/fridge/deduct/${addedItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1 })
      }, jar);
      record('Fridge: Deduct Item Quantity', deductRes.ok, `Status: ${deductRes.status}`);

      // 13. Fridge: Delete item
      const deleteRes = await api(`/api/fridge/delete/${addedItemId}`, {
        method: 'DELETE'
      }, jar);
      record('Fridge: Delete Item', deleteRes.ok, `Status: ${deleteRes.status}`);
    }

    // 14. Fridge: Frequent Items Stats
    const freqRes = await api('/api/fridge/frequent', { method: 'GET' }, jar);
    record('Fridge: Get Frequent Items', freqRes.ok, `Status: ${freqRes.status}`);

    // 15. Shopping List: Get items
    const shoppingGetRes = await api('/api/shopping', { method: 'GET' }, jar);
    record('Shopping: Get Shopping List', shoppingGetRes.ok, `Items count: ${Array.isArray(shoppingGetRes.data) ? shoppingGetRes.data.length : 'N/A'}`);

    // 16. Shopping List: Add item
    const shoppingAddRes = await api('/api/shopping/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'นมสดจืด Meiji',
        category: 'เครื่องดื่ม',
        amount: 2,
        unit: 'กล่อง'
      })
    }, jar);
    const shopItemId = shoppingAddRes.data?.shopId || shoppingAddRes.data?.item?.id || shoppingAddRes.data?.id;
    record('Shopping: Add Item to List', shoppingAddRes.ok && !!shopItemId, `Status: ${shoppingAddRes.status}, Item ID: ${shopItemId}`);

    // 17. Shopping List: Toggle item
    if (shopItemId) {
      const toggleRes = await api('/api/shopping/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shopItemId, completed: true })
      }, jar);
      record('Shopping: Toggle Item Checked Status', toggleRes.ok, `Status: ${toggleRes.status}`);

      // 18. Shopping List: Delete item
      const shopDelRes = await api('/api/shopping/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shopItemId })
      }, jar);
      record('Shopping: Delete Item from List', shopDelRes.ok, `Status: ${shopDelRes.status}`);
    }

    // 19. Notifications: Get notifications
    const notifGetRes = await api('/api/notifications', { method: 'GET' }, jar);
    record('Notifications: Get Notifications', notifGetRes.ok, `Count: ${Array.isArray(notifGetRes.data) ? notifGetRes.data.length : 'N/A'}`);

    // 20. AI: Recipe suggestions
    const recipeRes = await api('/api/recipes/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: ['ไข่ไก่', 'หมูสับ', 'ต้นหอม'] })
    }, jar);
    const hasRecipes = recipeRes.ok && recipeRes.data?.recipes?.length > 0;
    record('AI Chef: Recipe Suggestions (Gemini)', hasRecipes, `Generated ${recipeRes.data?.recipes?.length || 0} recipes`);

    // 21. AI: Vision Analyze
    // Test a tiny valid PNG image
    const tinyValidPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const visionRes = await api('/api/vision/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: tinyValidPng })
    }, jar);
    record('AI Vision: Object Detection Endpoint', visionRes.status !== 500, `Status: ${visionRes.status}, Success: ${visionRes.data?.success}, Msg: ${visionRes.data?.message || ''}`);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    // Cleanup test user
    try {
      await db.execute('DELETE FROM users WHERE email = ?', [testUser.email]);
    } catch {}
    await db.end();
  }

  console.log('\n====================================================');
  console.log('📊 สรุปผลการทดสอบ:');
  const passedCount = testResults.filter(r => r.passed).length;
  console.log(`ผ่าน: ${passedCount} / ${testResults.length} การทดสอบ`);
  console.log('====================================================');
}

runTests();
