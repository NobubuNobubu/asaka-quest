// 管理者ログインの簡易処理です。
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');

  if (!form) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const adminId = document.getElementById('adminId').value.trim();
    const adminPassword = document.getElementById('adminPassword').value.trim();

    // サンプルとして、IDとパスワードが一致した場合だけ管理画面へ進めます。
    if (adminId === 'admin' && adminPassword === 'password') {
      window.location.href = 'admin.html';
    } else {
      alert('IDまたはパスワードが違います');
    }
  });
});
