// ЭКРАНЫ
const screenStart = document.getElementById('screen-start');
const screenExam  = document.getElementById('screen-exam');
const screenFinal = document.getElementById('screen-final');

// ЭЛЕМЕНТЫ СТАРТА
const lastNameInput  = document.getElementById('lastName');
const firstNameInput = document.getElementById('firstName');
const examSelect     = document.getElementById('examSelect');
const variantSelect  = document.getElementById('variantSelect');
const startExamBtn   = document.getElementById('startExamBtn');

// ЭЛЕМЕНТЫ ЭКЗАМЕНА
const examTitle   = document.getElementById('examTitle');
const phaseLabel  = document.getElementById('phaseLabel');
const taskDiv     = document.getElementById('task');
const instrAudio  = document.getElementById('instructionPlayer');
const timerDiv    = document.getElementById('timer');
const finishBtn   = document.getElementById('finishBtn');

// ЭЛЕМЕНТЫ ФИНАЛА
const task1PlayDownloadBtn = document.getElementById('task1PlayDownloadBtn');
const task2PlayDownloadBtn = document.getElementById('task2PlayDownloadBtn');
const task3PlayDownloadBtn = document.getElementById('task3PlayDownloadBtn');
const sendTeacherBtn       = document.getElementById('sendTeacherBtn');
const finalPlayer          = document.getElementById('finalPlayer');

// СОСТОЯНИЕ
let studentFirstName = '';
let studentLastName  = '';
let currentExam      = 'oge';
let currentVariant   = 1;

let phase        = null; // 'intro', 'task1_prep', 'task1_rec', 'task2_qX_prep', 'task2_qX_rec', 'task3_prep', 'task3_rec'
let currentQIndex = 0;

// ТАЙМЕР
let timerInterval = null;
let timeLeft      = 0;

// МИКРОФОН
let micStream     = null;
let mediaRecorder = null;
let audioChunks   = [];

// ЗАПИСИ
let task1Blob  = null;     // webm
let task2Blobs = [];       // webm[]
let task3Blob  = null;     // webm

// КОНФИГ ОГЭ ВАРИАНТА (заглушки)
const ogeConfig = {
  1: {
    introText:  'Инструкция к экзамену (заглушка): вы выполняете 3 задания.',
    introTime:  5,
    task1Text:  'Задание 1. Прочитайте текст вслух (заглушка).',
    task1Prep:  10,
    task1Rec:   15,
    task2Info:  'Задание 2. Вы услышите 6 вопросов. После каждого — 5 секунд на ответ (заглушка).',
    task2PrepGap: 3,
    task2Rec:   5,
    task3Text:  'Задание 3. Подготовьте монолог по плану (заглушка).',
    task3Prep:  10,
    task3Rec:   15
  }
};

// ===== НАЧАЛО ЭКЗАМЕНА =====

startExamBtn.addEventListener('click', async () => {
  studentLastName  = (lastNameInput.value || '').trim();
  studentFirstName = (firstNameInput.value || '').trim();

  if (!studentLastName || !studentFirstName) {
    alert('Пожалуйста, введите фамилию и имя.');
    return;
  }

  currentExam    = examSelect.value;
  currentVariant = parseInt(variantSelect.value, 10);

  // Запрос микрофона один раз
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

  examTitle.textContent = currentExam === 'oge'
    ? `ОГЭ, вариант ${currentVariant}`
    : `ЕГЭ (пока сценарий как у ОГЭ), вариант ${currentVariant}`;

  screenStart.classList.add('hidden');
  screenExam.classList.remove('hidden');
  screenFinal.classList.add('hidden');

  startOgeFlow();
});

// ===== СЦЕНАРИЙ ОГЭ =====

function startOgeFlow() {
  task1Blob  = null;
  task2Blobs = [];
  task3Blob  = null;
  currentQIndex = 0;
  finalPlayer.src = '';

  startIntro();
}

// 0. Инструкция
function startIntro() {
  const cfg = ogeConfig[currentVariant];
  phase = 'intro';
  phaseLabel.textContent = 'Инструкция';
  taskDiv.textContent    = cfg.introText;
  instrAudio.style.display = 'none';
  resetExamButtons();

  timeLeft = cfg.introTime;
  startTimer(startTask1Prep);
}

