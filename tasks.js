// Банк заданий для ОГЭ и ЕГЭ
// Аудио кладёшь в папку audio/ рядом с index.html

const TASK_BANK = {
  oge: {
    1: {
      introText: 'ОГЭ, вариант 1. Вы выполните 3 задания. Следуйте инструкциям.',
      introTime: 5,

      task1: {
        text: 'ОГЭ, вариант 1, задание 1.\nПрочитайте текст вслух (заглушка).',
        prepTime: 60,
        recTime:  120
      },

      task2: {
        infoText: 'ОГЭ, вариант 1, задание 2.\nВы услышите 6 вопросов. После каждого у вас будет время на ответ.',
        questionText: 'Вопрос {n}.',
        prepGap: 3,
        recTime: 40,
        questionAudio: [
          'audio/oge1_q1.mp3',
          'audio/oge1_q2.mp3',
          'audio/oge1_q3.mp3',
          'audio/oge1_q4.mp3',
          'audio/oge1_q5.mp3',
          'audio/oge1_q6.mp3'
        ]
      },

      task3: {
        text: 'ОГЭ, вариант 1, задание 3.\nПодготовьте монолог по плану (заглушка).',
        prepTime: 90,
        recTime:  180
      }
    },

    2: {
      introText: 'ОГЭ, вариант 2. Вы выполните 3 задания. Следуйте инструкциям.',
      introTime: 5,

      task1: {
        text: 'ОГЭ, вариант 2, задание 1.\nПрочитайте другой текст вслух (заглушка).',
        prepTime: 60,
        recTime:  120
      },

      task2: {
        infoText: 'ОГЭ, вариант 2, задание 2.\nВы услышите 6 других вопросов.',
        questionText: 'Вопрос {n}.',
        prepGap: 3,
        recTime: 40,
        questionAudio: [
          'audio/oge2_q1.mp3',
          'audio/oge2_q2.mp3',
          'audio/oge2_q3.mp3',
          'audio/oge2_q4.mp3',
          'audio/oge2_q5.mp3',
          'audio/oge2_q6.mp3'
        ]
      },

      task3: {
        text: 'ОГЭ, вариант 2, задание 3.\nПодготовьте монолог по другому плану (заглушка).',
        prepTime: 90,
        recTime:  180
      }
    }
  },

  ege: {
    1: {
      introText: 'ЕГЭ, вариант 1 (пока сценарий как у ОГЭ).',
      introTime: 5,
      task1: {
        text: 'ЕГЭ, вариант 1, задание 1 (заглушка).',
        prepTime: 60,
        recTime:  120
      },
      task2: {
        infoText: 'ЕГЭ, вариант 1, задание 2 (заглушка).',
        questionText: 'Вопрос {n}.',
        prepGap: 3,
        recTime: 40,
        questionAudio: [
          'audio/ege1_q1.mp3',
          'audio/ege1_q2.mp3',
          'audio/ege1_q3.mp3',
          'audio/ege1_q4.mp3',
          'audio/ege1_q5.mp3',
          'audio/ege1_q6.mp3'
        ]
      },
      task3: {
        text: 'ЕГЭ, вариант 1, задание 3 (заглушка).',
        prepTime: 90,
        recTime:  180
      }
    }
  }
};
