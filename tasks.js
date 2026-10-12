const TASK_BANK = {
  oge: {
    free: {
      1: {
        introText: 'ОГЭ. Вариант 1. Вы выполните три задания. Следуйте инструкциям на экране.',
        introTime: 5,

        task1: {
          text:
            'Задание 1.\n\n' +
            'Прочитайте текст вслух.\n\n' +
            'Modern technology plays an important role in our everyday life. ' +
            'People use smartphones to communicate, study, find information and plan their day. ' +
            'However, it is important to use technology wisely and not forget about real communication.',
          prepTime: 90,
          recTime: 120
        },

        task2: {
          infoText:
            'Задание 2.\n\n' +
            'Вы услышите шесть вопросов. После каждого вопроса дайте развёрнутый ответ.',
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
          text:
            'Задание 3.\n\n' +
            'Подготовьте монологическое высказывание на тему «Мой любимый вид отдыха».\n\n' +
            'В своём высказывании расскажите:\n' +
            '• какой вид отдыха вы предпочитаете;\n' +
            '• где и с кем вы обычно отдыхаете;\n' +
            '• почему этот вид отдыха вам нравится;\n' +
            '• как отдых влияет на человека.',
          prepTime: 90,
          recTime: 120
        }
      },

      2: {
        introText: 'ОГЭ. Вариант 2. Вы выполните три задания. Следуйте инструкциям на экране.',
        introTime: 5,

        task1: {
          text:
            'Задание 1.\n\n' +
            'Прочитайте текст вслух.\n\n' +
            'Many teenagers enjoy doing sports. Regular physical activity helps people stay healthy, ' +
            'become stronger and feel more confident. Team sports are also a good way to make new friends ' +
            'and learn how to work together.',
          prepTime: 90,
          recTime: 120
        },

        task2: {
          infoText:
            'Задание 2.\n\n' +
            'Вы услышите шесть вопросов. После каждого вопроса дайте развёрнутый ответ.',
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
          text:
            'Задание 3.\n\n' +
            'Подготовьте монологическое высказывание на тему «Спорт в моей жизни».\n\n' +
            'В своём высказывании расскажите:\n' +
            '• занимаетесь ли вы спортом;\n' +
            '• какой вид спорта вам нравится;\n' +
            '• почему людям важно заниматься спортом;\n' +
            '• какие спортивные мероприятия популярны в вашей школе.',
          prepTime: 90,
          recTime: 120
        }
      }
    },

    premium: {
      3: {
        introText: 'ОГЭ. Вариант 3. Вы выполните три задания. Следуйте инструкциям на экране.',
        introTime: 5,

        task1: {
          text:
            'Задание 1.\n\n' +
            'Прочитайте текст вслух.\n\n' +
            'Travelling gives people an opportunity to discover new places and learn about different cultures. ' +
            'Some people prefer travelling by plane because it is fast, while others choose trains or cars ' +
            'because they can enjoy the journey itself.',
          prepTime: 90,
          recTime: 120
        },

        task2: {
          infoText:
            'Задание 2.\n\n' +
            'Вы услышите шесть вопросов. После каждого вопроса дайте развёрнутый ответ.',
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
          text:
            'Задание 3.\n\n' +
            'Подготовьте монологическое высказывание на тему «Путешествие, которое я хотел(а) бы совершить».\n\n' +
            'В своём высказывании расскажите:\n' +
            '• куда вы хотели бы поехать;\n' +
            '• с кем вы хотели бы путешествовать;\n' +
            '• что вы хотели бы увидеть;\n' +
            '• почему путешествия полезны.',
          prepTime: 90,
          recTime: 120
        }
      },

      4: {
        introText: 'ОГЭ. Вариант 4. Вы выполните три задания. Следуйте инструкциям на экране.',
        introTime: 5,

        task1: {
          text:
            'Задание 1.\n\n' +
            'Прочитайте текст вслух.\n\n' +
            'Reading is still an important part of modern life. Books can entertain us, teach us new things ' +
            'and help us understand other people better. Today readers can choose between paper books, ' +
            'electronic books and audiobooks.',
          prepTime: 90,
          recTime: 120
        },

        task2: {
          infoText:
            'Задание 2.\n\n' +
            'Вы услышите шесть вопросов. После каждого вопроса дайте развёрнутый ответ.',
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
          text:
            'Задание 3.\n\n' +
            'Подготовьте монологическое высказывание на тему «Книга, которую я могу рекомендовать».\n\n' +
            'В своём высказывании расскажите:\n' +
            '• какие книги вы любите читать;\n' +
            '• какую книгу вы можете рекомендовать;\n' +
            '• о чём эта книга;\n' +
            '• почему чтение важно.',
          prepTime: 90,
          recTime: 120
        }
      }
    }
  },

  ege: {
    free: {
      1: {
        introText: 'ЕГЭ. Вариант 1. Вы выполните четыре задания. Следуйте инструкциям на экране.',
        introTime: 5,

        task1: {
          text:
            'Задание 1.\n\n' +
            'Read the text aloud.\n\n' +
            'Learning foreign languages is useful for people of all ages. It helps them communicate with people ' +
            'from other countries, travel more confidently and understand different cultures. ' +
            'A foreign language can also create new opportunities for education and work.',
          prepTime: 90,
          recTime: 90
        },

        task2: {
          infoText:
            'Задание 2.\n\n' +
            'Study the advertisement. Ask four direct questions to find out about the information you need.',
          questionText:
            'Ключевое слово {n}. Сформулируйте прямой вопрос на английском языке.',
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
          infoText:
            'Задание 3.\n\n' +
            'Вы услышите пять вопросов интервьюера. После каждого вопроса дайте развёрнутый ответ.',
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
          text:
            'Задание 4.\n\n' +
            'Подготовьте развёрнутое монологическое высказывание на тему «The best way to spend a weekend».\n\n' +
            'Скажите:\n' +
            '• what you usually do at weekends;\n' +
            '• what activities are popular among teenagers;\n' +
            '• whether weekends should be active or relaxing;\n' +
            '• give your opinion and explain it.',
          prepTime: 150,
          recTime: 180
        }
      }
    },

    premium: {
      2: {
        introText: 'ЕГЭ. Вариант 2. Вы выполните четыре задания. Следуйте инструкциям на экране.',
        introTime: 5,

        task1: {
          text:
            'Задание 1.\n\n' +
            'Read the text aloud.\n\n' +
            'Environmental problems affect everyone. People can help the planet by saving water and electricity, ' +
            'recycling waste and using public transport more often. Even small actions can make a real difference ' +
            'when many people take part.',
          prepTime: 90,
          recTime: 90
        },

        task2: {
          infoText:
            'Задание 2.\n\n' +
            'Study the advertisement. Ask four direct questions to find out about the information you need.',
          questionText:
            'Ключевое слово {n}. Сформулируйте прямой вопрос на английском языке.',
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
          infoText:
            'Задание 3.\n\n' +
            'Вы услышите пять вопросов интервьюера. После каждого вопроса дайте развёрнутый ответ.',
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
          text:
            'Задание 4.\n\n' +
            'Подготовьте развёрнутое монологическое высказывание на тему «Living in a city or in the countryside».\n\n' +
            'Скажите:\n' +
            '• where you would prefer to live;\n' +
            '• what advantages city life has;\n' +
            '• what advantages country life has;\n' +
            '• give your opinion and explain it.',
          prepTime: 150,
          recTime: 180
        }
      },

      3: {
        introText: 'ЕГЭ. Вариант 3. Вы выполните четыре задания. Следуйте инструкциям на экране.',
        introTime: 5,

        task1: {
          text:
            'Задание 1.\n\n' +
            'Read the text aloud.\n\n' +
            'Healthy habits are formed gradually. A balanced diet, regular exercise and enough sleep help people ' +
            'feel energetic and stay productive. It is also important to take breaks from screens and spend time outdoors.',
          prepTime: 90,
          recTime: 90
        },

        task2: {
          infoText:
            'Задание 2.\n\n' +
            'Study the advertisement. Ask four direct questions to find out about the information you need.',
          questionText:
            'Ключевое слово {n}. Сформулируйте прямой вопрос на английском языке.',
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
          infoText:
            'Задание 3.\n\n' +
            'Вы услышите пять вопросов интервьюера. После каждого вопроса дайте развёрнутый ответ.',
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
          text:
            'Задание 4.\n\n' +
            'Подготовьте развёрнутое монологическое высказывание на тему «Technology in education».\n\n' +
            'Скажите:\n' +
            '• what technologies students use for learning;\n' +
            '• how technology can help teachers and students;\n' +
            '• what problems technology may cause;\n' +
            '• give your opinion and explain it.',
          prepTime: 150,
          recTime: 180
        }
      }
    }
  }
};