// Банк заданий для ОГЭ и ЕГЭ

const TASK_BANK = {
  oge: {
    1: {
      introText: 'ОГЭ, вариант 1. Вы выполните 3 задания. Следуйте инструкциям.',
      introTime: 5,
      task1: {
        text: 'ОГЭ, вариант 1, задание 1.\nПрочитайте текст вслух (заглушка).',
        prepTime: 60,
        recTime: 120
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
        recTime: 180
      }
    }
  },

  ege: {
    1: {
      introText: 'ЕГЭ, вариант 1. Вы выполните 4 задания. Следуйте инструкциям.',
      introTime: 5,

      // 1: чтение текста
      task1: {
        text: 'ЕГЭ, вариант 1, задание 1.\nПрочитайте текст вслух (заглушка).',
        prepTime: 60,
        recTime: 120
      },

      // 2: 4 раза задать вопрос по ключевому слову
      task2: {
        infoText: 'ЕГЭ, вариант 1, задание 2.\n4 раза задайте вопрос по ключевому слову.',
        questionText: 'Ключевое слово {n}. Сформулируйте вопрос.',
        prepGap: 3,
        recTime: 20,
        questionAudio: [
          'audio/ege1_t2_q1.mp3',
          'audio/ege1_t2_q2.mp3',
          'audio/ege1_t2_q3.mp3',
          'audio/ege1_t2_q4.mp3'
        ]
      },

      // 3: 5 вопросов (аналог ОГЭ-2, но 5)
      task3: {
        infoText: 'ЕГЭ, вариант 1, задание 3.\nВы услышите 5 вопросов. После каждого у вас будет время на ответ.',
        questionText: 'Вопрос {n}.',
        prepGap: 3,
        recTime: 40,
        questionAudio: [
          'audio/ege1_t3_q1.mp3',
          'audio/ege1_t3_q2.mp3',
          'audio/ege1_t3_q3.mp3',
          'audio/ege1_t3_q4.mp3',
          'audio/ege1_t3_q5.mp3'
        ]
      },

      // 4: монолог
      task4: {
        text: 'ЕГЭ, вариант 1, задание 4.\nПодготовьте развернутый монолог (заглушка).',
        prepTime: 90,
        recTime: 180
      }
    }
  }
};
