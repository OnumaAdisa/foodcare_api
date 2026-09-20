const mysql = require('mysql2');
const bcrypt = require('bcrypt');

async function main(){
  const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'foodcare_db' });
  const username = 'real_browser_user';
  const email = 'real_browser_user@example.com';
  const phone = '0990000123';
  const password = 'Pass123!';
  const hash = await bcrypt.hash(password,10);

  await new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO users (username, email, phone, password, is_verified, household_id) VALUES (?, ?, ?, ?, 1, NULL) ON DUPLICATE KEY UPDATE password = VALUES(password), is_verified = 1',
      [username, email, phone, hash],
      (err) => err ? reject(err) : resolve()
    );
  });

  console.log(JSON.stringify({ username, email, phone, password }, null, 2));
  db.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
