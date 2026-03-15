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

const startRecBtn    = document.getElementById('startRecBtn');
const stopRecBtn     = document.getElementById('stopRecBtn');
const playRecBtn     = document.getElementById('playRecBtn');
const downloadRecBtn = document.getElementById('downloadRecBtn');
const player         = document.getElementById('player');
const continueBtn    = document.getElementById('continueBtn');

// ЭЛЕМЕНТЫ ФИНАЛА
const downloadTask1Btn = document.getElementById('downloadTask1Btn');
const downloadTask2Btn = document.getElementById('downloadTask2Btn');
const downloadTask3Btn = document.getElementById('downloadTask3Btn');

// СОСТОЯНИЕ
let currentExam    = 'oge'; // 'oge' | 'ege'
let currentVariant = 1;

let phase = null; // текущая фаза сценария

// ТАЙМЕР
let timerInterval = null;
let timeLeft = 0;

// АУДИОЗАПИСЬ
let mediaRecorder = null;
let audioChunks   = [];
let lastAudioBlob = null;   // последняя webm-запись
let currentStream = null;

// ХРАНЕНИЕ ЗАПИСЕЙ
let task1Blob  = null;    // webm задания 1
let task2Blobs = [];      // webm 6 ответов задания 2
let task3Blob  = null;    // webm задания 3

// ПОКА ЗАГОТОВКА ПОД АУДИО – здесь позже подставите реальные файлы
// Для каждого варианта можно будет задать свои пути
const ogeAudio = {
  1: {
    intro: '',          // 'audio/oge1_intro.mp3'
    task1_text: 'Здесь будет текст для чтения задания 1.',
    task1_prep_time: 60,   // реальное время подготовки
    task1_rec_time: 120,   // реальное время записи

    // 6 вопросов задания 2
    task2_questions: ['', '', '', '', '', ''], // 'audio/oge1_q1.mp3', ...

    task2_rec_time: 40,    // 40 секунд на каждый ответ

    task3_text: 'Здесь будет задание 3 (монолог по плану).',
    task3_prep_time: 90,
    task3_rec_time: 180
  }
};

// === ИНИЦИАЛИЗАЦИЯ ===
startExamBtn.addEventListener('click', () => {
  currentExam = examSelect.value; // 'oge' или 'ege'
  currentVariant = parseInt(variantSelect.value, 10);

  examTitle.textContent = currentExam === 'oge'
    ? `ОГЭ, вариант ${currentVariant}`
    : `ЕГЭ, вариант ${currentVariant}`;

  screenSelect.classList.add('hidden');
  screenExam.classList.remove('hidden');
  screenFinal.classList.add('hidden');

  if (currentExam === 'oge') {
    startOgeFlow();
  } else {
    // Позже можно добавить сценарий ЕГЭ
    alert('Пока реализован только сценарий ОГЭ.');
    startOgeFlow();
  }
});

// === СЦЕНАРИЙ ОГЭ ===
function startOgeFlow() {
  // сбрасываем записи
  task1Blob  = null;
  task2Blobs = [];
  task3Blob  = null;

  // фаза: общая инструкция
  phaseLabel.textContent = 'Инструкция к экзамену';
  phase = 'intro';
  player.style.display = 'none';
  resetButtons();

  const config = ogeAudio[currentVariant];
  taskDiv.textContent = 'Слушайте инструкцию. Затем экзамен начнётся автоматически.';

  if (config.intro) {
    instructionAudio.src = config.intro;
    instructionAudio.onended = () => {
      startTask1Prep();
    };
    instructionAudio.play().catch(e => console.error(e));
  } else {
    // пока нет файла – имитируем 5 сек ожидания
    instructionAudio.removeAttribute('src');
    timeLeft = 5;
    startTimer(() => startTask1Prep());
  }
}

function startTask1Prep() {
  const config = ogeAudio[currentVariant];
  phase = 'task1_prep';
  phaseLabel.textContent = 'Задание 1: подготовка к чтению';
  taskDiv.textContent = config.task1_text + '\n(Сейчас – время на подготовку.)';
  player.style.display = 'none';
  resetButtons();

  timeLeft = config.task1_prep_time || 30;
  startTimer(() => startTask1Rec());
}

