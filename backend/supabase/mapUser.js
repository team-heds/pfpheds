// map-emails.js
const fs = require('fs');
const users = JSON.parse(fs.readFileSync('../../users.json','utf8'));

const mapped = users.map(u => {
  const orig = u.email || '';
  let email = orig;
  if (orig.endsWith('@students.hevs.ch')) {
    email = orig.replace(/@students\.hevs\.ch$/,'@hes-so.ch');
  }
  // garde l’original en métadonnées (utile en cas de support)
  u.email = email;
  u.customAttributes = JSON.stringify({
    ...(u.customAttributes ? JSON.parse(u.customAttributes) : {}),
    original_email: orig
  });
  return u;
});

fs.writeFileSync('./users_mapped.json', JSON.stringify(mapped, null, 2));
console.log('OK -> users_mapped.json');
