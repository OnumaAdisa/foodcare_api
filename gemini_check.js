require('dotenv').config();
const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAFc0b5AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJ0UkGAAAAAAgIY0UAAAAASUVORK5CYII=';

const payload = {
  contents: [{
    role: 'user',
    parts: [
      { text: 'Identify the main food item in this image. Return JSON only with exact format {"items":["name1","name2"]}. Use only the main food item visible in the image, maximum 3 entries, in Thai or English.' },
      { inline_data: { mime_type: 'image/jpeg', data: base64 } }
    ]
  }]
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
console.log('URL:', url);

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
}).then(async (r) => {
  const text = await r.text();
  console.log('status:', r.status);
  console.log(text.slice(0, 2000));
}).catch((err) => {
  console.error('fetch error:', err);
  process.exit(1);
});
