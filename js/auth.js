// 管理者ログインの簡易処理です。
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');

  if (!form) {
    return;
  }

  const loginErrorMessage = document.getElementById('loginErrorMessage');
  const loginStatus = document.getElementById('loginStatus');

  function showLoginError(message) {
    if (loginErrorMessage) {
      loginErrorMessage.textContent = message;
    } else {
      alert(message);
    }
  }

  function setLoginStatus(message) {
    if (loginStatus) {
      loginStatus.textContent = message;
    }
  }

  if (window.asakaFirebase?.enabled && window.asakaFirebase.auth) {
    setLoginStatus('Firebase 認証が利用可能です。Firebase で作成したメール/パスワードでログインしてください。');
  } else {
    setLoginStatus(`Firebase は利用できません。${window.asakaFirebase?.reason || 'local login のみ使用可能です。'}`);
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
        showLoginError(`ログインに失敗しました: ${error.message}`);
        return;
      }
    }

    // Firebase が使えない場合はローカルのサンプルログインを使います。
    if (adminId === 'admin' && adminPassword === 'password') {
      window.location.href = 'admin.html';
    } else {
      showLoginError('IDまたはパスワードが違います');
    }
  });
});
