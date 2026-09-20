const mysql = require('mysql2');
const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'foodcare_db' });

db.query('SHOW COLUMNS FROM users', (err, cols) => {
  if (err) {
    console.error('SCHEMA_ERR', err.message);
    process.exit(1);
  }
  console.log(JSON.stringify(cols, null, 2));
  db.end();
});
