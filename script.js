// ===== НАСТРОЙКА ДОСТУПА =====

// Пример секретного кода. Поменяй на свой.
const PREMIUM_ACCESS_CODE = 'SPEAK2026';

// читаем статус из localStorage
let isPremiumUser = localStorage.getItem('isPremiumUser') === 'true';

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

// элементы интерфейса кода доступа
const premiumCodeInput    = document.getElementById('premiumCodeInput');
const applyPremiumCodeBtn = document.getElementById('applyPremiumCodeBtn');
const premiumStatus       = document.getElementById('premiumStatus');

if (premiumStatus) {
  premiumStatus.textContent = isPremiumUser
    ? 'Премиум-доступ уже активирован на этом устройстве.'
    : 'Премиум-варианты будут открыты после ввода кода.';
}

// состояние выбора
let studentLastName  = '';
let studentFirstName = '';
let studentClass     = '';
let currentExam      = 'oge';   // 'oge' | 'ege'
let currentVariantId = null;    // строка вида "free:1" или "premium:3"
let currentConfig    = null;

let examEngine = null;


// ===== Вспомогательные функции для free/premium =====

function getAvailableVariantsForExam(examKey) {
  const examBank = TASK_BANK[examKey] || {};
  const free     = examBank.free     || {};
  const premium  = examBank.premium  || {};

  const result = [];

  Object.keys(free).sort((a,b) => Number(a)-Number(b)).forEach(num => {
    result.push({
      id: `free:${num}`,
      label: `Бесплатный вариант ${num}`,
      group: 'free',
      num,
      config: free[num]
    });
  });

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

function getConfigByVariantId(examKey, variantId) {
  const [group, numStr] = String(variantId).split(':');
  const num = Number(numStr);
  const examBank = TASK_BANK[examKey] || {};
  const groupBank = examBank[group] || {};
  return groupBank[num] || null;
}


// ===== Заполнение select с вариантами =====

function populateVariants() {
  const examKey = examSelect.value;
  const variants = getAvailableVariantsForExam(examKey);

  const prev = variantSelect.value;

  variantSelect.innerHTML = '';

  if (!variants.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Нет доступных вариантов';
    variantSelect.appendChild(opt);
    currentVariantId = null;
    return;
  }

  variants.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = v.label;
    variantSelect.appendChild(opt);
  });

  const stillExists = variants.some(v => v.id === prev);
  variantSelect.value = stillExists ? prev : variants[0].id;
  currentVariantId = variantSelect.value;
}

examSelect.addEventListener('change', populateVariants);
variantSelect.addEventListener('change', () => {
  currentVariantId = variantSelect.value;
});


// ===== Активация премиум-кода =====

if (applyPremiumCodeBtn) {
  applyPremiumCodeBtn.addEventListener('click', () => {
    const code = (premiumCodeInput.value || '').trim();
    if (!code) {
      alert('Введите код.');
      return;
    }

    if (code === PREMIUM_ACCESS_CODE) {
      isPremiumUser = true;
      localStorage.setItem('isPremiumUser', 'true');
      if (premiumStatus) {
        premiumStatus.style.color = 'green';
        premiumStatus.textContent = 'Премиум-доступ активирован. Премиум-варианты доступны в списке.';
      }
      populateVariants();
    } else {
      isPremiumUser = false;
      localStorage.setItem('isPremiumUser', 'false');
      if (premiumStatus) {
        premiumStatus.style.color = 'red';
        premiumStatus.textContent = 'Неверный код доступа. Попробуйте ещё раз.';
      }
      populateVariants();
    }
  });
}

// Инициализация вариантов при загрузке
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

  currentExam    = examSelect.value;
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
    currentVariant: num,
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
