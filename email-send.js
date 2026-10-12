window.EmailSender = (() => {
  let currentEngine = null;
  let teacherSelect;
  let sendButton;
  let status;

  function setStatus(message, color = '#555') {
    if (!status) return;
    status.textContent = message;
    status.style.color = color;
  }

  async function loadTeachers() {
    teacherSelect.innerHTML = '<option value="">Загрузка списка учителей…</option>';
    teacherSelect.disabled = true;

    try {
      const response = await fetch('/api/teachers');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Не удалось загрузить список учителей.');

      teacherSelect.innerHTML = '<option value="">Выберите учителя</option>';
      data.teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = teacher.name;
        teacherSelect.appendChild(option);
      });
      teacherSelect.disabled = false;
      setStatus('');
    } catch (error) {
      console.error(error);
      teacherSelect.innerHTML = '<option value="">Список учителей недоступен</option>';
      setStatus('Не удалось загрузить список учителей.', 'crimson');
    }
  }

  async function send() {
    const teacherId = teacherSelect.value;
    if (!teacherId) {
      setStatus('Выберите учителя из списка.', 'crimson');
      return;
    }
    if (!currentEngine || typeof currentEngine.getEmailAttachments !== 'function') {
      setStatus('Записи ещё не готовы к отправке.', 'crimson');
      return;
    }

    try {
      sendButton.disabled = true;
      teacherSelect.disabled = true;
      setStatus('Подготавливаем MP3-файлы…');

      const attachments = await currentEngine.getEmailAttachments();
      if (!attachments.length) throw new Error('Нет файлов для отправки.');

      const formData = new FormData();
      formData.append('teacherId', teacherId);
      formData.append('studentLastName', currentEngine.studentLastName || '');
      formData.append('studentFirstName', currentEngine.studentFirstName || '');
      formData.append('studentClass', currentEngine.studentClass || '');
      formData.append('exam', currentEngine.currentExam || '');
      formData.append('variant', String(currentEngine.currentVariant || ''));

      attachments.forEach(item => {
        formData.append('recordings', item.blob, item.filename);
      });

      setStatus('Отправляем записи учителю…');
      const response = await fetch('/api/send-recordings', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Ошибка отправки.');

      setStatus('Готово. Записи отправлены учителю.', 'green');
    } catch (error) {
      console.error(error);
      setStatus(`Ошибка: ${error.message || 'не удалось отправить записи.'}`, 'crimson');
    } finally {
      teacherSelect.disabled = false;
      sendButton.disabled = false;
    }
  }

  function init() {
    teacherSelect = document.getElementById('teacherSelect');
    sendButton = document.getElementById('sendToTeacherBtn');
    status = document.getElementById('sendEmailStatus');
    if (!teacherSelect || !sendButton || !status) return;

    sendButton.disabled = true;
    sendButton.addEventListener('click', send);
    loadTeachers();
  }

  function enable(engine) {
    currentEngine = engine;
    if (sendButton) sendButton.disabled = false;
  }

  function disable() {
    currentEngine = null;
    if (sendButton) sendButton.disabled = true;
    if (teacherSelect) teacherSelect.value = '';
    setStatus('');
  }

  return { init, enable, disable, loadTeachers };
})();