function startTask1Rec() {
  const config = ogeAudio[currentVariant];
  phase = 'task1_rec';
  phaseLabel.textContent = 'Задание 1: запись ответа';
  taskDiv.textContent = 'Читайте текст вслух. Запись идёт.';

  player.style.display = 'none';
  resetButtons();

  // Автостарт записи
  startRecording();

  timeLeft = config.task1_rec_time || 60;
  startTimer(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    startTask2Intro();
  });
}

function startTask2Intro() {
  const config = ogeAudio[currentVariant];
  phase = 'task2_intro';
  phaseLabel.textContent = 'Задание 2: ответы на вопросы';
  taskDiv.textContent = 'Сейчас вы услышите 6 вопросов. После каждого вопроса прозвучит сигнал и начнётся запись на 40 секунд.';
  player.style.display = 'none';
  resetButtons();

  // Небольшая пауза, потом первый вопрос
  timeLeft = 5;
  startTimer(() => {
    startTask2Question(0); // индекс 0..5
  });
}

function startTask2Question(index) {
  const config = ogeAudio[currentVariant];
  if (index >= 6) {
    // все 6 вопросов пройдены
    startTask3Prep();
    return;
  }

  phase = `task2_q${index+1}`;
  phaseLabel.textContent = `Задание 2: вопрос ${index + 1}/6`;
  taskDiv.textContent = `Вопрос ${index + 1}. Слушайте вопрос, затем начнётся запись.`;

  player.style.display = 'none';
  resetButtons();

  // Проигрываем аудиовопрос, если есть
  const qSrc = config.task2_questions[index];
  if (qSrc) {
    instructionAudio.src = qSrc;
    instructionAudio.onended = () => {
      startTask2AnswerRecording(index);
    };
    instructionAudio.play().catch(e => console.error(e));
  } else {
    // Пока нет файлов – имитируем вопрос 3 сек, потом запись
    instructionAudio.removeAttribute('src');
    timeLeft = 3;
    startTimer(() => startTask2AnswerRecording(index));
  }
}

function startTask2AnswerRecording(index) {
  const config = ogeAudio[currentVariant];
  phaseLabel.textContent = `Задание 2: ответ на вопрос ${index + 1}`;
  taskDiv.textContent = `Говорите. Время на ответ – ${config.task2_rec_time || 40} секунд.`;

  player.style.display = 'none';
  resetButtons();

  startRecording();

  // фиксированное время записи, без «Продолжить»
  continueBtn.disabled = true;

  timeLeft = config.task2_rec_time || 40;
  startTimer(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    // после остановки запись попадёт в task2Blobs
    // запускаем следующий вопрос
    startTask2Question(index + 1);
  });
}

function startTask3Prep() {
  const config = ogeAudio[currentVariant];
  phase = 'task3_prep';
  phaseLabel.textContent = 'Задание 3: подготовка к монологу';
  taskDiv.textContent = config.task3_text + '\n(Сейчас – время на подготовку.)';

  player.style.display = 'none';
  resetButtons();

  timeLeft = config.task3_prep_time || 60;
  startTimer(() => startTask3Rec());
}

function startTask3Rec() {
  const config = ogeAudio[currentVariant];
  phase = 'task3_rec';
  phaseLabel.textContent = 'Задание 3: запись ответа';
  taskDiv.textContent = 'Говорите монолог. Запись идёт.';

  player.style.display = 'none';
  resetButtons();

  // автостарт записи
  startRecording();

  // можно завершить досрочно
  continueBtn.disabled = false;

  timeLeft = config.task3_rec_time || 120;
  startTimer(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    finishExam();
  });
}

function finishExam() {
  phase = 'finished';
  clearInterval(timerInterval);
  timerDiv.textContent = '00:00';

  screenExam.classList.add('hidden');
  screenFinal.classList.remove('hidden');

  // Активируем кнопки скачивания, если есть записи
  downloadTask1Btn.disabled = !task1Blob;
  downloadTask2Btn.disabled = task2Blobs.length !== 6;
  downloadTask3Btn.disabled = !task3Blob;
}

// === ТАЙМЕР С КОЛБЭКОМ ===
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

