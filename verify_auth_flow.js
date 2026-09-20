const mysql = require('mysql2/promise');

const EMAIL = `otpflow_${Date.now()}@gmail.com`;
const USERNAME = `otpflow_${Date.now()}`;
const PHONE = `081${String(Date.now()).slice(-8)}`;
const PASSWORD = 'Pass123!';

async function request(url, options = {}, cookieJar = []) {
  const headers = { ...(options.headers || {}) };
  if (cookieJar.length) {
    headers.Cookie = cookieJar.join('; ');
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  const setCookie = res.headers.get('set-cookie');
  let nextCookieJar = [...cookieJar];
  if (setCookie) {
    nextCookieJar = [...new Set([...cookieJar, setCookie.split(';')[0]])];
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { status: res.status, data, cookieJar: nextCookieJar };
}

(async () => {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'foodcare_db'
  });

  try {
    const sendRes = await request('http://127.0.0.1:8080/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: USERNAME,
        email: EMAIL,
        phone: PHONE,
        password: PASSWORD
      })
    });

    console.log('SEND_OTP_STATUS', sendRes.status);
    console.log('SEND_OTP_BODY', JSON.stringify(sendRes.data));

    const [rows] = await db.execute(
      'SELECT username, email, otp_code, otp_expires_at, is_verified FROM users WHERE email = ? ORDER BY user_id DESC LIMIT 1',
      [EMAIL]
    );

    console.log('DB_ROW', JSON.stringify(rows[0] || null));

    const otp = rows[0] && rows[0].otp_code;
    if (!otp) {
      throw new Error('OTP missing in DB for email: ' + EMAIL);
    }

    const verifyRes = await request('http://127.0.0.1:8080/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, email: EMAIL, otp })
    }, sendRes.cookieJar);

    console.log('VERIFY_OTP_STATUS', verifyRes.status);
    console.log('VERIFY_OTP_BODY', JSON.stringify(verifyRes.data));

    const sessionRes = await request('http://127.0.0.1:8080/api/auth/session', { method: 'GET' }, verifyRes.cookieJar);
    console.log('SESSION_STATUS', sessionRes.status);
    console.log('SESSION_BODY', JSON.stringify(sessionRes.data));

    const loginRes = await request('http://127.0.0.1:8080/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD })
    }, verifyRes.cookieJar);

    console.log('LOGIN_STATUS', loginRes.status);
    console.log('LOGIN_BODY', JSON.stringify(loginRes.data));
  } finally {
    await db.end();
  }
})();
