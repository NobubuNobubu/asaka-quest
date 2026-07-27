// 結果ページで、URLのクエリを読み取って表示内容を決めます。
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const score = Number(params.get('score') || 0);
  const total = Number(params.get('total') || 0);

  const summary = document.getElementById('resultSummary');
  const message = document.getElementById('resultMessage');

  if (!summary || !message) {
    return;
  }

  const ratio = total > 0 ? Math.round((score / total) * 100) : 0;

  summary.textContent = `${score} / ${total} 問正解です。`;

  let text = '';

  if (ratio >= 80) {
    text = '素晴らしいです！学校の魅力をしっかり知っていますね。';
  } else if (ratio >= 50) {
    text = '良い感じです。もっと学校のことを知ると、さらに楽しめます。';
  } else {
    text = 'もう一度挑戦して、学校のことをもっと知ってみましょう。';
  }

  message.innerHTML = `
    <strong>正答率: ${ratio}%</strong><br />
    ${text}
  `;
});
