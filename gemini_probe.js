require('dotenv').config();
const key = process.env.GEMINI_API_KEY;
const models = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-lite'];
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB4L0mAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJ0UkGAAAAAAgIY0UAAAAASUVORK5CYII=';
(async () => {
  for (const model of models) {
    const payload = {
      contents: [{
        role: 'user',
        parts: [
          { text: 'Return JSON only: {"items":["banana"]}' },
          { inline_data: { mime_type: 'image/png', data: png } }
        ]
      }],
      generationConfig: { responseMimeType: 'application/json' }
    };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const text = await res.text();
      console.log('MODEL', model, 'STATUS', res.status);
      console.log(text.slice(0, 500));
    } catch (err) {
      console.log('MODEL', model, 'ERROR', err && err.message ? err.message : err);
    }
  }
})();
