// ЭЛЕМЕНТЫ СТРАНИЦЫ
const variantSelect = document.getElementById('variantSelect');
const startExamBtn = document.getElementById('startExamBtn');
const taskDiv = document.getElementById('task');
const timerDiv = document.getElementById('timer');

const startRecBtn = document.getElementById('startRecBtn');
const stopRecBtn = document.getElementById('stopRecBtn');
const playRecBtn = document.getElementById('playRecBtn');
const downloadRecBtn = document.getElementById('downloadRecBtn');
const player = document.getElementById('player');
const nextTaskBtn = document.getElementById('nextTaskBtn');

// ДАННЫЕ
let variants = {};
let currentVariant = 1;
let currentTaskIndex = 0;
let currentTask = null;

// ТАЙМЕР
let timerInterval = null;
let timeLeft = 0;

// АУДИО ЗАПИСЬ
let mediaRecorder = null;
let audioChunks = [];
let lastAudioBlob = null;

// ЗАГРУЖАЕМ ЗАДАНИЯ ИЗ tasks.json
fetch('tasks.json')
  .then(res => res.json())
  .then(data => {
    data.variants.forEach(v => {
      variants[v.id] = v.tasks;
    });
  })
  .catch(err => {
    console.error('Ошибка загрузки tasks.json', err);
    taskDiv.textContent = 'Ошибка загрузки заданий.';
  });

// ЗАПУСК ЭКЗАМЕНА
startExamBtn.addEventListener('click', () => {
  currentVariant = parseInt(variantSelect.value, 10);
  currentTaskIndex = 0;
  loadTask();
});

// ЗАГРУЗКА ТЕКУЩЕГО ЗАДАНИЯ
function loadTask() {
  const tasks = variants[currentVariant];
  if (!tasks) {
    taskDiv.textContent = 'Вариант не найден.';
    return;
  }
  if (currentTaskIndex >= tasks.length) {
    taskDiv.textContent = 'Экзамен завершён!';
    timerDiv.textContent = '00:00';
    startRecBtn.disabled = true;
    stopRecBtn.disabled = true;
    playRecBtn.disabled = true;
    downloadRecBtn.disabled = true;
    nextTaskBtn.disabled = true;
    return;
  }

  currentTask = tasks[currentVariant === 1 ? currentTaskIndex : currentTaskIndex]; // на будущее — другие варианты
  taskDiv.textContent = currentTask.text;
  timeLeft = currentTask.time;
  player.style.display = 'none';
  lastAudioBlob = null;

  startRecBtn.disabled = false;
  stopRecBtn.disabled = true;
  playRecBtn.disabled = true;
  downloadRecBtn.disabled = true;
  nextTaskBtn.disabled = true;

  startTimer();
}

// ТАЙМЕР
function startTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      // если идёт запись — остановить
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timerDiv.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ЗАПИСЬ АУДИО
startRecBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

    mediaRecorder.onstop = () => {
      lastAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(lastAudioBlob);
      player.src = url;
      player.style.display = 'block';

      playRecBtn.disabled = false;
      downloadRecBtn.disabled = false;
      startRecBtn.disabled = false;
      stopRecBtn.disabled = true;
      nextTaskBtn.disabled = false;
    };

    mediaRecorder.start();
    startRecBtn.disabled = true;
    stopRecBtn.disabled = false;
    playRecBtn.disabled = true;
    downloadRecBtn.disabled = true;
    nextTaskBtn.disabled = true;
  } catch (err) {
    alert('Не удалось получить доступ к микрофону');
    console.error(err);
  }
});

stopRecBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    clearInterval(timerInterval);
  }
});

playRecBtn.addEventListener('click', () => {
  if (player.src) {
    player.play();
  }
});

downloadRecBtn.addEventListener('click', () => {
  if (!lastAudioBlob) return;
  const url = URL.createObjectURL(lastAudioBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `oge_var${currentVariant}_task${currentTaskIndex + 1}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// ПЕРЕХОД К СЛЕДУЮЩЕМУ ЗАДАНИЮ
nextTaskBtn.addEventListener('click', () => {
  currentTaskIndex++;
  loadTask();
});
