// 管理者ログインの簡易処理です。
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');

  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const adminId = document.getElementById('adminId').value.trim();
    const adminPassword = document.getElementById('adminPassword').value.trim();

    if (window.asakaFirebase?.enabled && window.asakaFirebase.auth) {
      try {
        await window.asakaFirebase.auth.signInWithEmailAndPassword(adminId, adminPassword);
        window.location.href = 'admin.html';
        return;
      } catch (error) {
        console.warn('Firebase 認証に失敗しました。', error);
        alert(`ログインに失敗しました: ${error.message}`);
        return;
      }
    }

    // Firebase が使えない場合はローカルのサンプルログインを使います。
    if (adminId === 'admin' && adminPassword === 'password') {
      window.location.href = 'admin.html';
    } else {
      alert('IDまたはパスワードが違います');
    }
  });
});
