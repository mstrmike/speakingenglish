// ЭКРАНЫ
const screenSelect = document.getElementById('screen-select');
const screenExam   = document.getElementById('screen-exam');
const screenFinal  = document.getElementById('screen-final');

// ЭЛЕМЕНТЫ ВЫБОРА
const examSelect    = document.getElementById('examSelect');
const variantSelect = document.getElementById('variantSelect');
const startExamBtn  = document.getElementById('startExamBtn');

// ЭЛЕМЕНТЫ ЭКЗАМЕНА
const examTitle        = document.getElementById('examTitle');
const phaseLabel       = document.getElementById('phaseLabel');
const taskDiv          = document.getElementById('task');
const instructionAudio = document.getElementById('instructionPlayer');
const timerDiv         = document.getElementById('timer');

const startRecBtn    = document.getElementById('startRecBtn');    // НЕ используем в логике, оставляем отключённой
const stopRecBtn     = document.getElementById('stopRecBtn');     // НЕ используем
const playRecBtn     = document.getElementById('playRecBtn');     // НЕ используем
const downloadRecBtn = document.getElementById('downloadRecBtn'); // НЕ используем
const player         = document.getElementById('player');
const continueBtn    = document.getElementById('continueBtn');

// ЭЛЕМЕНТЫ ФИНАЛА
const downloadTask1Btn = document.getElementById('downloadTask1Btn');
const downloadTask2Btn = document.getElementById('downloadTask2Btn');
const downloadTask3Btn = document.getElementById('downloadTask3Btn');

// СОСТОЯНИЕ
let currentExam    = 'oge';
let currentVariant = 1;
let phase          = null;         // 'intro', 'task1_prep', 'task1_rec', 'task2_q1_prep', 'task2_q1_rec', ..., 'task3_prep', 'task3_rec'
let currentQIndex  = 0;            // индекс вопроса задания 2 (0–5)

// ТАЙМЕР
let timerInterval = null;
let timeLeft      = 0;

// АУДИОЗАПИСЬ
let mediaRecorder = null;
let audioChunks   = [];
let currentStream = null;

// ЗАПИСИ
let task1Blob   = null;    // webm задания 1
let task2Blobs  = [];      // webm 6 ответов задания 2
let task3Blob   = null;    // webm задания 3

// ПРОСТАЯ КОНФИГУРАЦИЯ ОГЭ, ВАРИАНТ 1 (заглушки)
const ogeAudio = {
  1: {
    intro: '', // путь к общей инструкции (позже)
    task1_text: 'Текст для чтения задания 1 (заглушка).',
    task1_prep_time: 10,
    task1_rec_time: 15,
    task2_questions: ['', '', '', '', '', ''], // пути к аудио вопросов
    task2_rec_time: 5,
    task3_text: 'Задание 3 (монолог, заглушка).',
    task3_prep_time: 10,
    task3_rec_time: 15
  }
};

// ===== НАЧАЛО ЭКЗАМЕНА =====

startExamBtn.addEventListener('click', () => {
  currentExam    = examSelect.value;
  currentVariant = parseInt(variantSelect.value, 10);

  examTitle.textContent = currentExam === 'oge'
    ? `ОГЭ, вариант ${currentVariant}`
    : `ЕГЭ, вариант ${currentVariant}`;

  screenSelect.classList.add('hidden');
  screenExam.classList.remove('hidden');
  screenFinal.classList.add('hidden');

  startOgeFlow();
});

// ===== СЦЕНАРИЙ ОГЭ =====

function startOgeFlow() {
  task1Blob  = null;
  task2Blobs = [];
  task3Blob  = null;
  startIntro();
}

// 0. Инструкция
function startIntro() {
  phase = 'intro';
  phaseLabel.textContent = 'Инструкция к экзамену';
  taskDiv.textContent    = 'Слушайте инструкцию (заглушка 5 секунд).';
  resetExamButtons();

  timeLeft = 5;
  startTimer(startTask1Prep);
}

// 1. Подготовка к заданию 1
function startTask1Prep() {
  const cfg = ogeAudio[currentVariant];
  phase = 'task1_prep';
  phaseLabel.textContent = 'Задание 1: подготовка';
  taskDiv.textContent    = cfg.task1_text + '\nВремя на подготовку.';
  resetExamButtons();

  timeLeft = cfg.task1_prep_time;
  startTimer(startTask1Rec);
}

