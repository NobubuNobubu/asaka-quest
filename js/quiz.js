// クイズデータは管理画面で保存した内容をそのまま使います。
document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'asakaQuestQuestions';
  const fallbackQuestions = [
    {
      question: 'ASAKA QUESTで大切にしたいことはどれですか？',
      options: ['遊ぶことだけ', '学びと楽しさの両立', '寝ること', 'おしゃべりだけ'],
      answer: 1,
      explanation: '学校説明会でも、学ぶ楽しさと安心感を大切にすることがポイントです。',
      isPublic: true,
    },
    {
      question: '学校で一番大切にしていることはどれですか？',
      options: ['思いやり', 'お菓子', 'テレビ', '寝る時間'],
      answer: 0,
      explanation: 'お互いを思いやる気持ちは、学校生活の土台になります。',
      isPublic: true,
    },
  ];

  function loadQuestions() {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      return fallbackQuestions;
    }

    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        throw new Error('invalid');
      }

      return parsed
        .filter((question) => question.isPublic !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((question) => ({
          question: question.question || question.questionText || '',
          options: Array.isArray(question.options) && question.options.length
            ? question.options
            : [question.option1, question.option2, question.option3, question.option4].filter(Boolean),
          answer: Number(question.answer ?? question.answerIndex - 1 ?? 0),
          explanation: question.explanation || '',
        }));
    } catch (error) {
      console.warn('クイズデータを読み込めませんでした。', error);
      return fallbackQuestions;
    }
  }

  const questions = loadQuestions();

  const progressLabel = document.getElementById('progressLabel');
  const questionTitle = document.getElementById('questionTitle');
  const questionText = document.getElementById('questionText');
  const optionsContainer = document.getElementById('options');
  const feedbackBox = document.getElementById('feedback');
  const nextButton = document.getElementById('nextButton');

  let currentIndex = 0;
  let score = 0;

  function renderQuestion() {
    if (!questions.length) {
      questionTitle.textContent = 'クイズがありません';
      questionText.textContent = '管理画面で問題を追加してください。';
      optionsContainer.innerHTML = '';
      feedbackBox.hidden = true;
      nextButton.hidden = true;
      return;
    }

    const currentQuestion = questions[currentIndex];

    progressLabel.textContent = `${currentIndex + 1} / ${questions.length}`;
    questionTitle.textContent = `Q${currentIndex + 1}`;
    questionText.textContent = currentQuestion.question;
    optionsContainer.innerHTML = '';
    feedbackBox.innerHTML = '';
    feedbackBox.hidden = true;
    nextButton.hidden = true;

    currentQuestion.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'option-button';
      button.textContent = option;
      button.addEventListener('click', () => answerQuestion(index));
      optionsContainer.appendChild(button);
    });
  }

  function answerQuestion(selectedIndex) {
    const currentQuestion = questions[currentIndex];
    const buttons = optionsContainer.querySelectorAll('button');

    buttons.forEach((button, index) => {
      button.disabled = true;

      if (index === currentQuestion.answer) {
        button.classList.add('is-correct');
      }

      if (index === selectedIndex && index !== currentQuestion.answer) {
        button.classList.add('is-wrong');
      }
    });

    if (selectedIndex === currentQuestion.answer) {
      score += 1;
    }

    feedbackBox.hidden = false;
    feedbackBox.innerHTML = `
      <strong>${selectedIndex === currentQuestion.answer ? '正解！' : '不正解...'}</strong><br />
      ${currentQuestion.explanation}
    `;

    nextButton.hidden = false;
  }

  nextButton.addEventListener('click', () => {
    if (currentIndex < questions.length - 1) {
      currentIndex += 1;
      renderQuestion();
    } else {
      const total = questions.length;
      window.location.href = `result.html?score=${score}&total=${total}`;
    }
  });

  renderQuestion();
});
