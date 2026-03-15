class EgeEngine {
  constructor(ctx) {
    Object.assign(this, ctx);

    this.phase         = null;
    this.timer         = null;
    this.timeLeft      = 0;
    this.questionIndex = 0;

    this.micStream     = ctx.micStream;
    this.mediaRecorder = null;
    this.audioChunks   = [];

    this.task1Blob  = null;
    this.task2Blobs = []; // 4 вопроса
    this.task3Blobs = []; // 5 ответов
    this.task4Blob  = null;
  }

  start() {
    this.startIntro();
  }

  updateTimer() {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    this.timerDiv.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  resetTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  playBeepThen(callback) {
    if (!this.beepPlayer) {
      callback && callback();
      return;
    }
    this.beepPlayer.currentTime = 0;
    this.beepPlayer.onended = () => {
      this.beepPlayer.onended = null;
      callback && callback();
    };
    this.beepPlayer.play().catch(err => {
      console.error(err);
      callback && callback();
    });
  }

  async startRecording(onStopped) {
    try {
      this.mediaRecorder = new MediaRecorder(this.micStream, { mimeType: 'audio/webm' });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) this.audioChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        if (!this.audioChunks.length) return;
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        onStopped && onStopped(blob);
      };

      this.mediaRecorder.start();
    } catch (e) {
      alert('Ошибка доступа к микрофону.');
      console.error(e);
    }
  }

  // фазы ЕГЭ
  startIntro() {
    this.phase = 'intro';
    this.phaseLabel.textContent = 'Инструкция';
    this.taskDiv.textContent    = this.config.introText;
    this.timeLeft = this.config.introTime;
    this.updateTimer();
    this.actionBtn.disabled = false;
    this.actionBtn.textContent = 'Сразу к заданию 1';

    this.resetTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimer();
      if (this.timeLeft <= 0) {
        this.resetTimer();
        this.startTask1Prep();
      }
    }, 1000);
  }

  // 1: чтение
  startTask1Prep() {
    this.phase = 'task1_prep';
    this.phaseLabel.textContent = 'Задание 1: подготовка';
    this.taskDiv.textContent    = this.config.task1.text + '\n\nВремя на подготовку.';
    this.timeLeft = this.config.task1.prepTime;
    this.updateTimer();
    this.actionBtn.disabled = false;
    this.actionBtn.textContent = 'Сразу к записи';

    this.resetTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimer();
      if (this.timeLeft <= 0) {
        this.resetTimer();
        this.playBeepThen(() => this.startTask1Rec());
      }
    }, 1000);
  }

  startTask1Rec() {
    this.phase = 'task1_rec';
    this.phaseLabel.textContent = 'Задание 1: запись';
    this.taskDiv.textContent    = 'Читайте текст вслух. Идёт запись.';
    this.timeLeft = this.config.task1.recTime;
    this.updateTimer();
    this.actionBtn.disabled = false;
    this.actionBtn.textContent = 'Закончить задание';

    this.startRecording(blob => {
      this.task1Blob = blob;
      this.startTask2Intro();
    });

    this.resetTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimer();
      if (this.timeLeft <= 0) {
        this.resetTimer();
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }
    }, 1000);
  }

  // 2: 4 вопроса по ключевым словам
  startTask2Intro() {
    this.phase = 'task2_intro';
    this.phaseLabel.textContent = 'Задание 2';
    this.taskDiv.textContent    = this.config.task2.infoText;
    this.timeLeft = 5;
    this.updateTimer();
    this.actionBtn.disabled = false;
    this.actionBtn.textContent = 'К вопросу 1';

    this.task2Blobs = [];
    this.questionIndex = 0;

    this.resetTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimer();
      if (this.timeLeft <= 0) {
        this.resetTimer();
        this.startTask2QuestionPrep(0);
      }
    }, 1000);
  }

  startTask2QuestionPrep(index) {
    if (index >= 4) {
      this.startTask3Intro();
      return;
    }
    this.questionIndex = index;
    const n = index + 1;
    this.phase = 'task2_q_prep';
    this.phaseLabel.textContent = `Задание 2: вопрос ${n}/4`;
    this.taskDiv.textContent    = this.config.task2.questionText.replace('{n}', n);
    this.actionBtn.disabled = false;
    this.actionBtn.textContent = 'Сразу к записи';

    this.resetTimer();
    this.timerDiv.textContent = '';

    const qSrc = this.config.task2.questionAudio && this.config.task2.questionAudio[index];
    if (qSrc) {
      this.questionPlayer.src = qSrc;
      this.questionPlayer.style.display = 'block';
      this.questionPlayer.onended = () => {
        this.questionPlayer.style.display = 'none';
        this.playBeepThen(() => this.startTask2QuestionRec(index));
      };
      this.questionPlayer.play().catch(err => {
        console.error(err);
        this.startTask2PrepFallback(index);
      });
    } else {
      this.startTask2PrepFallback(index);
    }
  }

  startTask2PrepFallback(index) {
    this.questionPlayer.pause();
    this.questionPlayer.currentTime = 0;
    this.questionPlayer.style.display = 'none';

    this.timeLeft = this.config.task2.prepGap;
    this.resetTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.resetTimer();
        this.playBeepThen(() => this.startTask2QuestionRec(index));
      }
    }, 1000);
  }

  startTask2QuestionRec(index) {
    const n = index + 1;
    this.phase = 'task2_q_rec';
    this.phaseLabel.textContent = `Задание 2: вопрос ${n}/4`;
    this.taskDiv.textContent    = `Сформулируйте вопрос по ключевому слову ${n}. Идёт запись.`;
    this.timeLeft = this.config.task2.recTime;
    this.updateTimer();
    this.actionBtn.disabled = false;
    this.actionBtn.textContent = 'Закончить ответ';

    this.startRecording(blob => {
      this.task2Blobs.push(blob);
      if (index < 3) {
        this.startTask2QuestionPrep(index + 1);
      } else {
        this.startTask3Intro();
      }
    });

    this.resetTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimer();
      if (this.timeLeft <= 0) {
        this.resetTimer();
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }
    }, 1000);
  }

  // 3: 5 вопросов
  startTask3Intro() {
    this.phase = 'task3_intro';
    this.phaseLabel.textContent = 'Задание 3';
    this.taskDiv.textContent    = this.config.task3.infoText;
    this.timeLeft = 5;
    this.updateTimer();
    this.actionBtn.disabled = false;
    this.actionBtn.textContent = 'К вопросу 1';

    this.task3Blobs = [];
    this.questionIndex = 0;
    this.questionPlayer.style.display = 'none';
    this.questionPlayer.src = '';

    this.resetTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimer();
      if (this.timeLeft <= 0) {
        this.resetTimer();
        this.startTask3QuestionPrep(0);
      }
    }, 1000);
  }

  startTask3QuestionPrep(index) {
    if (index >= 5) {
      this.startTask4Prep();
      return;
    }

    this.questionIndex = index;
    const n = index + 1;
    this.phase = 'task3_q_prep';
    this.phaseLabel.textContent = `Задание 3: вопрос ${n}/5`;
    this.taskDiv.textContent    = this.config.task3.questionText.replace('{n}', n);
    this.actionBtn.disabled = false;
    this.actionBtn.textContent = 'Сразу к записи';

    this.resetTimer();
    this.timerDiv.textContent = '';

    const qSrc = this.config.task3.questionAudio && this.config.task3.questionAudio[index];
    if (qSrc) {
      this.questionPlayer.src = qSrc;
      this.questionPlayer.style.display = 'block';
      this.questionPlayer.onended = () => {
        this.questionPlayer.style.display = 'none';
        this.playBeepThen(() => this.startTask3QuestionRec(index));
      };
      this.questionPlayer.play().catch(err => {
        console.error(err);
        this.startTask3PrepFallback(index);
      });
    } else {
      this.startTask3PrepFallback(index);
    }
  }

  startTask3PrepFallback(index) {
    this.questionPlayer.pause();
    this.questionPlayer.currentTime = 0;
    this.questionPlayer.style.display = 'none';

    this.timeLeft = this.config.task3.prepGap;
    this.resetTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.resetTimer();
        this.playBeepThen(() => this.startTask3QuestionRec(index));
      }
    }, 1000);
  }

  startTask3QuestionRec(index) {
    const n = index + 1;
    this.phase = 'task3_q_rec';
    this.phaseLabel.textContent = `Задание 3: ответ на вопрос ${n}/5`;
    this.taskDiv.textContent    = `Отвечайте на вопрос ${n}. Идёт запись.`;
    this.timeLeft = this.config.task3.recTime;
    this.updateTimer();
    this.actionBtn.disabled = false;
    this.actionBtn.textContent = 'Закончить ответ';

    this.startRecording(blob => {
      this.task3Blobs.push(blob);
      if (index < 4) {
        this.startTask3QuestionPrep(index + 1);
      } else {
        this.startTask4Prep();
      }
    });

    this.resetTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimer();
      if (this.timeLeft <= 0) {
        this.resetTimer();
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }
    }, 1000);
  }

  // 4: монолог
  startTask4Prep() {
    this.phase = 'task4_prep';
    this.phaseLabel.textContent = 'Задание 4: подготовка';
    this.taskDiv.textContent    = this.config.task4.text + '\n\nВремя на подготовку.';
    this.timeLeft = this.config.task4.prepTime;
    this.updateTimer();
    this.actionBtn.disabled = false;
    this.actionBtn.textContent = 'Сразу к записи';

    this.resetTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimer();
      if (this.timeLeft <= 0) {
        this.resetTimer();
        this.playBeepThen(() => this.startTask4Rec());
      }
    }, 1000);
  }

  startTask4Rec() {
    this.phase = 'task4_rec';
    this.phaseLabel.textContent = 'Задание 4: запись';
    this.taskDiv.textContent    = 'Говорите монолог. Идёт запись.';
    this.timeLeft = this.config.task4.recTime;
    this.updateTimer();
    this.actionBtn.disabled = false;
    this.actionBtn.textContent = 'Закончить задание';

    this.startRecording(blob => {
      this.task4Blob = blob;
      this.finish();
    });

    this.resetTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimer();
      if (this.timeLeft <= 0) {
        this.resetTimer();
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }
    }, 1000);
  }

  finish() {
    this.phase = 'finished';
    this.resetTimer();
    this.timerDiv.textContent = '00:00';
    this.actionBtn.disabled = true;

    this.screenExam.classList.add('hidden');
    this.screenFinal.classList.remove('hidden');

    this.playDownload1Btn.disabled = !this.task1Blob;
    this.playDownload2Btn.disabled = this.task2Blobs.length !== 4;
    this.playDownload3Btn.disabled = this.task3Blobs.length !== 5;
    this.playDownload4Btn.disabled = !this.task4Blob;

    this.finalPlayer.src = '';
  }

  handleAction() {
    switch (this.phase) {
      case 'intro':
        this.resetTimer(); this.startTask1Prep(); break;
      case 'task1_prep':
        this.resetTimer(); this.playBeepThen(() => this.startTask1Rec()); break;
      case 'task1_rec':
        this.resetTimer();
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') this.mediaRecorder.stop();
        break;

      case 'task2_intro':
        this.resetTimer(); this.startTask2QuestionPrep(0); break;
      case 'task2_q_prep':
        this.resetTimer();
        this.questionPlayer.pause();
        this.questionPlayer.currentTime = 0;
        this.questionPlayer.style.display = 'none';
        this.playBeepThen(() => this.startTask2QuestionRec(this.questionIndex));
        break;
      case 'task2_q_rec':
        this.resetTimer();
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') this.mediaRecorder.stop();
        break;

      case 'task3_intro':
        this.resetTimer(); this.startTask3QuestionPrep(0); break;
      case 'task3_q_prep':
        this.resetTimer();
        this.questionPlayer.pause();
        this.questionPlayer.currentTime = 0;
        this.questionPlayer.style.display = 'none';
        this.playBeepThen(() => this.startTask3QuestionRec(this.questionIndex));
        break;
      case 'task3_q_rec':
        this.resetTimer();
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') this.mediaRecorder.stop();
        break;

      case 'task4_prep':
        this.resetTimer(); this.playBeepThen(() => this.startTask4Rec()); break;
      case 'task4_rec':
        this.resetTimer();
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') this.mediaRecorder.stop();
        break;
    }
  }

  // mp3 конвертация и скачивание (аналогично ОГЭ)
  fioPrefix() {
    const ln = this.studentLastName  || 'Student';
    const fn = this.studentFirstName || 'Name';
    const cl = this.studentClass     || 'Class';
    return `${ln}_${fn}_${cl}_var${this.currentVariant}`;
  }
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  async convertWebmToMp3(webmBlob) {
    const arrayBuffer  = await webmBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer  = await audioContext.decodeAudioData(arrayBuffer);
    const channelData  = audioBuffer.getChannelData(0);
    const sampleRate   = audioBuffer.sampleRate;

    const samples = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      let s = Math.max(-1, Math.min(1, channelData[i]));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    const mp3Encoder  = new lamejs.Mp3Encoder(1, sampleRate, 128);
    const sampleBlock = 1152;
    const mp3Data     = [];

    for (let i = 0; i < samples.length; i += sampleBlock) {
      const chunk = samples.subarray(i, i + sampleBlock);
      const buf   = mp3Encoder.encodeBuffer(chunk);
      if (buf.length > 0) mp3Data.push(buf);
    }
    const end = mp3Encoder.flush();
    if (end.length > 0) mp3Data.push(end);
    return new Blob(mp3Data, { type: 'audio/mp3' });
  }
  async convertMultipleWebmToMp3(webmBlobs) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const buffers      = [];
    let totalLength    = 0;
    let sampleRate     = 44100;

    for (const blob of webmBlobs) {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      buffers.push(audioBuffer);
      totalLength += audioBuffer.length;
      sampleRate = audioBuffer.sampleRate;
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const buf of buffers) {
      merged.set(buf.getChannelData(0), offset);
      offset += buf.length;
    }

    const samples = new Int16Array(merged.length);
    for (let i = 0; i < merged.length; i++) {
      let s = Math.max(-1, Math.min(1, merged[i]));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    const mp3Encoder  = new lamejs.Mp3Encoder(1, sampleRate, 128);
    const sampleBlock = 1152;
    const mp3Data     = [];

    for (let i = 0; i < samples.length; i += sampleBlock) {
      const chunk = samples.subarray(i, i + sampleBlock);
      const buf   = mp3Encoder.encodeBuffer(chunk);
      if (buf.length > 0) mp3Data.push(buf);
    }
    const end = mp3Encoder.flush();
    if (end.length > 0) mp3Data.push(end);
    return new Blob(mp3Data, { type: 'audio/mp3' });
  }

  async playDownloadTask1() {
    if (!this.task1Blob) return;
    const mp3 = await this.convertWebmToMp3(this.task1Blob);
    const url = URL.createObjectURL(mp3);
    this.finalPlayer.src = url;
    this.finalPlayer.play().catch(console.error);
    this.downloadBlob(mp3, `${this.fioPrefix()}_ege_task1_reading.mp3`);
  }
  async playDownloadTask2() {
    if (this.task2Blobs.length !== 4) {
      alert('Записаны не все 4 вопроса задания 2.');
      return;
    }
    const mp3 = await this.convertMultipleWebmToMp3(this.task2Blobs);
    const url = URL.createObjectURL(mp3);
    this.finalPlayer.src = url;
    this.finalPlayer.play().catch(console.error);
    this.downloadBlob(mp3, `${this.fioPrefix()}_ege_task2_questions4.mp3`);
  }
  async playDownloadTask3() {
    if (this.task3Blobs.length !== 5) {
      alert('Записаны не все 5 ответов задания 3.');
      return;
    }
    const mp3 = await this.convertMultipleWebmToMp3(this.task3Blobs);
    const url = URL.createObjectURL(mp3);
    this.finalPlayer.src = url;
    this.finalPlayer.play().catch(console.error);
    this.downloadBlob(mp3, `${this.fioPrefix()}_ege_task3_answers5.mp3`);
  }
  async playDownloadTask4() {
    if (!this.task4Blob) return;
    const mp3 = await this.convertWebmToMp3(this.task4Blob);
    const url = URL.createObjectURL(mp3);
    this.finalPlayer.src = url;
    this.finalPlayer.play().catch(console.error);
    this.downloadBlob(mp3, `${this.fioPrefix()}_ege_task4_monologue.mp3`);
  }

  reset() {
    this.resetTimer();
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.finalPlayer.src = '';
    this.task1Blob = this.task4Blob = null;
    this.task2Blobs = [];
    this.task3Blobs = [];
    this.phase = null;
  }
}