// 1. Запись задания 1
function startTask1Rec() {
  const cfg = ogeAudio[currentVariant];
  phase = 'task1_rec';
  phaseLabel.textContent = 'Задание 1: запись';
  taskDiv.textContent    = 'Читайте текст вслух. Идёт запись.';
  resetExamButtons();

  startRecording(blob => {
    task1Blob = blob;
    startTask2Intro();
  });

  timeLeft = cfg.task1_rec_time;
  startTimer(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  });
}

// 2. Вступление к заданию 2
function startTask2Intro() {
  const cfg = ogeAudio[currentVariant];
  phase = 'task2_intro';
  phaseLabel.textContent = 'Задание 2: ответы на вопросы';
  taskDiv.textContent    = 'Сейчас будет 6 вопросов. После каждого – запись ответа.';
  resetExamButtons();

  currentQIndex = 0;
  timeLeft = 5;
  startTimer(() => startTask2QuestionPrep(0));
}

// 2.x Подготовка к вопросу №i
function startTask2QuestionPrep(index) {
  const cfg = ogeAudio[currentVariant];
  if (index >= 6) {
    startTask3Prep();
    return;
  }

  currentQIndex = index;
  phase = `task2_q${index + 1}_prep`;
  phaseLabel.textContent = `Задание 2: вопрос ${index + 1}/6 (прослушивание)`;
  taskDiv.textContent    = `Вопрос ${index + 1} (заглушка 3 секунды), потом запись.`;
  resetExamButtons();

  timeLeft = 3;
  startTimer(() => startTask2QuestionRec(index));
}

// 2.x Запись ответа на вопрос №i
function startTask2QuestionRec(index) {
  const cfg = ogeAudio[currentVariant];
  phase = `task2_q${index + 1}_rec`;
  phaseLabel.textContent = `Задание 2: ответ на вопрос ${index + 1}/6`;
  taskDiv.textContent    = `Говорите. Время на ответ ${cfg.task2_rec_time} секунд.`;
  resetExamButtons();

  startRecording(blob => {
    task2Blobs.push(blob);
    startTask2QuestionPrep(index + 1);
  });

  timeLeft = cfg.task2_rec_time;
  startTimer(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  });
}

// 3. Подготовка к заданию 3
function startTask3Prep() {
  const cfg = ogeAudio[currentVariant];
  phase = 'task3_prep';
  phaseLabel.textContent = 'Задание 3: подготовка';
  taskDiv.textContent    = cfg.task3_text + '\nВремя на подготовку.';
  resetExamButtons();

  timeLeft = cfg.task3_prep_time;
  startTimer(startTask3Rec);
}

// 3. Запись задания 3
function startTask3Rec() {
  const cfg = ogeAudio[currentVariant];
  phase = 'task3_rec';
  phaseLabel.textContent = 'Задание 3: запись';
  taskDiv.textContent    = 'Говорите монолог. Идёт запись.';
  resetExamButtons();

  startRecording(blob => {
    task3Blob = blob;
    finishExam();
  });

  timeLeft = cfg.task3_rec_time;
  startTimer(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  });
}

// Финал
function finishExam() {
  phase = 'finished';
  clearInterval(timerInterval);
  timerDiv.textContent = '00:00';
  resetExamButtons();

  screenExam.classList.add('hidden');
  screenFinal.classList.remove('hidden');

  // включаем кнопки, если записи есть
  downloadTask1Btn.disabled = !task1Blob;
  downloadTask2Btn.disabled = task2Blobs.length !== 6;
  downloadTask3Btn.disabled = !task3Blob;

  // показываем плеер на финальном экране при выборе задания
  player.style.display = 'block';
  player.src = '';
}

// ===== ТАЙМЕР =====

function startTimer(onFinish) {
  clearInterval(timerInterval);
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      if (typeof onFinish === 'function') onFinish();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timerDiv.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function resetExamButtons() {
  startRecBtn.disabled    = true;
  stopRecBtn.disabled     = true;
  playRecBtn.disabled     = true;
  downloadRecBtn.disabled = true;
  continueBtn.disabled    = true;
  player.style.display    = 'none';
  player.src              = '';
}

// ===== ЗАПИСЬ =====
// onStoppedCallback(blob) – вызывается после сохранения записи

async function startRecording(onStoppedCallback) {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(t => t.stop());
    }
    currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(currentStream, { mimeType: 'audio/webm' });
    audioChunks   = [];

    mediaRecorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) {
        audioChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
      }
      if (!audioChunks.length) return;
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      if (typeof onStoppedCallback === 'function') {
        onStoppedCallback(blob);
      }
    };

    mediaRecorder.start();
    continueBtn.disabled = false; // можно досрочно завершить
  } catch (err) {
    alert('Не удалось получить доступ к микрофону.');
    console.error(err);
  }
}

