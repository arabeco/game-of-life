// Uses only the public website key. No recipient or account is supplied.
const fs = require('fs');
const assert = require('node:assert/strict');
const site = fs.readFileSync('C:/Users/Afonso/Desktop/glyph-landing/script.js', 'utf8');
const url = site.match(/const SUPABASE_URL\s*=\s*'([^']+)'/)[1];
const key = site.match(/const SUPABASE_ANON\s*=\s*'([^']+)'/)[1];
(async () => {
  for (const name of ['resend', 'account-delete']) {
    const response = await fetch(`${url}/functions/v1/${name}`, {
      method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    console.log(name, response.status, await response.text());
    assert.equal(response.status, 401, `${name} must reject public credentials`);
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
