class BaseEngine {
  constructor(ctx) { Object.assign(this, ctx); this.timer = null; this.mediaRecorder = null; this.audioChunks = []; this.cueRunning = false; }
  updateTimer(seconds) { const m = Math.max(0, Math.floor(seconds / 60)); const s = Math.max(0, seconds % 60); this.timerDiv.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }
  clearTimer() { if (this.timer) clearInterval(this.timer); this.timer = null; }
  beginTimer(seconds, done) { this.clearTimer(); this.timeLeft = seconds; this.updateTimer(seconds); this.timer = setInterval(() => { this.timeLeft--; this.updateTimer(this.timeLeft); if (this.timeLeft <= 0) { this.clearTimer(); done(); } }, 1000); }
  hideAction() { this.actionBtn.classList.add('hidden'); this.actionBtn.disabled = true; }
  showStop(text) { this.actionBtn.textContent = text; this.actionBtn.disabled = false; this.actionBtn.classList.remove('hidden'); }
  stopQuestion() { this.questionPlayer.onended = null; this.questionPlayer.onerror = null; this.questionPlayer.pause(); this.questionPlayer.removeAttribute('src'); this.questionPlayer.load(); this.questionPlayer.style.display = 'none'; }
  runCue(next) {
    if (this.cueRunning) return;
    this.cueRunning = true; this.hideAction();
    const play = (el, after) => { if (!el) return after(); el.onended = null; el.currentTime = 0; el.onended = () => { el.onended = null; after(); }; el.play().catch(() => after()); };
    play(this.startSpeakingPlayer, () => play(this.beepPlayer, () => { this.cueRunning = false; next(); }));
  }
  playQuestion(src, fallback, next) {
    this.stopQuestion();
    if (!src) return fallback();
    const player = this.questionPlayer; player.src = src; player.style.display = 'block';
    player.onended = () => { this.stopQuestion(); this.runCue(next); };
    player.onerror = () => { this.stopQuestion(); fallback(); };
    player.play().catch(() => { this.stopQuestion(); fallback(); });
  }
  startRecording(onStopped) {
    try {
      const preferred = ['audio/webm;codecs=opus', 'audio/webm'];
      const mimeType = preferred.find(type => window.MediaRecorder && MediaRecorder.isTypeSupported(type));
      this.mediaRecorder = mimeType ? new MediaRecorder(this.micStream, { mimeType }) : new MediaRecorder(this.micStream);
      this.audioChunks = [];
      this.mediaRecorder.ondataavailable = e => { if (e.data?.size) this.audioChunks.push(e.data); };
      this.mediaRecorder.onstop = () => { const type = this.mediaRecorder.mimeType || 'audio/webm'; const blob = new Blob(this.audioChunks, { type }); if (blob.size) onStopped(blob); };
      this.mediaRecorder.start();
    } catch (error) { console.error(error); alert('Не удалось начать запись. Проверьте доступ к микрофону.'); }
  }
  stopRecording() { if (this.mediaRecorder?.state === 'recording') this.mediaRecorder.stop(); }
  fioPrefix() { return `${this.studentLastName || 'Student'}_${this.studentFirstName || 'Name'}_${this.studentClass || 'Class'}_var${this.currentVariant}`.replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '_'); }
  downloadBlob(blob, filename) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  async convertWebmToMp3(blob) {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const audio = await context.decodeAudioData(await blob.arrayBuffer());
    const source = audio.getChannelData(0); const pcm = new Int16Array(source.length);
    for (let i = 0; i < source.length; i++) { const x = Math.max(-1, Math.min(1, source[i])); pcm[i] = x < 0 ? x * 0x8000 : x * 0x7fff; }
    const encoder = new lamejs.Mp3Encoder(1, audio.sampleRate, 128); const out = []; const block = 1152;
    for (let i = 0; i < pcm.length; i += block) { const part = encoder.encodeBuffer(pcm.subarray(i, i + block)); if (part.length) out.push(part); }
    const end = encoder.flush(); if (end.length) out.push(end); await context.close(); return new Blob(out, { type: 'audio/mpeg' });
  }
  async convertMultipleWebmToMp3(blobs) {
    const context = new (window.AudioContext || window.webkitAudioContext)(); const audios = [];
    for (const blob of blobs) audios.push(await context.decodeAudioData(await blob.arrayBuffer()));
    const rate = audios[0].sampleRate; const total = audios.reduce((n, audio) => n + audio.length, 0); const merged = new Float32Array(total); let offset = 0;
    for (const audio of audios) { merged.set(audio.getChannelData(0), offset); offset += audio.length; }
    const temp = new Blob([new Uint8Array(0)]); // keeps conversion logic explicit
    const pcm = new Int16Array(merged.length); for (let i = 0; i < merged.length; i++) { const x = Math.max(-1, Math.min(1, merged[i])); pcm[i] = x < 0 ? x * 0x8000 : x * 0x7fff; }
    const encoder = new lamejs.Mp3Encoder(1, rate, 128); const out = []; for (let i = 0; i < pcm.length; i += 1152) { const part = encoder.encodeBuffer(pcm.subarray(i, i + 1152)); if (part.length) out.push(part); }
    const end = encoder.flush(); if (end.length) out.push(end); await context.close(); return new Blob(out, { type: 'audio/mpeg' });
  }
  async playAndDownload(blob, filename) { const url = URL.createObjectURL(blob); this.finalPlayer.src = url; await this.finalPlayer.play().catch(() => {}); this.downloadBlob(blob, filename); }
  reset() { this.clearTimer(); this.stopQuestion(); this.stopRecording(); this.finalPlayer.src = ''; this.hideAction(); window.EmailSender?.disable(); }
}