// "Продолжить" – досрочно завершает текущий этап
continueBtn.addEventListener('click', () => {
  if (phase === 'intro') {
    clearInterval(timerInterval);
    startTask1Prep();
    return;
  }
  if (phase === 'task1_prep') {
    clearInterval(timerInterval);
    startTask1Rec();
    return;
  }
  if (phase === 'task2_intro') {
    clearInterval(timerInterval);
    startTask2QuestionPrep(0);
    return;
  }
  if (phase && phase.endsWith('_prep')) {
    clearInterval(timerInterval);
    const index = currentQIndex;
    startTask2QuestionRec(index);
    return;
  }
  if (phase === 'task3_prep') {
    clearInterval(timerInterval);
    startTask3Rec();
    return;
  }
  // если идёт запись – досрочно остановить, onstop сам переведёт дальше
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    clearInterval(timerInterval);
    mediaRecorder.stop();
  }
});

// Убираем реальные действия с кнопками, которые не нужны
stopRecBtn.addEventListener('click', () => {
  // не используем
});
playRecBtn.addEventListener('click', () => {
  alert('Прослушивание доступно только после экзамена.');
});
downloadRecBtn.addEventListener('click', () => {
  alert('Скачивание доступно после экзамена.');
});

// ===== MP3 КОНВЕРТАЦИЯ И ПРОСЛУШИВАНИЕ НА ФИНАЛЕ =====

// Вспомогательная функция скачивания
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// webm -> mp3
async function convertWebmToMp3(webmBlob) {
  const arrayBuffer   = await webmBlob.arrayBuffer();
  const audioContext  = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer   = await audioContext.decodeAudioData(arrayBuffer);
  const channelData   = audioBuffer.getChannelData(0);
  const sampleRate    = audioBuffer.sampleRate;
  const mp3Encoder    = new lamejs.Mp3Encoder(1, sampleRate, 128);
  const sampleBlock   = 1152;
  const mp3Data       = [];
  const samples       = new Int16Array(channelData.length);

  for (let i = 0; i < channelData.length; i++) {
    let s = Math.max(-1, Math.min(1, channelData[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  for (let i = 0; i < samples.length; i += sampleBlock) {
    const sampleChunk = samples.subarray(i, i + sampleBlock);
    const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }
  const end = mp3Encoder.flush();
  if (end.length > 0) mp3Data.push(end);

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

// несколько webm подряд -> один mp3 (задание 2)
async function convertMultipleWebmToMp3(webmBlobs) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const buffers      = [];
  let totalLength    = 0;
  let sampleRate     = 44100;

  for (const blob of webmBlobs) {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    buffers.push(audioBuffer);
    totalLength += audioBuffer.length;
    sampleRate = audioBuffer.sampleRate;
  }

  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    merged.set(buf.getChannelData(0), offset);
    offset += buf.length;
  }

  const mp3Encoder  = new lamejs.Mp3Encoder(1, sampleRate, 128);
  const sampleBlock = 1152;
  const mp3Data     = [];
  const samples     = new Int16Array(merged.length);

  for (let i = 0; i < merged.length; i++) {
    let s = Math.max(-1, Math.min(1, merged[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  for (let i = 0; i < samples.length; i += sampleBlock) {
    const chunk = samples.subarray(i, i + sampleBlock);
    const mp3buf = mp3Encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }
  const end = mp3Encoder.flush();
  if (end.length > 0) mp3Data.push(end);

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

// Финальные кнопки: прослушивание + скачивание MP3

downloadTask1Btn.addEventListener('click', async () => {
  if (!task1Blob) return;
  const mp3 = await convertWebmToMp3(task1Blob);
  const url = URL.createObjectURL(mp3);
  player.src = url;
  player.play().catch(console.error);
  downloadBlob(mp3, 'oge_task1.mp3');
});

downloadTask2Btn.addEventListener('click', async () => {
  if (task2Blobs.length !== 6) {
    alert('Записаны не все 6 ответов задания 2.');
    return;
  }
  const mp3 = await convertMultipleWebmToMp3(task2Blobs);
  const url = URL.createObjectURL(mp3);
  player.src = url;
  player.play().catch(console.error);
  downloadBlob(mp3, 'oge_task2_all.mp3');
});

downloadTask3Btn.addEventListener('click', async () => {
  if (!task3Blob) return;
  const mp3 = await convertWebmToMp3(task3Blob);
  const url = URL.createObjectURL(mp3);
  player.src = url;
  player.play().catch(console.error);
  downloadBlob(mp3, 'oge_task3.mp3');
});
