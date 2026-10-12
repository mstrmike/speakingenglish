class OgeEngine extends BaseEngine {
  constructor(ctx) { super(ctx); this.task1Blob = null; this.task2Blobs = []; this.task3Blob = null; }
  start() { this.intro(); }
  intro() { this.phaseLabel.textContent = 'Инструкция'; this.taskDiv.textContent = this.config.introText; this.hideAction(); this.beginTimer(this.config.introTime, () => this.task1Prep()); }
  task1Prep() { this.phaseLabel.textContent = 'Задание 1: подготовка'; this.taskDiv.textContent = `${this.config.task1.text}\n\nВремя на подготовку.`; this.hideAction(); this.beginTimer(this.config.task1.prepTime, () => this.runCue(() => this.task1Rec())); }
  task1Rec() { this.phase = 'task1_rec'; this.phaseLabel.textContent = 'Задание 1: запись'; this.taskDiv.textContent = 'Читайте текст вслух. Идёт запись.'; this.showStop('Закончить задание'); this.startRecording(blob => { this.task1Blob = blob; this.task2Intro(); }); this.beginTimer(this.config.task1.recTime, () => this.stopRecording()); }
  task2Intro() { this.phase = 'task2_intro'; this.phaseLabel.textContent = 'Задание 2'; this.taskDiv.textContent = this.config.task2.infoText; this.task2Blobs = []; this.hideAction(); this.beginTimer(5, () => this.task2Question(0)); }
  task2Question(index) {
    if (index >= 6) return this.task3Prep();
    this.phase = 'task2_question'; this.questionIndex = index; const n = index + 1;
    this.phaseLabel.textContent = `Задание 2: вопрос ${n}/6`; this.taskDiv.textContent = this.config.task2.questionText.replace('{n}', n); this.hideAction(); this.timerDiv.textContent = '';
    const fallback = () => this.beginTimer(this.config.task2.prepGap || 0, () => this.runCue(() => this.task2Rec(index)));
    this.playQuestion(this.config.task2.questionAudio?.[index], fallback, () => this.task2Rec(index));
  }
  task2Rec(index) { const n = index + 1; this.phase = 'task2_rec'; this.phaseLabel.textContent = `Задание 2: ответ на вопрос ${n}/6`; this.taskDiv.textContent = `Отвечайте на вопрос ${n}. Идёт запись.`; this.showStop('Закончить ответ'); this.startRecording(blob => { this.task2Blobs.push(blob); this.task2Question(index + 1); }); this.beginTimer(this.config.task2.recTime, () => this.stopRecording()); }
  task3Prep() { this.phase = 'task3_prep'; this.phaseLabel.textContent = 'Задание 3: подготовка'; this.taskDiv.textContent = `${this.config.task3.text}\n\nВремя на подготовку.`; this.hideAction(); this.beginTimer(this.config.task3.prepTime, () => this.runCue(() => this.task3Rec())); }
  task3Rec() { this.phase = 'task3_rec'; this.phaseLabel.textContent = 'Задание 3: запись'; this.taskDiv.textContent = 'Говорите монолог. Идёт запись.'; this.showStop('Закончить задание'); this.startRecording(blob => { this.task3Blob = blob; this.finish(); }); this.beginTimer(this.config.task3.recTime, () => this.stopRecording()); }
  finish() { this.clearTimer(); this.hideAction(); this.timerDiv.textContent = '00:00'; this.screenExam.classList.add('hidden'); this.screenFinal.classList.remove('hidden'); this.playDownload1Btn.disabled = !this.task1Blob; this.playDownload2Btn.disabled = this.task2Blobs.length !== 6; this.playDownload3Btn.disabled = !this.task3Blob; this.playDownload4Btn.disabled = true; if (this.task1Blob && this.task2Blobs.length === 6 && this.task3Blob) window.EmailSender?.enable(this); }
  handleAction() { if (this.phase?.endsWith('_rec')) { this.clearTimer(); this.stopRecording(); } }
  async getEmailAttachments() { if (!this.task1Blob || this.task2Blobs.length !== 6 || !this.task3Blob) throw new Error('Не все записи ОГЭ готовы.'); const p = this.fioPrefix(); return [ { blob: await this.convertWebmToMp3(this.task1Blob), filename: `${p}_oge_task1.mp3` }, { blob: await this.convertMultipleWebmToMp3(this.task2Blobs), filename: `${p}_oge_task2.mp3` }, { blob: await this.convertWebmToMp3(this.task3Blob), filename: `${p}_oge_task3.mp3` } ]; }
  async playDownloadTask1() { const [file] = await this.getEmailAttachments(); await this.playAndDownload(file.blob, file.filename); }
  async playDownloadTask2() { const files = await this.getEmailAttachments(); await this.playAndDownload(files[1].blob, files[1].filename); }
  async playDownloadTask3() { const files = await this.getEmailAttachments(); await this.playAndDownload(files[2].blob, files[2].filename); }
  async playDownloadTask4() {}
  reset() { super.reset(); this.micStream?.getTracks().forEach(track => track.stop()); }
}