// 1. Подготовка к заданию 1
function startTask1Prep() {
  const cfg = ogeConfig[currentVariant];
  phase = 'task1_prep';
  phaseLabel.textContent = 'Задание 1: подготовка';
  taskDiv.textContent    = cfg.task1Text + '\n\nВремя на подготовку.';
  instrAudio.style.display = 'none';
  resetExamButtons();

  timeLeft = cfg.task1Prep;
  startTimer(startTask1Rec);
}

// 1. Запись задания 1
function startTask1Rec() {
  const cfg = ogeConfig[currentVariant];
  phase = 'task1_rec';
  phaseLabel.textContent = 'Задание 1: запись';
  taskDiv.textContent    = 'Читайте текст вслух. Идёт запись.';
  instrAudio.style.display = 'none';
  resetExamButtons();

  startRecording(blob => {
    task1Blob = blob;
    startTask2Intro();
  });

  timeLeft = cfg.task1Rec;
  startTimer(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  });
}

// 2. Вступление к заданию 2
function startTask2Intro() {
  const cfg = ogeConfig[currentVariant];
  phase = 'task2_intro';
  phaseLabel.textContent = 'Задание 2: вступление';
  taskDiv.textContent    = cfg.task2Info;
  instrAudio.style.display = 'none';
  resetExamButtons();

  currentQIndex = 0;
  timeLeft = 5;
  startTimer(() => startTask2QuestionPrep(0));
}

// 2.x Подготовка к вопросу №i
function startTask2QuestionPrep(index) {
  const cfg = ogeConfig[currentVariant];
  if (index >= 6) {
    startTask3Prep();
    return;
  }

  currentQIndex = index;
  phase = `task2_q${index+1}_prep`;
  phaseLabel.textContent = `Задание 2: вопрос ${index+1}/6 (прослушивание)`;
  taskDiv.textContent    = `Вопрос ${index+1} (заглушка ${cfg.task2PrepGap} секунд), затем запись ответа.`;
  instrAudio.style.display = 'none';
  resetExamButtons();

  timeLeft = cfg.task2PrepGap;
  startTimer(() => startTask2QuestionRec(index));
}

// 2.x Запись ответа на вопрос №i
function startTask2QuestionRec(index) {
  const cfg = ogeConfig[currentVariant];
  phase = `task2_q${index+1}_rec`;
  phaseLabel.textContent = `Задание 2: ответ на вопрос ${index+1}/6`;
  taskDiv.textContent    = `Говорите. Время на ответ ${cfg.task2Rec} секунд.`;
  instrAudio.style.display = 'none';
  resetExamButtons();

  startRecording(blob => {
    task2Blobs.push(blob);
    startTask2QuestionPrep(index + 1);
  });

  timeLeft = cfg.task2Rec;
  startTimer(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  });
}

// 3. Подготовка к заданию 3
function startTask3Prep() {
  const cfg = ogeConfig[currentVariant];
  phase = 'task3_prep';
  phaseLabel.textContent = 'Задание 3: подготовка';
  taskDiv.textContent    = cfg.task3Text + '\n\nВремя на подготовку.';
  instrAudio.style.display = 'none';
  resetExamButtons();

  timeLeft = cfg.task3Prep;
  startTimer(startTask3Rec);
}

// 3. Запись задания 3
function startTask3Rec() {
  const cfg = ogeConfig[currentVariant];
  phase = 'task3_rec';
  phaseLabel.textContent = 'Задание 3: запись';
  taskDiv.textContent    = 'Говорите монолог. Идёт запись.';
  instrAudio.style.display = 'none';
  resetExamButtons();

  startRecording(blob => {
    task3Blob = blob;
    finishExam();
  });

  timeLeft = cfg.task3Rec;
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

  task1PlayDownloadBtn.disabled = !task1Blob;
  task2PlayDownloadBtn.disabled = task2Blobs.length !== 6;
  task3PlayDownloadBtn.disabled = !task3Blob;
  sendTeacherBtn.disabled       = !(task1Blob && task3Blob && task2Blobs.length === 6);
}

// ===== ТАЙМЕР =====

