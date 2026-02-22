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

// АУДИО
let mediaRecorder = null;
let audioChunks = [];
let lastAudioBlob = null;   // webm
let currentStream = null;

// ЗАГРУЖАЕМ ЗАДАНИЯ
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

// СТАРТ ЭКЗАМЕНА
startExamBtn.addEventListener('click', () => {
  currentVariant = parseInt(variantSelect.value, 10);
  currentTaskIndex = 0;
  loadTask();
});

// ЗАГРУЗКА ЗАДАНИЯ
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

  currentTask = tasks[currentTaskIndex];
  taskDiv.textContent = currentTask.text;
  timeLeft = currentTask.time;

  player.style.display = 'none';
  player.src = '';
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

// ЗАПИСЬ
startRecBtn.addEventListener('click', async () => {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(t => t.stop());
    }

    currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(currentStream, { mimeType: 'audio/webm' });
    audioChunks = [];
    lastAudioBlob = null;

    mediaRecorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) {
        audioChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      if (!audioChunks.length) {
        console.warn('Нет аудиоданных для воспроизведения');
        return;
      }
      lastAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });

      const url = URL.createObjectURL(lastAudioBlob);
      player.src = url;
      player.style.display = 'block';

      playRecBtn.disabled = false;
      downloadRecBtn.disabled = false;
      startRecBtn.disabled = false;
      stopRecBtn.disabled = true;
      nextTaskBtn.disabled = false;

      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
      }
    };

    mediaRecorder.start();
    startRecBtn.disabled = true;
    stopRecBtn.disabled = false;
    playRecBtn.disabled = true;
    downloadRecBtn.disabled = true;
    nextTaskBtn.disabled = true;
  } catch (err) {
    alert('Не удалось получить доступ к микрофону.');
    console.error(err);
  }
});

stopRecBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    clearInterval(timerInterval);
  }
});

// ПРОСЛУШИВАНИЕ
playRecBtn.addEventListener('click', () => {
  if (!lastAudioBlob) {
    alert('Сначала запишите ответ.');
    return;
  }
  if (player.src) {
    player.play().catch(e => {
      console.error('Ошибка при воспроизведении', e);
      alert('Не удалось воспроизвести запись (см. консоль).');
    });
  }
});

// КОНВЕРТАЦИЯ В MP3 + СКАЧИВАНИЕ
downloadRecBtn.addEventListener('click', async () => {
  if (!lastAudioBlob) {
    alert('Нет записи для сохранения.');
    return;
  }
  try {
    const mp3Blob = await convertWebmToMp3(lastAudioBlob);
    const url = URL.createObjectURL(mp3Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oge_var${currentVariant}_task${currentTaskIndex + 1}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    console.error('Ошибка конвертации в MP3', e);
    alert('Не удалось конвертировать в MP3 (см. консоль).');
  }
});

// Переход к следующему заданию
nextTaskBtn.addEventListener('click', () => {
  currentTaskIndex++;
  loadTask();
});

// === ФУНКЦИЯ КОНВЕРТАЦИИ WEBM -> MP3 С ПОМОЩЬЮ LAMEJS ===
async function convertWebmToMp3(webmBlob) {
  const arrayBuffer = await webmBlob.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0); // берём mono
  const sampleRate = audioBuffer.sampleRate;
  const mp3Encoder = new lamejs.Mp3Encoder(1, sampleRate, 128); // 1 канал, 128kbps
  const sampleBlockSize = 1152;
  const mp3Data = [];

  // float32 [-1,1] -> int16
  const samples = new Int16Array(channelData.length);
  for (let i = 0; i < channelData.length; i++) {
    let s = Math.max(-1, Math.min(1, channelData[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  for (let i = 0; i < samples.length; i += sampleBlockSize) {
    const sampleChunk = samples.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }
  const end = mp3Encoder.flush();
  if (end.length > 0) {
    mp3Data.push(end);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}
