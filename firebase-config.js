// ค่าตั้งค่า Firebase ของโปรเจกต์ (คัดลอกจาก Firebase Console › Project settings › Your apps › Web app)
// ค่าพวกนี้ไม่ใช่รหัสลับ ใส่ในเว็บได้ · ความปลอดภัยจริงอยู่ที่ firestore.rules
export const firebaseConfig = {
  apiKey: 'AIzaSyBudxqIDWQUMNWMIv40n8H79qKOn58jmns',
  authDomain: 'piority-2.firebaseapp.com',
  projectId: 'piority-2',
  storageBucket: 'piority-2.firebasestorage.app',
  messagingSenderId: '877065468944',
  appId: '1:877065468944:web:7262c2175a18ec07905e95',
};
// วิธีล็อกอิน: 'password' = อีเมลบริษัท + รหัสผ่านที่แอดมินสร้างให้ (ค่าเริ่มต้น) · 'email' = ลิงก์ทางอีเมล ไม่ใช้รหัสผ่าน · 'microsoft' = บัญชี Microsoft ขององค์กร (ต้องตั้ง Entra ID)
export const AUTH_MODE = 'password';
export const MS_TENANT_ID = '';   // ใช้เฉพาะ AUTH_MODE = 'microsoft' · IT ให้ได้
export const ALLOWED_DOMAIN = 'patta.co.th';