function startTimer(onFinish) {
  clearInterval(timerInterval);
  updateTimerDisplay();
  finishBtn.disabled = false; // "Закончить задание" активна на любом таймере
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
  clearInterval(timerInterval);
  timerDiv.textContent = '00:00';
  finishBtn.disabled   = false; // можно всегда досрочно завершить этап
}

// ===== ЗАПИСЬ =====

// Запуск записи; callback получает webm blob после остановки
async function startRecording(onStopped) {
  try {
    // Переназначаем поток микрофона, если нужно
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

// "Закончить задание"
finishBtn.addEventListener('click', () => {
  // 1) если фаза подготовки – перейти сразу к записи
  if (phase === 'intro') {
    startTask1Prep();
    return;
  }
  if (phase === 'task1_prep') {
    startTask1Rec();
    return;
  }
  if (phase === 'task2_intro') {
    startTask2QuestionPrep(0);
    return;
  }
  if (phase && phase.endsWith('_prep')) {
    // task2_qX_prep
    startTask2QuestionRec(currentQIndex);
    return;
  }
  if (phase === 'task3_prep') {
    startTask3Rec();
    return;
  }

  // 2) если идёт запись – досрочно остановить, переход сделает onstop
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    clearInterval(timerInterval);
    mediaRecorder.stop();
  }
});

// ===== МP3 КОНВЕРТАЦИЯ =====

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

  const samples = new Int16Array(merged.length);
  for (let i = 0; i < merged.length; i++) {
    let s = Math.max(-1, Math.min(1, merged[i]));
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

// ===== ФИНАЛ: ПРОСЛУШКА + СКАЧИВАНИЕ =====

function fioPrefix() {
  const ln = studentLastName  || 'Student';
  const fn = studentFirstName || 'Name';
  return `${ln}_${fn}`;
}

task1PlayDownloadBtn.addEventListener('click', async () => {
  if (!task1Blob) return;
  const mp3 = await convertWebmToMp3(task1Blob);
  const url = URL.createObjectURL(mp3);
  finalPlayer.src = url;
  finalPlayer.play().catch(console.error);
  downloadBlob(mp3, `${fioPrefix()}_task1.mp3`);
});

task2PlayDownloadBtn.addEventListener('click', async () => {
  if (task2Blobs.length !== 6) return;
  const mp3 = await convertMultipleWebmToMp3(task2Blobs);
  const url = URL.createObjectURL(mp3);
  finalPlayer.src = url;
  finalPlayer.play().catch(console.error);
  downloadBlob(mp3, `${fioPrefix()}_task2_all.mp3`);
});

task3PlayDownloadBtn.addEventListener('click', async () => {
  if (!task3Blob) return;
  const mp3 = await convertWebmToMp3(task3Blob);
  const url = URL.createObjectURL(mp3);
  finalPlayer.src = url;
  finalPlayer.play().catch(console.error);
  downloadBlob(mp3, `${fioPrefix()}_task3.mp3`);
});

// Псевдо-отправка учителю через mailto
sendTeacherBtn.addEventListener('click', () => {
  const ln = encodeURIComponent(studentLastName);
  const fn = encodeURIComponent(studentFirstName);
  const subject = encodeURIComponent(`Аудио ответов ОГЭ/${currentExam.toUpperCase()}: ${studentLastName} ${studentFirstName}`);
  const body = encodeURIComponent(
    `Здравствуйте!\n\n` +
    `Отправляю аудиозаписи устной части.\n` +
    `Фамилия, имя: ${studentLastName} ${studentFirstName}\n` +
    `Экзамен: ${currentExam.toUpperCase()}, вариант ${currentVariant}\n\n` +
    `Файлы для прикрепления (вы уже скачали их на компьютер):\n` +
    `- ${fioPrefix()}_task1.mp3\n` +
    `- ${fioPrefix()}_task2_all.mp3\n` +
    `- ${fioPrefix()}_task3.mp3\n\n` +
    `С уважением,\n${studentFirstName}`
  );

  const teacherEmail = 'mstrmike@yandex.ru'; // ЗАМЕНИТЕ на свой e-mail
  window.location.href = `mailto:${teacherEmail}?subject=${subject}&body=${body}`;
});
