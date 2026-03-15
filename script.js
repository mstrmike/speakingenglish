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
let
