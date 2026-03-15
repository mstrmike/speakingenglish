// ===== НАСТРОЙКА ДОСТУПА =====

// Пока просто флаг. Потом здесь можно будет подставлять результат проверки кода / подписки.
let isPremiumUser = false;

// Пример: временно включить премиум для теста
// isPremiumUser = true;


// ===== DOM-элементы =====

const screenStart = document.getElementById('screen-start');
const screenExam  = document.getElementById('screen-exam');
const screenFinal = document.getElementById('screen-final');

const lastNameInput  = document.getElementById('lastName');
const firstNameInput = document.getElementById('firstName');
const classNameInput = document.getElementById('className');

const examSelect    = document.getElementById('examSelect');
const variantSelect = document.getElementById('variantSelect');
const startExamBtn  = document.getElementById('startExamBtn');

const examTitle      = document.getElementById('examTitle');
const phaseLabel     = document.getElementById('phaseLabel');
const taskDiv        = document.getElementById('task');
const timerDiv       = document.getElementById('timer');
const actionBtn      = document.getElementById('actionBtn');
const questionPlayer = document.getElementById('questionPlayer');
const beepPlayer     = document.getElementById('beepPlayer');
const startSpeakingPlayer = document.getElementById('startSpeakingPlayer');

const playDownload1Btn = document.getElementById('playDownload1Btn');
const playDownload2Btn = document.getElementById('playDownload2Btn');
const playDownload3Btn = document.getElementById('playDownload3Btn');
const playDownload4Btn = document.getElementById('playDownload4Btn');
const finalPlayer      = document.getElementById('finalPlayer');
const backBtn          = document.getElementById('backBtn');

// состояние выбора
let studentLastName  = '';
let studentFirstName = '';
let studentClass     = '';
let currentExam      = 'oge';   // 'oge' | 'ege'
let currentVariantId = null;    // строка вида "free:1" или "premium:3"
let currentConfig    = null;

let examEngine = null;


// ===== Вспомогательные функции для free/premium =====

// Собрать список доступных вариантов для экзамена с учётом isPremiumUser
function getAvailableVariantsForExam(examKey) {
  const examBank = TASK_BANK[examKey] || {};
  const free     = examBank.free     || {};
  const premium  = examBank.premium  || {};

  const result = [];

  // сначала free
  Object.keys(free).sort((a,b) => Number(a)-Number(b)).forEach(num => {
    result.push({
      id: `free:${num}`,
      label: `Бесплатный вариант ${num}`,
      group: 'free',
      num,
      config: free[num]
    });
  });

  // если есть премиум-доступ – добавляем premium
  if (isPremiumUser) {
    Object.keys(premium).sort((a,b) => Number(a)-Number(b)).forEach(num => {
      result.push({
        id: `premium:${num}`,
        label: `Премиум вариант ${num}`,
        group: 'premium',
        num,
        config: premium[num]
      });
    });
  }

  return result;
}

// Получить конфиг по id вида "free:1" / "premium:3"
function getConfigByVariantId(examKey, variantId) {
  const [group, numStr] = String(variantId).split(':');
  const num = Number(numStr);
  const examBank = TASK_BANK[examKey] || {};
  const groupBank = examBank[group] || {};
  return groupBank[num] || null;
}


// ===== Заполнение select с вариантами =====

function populateVariants() {
  const examKey = examSelect.value; // 'oge' или 'ege'
  const variants = getAvailableVariantsForExam(examKey);

  variantSelect.innerHTML = '';

  if (!variants.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Нет доступных вариантов';
    variantSelect.appendChild(opt);
    return;
  }

  variants.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.id;     // free:1 / premium:3
    opt.textContent = v.label;
    variantSelect.appendChild(opt);
  });

  // по умолчанию выбираем первый доступный вариант
  currentVariantId = variants[0].id;
}

examSelect.addEventListener('change', populateVariants);
variantSelect.addEventListener('change', () => {
  currentVariantId = variantSelect.value;
});

// При загрузке страницы
populateVariants();


// ===== Старт экзамена =====

startExamBtn.addEventListener('click', async () => {
  studentLastName  = (lastNameInput.value  || '').trim();
  studentFirstName = (firstNameInput.value || '').trim();
  studentClass     = (classNameInput.value || '').trim();

  if (!studentLastName || !studentFirstName || !studentClass) {
    alert('Введите фамилию, имя и класс.');
    return;
  }

  currentExam    = examSelect.value;          // 'oge'|'ege'
  currentVariantId = variantSelect.value || currentVariantId;

  const config = getConfigByVariantId(currentExam, currentVariantId);
  if (!config) {
    alert('Для выбранного экзамена и варианта нет заданий (или нет доступа).');
    return;
  }
  currentConfig = config;

  let micStream;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    alert('Нет доступа к микрофону. Разрешите использование микрофона.');
    console.error(e);
    return;
  }

  // Человекочитаемый заголовок
  const [group, numStr] = String(currentVariantId).split(':');
  const num = Number(numStr);
  const groupTitle = group === 'free' ? 'бесплатный' : 'премиум';
  examTitle.textContent = `${currentExam.toUpperCase()}, ${groupTitle} вариант ${num}`;

  screenStart.classList.add('hidden');
  screenExam.classList.remove('hidden');
  screenFinal.classList.add('hidden');

  const ctx = {
    screenExam,
    screenFinal,
    examTitle,
    phaseLabel,
    taskDiv,
    timerDiv,
    actionBtn,
    questionPlayer,
    beepPlayer,
    startSpeakingPlayer,
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
    currentVariant: num,      // только номер варианта для названия файлов
    config: currentConfig,
    micStream
  };

  if (currentExam === 'oge') {
    examEngine = new OgeEngine(ctx);
  } else {
    examEngine = new EgeEngine(ctx);
  }
  examEngine.start();
});


// ===== Проброс кнопок =====

actionBtn.addEventListener('click', () => {
  if (examEngine && typeof examEngine.handleAction === 'function') {
    examEngine.handleAction();
  }
});

playDownload1Btn.addEventListener('click', () => {
  examEngine && examEngine.playDownloadTask1 && examEngine.playDownloadTask1();
});
playDownload2Btn.addEventListener('click', () => {
  examEngine && examEngine.playDownloadTask2 && examEngine.playDownloadTask2();
});
playDownload3Btn.addEventListener('click', () => {
  examEngine && examEngine.playDownloadTask3 && examEngine.playDownloadTask3();
});
playDownload4Btn.addEventListener('click', () => {
  examEngine && examEngine.playDownloadTask4 && examEngine.playDownloadTask4();
});

backBtn.addEventListener('click', () => {
  if (examEngine && examEngine.reset) examEngine.reset();
  examEngine = null;
  screenFinal.classList.add('hidden');
  screenStart.classList.remove('hidden');
  finalPlayer.src = '';
});
