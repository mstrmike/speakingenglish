# Надстройка отправки MP3 учителю

Этот комплект добавляет в тренажёр выбор учителя из списка и отправку итоговых MP3 по email. Ученик не видит и не вводит email: браузер получает от сервера только `id` и имя учителя, а настоящий адрес остаётся в `.env` на сервере.

## 1. Структура проекта

Перенесите фронтенд в папку `public`:

```text
project/
├── public/
│   ├── index.html
│   ├── script.js
│   ├── script_oge.js
│   ├── script_ege.js
│   ├── tasks.js
│   ├── email-send.js
│   └── audio/
├── server.js
├── package.json
├── .env
└── .gitignore
```

Не подключайте старые скрипты с кнопками `startRecBtn`, `stopRecBtn`, `nextTaskBtn` и т. п. Они несовместимы с текущей версией движков.

## 2. index.html

Внутри `#screen-final`, перед блоком с кнопкой `backBtn`, добавьте:

```html
<div class="center" style="margin-top: 25px;">
  <h3>Отправить ответы учителю</h3>
  <p style="font-size: 0.9rem; color: #555;">
    После отправки MP3-записи и данные ученика будут переданы на сервер
    и направлены выбранному учителю.
  </p>

  <label>
    Учитель:
    <select id="teacherSelect" disabled>
      <option value="">Загрузка списка учителей…</option>
    </select>
  </label>

  <button id="sendToTeacherBtn" type="button" disabled>
    Отправить все записи
  </button>

  <div id="sendEmailStatus" style="margin-top: 8px; min-height: 20px;"></div>
</div>
```

В конце `index.html` подключите `email-send.js` строго **после** файлов движков и **до** `script.js`:

```html
<script src="tasks.js"></script>
<script src="script_oge.js"></script>
<script src="script_ege.js"></script>
<script src="email-send.js"></script>
<script src="script.js"></script>
```

## 3. script.js

После всех обработчиков DOM-элементов и до `populateVariants()` добавьте инициализацию:

```js
window.EmailSender?.init();
```

В обработчике кнопки `backBtn`, после сброса `finalPlayer.src`, добавьте:

```js
window.EmailSender?.disable();
```

Больше изменять `script.js` не требуется.

## 4. script_oge.js

### Измените метод `finish()`

После строк, где активируются `playDownload1Btn`, `playDownload2Btn`, `playDownload3Btn`, добавьте:

```js
window.EmailSender?.enable(this);
```

### Добавьте метод в класс OgeEngine

Вставьте его перед методом `reset()`:

```js
async getEmailAttachments() {
  if (!this.task1Blob || this.task2Blobs.length !== 6 || !this.task3Blob) {
    throw new Error('Не все записи ОГЭ готовы для отправки.');
  }

  const prefix = this.fioPrefix();
  const task1Mp3 = await this.convertWebmToMp3(this.task1Blob);
  const task2Mp3 = await this.convertMultipleWebmToMp3(this.task2Blobs);
  const task3Mp3 = await this.convertWebmToMp3(this.task3Blob);

  return [
    { blob: task1Mp3, filename: `${prefix}_oge_task1.mp3` },
    { blob: task2Mp3, filename: `${prefix}_oge_task2_all.mp3` },
    { blob: task3Mp3, filename: `${prefix}_oge_task3.mp3` }
  ];
}
```

### Измените метод `reset()`

В конец `reset()` добавьте:

```js
window.EmailSender?.disable();
```

## 5. script_ege.js

### Измените метод `finish()`

После строк, где активируются `playDownload1Btn`–`playDownload4Btn`, добавьте:

```js
window.EmailSender?.enable(this);
```

### Добавьте метод в класс EgeEngine

Вставьте перед методом `reset()`:

```js
async getEmailAttachments() {
  if (
    !this.task1Blob ||
    this.task2Blobs.length !== 4 ||
    this.task3Blobs.length !== 5 ||
    !this.task4Blob
  ) {
    throw new Error('Не все записи ЕГЭ готовы для отправки.');
  }

  const prefix = this.fioPrefix();
  const task1Mp3 = await this.convertWebmToMp3(this.task1Blob);
  const task2Mp3 = await this.convertMultipleWebmToMp3(this.task2Blobs);
  const task3Mp3 = await this.convertMultipleWebmToMp3(this.task3Blobs);
  const task4Mp3 = await this.convertWebmToMp3(this.task4Blob);

  return [
    { blob: task1Mp3, filename: `${prefix}_ege_task1_reading.mp3` },
    { blob: task2Mp3, filename: `${prefix}_ege_task2_questions.mp3` },
    { blob: task3Mp3, filename: `${prefix}_ege_task3_answers.mp3` },
    { blob: task4Mp3, filename: `${prefix}_ege_task4_monologue.mp3` }
  ];
}
```

### Измените `reset()`

В конец метода добавьте:

```js
window.EmailSender?.disable();
```

## 6. Настройка сервера

1. Скопируйте `env.example.txt` в `.env`.
2. Укажите параметры SMTP почты, с которой будут уходить письма.
3. В `TEACHERS_JSON` внесите всех педагогов. У каждого учителя должны быть уникальные `id`, `name`, `email`.
4. Добавьте `.env` в `.gitignore`:

```gitignore
.env
node_modules
```

5. Установите зависимости:

```bash
npm install
```

6. Запустите проект:

```bash
npm start
```

Тренажёр будет доступен на `http://localhost:3000`.

## 7. Проверка

1. Откройте тренажёр через `http://localhost:3000`, а не двойным кликом по `index.html`.
2. Перейдите до финального экрана.
3. Выберите учителя: в списке должны отображаться только имена.
4. Нажмите «Отправить все записи».
5. Проверьте почтовый ящик учителя и папку «Спам».

## 8. Для хостинга

GitHub Pages подходит только для статических файлов и не запустит `server.js`. Нужен хостинг с Node.js: VPS, Render, Railway, Fly.io, Timeweb Cloud или другой аналог. Домен сайта и API должны работать на одном домене: это избавит от проблем CORS.

## 9. Защита и персональные данные

- Не загружайте `.env` в GitHub.
- Адреса педагогов хранятся только на сервере; `/api/teachers` возвращает лишь имя и ID.
- В `server.js` есть ограничение: не более 5 отправок с одного IP за час, максимум 4 файла, максимум 15 МБ на файл и 40 МБ суммарно.
- Перед запуском для учеников согласуйте правила обработки голосовых записей и персональных данных с администрацией школы.
- Для production лучше дополнительно ввести вход ученика/учителя и хранить лимиты в Redis или базе данных: встроенный лимит в памяти подходит для одного небольшого сервера.