function resetButtons() {
  startRecBtn.disabled    = true;
  stopRecBtn.disabled     = true;
  playRecBtn.disabled     = true;
  downloadRecBtn.disabled = true;
  continueBtn.disabled    = true;
  player.style.display    = 'none';
  player.src              = '';
  lastAudioBlob           = null;
}

// === ЗАПИСЬ (общая функция автостарта) ===
async function startRecording() {
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
      if (!audioChunks.length) return;

      lastAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });

      const url = URL.createObjectURL(lastAudioBlob);
      player.src = url;
      player.style.display = 'block';

      playRecBtn.disabled     = false;
      downloadRecBtn.disabled = false;
      startRecBtn.disabled    = false;
      stopRecBtn.disabled     = true;
      continueBtn.disabled    = false;

      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
      }

      // сохраняем blob в нужное место
      if (phase === 'task1_rec') {
        task1Blob = lastAudioBlob;
      } else if (phase.startsWith('task2_q')) {
        task2Blobs.push(lastAudioBlob);
      } else if (phase === 'task3_rec') {
        task3Blob = lastAudioBlob;
      }
    };

    mediaRecorder.start();
    startRecBtn.disabled    = true;
    stopRecBtn.disabled     = false;
    playRecBtn.disabled     = true;
    downloadRecBtn.disabled = true;
    continueBtn.disabled    = false;
  } catch (err) {
    alert('Не удалось получить доступ к микрофону.');
    console.error(err);
  }
}

// РУЧНОЕ УПРАВЛЕНИЕ
stopRecBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
});

continueBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
});

playRecBtn.addEventListener('click', () => {
  if (!lastAudioBlob) {
    alert('Сначала запишите ответ.');
    return;
  }
  player.play().catch(e => console.error(e));
});

// === КОНВЕРТАЦИЯ В MP3 ДЛЯ ФИНАЛА ===
downloadTask1Btn.addEventListener('click', async () => {
  if (!task1Blob) return;
  const mp3Blob = await convertWebmToMp3(task1Blob);
  downloadBlob(mp3Blob, 'oge_task1.mp3');
});

downloadTask2Btn.addEventListener('click', async () => {
  if (task2Blobs.length !== 6) return;
  // склеиваем 6 webm в один mp3
  const mp3Blob = await convertMultipleWebmToMp3(task2Blobs);
  downloadBlob(mp3Blob, 'oge_task2_all.mp3');
});

downloadTask3Btn.addEventListener('click', async () => {
  if (!task3Blob) return;
  const mp3Blob = await convertWebmToMp3(task3Blob);
  downloadBlob(mp3Blob, 'oge_task3.mp3');
});

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ MP3 ===
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// одна запись webm -> mp3
async function convertWebmToMp3(webmBlob) {
  const arrayBuffer = await webmBlob.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0); // mono
  const sampleRate  = audioBuffer.sampleRate;
  const mp3Encoder  = new lamejs.Mp3Encoder(1, sampleRate, 128);
  const sampleBlockSize = 1152;
  const mp3Data = [];

  const samples = new Int16Array(channelData.length);
  for (let i = 0; i < channelData.length; i++) {
    let s = Math.max(-1, Math.min(1, channelData[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  for (let i = 0; i < samples.length; i += sampleBlockSize) {
    const sampleChunk = samples.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }

  const end = mp3Encoder.flush();
  if (end.length > 0) mp3Data.push(end);

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

// несколько webm подряд -> один mp3
async function convertMultipleWebmToMp3(webmBlobs) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Декодируем все webm в AudioBuffer и склеиваем в один Float32Array
  const buffers = [];
  let totalLength = 0;
  let sampleRate = 44100;

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

  // Кодируем merged в mp3
  const mp3Encoder  = new lamejs.Mp3Encoder(1, sampleRate, 128);
  const sampleBlockSize = 1152;
  const mp3Data = [];

  const samples = new Int16Array(merged.length);
  for (let i = 0; i < merged.length; i++) {
    let s = Math.max(-1, Math.min(1, merged[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  for (let i = 0; i < samples.length; i += sampleBlockSize) {
    const sampleChunk = samples.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }

  const end = mp3Encoder.flush();
  if (end.length > 0) mp3Data.push(end);

  return new Blob(mp3Data, { type: 'audio/mp3' });
}
