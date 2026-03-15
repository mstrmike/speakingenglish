// ЭКРАНЫ
const screenStart = document.getElementById('screen-start');
const screenExam  = document.getElementById('screen-exam');
const screenFinal = document.getElementById('screen-final');

// СТАРТ
const lastNameInput  = document.getElementById('lastName');
const firstNameInput = document.getElementById('firstName');
const classNameInput = document.getElementById('className');
const examSelect     = document.getElementById('examSelect');
const variantSelect  = document.getElementById('variantSelect');
const startExamBtn   = document.getElementById('startExamBtn');

// ЭКЗАМЕН
const examTitle  = document.getElementById('examTitle');
const phaseLabel = document.getElementById('phaseLabel');
const taskDiv    = document.getElementById('task');
const timerDiv   = document.getElementById('timer');
const actionBtn  = document.getElementById('actionBtn');

// ФИНАЛ
const playDownloadBtn = document.getElementById('playDownloadBtn');
const finalPlayer     = document.getElementById('finalPlayer');
const backBtn         = document.getElementById('backBtn');

// СОСТОЯНИЕ
let studentLastName  = '';
let studentFirstName = '';
let studentClass     = '';
let currentExam      = 'oge';
let currentVariant   = 1;

let phase       = null; // 'prep' | 'rec' | 'finished'
let timer       = null;
let timeLeft    = 0;

// МИКРОФОН / ЗАПИСЬ
let micStream     = null;
let mediaRecorder = null;
let audioChunks   = [];

// ЗАПИСЬ ЗАДАНИЯ
let taskBlob = null; // webm

// КОНФИГ ОДНОГО ЗАДАНИЯ
const taskConfig = {
  text: 'Задание: расскажите о своём любимом школьном предмете (заглушка).',
  prepTime: 10,  // сек на подготовку
  recTime:  30   // сек на запись
};

// ===== НАЧАЛО =====

startExamBtn.addEventListener('click', async () => {
  studentLastName  = (lastNameInput.value  || '').trim();
  studentFirstName = (firstNameInput.value || '').trim();
  studentClass     = (classNameInput.value || '').trim();

  if (!studentLastName || !studentFirstName || !studentClass) {
    alert('Введите фамилию, имя и класс.');
    return;
  }

  currentExam    = examSelect.value;
  currentVariant = parseInt(variantSelect.value, 10);

  // запрос микрофона
  try {
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    alert('Нет доступа к микрофону. Разрешите использование микрофона и попробуйте снова.');
    console.error(e);
    return;
  }

  examTitle.textContent = `${currentExam.toUpperCase()}, вариант ${currentVariant}`;

  screenStart.classList.add('hidden');
  screenExam.classList.remove('hidden');
  screenFinal.classList.add('hidden');

  startPrep();
});

// ===== ФАЗЫ ЗАДАНИЯ =====

function startPrep() {
  phase = 'prep';
  phaseLabel.textContent = 'Подготовка к заданию';
  taskDiv.textContent    = taskConfig.text + '\n\nВремя на подготовку.';
  timeLeft = taskConfig.prepTime;
  updateTimer();
  actionBtn.disabled = false;
  actionBtn.textContent = 'Сразу перейти к записи';

  resetTimer();
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      resetTimer();
      startRec();
    }
  }, 1000);
}

function startRec() {
  phase = 'rec';
  phaseLabel.textContent = 'Запись ответа';
  taskDiv.textContent    = 'Говорите. Идёт запись.';
  timeLeft = taskConfig.recTime;
  updateTimer();
  actionBtn.disabled = false;
  actionBtn.textContent = 'Закончить задание';

  startRecording(blob => {
    taskBlob = blob;
    finishTask();
  });

  resetTimer();
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      resetTimer();
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }
  }, 1000);
}

function finishTask() {
  phase = 'finished';
  resetTimer();
  timerDiv.textContent = '00:00';
  actionBtn.disabled = true;

  screenExam.classList.add('hidden');
  screenFinal.classList.remove('hidden');

  playDownloadBtn.disabled = !taskBlob;
  finalPlayer.src = '';
}

// ===== КНОПКА ДЕЙСТВИЯ НА ЭКЗАМЕНЕ =====

actionBtn.addEventListener('click', () => {
  if (phase === 'prep') {
    resetTimer();
    startRec();
    return;
  }
  if (phase === 'rec') {
    resetTimer();
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }
});

// ===== ТАЙМЕР =====

function updateTimer() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timerDiv.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function resetTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// ===== ЗАПИСЬ =====

async function startRecording(onStopped) {
  try {
    if (!micStream) {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    mediaRecorder = new MediaRecorder(micStream, { mimeType: 'audio/webm' });
    audioChunks   = [];

    mediaRecorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      if (!audioChunks.length) return;
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      if (typeof onStopped === 'function') onStopped(blob);
    };

    mediaRecorder.start();
  } catch (e) {
    alert('Ошибка доступа к микрофону во время записи.');
    console.error(e);
  }
}

// ===== МP3 КОНВЕРТАЦИЯ + СКАЧИВАНИЕ =====

function fioPrefix() {
  const ln = studentLastName  || 'Student';
  const fn = studentFirstName || 'Name';
  const cl = studentClass     || 'Class';
  return `${ln}_${fn}_${cl}_var${currentVariant}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function convertWebmToMp3(webmBlob) {
  const arrayBuffer  = await webmBlob.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer  = await audioContext.decodeAudioData(arrayBuffer);
  const channelData  = audioBuffer.getChannelData(0);
  const sampleRate   = audioBuffer.sampleRate;

  const samples = new Int16Array(channelData.length);
  for (let i = 0; i < channelData.length; i++) {
    let s = Math.max(-1, Math.min(1, channelData[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  const mp3Encoder  = new lamejs.Mp3Encoder(1, sampleRate, 128);
  const sampleBlock = 1152;
  const mp3Data     = [];

  for (let i = 0; i < samples.length; i += sampleBlock) {
    const chunk = samples.subarray(i, i + sampleBlock);
    const buf   = mp3Encoder.encodeBuffer(chunk);
    if (buf.length > 0) mp3Data.push(buf);
  }
  const end = mp3Encoder.flush();
  if (end.length > 0) mp3Data.push(end);

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

// Кнопка финала: прослушать + скачать
playDownloadBtn.addEventListener('click', async () => {
  if (!taskBlob) return;
  const mp3 = await convertWebmToMp3(taskBlob);
  const url = URL.createObjectURL(mp3);
  finalPlayer.src = url;
  finalPlayer.play().catch(console.error);
  downloadBlob(mp3, `${fioPrefix()}_task1.mp3`);
});

// Вернуться на старт
backBtn.addEventListener('click', () => {
  screenFinal.classList.add('hidden');
  screenStart.classList.remove('hidden');
  finalPlayer.src = '';
  taskBlob = null;
  phase = null;
});
