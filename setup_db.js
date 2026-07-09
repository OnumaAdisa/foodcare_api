const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'foodcare_db'
});

db.connect((err) => {
    if (err) {
        console.error('เกิดข้อผิดพลาดในการเชื่อมต่อ:', err);
        return;
    }
    console.log('เชื่อมต่อฐานข้อมูลสำเร็จ');

    // ตรวจสอบว่าตาราง users มีอยู่และ add columns ถ้าไม่มี
    const addColumnsSQL = `
        ALTER TABLE users 
        ADD COLUMN email VARCHAR(255) UNIQUE NOT NULL DEFAULT '' AFTER id,
        ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '' AFTER email,
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER password;
    `;

    db.query('DESCRIBE users', (err, results) => {
        if (err) {
            console.error('ไม่สามารถดึงข้อมูลตาราง:', err);
            db.end();
            return;
        }

        console.log('Columns ที่มีอยู่ใน users table:');
        results.forEach(col => console.log(`- ${col.Field} (${col.Type})`));

        // Check ว่ามี email column หรือไม่
        const hasEmail = results.some(col => col.Field === 'email');
        const hasPassword = results.some(col => col.Field === 'password');

        if (!hasEmail || !hasPassword) {
            console.log('\nเพิ่ม columns ที่ขาดหาย...');
            
            const queries = [];
            if (!hasEmail) queries.push('ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;');
            if (!hasPassword) queries.push('ALTER TABLE users ADD COLUMN password VARCHAR(255);');

            let completed = 0;
            queries.forEach(query => {
                db.query(query, (err) => {
                    if (err) {
                        console.error('Error:', err.message);
                    } else {
                        console.log('✓ Query สำเร็จ:', query.substring(0, 50) + '...');
                    }
                    completed++;
                    if (completed === queries.length) {
                        console.log('\n✅ Setup เสร็จสิ้น');
                        db.end();
                    }
                });
            });
        } else {
            console.log('\n✅ ตาราง users มี columns ที่ต้องการแล้ว');
            db.end();
        }
    });
});
