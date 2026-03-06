const fs = require('fs');

const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="36" fill="#1e40af"/>
  <text x="96" y="130" text-anchor="middle" font-family="Arial,sans-serif" font-size="90" font-weight="bold" fill="white">م</text>
</svg>`;

const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1e40af"/>
  <text x="256" y="340" text-anchor="middle" font-family="Arial,sans-serif" font-size="240" font-weight="bold" fill="white">م</text>
</svg>`;

fs.mkdirSync('public/icons', { recursive: true });
fs.writeFileSync('public/icons/icon-192.png', svg192);
fs.writeFileSync('public/icons/icon-512.png', svg512);
fs.writeFileSync('public/icons/icon-192.svg', svg192);
fs.writeFileSync('public/icons/icon-512.svg', svg512);
console.log('Icons created successfully!');
