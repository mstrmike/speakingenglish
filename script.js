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

// ===== СЦЕНАРИЙ ОГЭ =====

function startOgeFlow() {
  task1Blob  = null;
  task2Blobs = [];
  task3Blob  = null;
  startIntro();
}

function startIntro() {
  phase = 'intro';
  phaseLabel.textContent = 'Инструкция к экзамену';
  taskDiv.textContent    = 'Слушайте инструкцию (заглушка 5 секунд).';
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

  // автостарт записи
  startRecording(() => {
    // колбэк после onstop
    startTask2Intro();
  });

  timeLeft = cfg.task1_rec_time;
  startTimer(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
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

  startRecording(() => {
    startTask2Question(index + 1);
  });

  timeLeft = cfg.task2_rec_time;
  startTimer(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
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

  startRecording(() => {
    finishExam();
  });

  timeLeft = cfg.task3_rec_time;
  startTimer(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  });
}

function finishExam() {
  phase = 'finished';
  clearInterval(timerInterval);
  timerDiv.textContent = '00:00';

  screenExam.classList.add('hidden');
  screenFinal.classList.remove('hidden');

  downloadTask1Btn.disabled = !task1Blob;
  downloadTask2Btn.disabled = task2Blobs.length !== 6;
  downloadTask3Btn.disabled = !task3Blob;
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

// ===== ЗАПИСЬ =====
// onStoppedCallback вызывается после того, как запись сохранена (onstop)

async function startRecording(onStoppedCallback) {
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

      // во время экзамена НЕ показываем плеер, не даём слушать
      player.src = '';
      player.style.display = 'none';

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

      // после сохранения – вызываем переход к следующему этапу
      if (typeof onStoppedCallback === 'function') {
        onStoppedCallback();
      }
    };

    mediaRecorder.start();
    startRecBtn.disabled    = true;
    stopRecBtn.disabled     = false; // можно оставить или убрать
    playRecBtn.disabled     = true;
    downloadRecBtn.disabled = true;
    continueBtn.disabled    = false; // "Продолжить" доступна
  } catch (err) {
    alert('Не удалось получить доступ к микрофону.');
    console.error(err);
  }
}

// РУЧНОЙ СТОП (опциональный)
stopRecBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
});

// "Продолжить" – досрочно завершает запись и сразу переводит дальше
continueBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    clearInterval(timerInterval);

    // переход зависит от фазы
    if (phase === 'task1_rec') {
      // onStoppedCallback уже вызовет startTask2Intro, поэтому ничего не делаем
    } else if (phase && phase.startsWith('task2_q')) {
      // здесь onStoppedCallback уже вызывает startTask2Question(next)
    } else if (phase === 'task3_rec') {
      // onStoppedCallback вызовет finishExam
    }
  }
});

// Плеер в процессе экзамена не используется
playRecBtn.addEventListener('click', () => {
  alert('Прослушивание доступно только после экзамена.');
});

// ===== СКАЧИВАНИЕ НА ФИНАЛЬНОМ ЭКРАНЕ (WEBM) =====

downloadTask1Btn.addEventListener('click', () => {
  if (!task1Blob) return;
  downloadBlob(task1Blob, 'oge_task1.webm');
});

downloadTask2Btn.addEventListener('click', () => {
  if (task2Blobs.length !== 6) {
    alert('Записаны не все 6 ответов задания 2.');
    return;
  }
  // Пока просто скачиваем 6 отдельных файлов вебм
  task2Blobs.forEach((blob, index) => {
    downloadBlob(blob, `oge_task2_q${index + 1}.webm`);
  });
});

downloadTask3Btn.addEventListener('click', () => {
  if (!task3Blob) return;
  downloadBlob(task3Blob, 'oge_task3.webm');
});

// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ СКАЧИВАНИЯ BLOB
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
