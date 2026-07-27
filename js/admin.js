// 管理画面で問題を追加・編集・削除・公開切り替え・並び替えできるようにします。
document.addEventListener('DOMContentLoaded', async () => {
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

  function loadLocalQuestions() {
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

  async function saveQuestions(questions) {
    const normalized = normalizeOrder(questions);
    if (window.asakaFirebase?.enabled && window.asakaFirebase.db) {
      try {
        const collection = window.asakaFirebase.db.collection('questions');
        const snapshot = await collection.get();
        const existingIds = new Set(snapshot.docs.map((doc) => doc.id));
        const batch = window.asakaFirebase.db.batch();

        normalized.forEach((question) => {
          const doc = collection.doc(question.id);
          batch.set(doc, question, { merge: true });
          existingIds.delete(question.id);
        });

        snapshot.docs.forEach((doc) => {
          if (!normalized.some((question) => question.id === doc.id)) {
            batch.delete(doc.ref);
          }
        });

        await batch.commit();
        localStorage.setItem(storageKey, JSON.stringify(normalized));
      } catch (error) {
        console.warn('Firebase への保存に失敗しました。', error);
        localStorage.setItem(storageKey, JSON.stringify(normalized));
      }
    } else {
      localStorage.setItem(storageKey, JSON.stringify(normalized));
    }
  }

  async function loadQuestions() {
    if (window.asakaFirebase?.enabled && window.asakaFirebase.db) {
      try {
        const snapshot = await window.asakaFirebase.db.collection('questions').orderBy('order').get();
        const questions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (questions.length) {
          const normalized = normalizeOrder(questions);
          localStorage.setItem(storageKey, JSON.stringify(normalized));
          return normalized;
        }
      } catch (error) {
        console.warn('Firebase から読み込みに失敗しました。', error);
      }
    }

    return loadLocalQuestions();
  }

  function normalizeOrder(questions) {
    return questions
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({ ...item, order: index + 1 }));
  }

  const state = {
    questions: [],
    editingId: null,
  };
  let dragSourceId = null;

  async function initializeState() {
    state.questions = normalizeOrder(await loadQuestions());
  }

  function resetForm() {
    form.reset();
    document.getElementById('answerIndex').value = '1';
    document.getElementById('isPublic').checked = true;
    submitButton.textContent = '問題を保存';
    setEditStatus(false);
    state.editingId = null;
  }

  function setEditStatus(isEditing, questionText = '') {
    const statusTag = document.getElementById('editStatus');
    if (!statusTag) {
      return;
    }

    if (isEditing) {
      statusTag.textContent = `編集中: ${questionText.slice(0, 24)}`;
      statusTag.hidden = false;
    } else {
      statusTag.textContent = '新規追加モード';
      statusTag.hidden = false;
    }
  }

  function showActionMessage(message) {
    const actionMessage = document.getElementById('actionMessage');
    if (!actionMessage) {
      return;
    }
    actionMessage.textContent = message;
    actionMessage.hidden = false;
    setTimeout(() => {
      actionMessage.hidden = true;
    }, 2400);
  }

  async function saveAndRefresh(message) {
    state.questions = normalizeOrder(state.questions);
    await saveQuestions(state.questions);
    state.questions = normalizeOrder(await loadQuestions());
    renderQuestions();
    if (message) {
      showActionMessage(message);
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
          <p class="question-meta">
            <span class="status-badge ${item.isPublic ? 'badge-public' : 'badge-hidden'}">${item.isPublic ? '公開中' : '非公開'}</span>
            <span>順位: ${item.order}</span>
            <span>正解: ${item.answerIndex}</span>
          </p>
          <ul class="option-list">
            ${item.options.map((option, index) => `<li>${index + 1}. ${option}</li>`).join('')}
          </ul>
          ${item.imageUrl ? `<img class="question-image" src="${item.imageUrl}" alt="${item.question}" />` : ''}
        </div>
        <div class="item-actions">
          <button type="button" class="drag-handle" aria-label="ドラッグして並べ替え">≡</button>
          <button type="button" class="edit-button">編集</button>
          <button type="button" class="delete-button">削除</button>
          <button type="button" class="toggle-button">${item.isPublic ? '非公開にする' : '公開する'}</button>
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
        setEditStatus(true, item.question);
      });

      questionItem.querySelector('.delete-button').addEventListener('click', async () => {
        if (!confirm('この問題を削除してもよろしいですか？')) {
          return;
        }

        state.questions = state.questions.filter((question) => question.id !== item.id);
        await saveAndRefresh('問題を削除しました');
      });

      questionItem.querySelector('.toggle-button').addEventListener('click', async () => {
        state.questions = state.questions.map((question) =>
          question.id === item.id ? { ...question, isPublic: !question.isPublic } : question,
        );
        await saveAndRefresh('公開状態を更新しました');
      });

      const dragHandle = questionItem.querySelector('.drag-handle');
      if (dragHandle) {
        questionItem.draggable = false;
        dragHandle.draggable = true;

        dragHandle.addEventListener('dragstart', (event) => {
          dragSourceId = item.id;
          questionItem.classList.add('dragging');
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', item.id);
        });

        dragHandle.addEventListener('dragend', () => {
          dragSourceId = null;
          questionItem.classList.remove('dragging');
          document.querySelectorAll('.question-item.drag-over').forEach((el) => {
            el.classList.remove('drag-over');
          });
        });
      }

      questionItem.addEventListener('dragenter', () => {
        questionItem.classList.add('drag-over');
      });

      questionItem.addEventListener('dragleave', (event) => {
        if (!questionItem.contains(event.relatedTarget)) {
          questionItem.classList.remove('drag-over');
        }
      });

      questionItem.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      });

      questionItem.addEventListener('drop', (event) => {
        event.preventDefault();
        const sourceId = event.dataTransfer.getData('text/plain') || dragSourceId;
        if (!sourceId || sourceId === item.id) {
          return;
        }

        const sourceIndex = state.questions.findIndex((question) => question.id === sourceId);
        const targetIndex = state.questions.findIndex((question) => question.id === item.id);
        if (sourceIndex === -1 || targetIndex === -1) {
          return;
        }

        const reordered = [...state.questions];
        const [movedItem] = reordered.splice(sourceIndex, 1);
        reordered.splice(targetIndex, 0, movedItem);
        state.questions = normalizeOrder(reordered);
        saveAndRefresh('順番を更新しました');
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
      const editIndex = state.questions.findIndex((question) => question.id === state.editingId);
      if (editIndex !== -1) {
        state.questions[editIndex] = {
          ...state.questions[editIndex],
          ...newQuestion,
        };
      } else {
        state.questions = state.questions.map((question) =>
          question.id === state.editingId ? { ...question, ...newQuestion } : question,
        );
      }
      saveAndRefresh('問題を更新しました');
    } else {
      state.questions.push(newQuestion);
      saveAndRefresh('問題を追加しました');
    }

    resetForm();
  });

  const clearFormButton = document.getElementById('clearFormButton');
  if (clearFormButton) {
    clearFormButton.addEventListener('click', () => {
      resetForm();
    });
  }

  const cancelEditButton = document.getElementById('cancelEditButton');
  if (cancelEditButton) {
    cancelEditButton.addEventListener('click', () => {
      resetForm();
      alert('編集中をキャンセルしました');
    });
  }

  resetForm();
  renderQuestions();
});