const $ = id => document.getElementById(id);
const screenStart = $('screen-start'), screenExam = $('screen-exam'), screenFinal = $('screen-final');
const lastNameInput = $('lastName'), firstNameInput = $('firstName'), classNameInput = $('className');
const examSelect = $('examSelect'), variantSelect = $('variantSelect'), startExamBtn = $('startExamBtn');
const premiumCodeInput = $('premiumCodeInput'), applyPremiumCodeBtn = $('applyPremiumCodeBtn'), premiumStatus = $('premiumStatus');
let isPremiumUser = localStorage.getItem('isPremiumUser') === 'true'; let examEngine = null;
const PREMIUM_ACCESS_CODE = 'SPEAK2026';
function variants(exam) { const bank = TASK_BANK[exam] || {}; const list = []; for (const [n, config] of Object.entries(bank.free || {})) list.push({ id:`free:${n}`, label:`Бесплатный вариант ${n}`, config }); if (isPremiumUser) for (const [n, config] of Object.entries(bank.premium || {})) list.push({ id:`premium:${n}`, label:`Премиум вариант ${n}`, config }); return list.sort((a,b) => Number(a.id.split(':')[1]) - Number(b.id.split(':')[1])); }
function populateVariants() { const list = variants(examSelect.value); const previous = variantSelect.value; variantSelect.innerHTML = ''; list.forEach(v => { const o = document.createElement('option'); o.value = v.id; o.textContent = v.label; variantSelect.appendChild(o); }); variantSelect.value = list.some(v => v.id === previous) ? previous : list[0]?.id || ''; }
function statusPremium() { premiumStatus.textContent = isPremiumUser ? 'Премиум-доступ активирован на этом устройстве.' : 'Премиум-варианты откроются после ввода кода.'; premiumStatus.style.color = isPremiumUser ? 'green' : '#555'; }
examSelect.addEventListener('change', populateVariants); statusPremium(); populateVariants();
applyPremiumCodeBtn.addEventListener('click', () => { if ((premiumCodeInput.value || '').trim() !== PREMIUM_ACCESS_CODE) { premiumStatus.textContent = 'Неверный код доступа.'; premiumStatus.style.color = 'crimson'; return; } isPremiumUser = true; localStorage.setItem('isPremiumUser', 'true'); premiumCodeInput.value = ''; statusPremium(); populateVariants(); });
startExamBtn.addEventListener('click', async () => {
  const studentLastName = lastNameInput.value.trim(), studentFirstName = firstNameInput.value.trim(), studentClass = classNameInput.value.trim();
  if (!studentLastName || !studentFirstName || !studentClass) return alert('Введите фамилию, имя и класс.');
  const selected = variants(examSelect.value).find(v => v.id === variantSelect.value); if (!selected) return alert('Выберите доступный вариант.');
  let micStream; try { micStream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (error) { console.error(error); return alert('Разрешите доступ к микрофону.'); }
  const [, n] = selected.id.split(':'); const ctx = { screenExam, screenFinal, examTitle:$('examTitle'), phaseLabel:$('phaseLabel'), taskDiv:$('task'), timerDiv:$('timer'), actionBtn:$('actionBtn'), questionPlayer:$('questionPlayer'), beepPlayer:$('beepPlayer'), startSpeakingPlayer:$('startSpeakingPlayer'), playDownload1Btn:$('playDownload1Btn'), playDownload2Btn:$('playDownload2Btn'), playDownload3Btn:$('playDownload3Btn'), playDownload4Btn:$('playDownload4Btn'), finalPlayer:$('finalPlayer'), studentLastName, studentFirstName, studentClass, currentExam:examSelect.value, currentVariant:Number(n), config:selected.config, micStream };
  examEngine = examSelect.value === 'oge' ? new OgeEngine(ctx) : new EgeEngine(ctx); $('examTitle').textContent = `${examSelect.value.toUpperCase()}, вариант ${n}`; screenStart.classList.add('hidden'); screenExam.classList.remove('hidden'); screenFinal.classList.add('hidden'); examEngine.start();
});
$('actionBtn').addEventListener('click', () => examEngine?.handleAction());
$('playDownload1Btn').addEventListener('click', () => examEngine?.playDownloadTask1()); $('playDownload2Btn').addEventListener('click', () => examEngine?.playDownloadTask2()); $('playDownload3Btn').addEventListener('click', () => examEngine?.playDownloadTask3()); $('playDownload4Btn').addEventListener('click', () => examEngine?.playDownloadTask4());
$('backBtn').addEventListener('click', () => { examEngine?.reset(); examEngine = null; screenFinal.classList.add('hidden'); screenStart.classList.remove('hidden'); });
