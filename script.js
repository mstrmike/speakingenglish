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
let currentExam    = 'oge';
let currentVariant = 1;
let phase          = null;

// ТАЙМЕР
let timerInterval = null;
let timeLeft      = 0;

// АУДИОЗАПИСЬ
let mediaRecorder = null;
let audioChunks   = [];
let lastAudioBlob = null;
let currentStream = null;

// ЗАПИСИ
let task1Blob  = null;   // webm задания 1
let task2Blobs = [];     // webm 6 ответов задания 2
let task3Blob  = null;   // webm задания 3

// ПРОСТАЯ КОНФИГУРАЦИЯ ОГЭ, ВАРИАНТ 1 (пока заглушки)
const ogeAudio = {
  1: {
    intro: '',
    task1_text: 'Текст для чтения задания 1 (заглушка).',
    task1_prep_time: 10,
    task1_rec_time: 15,
    task2_questions: ['', '', '', '', '', ''],
    task2_rec_time: 5,
    task3_text: 'Задание 3 (монолог, заглушка).',
    task3_prep_time: 10,
    task3_rec_time: 15
  }
};

// НАЧАЛО ЭКЗАМЕНА
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

// СЦЕНАРИЙ ОГЭ (верхнеуровневые функции)

function startOgeFlow() {
  task1Blob  = null;
  task2Blobs = [];
  task3Blob  = null;
  startIntro();
}

function startIntro() {
  phase = 'intro';
  phaseLabel.textContent = 'Инструкция к экзамену';
  taskDiv.textContent    = 'Слушайте инструкцию (пока заглушка 5 секунд).';
  resetButtons();
  player.style.display = 'none';

  timeLeft = 5;
  startTimer(startTask1Prep);
}

function startTask1Prep() {
  const cfg = ogeAudio[currentVariant];
  phase = 'task1_prep';
  phaseLabel.textContent = 'Задание 1: подготовка';
  taskDiv.textContent    = cfg.task1_text + '\nВремя на подготовку.';
  resetButtons();
  player.style.display = 'none';

  timeLeft = cfg.task1_prep_time;
  startTimer(startTask1Rec);
}

function startTask1Rec() {
  const cfg = ogeAudio[currentVariant];
  phase = 'task1_rec';
  phaseLabel.textContent = 'Задание 1: запись';
  taskDiv.textContent    = 'Читайте текст вслух. Идёт запись.';
  resetButtons();
  player.style.display = 'none';

  startRecording();
  timeLeft = cfg.task1_rec_time;
  startTimer(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    startTask2Intro();
  });
}

function startTask2Intro() {
  const cfg = ogeAudio[currentVariant];
  phase = 'task2_intro';
  phaseLabel.textContent = 'Задание 2: ответы на вопросы';
  taskDiv.textContent    = 'Сейчас будет 6 вопросов (заглушка).';
  resetButtons();
  player.style.display = 'none';

  timeLeft = 5;
  startTimer(() => startTask2Question(0));
}

function startTask2Question(index) {
  const cfg = ogeAudio[currentVariant];
  if (index >= 6) {
    startTask3Prep();
    return;
  }

  phase = `task2_q${index + 1}`;
  phaseLabel.textContent = `Задание 2: вопрос ${index + 1}/6`;
  taskDiv.textContent    = `Вопрос ${index + 1} (заглушка 3 секунды), потом запись.`;
  resetButtons();
  player.style.display = 'none';

  timeLeft = 3;
  startTimer(() => startTask2AnswerRecording(index));
}

function startTask2AnswerRecording(index) {
  const cfg = ogeAudio[currentVariant];
  phaseLabel.textContent = `Задание 2: ответ на вопрос ${index + 1}`;
  taskDiv.textContent    = `Говорите. Время на ответ ${cfg.task2_rec_time} секунд.`;
  resetButtons();
  player.style.display = 'none';

  startRecording();
  timeLeft = cfg.task2_rec_time;
  startTimer(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    startTask2Question(index + 1);
  });
}

function startTask3Prep() {
  const cfg = ogeAudio[currentVariant];
  phase = 'task3_prep';
  phaseLabel.textContent = 'Задание 3: подготовка';
  taskDiv.textContent    = cfg.task3_text + '\nВремя на подготовку.';
  resetButtons();
  player.style.display = 'none';

  timeLeft = cfg.task3_prep_time;
  startTimer(startTask3Rec);
}

function startTask3Rec() {
  const cfg = ogeAudio[currentVariant];
  phase = 'task3_rec';
  phaseLabel.textContent = 'Задание 3: запись';
  taskDiv.textContent    = 'Говорите монолог. Идёт запись.';
  resetButtons();
  player.style.display = 'none';

  startRecording();
  timeLeft = cfg.task3_rec_time;
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

  // Активируем кнопки, если есть записи
  downloadTask1Btn.disabled = !task1Blob;
  downloadTask2Btn.disabled = task2Blobs.length !== 6;
  downloadTask3Btn.disabled = !task3Blob;
}

// ТАЙМЕР

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

// ЗАПИСЬ

async function startRecording() {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(t => t.stop());
    }
    currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(currentStream, { mimeType: 'audio/webm' });
    audioChunks   = [];
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
      stopRecBtn.disabled     = true;

      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
      }

      // сохраняем blob по фазе
      if (phase === 'task1_rec') {
        task1Blob = lastAudioBlob;
      } else if (phase && phase.startsWith('task2_q')) {
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

// СКАЧАТЬ ТЕКУЩУЮ ЗАПИСЬ (WEBM) С ЭКРАНА ЭКЗАМЕНА
downloadRecBtn.addEventListener('click', () => {
  if (!lastAudioBlob) {
    alert('Нет записи для сохранения.');
    return;
  }
  const url = URL.createObjectURL(lastAudioBlob);
  const a   = document.createElement('a');
  let filename = 'answer.webm';

  if (phase === 'task1_rec') {
    filename = 'oge_task1.webm';
  } else if (phase && phase.startsWith('task2_q')) {
    const idx = task2Blobs.length;
    filename  = `oge_task2_q${idx}.webm`;
  } else if (phase === 'task3_rec') {
    filename = 'oge_task3.webm';
  }

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// ВСПОМОГАТЕЛЬНО: СКАЧАТЬ BLOB (будет использоваться позже для MP3)
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
