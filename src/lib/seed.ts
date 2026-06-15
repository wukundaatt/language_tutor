import { getDb, initDb } from './db';

export function seedDatabase(): void {
  initDb();
  const db = getDb();

  const badgeCount = db.prepare('SELECT COUNT(*) as count FROM badges').get() as { count: number };
  if (badgeCount.count > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  console.log('Seeding database...');

  // Languages
  const insertLang = db.prepare('INSERT INTO languages (code, name, flag_emoji) VALUES (?, ?, ?)');
  const langs = [
    ['english', 'English', '🇬🇧'],
    ['french', 'Français', '🇫🇷'],
    ['spanish', 'Español', '🇪🇸'],
    ['russian', 'Русский', '🇷🇺'],
    ['german', 'Deutsch', '🇩🇪'],
  ];
  for (const l of langs) insertLang.run(...l);

  // Badges
  const insertBadge = db.prepare('INSERT INTO badges (name, icon, description, condition) VALUES (?, ?, ?, ?)');
  const badges = [
    ['初来乍到', 'rocket', '完成你的第一节课程', 'complete_first_lesson'],
    ['连续打卡7天', 'flame', '连续学习7天', 'streak_7'],
    ['连续打卡30天', 'zap', '连续学习30天', 'streak_30'],
    ['单词达人', 'book-open', '掌握100个单词', 'master_100_words'],
    ['语法专家', 'check-circle', '完成50道语法题', 'complete_50_grammar'],
    ['听力高手', 'headphones', '完成20次听力训练', 'complete_20_listening'],
    ['口语新星', 'mic', '完成10次口语跟读', 'complete_10_speaking'],
    ['积分收割机', 'trophy', '累计获得1000经验值', 'xp_1000'],
    ['挑战达人', 'target', '完成7次每日挑战', 'complete_7_challenges'],
    ['学霸', 'graduation-cap', '完成5门课程', 'complete_5_courses'],
  ];
  for (const b of badges) insertBadge.run(...b);

  // Courses for English A1
  const courseColors = ['#1e3a5f', '#2d6a4f', '#7b2d8b', '#b45309', '#991b1b'];
  const courseLevels = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const courseTitles: Record<string, string[]> = {
    english: ['English Basics', 'Everyday English', 'Intermediate Communication', 'Advanced Fluency', 'Mastery Level'],
    french: ['Français Débutant', 'Français Quotidien', 'Communication Intermédiaire', 'Français Avancé', 'Maîtrise'],
    spanish: ['Español Básico', 'Español Cotidiano', 'Comunicación Intermedia', 'Español Avanzado', 'Dominio'],
    russian: ['Русский для начинающих', 'Повседневный русский', 'Средний уровень', 'Продвинутый русский', 'Мастерство'],
    german: ['Deutsch Grundlagen', 'Alltagsdeutsch', 'Mittelstufe', 'Fortgeschritten', 'Meisterschaft'],
  };

  const wordBanks: Record<string, { word: string; phonetic: string; translation: string; pos: string; example: string; exampleTrans: string }[]> = {
    english: [
      { word: 'hello', phonetic: '/həˈloʊ/', translation: '你好', pos: 'interjection', example: 'Hello, how are you?', exampleTrans: '你好，你好吗？' },
      { word: 'goodbye', phonetic: '/ɡʊdˈbaɪ/', translation: '再见', pos: 'interjection', example: 'Goodbye, see you tomorrow!', exampleTrans: '再见，明天见！' },
      { word: 'thank you', phonetic: '/θæŋk juː/', translation: '谢谢', pos: 'expression', example: 'Thank you for your help.', exampleTrans: '谢谢你的帮助。' },
      { word: 'please', phonetic: '/pliːz/', translation: '请', pos: 'adverb', example: 'Please sit down.', exampleTrans: '请坐。' },
      { word: 'sorry', phonetic: '/ˈsɒri/', translation: '对不起', pos: 'adjective', example: "I'm sorry for being late.", exampleTrans: '对不起我迟到了。' },
      { word: 'friend', phonetic: '/frend/', translation: '朋友', pos: 'noun', example: 'She is my best friend.', exampleTrans: '她是我最好的朋友。' },
      { word: 'family', phonetic: '/ˈfæməli/', translation: '家庭', pos: 'noun', example: 'I love my family.', exampleTrans: '我爱我的家人。' },
      { word: 'water', phonetic: '/ˈwɔːtər/', translation: '水', pos: 'noun', example: 'Can I have a glass of water?', exampleTrans: '我可以要一杯水吗？' },
      { word: 'food', phonetic: '/fuːd/', translation: '食物', pos: 'noun', example: 'The food is delicious.', exampleTrans: '食物很美味。' },
      { word: 'house', phonetic: '/haʊs/', translation: '房子', pos: 'noun', example: 'This is my house.', exampleTrans: '这是我的房子。' },
      { word: 'book', phonetic: '/bʊk/', translation: '书', pos: 'noun', example: 'I am reading a book.', exampleTrans: '我正在读一本书。' },
      { word: 'school', phonetic: '/skuːl/', translation: '学校', pos: 'noun', example: 'I go to school every day.', exampleTrans: '我每天去学校。' },
      { word: 'happy', phonetic: '/ˈhæpi/', translation: '快乐的', pos: 'adjective', example: 'I am very happy today.', exampleTrans: '我今天很开心。' },
      { word: 'big', phonetic: '/bɪɡ/', translation: '大的', pos: 'adjective', example: 'That is a big dog.', exampleTrans: '那是一只大狗。' },
      { word: 'small', phonetic: '/smɔːl/', translation: '小的', pos: 'adjective', example: 'The cat is small.', exampleTrans: '这只猫很小。' },
    ],
    french: [
      { word: 'bonjour', phonetic: '/bɔ̃ʒuʁ/', translation: '你好', pos: 'interjection', example: 'Bonjour, comment allez-vous?', exampleTrans: '你好，你好吗？' },
      { word: 'merci', phonetic: '/mɛʁsi/', translation: '谢谢', pos: 'interjection', example: 'Merci beaucoup!', exampleTrans: '非常感谢！' },
      { word: 'au revoir', phonetic: '/o ʁəvwaʁ/', translation: '再见', pos: 'expression', example: 'Au revoir, à demain!', exampleTrans: '再见，明天见！' },
      { word: 's\'il vous plaît', phonetic: '/sil vu plɛ/', translation: '请', pos: 'expression', example: 'Un café, s\'il vous plaît.', exampleTrans: '请来一杯咖啡。' },
      { word: 'ami', phonetic: '/ami/', translation: '朋友', pos: 'noun', example: 'Il est mon meilleur ami.', exampleTrans: '他是我最好的朋友。' },
      { word: 'famille', phonetic: '/famij/', translation: '家庭', pos: 'noun', example: "J'aime ma famille.", exampleTrans: '我爱我的家人。' },
      { word: 'eau', phonetic: '/o/', translation: '水', pos: 'noun', example: "Je voudrais de l'eau.", exampleTrans: '我想要一些水。' },
      { word: 'maison', phonetic: '/mɛzɔ̃/', translation: '房子', pos: 'noun', example: "C'est ma maison.", exampleTrans: '这是我的房子。' },
      { word: 'livre', phonetic: '/livʁ/', translation: '书', pos: 'noun', example: 'Je lis un livre.', exampleTrans: '我在读一本书。' },
      { word: 'école', phonetic: '/ekɔl/', translation: '学校', pos: 'noun', example: "Je vais à l'école.", exampleTrans: '我去学校。' },
    ],
    spanish: [
      { word: 'hola', phonetic: '/ˈola/', translation: '你好', pos: 'interjection', example: '¡Hola! ¿Cómo estás?', exampleTrans: '你好！你好吗？' },
      { word: 'gracias', phonetic: '/ˈɡɾaθjas/', translation: '谢谢', pos: 'interjection', example: 'Muchas gracias por tu ayuda.', exampleTrans: '非常感谢你的帮助。' },
      { word: 'adiós', phonetic: '/aˈðjos/', translation: '再见', pos: 'interjection', example: '¡Adiós, hasta luego!', exampleTrans: '再见，回头见！' },
      { word: 'por favor', phonetic: '/poɾ faˈβoɾ/', translation: '请', pos: 'expression', example: 'Un café, por favor.', exampleTrans: '请来一杯咖啡。' },
      { word: 'amigo', phonetic: '/aˈmiɣo/', translation: '朋友', pos: 'noun', example: 'Él es mi mejor amigo.', exampleTrans: '他是我最好的朋友。' },
      { word: 'familia', phonetic: '/faˈmilja/', translation: '家庭', pos: 'noun', example: 'Amo a mi familia.', exampleTrans: '我爱我的家人。' },
      { word: 'agua', phonetic: '/ˈaɣwa/', translation: '水', pos: 'noun', example: '¿Me das un vaso de agua?', exampleTrans: '可以给我一杯水吗？' },
      { word: 'casa', phonetic: '/ˈkasa/', translation: '房子', pos: 'noun', example: 'Esta es mi casa.', exampleTrans: '这是我的房子。' },
      { word: 'libro', phonetic: '/ˈliβɾo/', translation: '书', pos: 'noun', example: 'Estoy leyendo un libro.', exampleTrans: '我在读一本书。' },
      { word: 'escuela', phonetic: '/esˈkwela/', translation: '学校', pos: 'noun', example: 'Voy a la escuela todos los días.', exampleTrans: '我每天去学校。' },
    ],
    russian: [
      { word: 'здравствуйте', phonetic: '/ˈzdrastvʊjtʲe/', translation: '你好（正式）', pos: 'interjection', example: 'Здравствуйте, как дела?', exampleTrans: '您好，最近怎么样？' },
      { word: 'спасибо', phonetic: '/spɐˈsʲibə/', translation: '谢谢', pos: 'interjection', example: 'Большое спасибо!', exampleTrans: '非常感谢！' },
      { word: 'до свидания', phonetic: '/də svʲɪˈdanʲɪjə/', translation: '再见', pos: 'expression', example: 'До свидания, до завтра!', exampleTrans: '再见，明天见！' },
      { word: 'пожалуйста', phonetic: '/pɐˈʐalʊstə/', translation: '请/不客气', pos: 'adverb', example: 'Дайте воды, пожалуйста.', exampleTrans: '请给我水。' },
      { word: 'друг', phonetic: '/druk/', translation: '朋友', pos: 'noun', example: 'Он мой лучший друг.', exampleTrans: '他是我最好的朋友。' },
      { word: 'семья', phonetic: '/sʲɪˈmʲja/', translation: '家庭', pos: 'noun', example: 'Я люблю свою семью.', exampleTrans: '我爱我的家人。' },
      { word: 'вода', phonetic: '/vɐˈda/', translation: '水', pos: 'noun', example: 'Можно стакан воды?', exampleTrans: '可以要一杯水吗？' },
      { word: 'дом', phonetic: '/dom/', translation: '房子', pos: 'noun', example: 'Это мой дом.', exampleTrans: '这是我的房子。' },
      { word: 'книга', phonetic: '/ˈknʲiɡə/', translation: '书', pos: 'noun', example: 'Я читаю книгу.', exampleTrans: '我在读书。' },
      { word: 'школа', phonetic: '/ˈʂkolə/', translation: '学校', pos: 'noun', example: 'Я хожу в школу.', exampleTrans: '我去学校。' },
    ],
    german: [
      { word: 'hallo', phonetic: '/haˈloː/', translation: '你好', pos: 'interjection', example: 'Hallo, wie geht es Ihnen?', exampleTrans: '你好，你好吗？' },
      { word: 'danke', phonetic: '/ˈdaŋkə/', translation: '谢谢', pos: 'interjection', example: 'Vielen Dank!', exampleTrans: '非常感谢！' },
      { word: 'auf Wiedersehen', phonetic: '/aʊf ˈviːdɐzeːən/', translation: '再见', pos: 'expression', example: 'Auf Wiedersehen, bis morgen!', exampleTrans: '再见，明天见！' },
      { word: 'bitte', phonetic: '/ˈbɪtə/', translation: '请/不客气', pos: 'adverb', example: 'Ein Kaffee, bitte.', exampleTrans: '请来一杯咖啡。' },
      { word: 'Freund', phonetic: '/fʁɔʏnt/', translation: '朋友', pos: 'noun', example: 'Er ist mein bester Freund.', exampleTrans: '他是我最好的朋友。' },
      { word: 'Familie', phonetic: '/faˈmiːliə/', translation: '家庭', pos: 'noun', example: 'Ich liebe meine Familie.', exampleTrans: '我爱我的家人。' },
      { word: 'Wasser', phonetic: '/ˈvasɐ/', translation: '水', pos: 'noun', example: 'Kann ich ein Glas Wasser haben?', exampleTrans: '可以要一杯水吗？' },
      { word: 'Haus', phonetic: '/haʊs/', translation: '房子', pos: 'noun', example: 'Das ist mein Haus.', exampleTrans: '这是我的房子。' },
      { word: 'Buch', phonetic: '/buːx/', translation: '书', pos: 'noun', example: 'Ich lese ein Buch.', exampleTrans: '我在读一本书。' },
      { word: 'Schule', phonetic: '/ˈʃuːlə/', translation: '学校', pos: 'noun', example: 'Ich gehe zur Schule.', exampleTrans: '我去学校。' },
    ],
  };

  // Create courses with units and lessons for each language (A1 level only for brevity, but enough data)
  const insertCourse = db.prepare('INSERT INTO courses (language_id, title, description, level, cover_color, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
  const insertUnit = db.prepare('INSERT INTO units (course_id, title, description, sort_order) VALUES (?, ?, ?, ?)');
  const insertLesson = db.prepare('INSERT INTO lessons (unit_id, title, type, duration_minutes, sort_order) VALUES (?, ?, ?, ?, ?)');
  const insertWord = db.prepare('INSERT INTO words (lesson_id, word, phonetic, translation, part_of_speech, example_sentence, example_translation) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertGrammar = db.prepare('INSERT INTO grammar_questions (lesson_id, type, question, options_json, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)');
  const insertListening = db.prepare('INSERT INTO listening_questions (lesson_id, audio_url, transcript, type, question, options_json, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertSpeaking = db.prepare('INSERT INTO speaking_prompts (lesson_id, text, translation, phonetic, audio_url, difficulty) VALUES (?, ?, ?, ?, ?, ?)');

  const allLangs = db.prepare('SELECT id, code FROM languages').all() as { id: number; code: string }[];

  const langDescriptions: Record<string, string> = {
    english: 'Start your English learning journey with basic vocabulary and simple conversations.',
    french: 'Commencez votre voyage en français avec le vocabulaire de base.',
    spanish: 'Comienza tu viaje en español con vocabulario básico.',
    russian: 'Начните изучение русского языка с базовой лексики.',
    german: 'Beginnen Sie Ihre Deutschreise mit Grundwortschatz.',
  };

  for (const lang of allLangs) {
    const levelIndex = 0; // A1
    const desc = langDescriptions[lang.code] || 'Begin your language learning journey.';

    const courseResult = insertCourse.run(
      lang.id,
      `${lang.code === 'english' ? 'English' : lang.code === 'french' ? 'Français' : lang.code === 'spanish' ? 'Español' : lang.code === 'russian' ? 'Русский' : 'Deutsch'} ${courseLevels[levelIndex]}`,
      desc,
      courseLevels[levelIndex],
      courseColors[levelIndex % courseColors.length],
      levelIndex
    );
    const courseId = courseResult.lastInsertRowid as number;

    // Unit 1: Basics
    const unit1Result = insertUnit.run(courseId, '单元 1: 基础入门', '学习基础问候语和常用词汇', 0);
    const unit1Id = unit1Result.lastInsertRowid as number;

    // Lesson 1: Word (Vocabulary)
    const wordLessonResult = insertLesson.run(unit1Id, '基础词汇', 'word', 15, 0);
    const wordLessonId = wordLessonResult.lastInsertRowid as number;

    const words = wordBanks[lang.code] || wordBanks.english;
    for (const w of words.slice(0, 10)) {
      insertWord.run(wordLessonId, w.word, w.phonetic, w.translation, w.pos, w.example, w.exampleTrans);
    }

    // Lesson 2: Grammar
    const grammarOptions1 = JSON.stringify(['am', 'is', 'are', 'be']);
    const grammarLessonResult = insertLesson.run(unit1Id, '基础语法 - 动词 to be', 'grammar', 15, 1);
    const grammarLessonId = grammarLessonResult.lastInsertRowid as number;

    const grammarQs = [
      {
        type: 'choice',
        question: 'She ___ a teacher.',
        options_json: JSON.stringify(['am', 'is', 'are', 'be']),
        correct_answer: 'is',
        explanation: '第三人称单数使用 is。',
      },
      {
        type: 'choice',
        question: 'They ___ students.',
        options_json: JSON.stringify(['am', 'is', 'are', 'be']),
        correct_answer: 'are',
        explanation: '复数主语使用 are。',
      },
      {
        type: 'choice',
        question: 'I ___ happy.',
        options_json: JSON.stringify(['am', 'is', 'are', 'be']),
        correct_answer: 'am',
        explanation: '第一人称 I 使用 am。',
      },
      {
        type: 'fill',
        question: 'He ___ (be) from China.',
        options_json: JSON.stringify(['is']),
        correct_answer: 'is',
        explanation: 'He 是第三人称单数。',
      },
      {
        type: 'fill',
        question: 'We ___ (be) friends.',
        options_json: JSON.stringify(['are']),
        correct_answer: 'are',
        explanation: 'We 是复数主语。',
      },
    ];
    for (const q of grammarQs) {
      insertGrammar.run(grammarLessonId, q.type, q.question, q.options_json, q.correct_answer, q.explanation);
    }

    // Lesson 3: Listening
    const listeningLessonResult = insertLesson.run(unit1Id, '听力训练 - 问候', 'listening', 10, 2);
    const listeningLessonId = listeningLessonResult.lastInsertRowid as number;

    const listeningQs = [
      {
        audio_url: '/audio/hello.mp3',
        transcript: 'Hello! How are you?',
        type: 'choice',
        question: 'What did the speaker say?',
        options_json: JSON.stringify(['Hello! How are you?', 'Goodbye! See you later!', 'What is your name?', 'Where are you from?']),
        correct_answer: 'Hello! How are you?',
      },
      {
        audio_url: '/audio/name.mp3',
        transcript: 'My name is John.',
        type: 'choice',
        question: 'What is his name?',
        options_json: JSON.stringify(['Tom', 'John', 'Mike', 'Peter']),
        correct_answer: 'John',
      },
      {
        audio_url: '/audio/thanks.mp3',
        transcript: 'Thank you very much!',
        type: 'choice',
        question: 'What expression did you hear?',
        options_json: JSON.stringify(['Sorry', 'Please', 'Thank you', 'Goodbye']),
        correct_answer: 'Thank you',
      },
    ];
    for (const q of listeningQs) {
      insertListening.run(listeningLessonId, q.audio_url, q.transcript, q.type, q.question, q.options_json, q.correct_answer);
    }

    // Lesson 4: Speaking
    const speakingLessonResult = insertLesson.run(unit1Id, '口语跟读 - 基础句型', 'speaking', 10, 3);
    const speakingLessonId = speakingLessonResult.lastInsertRowid as number;

    const speakingPrompts = [
      { text: 'Hello, how are you?', translation: '你好，你好吗？', phonetic: '/həˈloʊ, haʊ ɑːr juː/', audio_url: '/audio/hello.mp3', difficulty: 1 },
      { text: 'My name is...', translation: '我的名字是...', phonetic: '/maɪ neɪm ɪz/', audio_url: '/audio/myname.mp3', difficulty: 1 },
      { text: 'Nice to meet you.', translation: '很高兴认识你。', phonetic: '/naɪs tuː miːt juː/', audio_url: '/audio/nice.mp3', difficulty: 1 },
      { text: 'Thank you very much.', translation: '非常感谢。', phonetic: '/θæŋk juː ˈveri mʌtʃ/', audio_url: '/audio/thanks.mp3', difficulty: 1 },
      { text: 'Where are you from?', translation: '你来自哪里？', phonetic: '/wer ɑːr juː frʌm/', audio_url: '/audio/where.mp3', difficulty: 1 },
    ];
    for (const s of speakingPrompts) {
      insertSpeaking.run(speakingLessonId, s.text, s.translation, s.phonetic, s.audio_url, s.difficulty);
    }
  }

  console.log('Database seeded successfully!');
}

// Run directly
seedDatabase();