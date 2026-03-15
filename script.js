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
const playDownload1Btn = document.getElementById('playDownload1Btn');
const playDownload2Btn = document.getElementById('playDownload2Btn');
const playDownload3Btn = document.getElementById('playDownload3Btn');
const finalPlayer      = document.getElementById('finalPlayer');
const backBtn          = document.getElementById('backBtn');

// СОСТОЯНИЕ
let studentLastName  = '';
let studentFirstName = '';
let studentClass     = '';
let currentExam      = 'oge';
let currentVariant   = 1;

// фаза: 'intro', 'task1_prep', 'task1_rec',
//       'task2_intro', 'task2_q_prep', 'task2_q_rec',
//       'task3_prep', 'task3_rec', 'finished'
let phase        = null;
let timer        = null;
let timeLeft     = 0;
let questionIndex = 0; // 0–5 для задания 2

// МИКРОФОН / ЗАПИСЬ
let micStream     = null;
let mediaRecorder = null;
let audioChunks   = [];

// ЗАПИСИ
let task1Blob  = null;
let task2Blobs = [];  // 6 webm, по одному на ответ
let task3Blob  = null;

// КОНФИГ ЗАДАНИЙ (заглушки, можно заменить)
const config = {
  introText: 'Инструкция к экзамену (заглушка). Вы выполните 3 задания.',
  introTime: 5,

  task1: {
    text: 'Задание 1. Прочитайте текст вслух (заглушка).',
    prepTime: 10,
    recTime:  20
  },
  task2: {
    infoText: 'Задание 2. Вы услышите 6 вопросов. После каждого — время на ответ (заглушка).',
    questionText: 'Вопрос {n} (заглушка). Подумайте над ответом.',
    prepGap: 3,   // пауза/прослушивание вопроса (сек)
    recTime:  15  // запись ответа (сек)
  },
  task3: {
    text: 'Задание 3. Монолог по плану (заглушка).',
    prepTime: 15,
    recTime:  30
  }
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

  startIntro();
});

// ===== ФАЗЫ =====

function startIntro() {
  phase = 'intro';
  phaseLabel.textContent = 'Инструкция';
  taskDiv.textContent    = config.introText;
  timeLeft = config.introTime;
  updateTimer();
  actionBtn.disabled = false;
  actionBtn.textContent = 'Сразу перейти к заданию 1';

  resetTimer();
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      resetTimer();
      startTask1Prep();
    }
  }, 1000);
}

// --- Задание 1 ---

function startTask1Prep() {
  phase = 'task1_prep';
  phaseLabel.textContent = 'Задание 1: подготовка';
  taskDiv.textContent    = config.task1.text + '\n\nВремя на подготовку.';
  timeLeft = config.task1.prepTime;
  updateTimer();
  actionBtn.disabled = false;
  actionBtn.textContent = 'Сразу перейти к записи';

  resetTimer();
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      resetTimer();
      startTask1Rec();
    }
  }, 1000);
}

function startTask1Rec() {
  phase = 'task1_rec';
  phaseLabel.textContent = 'Задание 1: запись';
  taskDiv.textContent    = 'Читайте текст вслух. Идёт запись.';
  timeLeft = config.task1.recTime;
  updateTimer();
  actionBtn.disabled = false;
  actionBtn.textContent = 'Закончить задание';

  startRecording(blob => {
    task1Blob = blob;
    startTask2Intro();
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

// --- Задание 2: 6 вопросов ---

function startTask2Intro() {
  phase = 'task2_intro';
  phaseLabel.textContent = 'Задание 2: вступление';
  taskDiv.textContent    = config.task2.infoText;
  timeLeft = 5;
  updateTimer();
  actionBtn.disabled = false;
  actionBtn.textContent = 'Сразу перейти к вопросу 1';

  questionIndex = 0;
  task2Blobs = [];

  resetTimer();
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      resetTimer();
      startTask2QuestionPrep(0);
    }
  }, 1000);
}

function startTask2QuestionPrep(index) {
  if (index >= 6) {
    startTask3Prep();
    return;
  }

  questionIndex = index;
  phase = 'task2_q_prep';
  const n = index + 1;
  phaseLabel.textContent = `Задание 2: вопрос ${n}/6 (прослушивание)`;
  taskDiv.textContent    = config.task2.questionText.replace('{n}', n) +
                           `\n\nЧерез несколько секунд начнётся запись ответа.`;
  // В этой фазе НЕ показываем реальный таймер для ученика, но можем использовать внутренний
  timeLeft = config.task2.prepGap;
  timerDiv.textContent = ''; // убрать счётчик, чтобы не отвлекал
  actionBtn.disabled = false;
  actionBtn.textContent = 'Сразу перейти к записи';

  resetTimer();
  timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      resetTimer();
      startTask2QuestionRec(questionIndex);
    }
  }, 1000);
}

