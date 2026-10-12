class EgeEngine extends BaseEngine {
  constructor(ctx) { super(ctx); this.task1Blob = null; this.task2Blobs = []; this.task3Blobs = []; this.task4Blob = null; }
  start() { this.intro(); }
  intro() { this.phaseLabel.textContent = 'Инструкция'; this.taskDiv.textContent = this.config.introText; this.hideAction(); this.beginTimer(this.config.introTime, () => this.task1Prep()); }
  task1Prep() { this.phaseLabel.textContent = 'Задание 1: подготовка'; this.taskDiv.textContent = `${this.config.task1.text}\n\nВремя на подготовку.`; this.hideAction(); this.beginTimer(this.config.task1.prepTime, () => this.runCue(() => this.task1Rec())); }
  task1Rec() { this.phase = 'task1_rec'; this.phaseLabel.textContent = 'Задание 1: запись'; this.taskDiv.textContent = 'Читайте текст вслух. Идёт запись.'; this.showStop('Закончить задание'); this.startRecording(blob => { this.task1Blob = blob; this.task2Intro(); }); this.beginTimer(this.config.task1.recTime, () => this.stopRecording()); }
  task2Intro() { this.phase = 'task2_intro'; this.phaseLabel.textContent = 'Задание 2'; this.taskDiv.textContent = this.config.task2.infoText; this.task2Blobs = []; this.hideAction(); this.beginTimer(5, () => this.task2Question(0)); }
  task2Question(index) {
    if (index >= 4) return this.task3Intro();
    this.phase = 'task2_question'; this.questionIndex = index; const n = index + 1; this.phaseLabel.textContent = `Задание 2: вопрос ${n}/4`; this.taskDiv.textContent = this.config.task2.questionText.replace('{n}', n); this.hideAction(); this.timerDiv.textContent = '';
    const fallback = () => this.beginTimer(this.config.task2.prepGap || 0, () => this.runCue(() => this.task2Rec(index)));
    this.playQuestion(this.config.task2.questionAudio?.[index], fallback, () => this.task2Rec(index));
  }
  task2Rec(index) { const n = index + 1; this.phase = 'task2_rec'; this.phaseLabel.textContent = `Задание 2: вопрос ${n}/4`; this.taskDiv.textContent = `Сформулируйте вопрос по ключевому слову ${n}. Идёт запись.`; this.showStop('Закончить ответ'); this.startRecording(blob => { this.task2Blobs.push(blob); this.task2Question(index + 1); }); this.beginTimer(this.config.task2.recTime, () => this.stopRecording()); }
  task3Intro() { this.phase = 'task3_intro'; this.phaseLabel.textContent = 'Задание 3'; this.taskDiv.textContent = this.config.task3.infoText; this.task3Blobs = []; this.hideAction(); this.beginTimer(5, () => this.task3Question(0)); }
  task3Question(index) {
    if (index >= 5) return this.task4Prep();
    this.phase = 'task3_question'; this.questionIndex = index; const n = index + 1; this.phaseLabel.textContent = `Задание 3: вопрос ${n}/5`; this.taskDiv.textContent = this.config.task3.questionText.replace('{n}', n); this.hideAction(); this.timerDiv.textContent = '';
    const fallback = () => this.beginTimer(this.config.task3.prepGap || 0, () => this.runCue(() => this.task3Rec(index)));
    this.playQuestion(this.config.task3.questionAudio?.[index], fallback, () => this.task3Rec(index));
  }
  task3Rec(index) { const n = index + 1; this.phase = 'task3_rec'; this.phaseLabel.textContent = `Задание 3: ответ на вопрос ${n}/5`; this.taskDiv.textContent = `Отвечайте на вопрос ${n}. Идёт запись.`; this.showStop('Закончить ответ'); this.startRecording(blob => { this.task3Blobs.push(blob); this.task3Question(index + 1); }); this.beginTimer(this.config.task3.recTime, () => this.stopRecording()); }
  task4Prep() { this.phase = 'task4_prep'; this.phaseLabel.textContent = 'Задание 4: подготовка'; this.taskDiv.textContent = `${this.config.task4.text}\n\nВремя на подготовку.`; this.hideAction(); this.beginTimer(this.config.task4.prepTime, () => this.runCue(() => this.task4Rec())); }
  task4Rec() { this.phase = 'task4_rec'; this.phaseLabel.textContent = 'Задание 4: запись'; this.taskDiv.textContent = 'Говорите монолог. Идёт запись.'; this.showStop('Закончить задание'); this.startRecording(blob => { this.task4Blob = blob; this.finish(); }); this.beginTimer(this.config.task4.recTime, () => this.stopRecording()); }
  finish() { this.clearTimer(); this.hideAction(); this.timerDiv.textContent = '00:00'; this.screenExam.classList.add('hidden'); this.screenFinal.classList.remove('hidden'); this.playDownload1Btn.disabled = !this.task1Blob; this.playDownload2Btn.disabled = this.task2Blobs.length !== 4; this.playDownload3Btn.disabled = this.task3Blobs.length !== 5; this.playDownload4Btn.disabled = !this.task4Blob; if (this.task1Blob && this.task2Blobs.length === 4 && this.task3Blobs.length === 5 && this.task4Blob) window.EmailSender?.enable(this); }
  handleAction() { if (this.phase?.endsWith('_rec')) { this.clearTimer(); this.stopRecording(); } }
  async getEmailAttachments() { if (!this.task1Blob || this.task2Blobs.length !== 4 || this.task3Blobs.length !== 5 || !this.task4Blob) throw new Error('Не все записи ЕГЭ готовы.'); const p = this.fioPrefix(); return [ { blob: await this.convertWebmToMp3(this.task1Blob), filename: `${p}_ege_task1.mp3` }, { blob: await this.convertMultipleWebmToMp3(this.task2Blobs), filename: `${p}_ege_task2.mp3` }, { blob: await this.convertMultipleWebmToMp3(this.task3Blobs), filename: `${p}_ege_task3.mp3` }, { blob: await this.convertWebmToMp3(this.task4Blob), filename: `${p}_ege_task4.mp3` } ]; }
  async playDownloadTask1() { const files = await this.getEmailAttachments(); await this.playAndDownload(files[0].blob, files[0].filename); }
  async playDownloadTask2() { const files = await this.getEmailAttachments(); await this.playAndDownload(files[1].blob, files[1].filename); }
  async playDownloadTask3() { const files = await this.getEmailAttachments(); await this.playAndDownload(files[2].blob, files[2].filename); }
  async playDownloadTask4() { const files = await this.getEmailAttachments(); await this.playAndDownload(files[3].blob, files[3].filename); }
  reset() { super.reset(); this.micStream?.getTracks().forEach(track => track.stop()); }
}
