const mysql = require('mysql2');
const bcrypt = require('bcrypt');

async function main() {
  const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'foodcare_db' });
  const username = 'real_app_test_' + Date.now();
  const email = `real_app_test_${Date.now()}@example.com`;
  const password = 'Pass123!';
  const passwordHash = await bcrypt.hash(password, 10);

  await new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO users (username, email, phone, password, is_verified, household_id) VALUES (?, ?, ?, ?, 1, NULL)',
      [username, email, '0990000111', passwordHash],
      (err) => (err ? reject(err) : resolve())
    );
  });

  const loginUrl = 'http://127.0.0.1:8080/api/login';
  const loginRes = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });

  const setCookie = loginRes.headers.get('set-cookie');
  const loginText = await loginRes.text();
  console.log('LOGIN_STATUS', loginRes.status);
  console.log('LOGIN_BODY', loginText);

  const sessionRes = await fetch('http://127.0.0.1:8080/api/auth/session', {
    method: 'GET',
    credentials: 'include',
    headers: setCookie ? { Cookie: setCookie.split(';')[0] } : {}
  });

  const sessionText = await sessionRes.text();
  console.log('SESSION_STATUS', sessionRes.status);
  console.log('SESSION_BODY', sessionText);

  db.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
