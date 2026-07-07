/**
 * Questions.gs — Logic สร้างโจทย์คณิตศาสตร์ (ไม่ใช้ AI สำหรับการคำนวณ)
 * ใช้ logic ธรรมดา generate โจทย์บวก/ลบ/คูณ/หาร
 * Gemini API ใช้สำหรับสร้างโจทย์แบบมีบริบท/เรื่องราวเท่านั้น
 */

var GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
var GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ─── Grade configs ────────────────────────────────────────────────────────────

var GRADE_CONFIG = {
  'kg2': {   // อนุบาล 2 (อายุ ~5 ปี)
    addition:    { min: 1, max: 10 },
    subtraction: { min: 1, max: 10 },
    maxResult:   10,
  },
  'p2': {    // ป.2 (อายุ ~8 ปี)
    addition:    { min: 1, max: 100 },
    subtraction: { min: 1, max: 100 },
    multiplication: { min: 1, max: 12 },
    maxResult:   100,
  },
};

// ─── Core question generators ─────────────────────────────────────────────────

function generateArithmeticQuestions(grade, operation, difficulty, count) {
  count = count || 10;
  var config = GRADE_CONFIG[grade];
  if (!config) return { success: false, error: 'Unknown grade: ' + grade };

  var questions = [];
  for (var i = 0; i < count; i++) {
    var q = generateSingleQuestion(config, operation, difficulty);
    if (q) questions.push(q);
  }
  return { success: true, data: questions };
}

function generateSingleQuestion(config, operation, difficulty) {
  var cfg = config[operation];
  if (!cfg) return null;

  // Scale range by difficulty
  var scale = difficulty === 'hard' ? 1 : difficulty === 'medium' ? 0.7 : 0.4;
  var max   = Math.max(2, Math.round(cfg.max * scale));
  var min   = cfg.min;

  var a, b, answer, questionText;

  switch (operation) {
    case 'addition':
      a      = randInt(min, max);
      b      = randInt(min, max);
      answer = a + b;
      questionText = a + ' + ' + b + ' = ?';
      break;

    case 'subtraction':
      a      = randInt(min, max);
      b      = randInt(min, a);     // ensure b <= a (no negatives for kids)
      answer = a - b;
      questionText = a + ' - ' + b + ' = ?';
      break;

    case 'multiplication':
      a      = randInt(1, Math.min(12, max));
      b      = randInt(1, Math.min(12, max));
      answer = a * b;
      questionText = a + ' × ' + b + ' = ?';
      break;

    case 'division':
      b      = randInt(1, Math.min(10, max));
      answer = randInt(1, Math.min(10, max));
      a      = b * answer;          // ensure clean division
      questionText = a + ' ÷ ' + b + ' = ?';
      break;

    default:
      return null;
  }

  // Generate wrong choices for Multiple Choice
  var choices = generateChoices(answer, operation);

  return {
    type:        'arithmetic',
    operation:   operation,
    difficulty:  difficulty,
    a:           a,
    b:           b,
    answer:      answer,
    questionText:questionText,
    choices:     choices,
  };
}

function generateChoices(correct, operation) {
  var wrongs = new Set();
  while (wrongs.size < 3) {
    var delta = randInt(1, 5) * (Math.random() < 0.5 ? 1 : -1);
    var wrong = correct + delta;
    if (wrong !== correct && wrong >= 0) wrongs.add(wrong);
  }
  var all = [correct].concat(Array.from(wrongs));
  return shuffle(all);
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

// ─── Gemini API — Contextual (word problem) generation ───────────────────────

/**
 * ใช้ Gemini สร้างโจทย์แบบมีเรื่องราว (word problem) เท่านั้น
 * ไม่ใช้ AI กับส่วนคำนวณโดยตรง
 *
 * @param {object} params - { grade, operation, a, b, answer, theme }
 * @returns {object} { success, story }
 */
function generateWordProblem(params) {
  if (!GEMINI_API_KEY) return { success: false, error: 'GEMINI_API_KEY not set' };

  var prompt = buildWordProblemPrompt(params);
  var payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 200, temperature: 0.8 },
  };

  try {
    var resp = UrlFetchApp.fetch(GEMINI_API_URL + '?key=' + GEMINI_API_KEY, {
      method:      'post',
      contentType: 'application/json',
      payload:     JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    var json = JSON.parse(resp.getContentText());
    var story = json.candidates &&
                json.candidates[0] &&
                json.candidates[0].content &&
                json.candidates[0].content.parts[0].text;
    return { success: true, story: story || '' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function buildWordProblemPrompt(p) {
  var gradeLabel = p.grade === 'kg2' ? 'อนุบาล 2 (อายุ 5 ปี)' : 'ประถม 2 (อายุ 8 ปี)';
  var opLabel    = { addition: 'บวก', subtraction: 'ลบ', multiplication: 'คูณ', division: 'หาร' }[p.operation] || p.operation;
  var theme      = p.theme || 'สัตว์น่ารัก';

  return [
    'สร้างโจทย์คณิตศาสตร์แบบมีเรื่องราว (word problem) สำหรับเด็ก' + gradeLabel,
    'โดยใช้ธีม: ' + theme,
    'การคำนวณ: ' + p.a + ' ' + opLabel + ' ' + p.b + ' = ' + p.answer,
    'ข้อกำหนด:',
    '- เขียนเป็นภาษาไทย ใช้ภาษาง่าย สั้น (1-2 ประโยค)',
    '- อย่าเฉลยคำตอบในโจทย์',
    '- ใช้ชื่อตัวละครสมมติ เช่น หมีน้อย กระต่าย ฯลฯ',
    '- ตอบเฉพาะโจทย์เท่านั้น ไม่ต้องมีคำอธิบายเพิ่ม',
  ].join('\n');
}

// ─── Daily assignment generator ───────────────────────────────────────────────

/**
 * สร้างชุดโจทย์ประจำวัน 10 ข้อ ปรับระดับความยากอัตโนมัติตามประวัติ
 */
function generateDailyAssignment(uid, grade) {
  var progressResult = getUserProgress(uid);
  var recentAnswers  = (progressResult.data.answers || []).slice(-20);

  // คำนวณ accuracy จาก 20 ข้อล่าสุด
  var accuracy = recentAnswers.length > 0
    ? recentAnswers.filter(function(a) { return a.is_correct === 'TRUE' || a.is_correct === true; }).length / recentAnswers.length
    : 0.5;

  var difficulty = accuracy >= 0.8 ? 'hard' : accuracy >= 0.5 ? 'medium' : 'easy';

  // เลือก operations ตาม grade
  var ops = grade === 'kg2'
    ? ['addition', 'subtraction']
    : ['addition', 'subtraction', 'multiplication'];

  var questions = [];
  var perOp = Math.ceil(10 / ops.length);

  ops.forEach(function(op) {
    var result = generateArithmeticQuestions(grade, op, difficulty, perOp);
    if (result.success) {
      questions = questions.concat(result.data);
    }
  });

  // จำกัด 10 ข้อ และ shuffle
  questions = shuffle(questions).slice(0, 10);
  return { success: true, data: questions, difficulty: difficulty, accuracy: accuracy };
}
