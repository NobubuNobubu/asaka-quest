// Firebase の初期化設定です。
// 必要に応じてここに Firebase プロジェクトの値を入力してください。
const firebaseConfig = {
  apiKey: "AIzaSyDfVFOO6fbbTOpz0FKVVTMn-9fZdL3L0Q4",
  authDomain: "asaka-quest.firebaseapp.com",
  projectId: "asaka-quest",
  storageBucket: "asaka-quest.firebasestorage.app",
  messagingSenderId: "625475534082",
  appId: "1:625475534082:web:5f8ded63f276d328d3161b",
  measurementId: "G-CHGCLDN6BZ"
};

const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.length > 0 && !value.includes('YOUR_'),
);

if (typeof firebase !== 'undefined' && isFirebaseConfigured) {
  try {
    firebase.initializeApp(firebaseConfig);
    window.asakaFirebase = {
      enabled: true,
      auth: firebase.auth(),
      db: firebase.firestore(),
      reason: 'Firebase initialized',
    };
    console.info('Firebase has been initialized.');
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    window.asakaFirebase = { enabled: false, reason: error.message || 'Firebase init failed' };
  }
} else {
  const reason = typeof firebase === 'undefined'
    ? 'Firebase SDK が読み込まれていません'
    : 'Firebase 設定が不足しています';
  console.warn(`Firebase is not configured. Using local storage fallback. (${reason})`);
  window.asakaFirebase = { enabled: false, reason };
}
