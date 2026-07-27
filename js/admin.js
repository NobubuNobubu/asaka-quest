// 管理画面で問題を追加・編集・削除・公開切り替え・並び替えできるようにします。
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('questionForm');
  const list = document.getElementById('questionList');

  if (!form || !list) {
    return;
  }

  const storageKey = 'asakaQuestQuestions';
  const submitButton = form.querySelector('button[type="submit"]');

  const fallbackQuestions = [
    {
      id: 'fallback-1',
      question: 'ASAKA QUESTで大切にしたいことは？',
      options: ['遊ぶことだけ', '学びと楽しさの両立', '寝ること', 'おしゃべりだけ'],
      answer: 1,
      answerIndex: 2,
      explanation: '学びと楽しさを両立することが大切です。',
      imageUrl: '',
      isPublic: true,
      order: 1,
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
        throw new Error('invalid data');
      }

      return parsed.map((item, index) => ({
        id: item.id || `question-${index + 1}`,
        question: item.question || item.questionText || '',
        options: Array.isArray(item.options) && item.options.length
          ? item.options
          : [item.option1, item.option2, item.option3, item.option4].filter(Boolean),
        answer: Number(item.answer ?? item.answerIndex - 1 ?? 0),
        answerIndex: Number(item.answerIndex || item.answer + 1 || 1),
        explanation: item.explanation || '',
        imageUrl: item.imageUrl || '',
        isPublic: item.isPublic !== false,
        order: Number(item.order || index + 1),
      }));
    } catch (error) {
      console.warn('保存データを読み込めませんでした。', error);
      return fallbackQuestions;
    }
  }

  function saveQuestions(questions) {
    localStorage.setItem(storageKey, JSON.stringify(questions));
  }

  function normalizeOrder(questions) {
    return questions
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({ ...item, order: index + 1 }));
  }

  const state = {
    questions: normalizeOrder(loadQuestions()),
    editingId: null,
  };

  function resetForm() {
    form.reset();
    document.getElementById('answerIndex').value = '1';
    document.getElementById('isPublic').checked = true;
    submitButton.textContent = '問題を保存';
    state.editingId = null;
    const statusTag = document.getElementById('editStatus');
    if (statusTag) {
      statusTag.textContent = '新規追加モード';
      statusTag.hidden = false;
    }
  }

  function renderQuestions() {
    const sortedQuestions = normalizeOrder(state.questions);
    state.questions = sortedQuestions;
    list.innerHTML = '';

    const countLabel = document.getElementById('questionCount');
    if (countLabel) {
      countLabel.textContent = String(sortedQuestions.length);
    }

    if (!sortedQuestions.length) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'question-item';
      emptyItem.innerHTML = '<div><strong>まだ問題がありません</strong><p>最初の1問を追加してください。</p></div>';
      list.appendChild(emptyItem);
      return;
    }

    sortedQuestions.forEach((item) => {
      const questionItem = document.createElement('li');
      questionItem.className = 'question-item';
      questionItem.innerHTML = `
        <div>
          <strong>${item.question || '未入力の問題'}</strong>
          <p>${item.isPublic ? '公開中' : '非公開'}・並び順: ${item.order}・正解: ${item.answerIndex}</p>
          ${item.imageUrl ? `<img class="question-image" src="${item.imageUrl}" alt="${item.question}" />` : ''}
        </div>
        <div class="item-actions">
          <button type="button" class="move-up">↑</button>
          <button type="button" class="move-down">↓</button>
          <button type="button" class="edit-button">編集</button>
          <button type="button" class="delete-button">削除</button>
          <button type="button" class="toggle-button">${item.isPublic ? '非公開' : '公開'}</button>
        </div>
      `;

      questionItem.querySelector('.edit-button').addEventListener('click', () => {
        state.editingId = item.id;
        document.getElementById('questionText').value = item.question;
        document.getElementById('option1').value = item.options[0] || '';
        document.getElementById('option2').value = item.options[1] || '';
        document.getElementById('option3').value = item.options[2] || '';
        document.getElementById('option4').value = item.options[3] || '';
        document.getElementById('answerIndex').value = item.answerIndex;
        document.getElementById('explanation').value = item.explanation;
        document.getElementById('imageUrl').value = item.imageUrl;
        document.getElementById('isPublic').checked = item.isPublic;
        submitButton.textContent = '変更を保存';
        const statusTag = document.getElementById('editStatus');
        if (statusTag) {
          statusTag.textContent = '編集中: ' + item.question.slice(0, 20);
          statusTag.hidden = false;
        }
      });

      questionItem.querySelector('.delete-button').addEventListener('click', () => {
        state.questions = state.questions.filter((question) => question.id !== item.id);
        saveQuestions(normalizeOrder(state.questions));
        renderQuestions();
        alert('問題を削除しました');
      });

      questionItem.querySelector('.toggle-button').addEventListener('click', () => {
        state.questions = state.questions.map((question) =>
          question.id === item.id ? { ...question, isPublic: !question.isPublic } : question,
        );
        saveQuestions(normalizeOrder(state.questions));
        renderQuestions();
      });

      questionItem.querySelector('.move-up').addEventListener('click', () => {
        const index = state.questions.findIndex((question) => question.id === item.id);
        if (index <= 0) {
          return;
        }

        const nextQuestions = [...state.questions];
        [nextQuestions[index - 1], nextQuestions[index]] = [nextQuestions[index], nextQuestions[index - 1]];
        state.questions = normalizeOrder(nextQuestions);
        saveQuestions(state.questions);
        renderQuestions();
      });

      questionItem.querySelector('.move-down').addEventListener('click', () => {
        const index = state.questions.findIndex((question) => question.id === item.id);
        if (index === -1 || index >= state.questions.length - 1) {
          return;
        }

        const nextQuestions = [...state.questions];
        [nextQuestions[index], nextQuestions[index + 1]] = [nextQuestions[index + 1], nextQuestions[index]];
        state.questions = normalizeOrder(nextQuestions);
        saveQuestions(state.questions);
        renderQuestions();
      });

      list.appendChild(questionItem);
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const questionText = document.getElementById('questionText').value.trim();
    const option1 = document.getElementById('option1').value.trim();
    const option2 = document.getElementById('option2').value.trim();
    const option3 = document.getElementById('option3').value.trim();
    const option4 = document.getElementById('option4').value.trim();
    const answerIndex = Number(document.getElementById('answerIndex').value || 1);
    const explanation = document.getElementById('explanation').value.trim();
    const imageUrl = document.getElementById('imageUrl').value.trim();
    const isPublic = document.getElementById('isPublic').checked;

    if (!questionText || !option1 || !option2 || !option3 || !option4) {
      alert('問題文と4つの選択肢は必須です');
      return;
    }

    const existingOrder = state.editingId
      ? state.questions.find((question) => question.id === state.editingId)?.order
      : undefined;

    const newQuestion = {
      id: state.editingId || `question-${Date.now()}`,
      question: questionText,
      options: [option1, option2, option3, option4],
      answer: answerIndex - 1,
      answerIndex,
      explanation,
      imageUrl,
      isPublic,
      order: existingOrder ?? state.questions.length + 1,
    };

    if (state.editingId) {
      state.questions = state.questions.map((question) =>
        question.id === state.editingId ? { ...question, ...newQuestion } : question,
      );
      alert('問題を更新しました');
    } else {
      state.questions.push(newQuestion);
      alert('問題を追加しました');
    }

    saveQuestions(normalizeOrder(state.questions));
    renderQuestions();
    resetForm();
  });

  const clearFormButton = document.getElementById('clearFormButton');
  if (clearFormButton) {
    clearFormButton.addEventListener('click', () => {
      resetForm();
    });
  }

  resetForm();
  renderQuestions();
});