function startTask2QuestionRec(index) {
  const n = index + 1;
  phase = 'task2_q_rec';
  phaseLabel.textContent = `Задание 2: ответ на вопрос ${n}/6`;
  taskDiv.textContent    = `Отвечайте на вопрос ${n}. Идёт запись.`;
  timeLeft = config.task2.recTime;
  updateTimer();
  actionBtn.disabled = false;
  actionBtn.textContent = 'Закончить ответ';

  startRecording(blob => {
    task2Blobs.push(blob);
    if (index < 5) {
      startTask2QuestionPrep(index + 1);
    } else {
      startTask3Prep();
    }
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

// --- Задание 3 ---

function startTask3Prep() {
  phase = 'task3_prep';
  phaseLabel.textContent = 'Задание 3: подготовка';
  taskDiv.textContent    = config.task3.text + '\n\nВремя на подготовку.';
  timeLeft = config.task3.prepTime;
  updateTimer();
  actionBtn.disabled = false;
  actionBtn.textContent = 'Сразу перейти к записи';

  resetTimer();
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      resetTimer();
      startTask3Rec();
    }
  }, 1000);
}

function startTask3Rec() {
  phase = 'task3_rec';
  phaseLabel.textContent = 'Задание 3: запись';
  taskDiv.textContent    = 'Говорите монолог. Идёт запись.';
  timeLeft = config.task3.recTime;
  updateTimer();
  actionBtn.disabled = false;
  actionBtn.textContent = 'Закончить задание';

  startRecording(blob => {
    task3Blob = blob;
    finishExam();
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

// --- Финал ---

function finishExam() {
  phase = 'finished';
  resetTimer();
  timerDiv.textContent = '00:00';
  actionBtn.disabled = true;

  screenExam.classList.add('hidden');
  screenFinal.classList.remove('hidden');

  playDownload1Btn.disabled = !task1Blob;
  playDownload2Btn.disabled = task2Blobs.length !== 6;
  playDownload3Btn.disabled = !task3Blob;

  finalPlayer.src = '';
}

// ===== КНОПКА ДЕЙСТВИЯ НА ЭКЗАМЕНЕ =====

actionBtn.addEventListener('click', () => {
  switch (phase) {
    case 'intro':
      resetTimer();
      startTask1Prep();
      break;
    case 'task1_prep':
      resetTimer();
      startTask1Rec();
      break;
    case 'task1_rec':
      resetTimer();
      if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
      break;

    case 'task2_intro':
      resetTimer();
      startTask2QuestionPrep(0);
      break;
    case 'task2_q_prep':
      resetTimer();
      startTask2QuestionRec(questionIndex);
      break;
    case 'task2_q_rec':
      resetTimer();
      if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
      break;

    case 'task3_prep':
      resetTimer();
      startTask3Rec();
      break;
    case 'task3_rec':
      resetTimer();
      if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
      break;
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

// склейка 6 webm → один mp3
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

// Кнопки финала: прослушать + скачать
playDownload1Btn.addEventListener('click', async () => {
  if (!task1Blob) return;
  const mp3 = await convertWebmToMp3(task1Blob);
  const url = URL.createObjectURL(mp3);
  finalPlayer.src = url;
  finalPlayer.play().catch(console.error);
  downloadBlob(mp3, `${fioPrefix()}_task1.mp3`);
});

playDownload2Btn.addEventListener('click', async () => {
  if (task2Blobs.length !== 6) {
    alert('Записаны не все 6 ответов задания 2.');
    return;
  }
  const mp3 = await convertMultipleWebmToMp3(task2Blobs);
  const url = URL.createObjectURL(mp3);
  finalPlayer.src = url;
  finalPlayer.play().catch(console.error);
  downloadBlob(mp3, `${fioPrefix()}_task2_all.mp3`);
});

playDownload3Btn.addEventListener('click', async () => {
  if (!task3Blob) return;
  const mp3 = await convertWebmToMp3(task3Blob);
  const url = URL.createObjectURL(mp3);
  finalPlayer.src = url;
  finalPlayer.play().catch(console.error);
  downloadBlob(mp3, `${fioPrefix()}_task3.mp3`);
});

// Вернуться на старт
backBtn.addEventListener('click', () => {
  screenFinal.classList.add('hidden');
  screenStart.classList.remove('hidden');
  finalPlayer.src = '';
  task1Blob = task3Blob = null;
  task2Blobs = [];
  phase = null;
});
