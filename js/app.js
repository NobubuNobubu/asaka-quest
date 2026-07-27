// ホーム画面のボタン操作を管理するJavaScriptです。
document.addEventListener('DOMContentLoaded', () => {
  // data-action 属性が付いたボタンを全部取得します。
  const buttons = document.querySelectorAll('[data-action]');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;

      // 「クイズを始める」なら quiz.html へ移動します。
      if (action === 'start') {
        window.location.href = 'quiz.html';
      }

      // 「管理者ログイン」なら login.html へ移動します。
      else if (action === 'login') {
        window.location.href = 'login.html';
      }

      // それ以外は準備中のアラートを表示します。
      else {
        alert('準備中です');
      }
    });
  });
});
