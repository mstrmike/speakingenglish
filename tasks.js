// Банк заданий для ОГЭ и ЕГЭ с разделением на free / premium

const TASK_BANK = {
  oge: {
    free: {
      1: {
        introText: 'ОГЭ, вариант 1 (БЕСПЛАТНО). Вы выполните 3 задания. Следуйте инструкциям.',
        introTime: 5,
        task1: {
          text: 'ОГЭ, вариант 1, задание 1.\nПрочитайте текст вслух (заглушка).',
          prepTime: 90,
          recTime: 120
        },
        task2: {
          infoText: 'ОГЭ, вариант 1, задание 2.\nВы услышите 6 вопросов. После каждого у вас будет время на ответ.',
          questionText: 'Вопрос {n}.',
          prepGap: 5,
          recTime: 60,
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
          recTime: 120
        }
      },
      2: {
        introText: 'ОГЭ, вариант 2 (БЕСПЛАТНО). Вы выполните 3 задания. Следуйте инструкциям.',
        introTime: 5,
        task1: {
          text: 'ОГЭ, вариант 2, задание 1.\nПрочитайте другой текст вслух (заглушка).',
          prepTime: 90,
          recTime: 120
        },
        task2: {
          infoText: 'ОГЭ, вариант 2, задание 2.\nВы услышите 6 других вопросов.',
          questionText: 'Вопрос {n}.',
          prepGap: 5,
          recTime: 60,
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
          recTime: 120
        }
      }
    },

    premium: {
      3: {
        introText: 'ОГЭ, вариант 3 (PREMIUM). Вы выполните 3 задания.',
        introTime: 5,
        task1: {
          text: 'ОГЭ, вариант 3, задание 1.\nТекст для чтения (премиум).',
          prepTime: 90,
          recTime: 120
        },
        task2: {
          infoText: 'ОГЭ, вариант 3, задание 2.\n6 вопросов (премиум-аудио).',
          questionText: 'Вопрос {n}.',
          prepGap: 5,
          recTime: 60,
          questionAudio: [
            'audio/oge3_q1.mp3',
            'audio/oge3_q2.mp3',
            'audio/oge3_q3.mp3',
            'audio/oge3_q4.mp3',
            'audio/oge3_q5.mp3',
            'audio/oge3_q6.mp3'
          ]
        },
        task3: {
          text: 'ОГЭ, вариант 3, задание 3.\nМонолог (премиум).',
          prepTime: 90,
          recTime: 120
        }
      },
      4: {
        introText: 'ОГЭ, вариант 4 (PREMIUM). Вы выполните 3 задания.',
        introTime: 5,
        task1: {
          text: 'ОГЭ, вариант 4, задание 1.\nТекст для чтения (премиум).',
          prepTime: 90,
          recTime: 120
        },
        task2: {
          infoText: 'ОГЭ, вариант 4, задание 2.\n6 вопросов (премиум-аудио).',
          questionText: 'Вопрос {n}.',
          prepGap: 5,
          recTime: 60,
          questionAudio: [
            'audio/oge4_q1.mp3',
            'audio/oge4_q2.mp3',
            'audio/oge4_q3.mp3',
            'audio/oge4_q4.mp3',
            'audio/oge4_q5.mp3',
            'audio/oge4_q6.mp3'
          ]
        },
        task3: {
          text: 'ОГЭ, вариант 4, задание 3.\nМонолог (премиум).',
          prepTime: 90,
          recTime: 120
        }
      }
    }
  },

  ege: {
    free: {
      1: {
        introText: 'ЕГЭ, вариант 1 (БЕСПЛАТНО). Вы выполните 4 задания.',
        introTime: 5,
        task1: {
          text: 'ЕГЭ, вариант 1, задание 1.\nПрочитайте текст вслух (заглушка).',
          prepTime: 90,
          recTime: 90
        },
        task2: {
          infoText: 'ЕГЭ, вариант 1, задание 2.\nПо каждому ключевому слову задайте вопрос.',
          questionText: 'Ключевое слово {n}. Сформулируйте вопрос.',
          prepGap: 5,
          recTime: 20,
          questionAudio: [
            'audio/ege1_t2_q1.mp3',
            'audio/ege1_t2_q2.mp3',
            'audio/ege1_t2_q3.mp3',
            'audio/ege1_t2_q4.mp3'
          ]
        },
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
        task4: {
          text: 'ЕГЭ, вариант 1, задание 4.\nПодготовьте развернутый монолог (12–15 фраз).',
          prepTime: 150,
          recTime: 180
        }
      }
    },

    premium: {
      2: {
        introText: 'ЕГЭ, вариант 2 (PREMIUM). Вы выполните 4 задания.',
        introTime: 5,
        task1: {
          text: 'ЕГЭ, вариант 2, задание 1.\nТекст для чтения (премиум).',
          prepTime: 90,
          recTime: 90
        },
        task2: {
          infoText: 'ЕГЭ, вариант 2, задание 2.\nПо каждому ключевому слову задайте вопрос (премиум).',
          questionText: 'Ключевое слово {n}. Сформулируйте вопрос.',
          prepGap: 5,
          recTime: 20,
          questionAudio: [
            'audio/ege2_t2_q1.mp3',
            'audio/ege2_t2_q2.mp3',
            'audio/ege2_t2_q3.mp3',
            'audio/ege2_t2_q4.mp3'
          ]
        },
        task3: {
          infoText: 'ЕГЭ, вариант 2, задание 3.\n5 вопросов (премиум-аудио).',
          questionText: 'Вопрос {n}.',
          prepGap: 3,
          recTime: 40,
          questionAudio: [
            'audio/ege2_t3_q1.mp3',
            'audio/ege2_t3_q2.mp3',
            'audio/ege2_t3_q3.mp3',
            'audio/ege2_t3_q4.mp3',
            'audio/ege2_t3_q5.mp3'
          ]
        },
        task4: {
          text: 'ЕГЭ, вариант 2, задание 4.\nМонолог (премиум).',
          prepTime: 150,
          recTime: 180
        }
      },
      3: {
        introText: 'ЕГЭ, вариант 3 (PREMIUM). Вы выполните 4 задания.',
        introTime: 5,
        task1: {
          text: 'ЕГЭ, вариант 3, задание 1.\nТекст для чтения (премиум).',
          prepTime: 90,
          recTime: 90
        },
        task2: {
          infoText: 'ЕГЭ, вариант 3, задание 2.\nВопросы по ключевым словам (премиум).',
          questionText: 'Ключевое слово {n}. Сформулируйте вопрос.',
          prepGap: 5,
          recTime: 20,
          questionAudio: [
            'audio/ege3_t2_q1.mp3',
            'audio/ege3_t2_q2.mp3',
            'audio/ege3_t2_q3.mp3',
            'audio/ege3_t2_q4.mp3'
          ]
        },
        task3: {
          infoText: 'ЕГЭ, вариант 3, задание 3.\n5 вопросов (премиум-аудио).',
          questionText: 'Вопрос {n}.',
          prepGap: 3,
          recTime: 40,
          questionAudio: [
            'audio/ege3_t3_q1.mp3',
            'audio/ege3_t3_q2.mp3',
            'audio/ege3_t3_q3.mp3',
            'audio/ege3_t3_q4.mp3',
            'audio/ege3_t3_q5.mp3'
          ]
        },
        task4: {
          text: 'ЕГЭ, вариант 3, задание 4.\nМонолог (премиум).',
          prepTime: 150,
          recTime: 180
        }
      }
    }
  }
};
