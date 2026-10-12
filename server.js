require('dotenv').config();

const path = require('path');
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MAX_FILES = 4;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_TOTAL_SIZE = 40 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function parseTeachers() {
  try {
    const teachers = JSON.parse(process.env.TEACHERS_JSON || '[]');
    if (!Array.isArray(teachers)) throw new Error('TEACHERS_JSON must be an array');
    return teachers.filter(t => t && t.id && t.name && t.email);
  } catch (error) {
    console.error('Invalid TEACHERS_JSON:', error.message);
    return [];
  }
}

const teachers = parseTeachers();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: MAX_FILES, fileSize: MAX_FILE_SIZE }
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

const rateLimitStore = new Map();

function rateLimit(req, res, next) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const current = rateLimitStore.get(key) || { count: 0, startedAt: now };
  const expired = now - current.startedAt >= RATE_LIMIT_WINDOW_MS;
  const record = expired ? { count: 1, startedAt: now } : { ...current, count: current.count + 1 };
  rateLimitStore.set(key, record);

  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ message: 'Слишком много отправок. Повторите попытку позже.' });
  }
  next();
}

function cleanText(value, maxLength) {
  return String(value || '').trim().replace(/[<>]/g, '').slice(0, maxLength);
}

function validExam(value) {
  return value === 'oge' || value === 'ege';
}

app.disable('x-powered-by');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/teachers', (req, res) => {
  res.json({
    teachers: teachers.map(({ id, name }) => ({ id, name }))
  });
});

app.post('/api/send-recordings', rateLimit, upload.array('recordings', MAX_FILES), async (req, res) => {
  try {
    const teacherId = cleanText(req.body.teacherId, 60);
    const teacher = teachers.find(item => item.id === teacherId);
    const studentLastName = cleanText(req.body.studentLastName, 60);
    const studentFirstName = cleanText(req.body.studentFirstName, 60);
    const studentClass = cleanText(req.body.studentClass, 30);
    const exam = cleanText(req.body.exam, 10).toLowerCase();
    const variant = cleanText(req.body.variant, 20);
    const files = req.files || [];

    if (!teacher) {
      return res.status(400).json({ message: 'Выберите учителя из списка.' });
    }
    if (!studentLastName || !studentFirstName || !studentClass || !validExam(exam)) {
      return res.status(400).json({ message: 'Недостаточно данных об ученике или экзамене.' });
    }
    if (!files.length) {
      return res.status(400).json({ message: 'Аудиозаписи не получены.' });
    }
    if (files.some(file => file.mimetype !== 'audio/mpeg' && file.mimetype !== 'audio/mp3')) {
      return res.status(400).json({ message: 'Разрешена отправка только MP3-файлов.' });
    }
    if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_SIZE) {
      return res.status(413).json({ message: 'Суммарный размер записей слишком большой.' });
    }

    const fullName = `${studentLastName} ${studentFirstName}`;
    const examName = exam.toUpperCase();

    await transporter.sendMail({
      from: `"Тренажёр устной части" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
      to: teacher.email,
      subject: `${examName}: ответы — ${fullName}, ${studentClass}`,
      text: [
        `Ученик: ${fullName}`,
        `Класс: ${studentClass}`,
        `Экзамен: ${examName}`,
        `Вариант: ${variant || 'не указан'}`,
        '',
        'К письму прикреплены MP3-записи ответов ученика.'
      ].join('\n'),
      attachments: files.map(file => ({
        filename: path.basename(file.originalname).replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]/g, '_'),
        content: file.buffer,
        contentType: 'audio/mpeg'
      }))
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('send-recordings error:', error);
    res.status(500).json({ message: 'Не удалось отправить письмо. Попробуйте позже.' });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: 'Слишком большой файл или слишком много файлов.' });
  }
  console.error(error);
  res.status(500).json({ message: 'Ошибка сервера.' });
});

transporter.verify()
  .then(() => console.log('SMTP connection is ready'))
  .catch(error => console.error('SMTP verification failed:', error.message));

app.listen(PORT, () => {
  console.log(`Trainer is running on http://localhost:${PORT}`);
});
