// Общие DOM-элементы (один раз)
const screenStart = document.getElementById('screen-start');
const screenExam  = document.getElementById('screen-exam');
const screenFinal = document.getElementById('screen-final');

const lastNameInput  = document.getElementById('lastName');
const firstNameInput = document.getElementById('firstName');
const classNameInput = document.getElementById('className');
const examSelect     = document.getElementById('examSelect');
const variantSelect  = document.getElementById('variantSelect');
const startExamBtn   = document.getElementById('startExamBtn');

const examTitle      = document.getElementById('examTitle');
const phaseLabel     = document.getElementById('phaseLabel');
const taskDiv        = document.getElementById('task');
const timerDiv       = document.getElementById('timer');
const actionBtn      = document.getElementById('actionBtn');
const questionPlayer = document.getElementById('questionPlayer');

const playDownload1Btn = document.getElementById('playDownload1Btn');
const playDownload2Btn = document.getElementById('playDownload2Btn');
const playDownload3Btn = document.getElementById('playDownload3Btn');
const playDownload4Btn = document.getElementById('playDownload4Btn'); // для ЕГЭ 4 задания
const finalPlayer      = document.getElementById('finalPlayer');
const backBtn          = document.getElementById('backBtn');

// Глобальные данные о студенте и выбранном варианте
let studentLastName  = '';
let studentFirstName = '';
let studentClass     = '';
let currentExam      = 'oge';
let currentVariant   = 1;
let currentConfig    = null;

// Текущий "движок" экзамена (объект OgeEngine или EgeEngine)
let examEngine = null;

// ==== заполняем варианты по экзамену ====

function populateVariants() {
  const examKey = examSelect.value; // 'oge' | 'ege'
  const examBank = TASK_BANK[examKey] || {};
  variantSelect.innerHTML = '';
  Object.keys(examBank).forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = `Вариант ${v}`;
    variantSelect.appendChild(opt);
  });
}

examSelect.addEventListener('change', populateVariants);
populateVariants();

// ==== старт экзамена ====

startExamBtn.addEventListener('click', async () => {
  studentLastName  = (lastNameInput.value  || '').trim();
  studentFirstName = (firstNameInput.value || '').trim();
  studentClass     = (classNameInput.value || '').trim();

  if (!studentLastName || !studentFirstName || !studentClass) {
    alert('Введите фамилию, имя и класс.');
    return;
  }

  currentExam    = examSelect.value;          // 'oge' или 'ege'
  currentVariant = parseInt(variantSelect.value, 10) || 1;

  const examBank = TASK_BANK[currentExam];
  if (!examBank || !examBank[currentVariant]) {
    alert('Для выбранного экзамена и варианта нет заданий.');
    return;
  }
  currentConfig = examBank[currentVariant];

  // запрос микрофона один раз, дальше движки используют общий stream
  let micStream;
  try {
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

  // создаём нужный движок
  const sharedContext = {
    screenExam,
    screenFinal,
    examTitle,
    phaseLabel,
    taskDiv,
    timerDiv,
    actionBtn,
    questionPlayer,
    playDownload1Btn,
    playDownload2Btn,
    playDownload3Btn,
    playDownload4Btn,
    finalPlayer,
    backBtn,
    studentLastName,
    studentFirstName,
    studentClass,
    currentExam,
    currentVariant,
    config: currentConfig,
    micStream
  };

  if (currentExam === 'oge') {
    examEngine = new OgeEngine(sharedContext);
  } else {
    examEngine = new EgeEngine(sharedContext);
  }

  examEngine.start();
});

// проброс кликов с общей кнопки в движок
actionBtn.addEventListener('click', () => {
  if (examEngine && typeof examEngine.handleAction === 'function') {
    examEngine.handleAction();
  }
});

// кнопки финала → в движок
playDownload1Btn.addEventListener('click', () => examEngine && examEngine.playDownloadTask1());
playDownload2Btn.addEventListener('click', () => examEngine && examEngine.playDownloadTask2());
playDownload3Btn.addEventListener('click', () => examEngine && examEngine.playDownloadTask3());
if (playDownload4Btn) {
  playDownload4Btn.addEventListener('click', () => examEngine && examEngine.playDownloadTask4 && examEngine.playDownloadTask4());
}

// возврат на старт
backBtn.addEventListener('click', () => {
  if (examEngine && typeof examEngine.reset === 'function') {
    examEngine.reset();
  }
  screenFinal.classList.add('hidden');
  screenStart.classList.remove('hidden');
  finalPlayer.src = '';
  examEngine = null;
});
