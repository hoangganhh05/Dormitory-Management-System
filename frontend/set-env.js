const fs = require('fs');
const path = require('path');

// Đường dẫn tới file environment.ts của frontend
const targetPath = path.resolve(__dirname, 'src/environments/environment.ts');

// Lấy apiUrl từ biến môi trường của Vercel (API_URL hoặc BACKEND_URL)
// Nếu chưa đặt biến môi trường, sử dụng URL mặc định hiện tại
const apiUrl =
  process.env.API_URL ||
  process.env.BACKEND_URL ||
  'https://dormitory-management-system-o9ow.onrender.com/api';
const googleClientId = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com';

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl.replace(/\/+$/, '')}',
  googleClientId: '${googleClientId}',
  appName: 'Dormitory Management System',
  version: '1.0.0',
};
`;

try {
  fs.writeFileSync(targetPath, envConfigFile, { encoding: 'utf8' });
  console.log(`[set-env] Đã cập nhật environment.ts với apiUrl = ${apiUrl}`);
} catch (err) {
  console.error('[set-env] Lỗi khi ghi file environment.ts:', err);
  process.exit(1);
}
