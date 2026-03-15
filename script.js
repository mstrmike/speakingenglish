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
  p

