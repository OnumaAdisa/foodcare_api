require('dotenv').config();
const key = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB4L0mAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJ0UkGAAAAAAgIY0UAAAAASUVORK5CYII=';
const payload = {
  contents: [{
    role: 'user',
    parts: [
      { text: 'Return JSON only: {"items":["banana"]}' },
      { inline_data: { mime_type: 'image/png', data: png } }
    ]
  }],
  generationConfig: {
    responseMimeType: 'application/json'
  }
};
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
console.log('MODEL', model);
console.log('URL', url);
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
}).then(async (res) => {
  const text = await res.text();
  console.log('STATUS', res.status);
  console.log(text.slice(0, 2000));
}).catch((err) => {
  console.error('FETCH_ERROR', err && err.message ? err.message : err);
  process.exit(1);
});
