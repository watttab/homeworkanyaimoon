/**
 * Database.gs — Google Sheets CRUD layer
 * All sheet names and column mappings are defined here.
 */

// ─── Config ───────────────────────────────────────────────────────────────────

var SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');

var SHEETS = {
  USERS:        'Users',
  SESSIONS:     'Sessions',
  ANSWERS:      'Answers',
  QUESTIONS:    'Questions',
  LEVELS:       'Levels',
  ACHIEVEMENTS: 'Achievements',
  STARS:        'Stars',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSheet(name) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow(sheetName, obj) {
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) { return obj[h] !== undefined ? obj[h] : ''; });
  sheet.appendRow(row);
  return obj;
}

function generateId(prefix) {
  return prefix + '_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 6);
}

// ─── Users ────────────────────────────────────────────────────────────────────

function getUsers() {
  var users = sheetToObjects(getSheet(SHEETS.USERS));
  return { success: true, data: users };
}

function getUser(uid) {
  var users = sheetToObjects(getSheet(SHEETS.USERS));
  var user  = users.find(function(u) { return u.uid === uid; });
  return user ? { success: true, data: user } : { success: false, error: 'User not found' };
}

function createUser(body) {
  var uid  = generateId('u');
  var now  = new Date().toISOString();
  var user = {
    uid:        uid,
    name:       body.name || '',
    grade:      body.grade || '',
    avatar:     body.avatar || 'default',
    created_at: now,
  };
  appendRow(SHEETS.USERS, user);
  return { success: true, data: user };
}

function updateUser(body) {
  var sheet = getSheet(SHEETS.USERS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var uidCol = headers.indexOf('uid');
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][uidCol] === body.uid) {
      if (body.name) sheet.getRange(i + 1, headers.indexOf('name') + 1).setValue(body.name);
      if (body.grade) sheet.getRange(i + 1, headers.indexOf('grade') + 1).setValue(body.grade);
      if (body.avatar) sheet.getRange(i + 1, headers.indexOf('avatar') + 1).setValue(body.avatar);
      return { success: true, data: body };
    }
  }
  return { success: false, error: 'User not found' };
}

function deleteUser(body) {
  var sheet = getSheet(SHEETS.USERS);
  var data = sheet.getDataRange().getValues();
  var uidCol = data[0].indexOf('uid');
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][uidCol] === body.uid) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'User not found' };
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

function createSession(body) {
  var id  = generateId('s');
  var now = new Date().toISOString();
  var session = {
    session_id:   id,
    uid:          body.uid,
    date:         body.date || now.split('T')[0],
    score:        0,
    total:        0,
    duration_sec: 0,
    created_at:   now,
  };
  appendRow(SHEETS.SESSIONS, session);
  return { success: true, data: session };
}

function getSessions(uid) {
  var all = sheetToObjects(getSheet(SHEETS.SESSIONS));
  var filtered = uid ? all.filter(function(s) { return s.uid === uid; }) : all;
  return { success: true, data: filtered };
}

// ─── Answers ──────────────────────────────────────────────────────────────────

function saveAnswers(body) {
  // body.answers = [{ question_json, answer, is_correct, time_taken_sec }]
  var now = new Date().toISOString();
  (body.answers || []).forEach(function(a) {
    appendRow(SHEETS.ANSWERS, {
      answer_id:     generateId('a'),
      session_id:    body.session_id,
      uid:           body.uid,
      question_json: JSON.stringify(a.question_json),
      answer:        a.answer,
      is_correct:    a.is_correct ? 'TRUE' : 'FALSE',
      time_taken_sec:a.time_taken_sec || 0,
      created_at:    now,
    });
  });
  // Update session score
  updateSessionScore(body.session_id, body.answers);
  return { success: true };
}

function updateSessionScore(sessionId, answers) {
  var sheet = getSheet(SHEETS.SESSIONS);
  var data  = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('session_id');
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === sessionId) {
      var correctCount = (answers || []).filter(function(a) { return a.is_correct; }).length;
      var scoreCol = headers.indexOf('score') + 1;
      var totalCol = headers.indexOf('total') + 1;
      sheet.getRange(i + 1, scoreCol).setValue(correctCount);
      sheet.getRange(i + 1, totalCol).setValue((answers || []).length);
      break;
    }
  }
}

// ─── Questions ────────────────────────────────────────────────────────────────

function getQuestions(params) {
  var all = sheetToObjects(getSheet(SHEETS.QUESTIONS));
  var filtered = all.filter(function(q) {
    if (q.is_active !== 'TRUE' && q.is_active !== true) return false;
    if (params.grade && q.grade !== params.grade) return false;
    if (params.topic && q.topic !== params.topic) return false;
    if (params.difficulty && q.difficulty !== params.difficulty) return false;
    return true;
  });
  return { success: true, data: filtered };
}

function createQuestion(body) {
  var id  = generateId('q');
  var now = new Date().toISOString();
  var q = {
    question_id:   id,
    grade:         body.grade || '',
    topic:         body.topic || '',
    operation:     body.operation || '',
    difficulty:    body.difficulty || 'easy',
    content_json:  JSON.stringify(body.content_json || {}),
    is_active:     'TRUE',
    created_at:    now,
  };
  appendRow(SHEETS.QUESTIONS, q);
  return { success: true, data: q };
}

// ─── Levels ───────────────────────────────────────────────────────────────────

function getLevels(grade) {
  var all = sheetToObjects(getSheet(SHEETS.LEVELS));
  var filtered = grade ? all.filter(function(l) { return l.grade === grade; }) : all;
  return { success: true, data: filtered };
}

function createLevel(body) {
  var id = generateId('LVL');
  var now = new Date().toISOString();
  var level = {
    level_id: id,
    grade: body.grade || '',
    topic: body.topic || '',
    level_no: body.level_no || 1,
    name: body.name || '',
    pass_score: body.pass_score || 7,
    created_at: now
  };
  appendRow(SHEETS.LEVELS, level);
  return { success: true, data: level };
}

function updateLevel(body) {
  var sheet = getSheet(SHEETS.LEVELS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('level_id');
  
  if (idCol === -1) return { success: false, error: 'Invalid sheet format' };

  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === body.level_id) {
      if (body.grade !== undefined) data[i][headers.indexOf('grade')] = body.grade;
      if (body.topic !== undefined) data[i][headers.indexOf('topic')] = body.topic;
      if (body.level_no !== undefined) data[i][headers.indexOf('level_no')] = body.level_no;
      if (body.name !== undefined) data[i][headers.indexOf('name')] = body.name;
      if (body.pass_score !== undefined) data[i][headers.indexOf('pass_score')] = body.pass_score;
      
      sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
      return { success: true, data: data[i] };
    }
  }
  return { success: false, error: 'Level not found' };
}

function deleteLevel(body) {
  var sheet = getSheet(SHEETS.LEVELS);
  var data = sheet.getDataRange().getValues();
  var idCol = data[0].indexOf('level_id');
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === body.level_id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Level deleted' };
    }
  }
  return { success: false, error: 'Level not found' };
}

function getUserProgress(uid) {
  var answers  = sheetToObjects(getSheet(SHEETS.ANSWERS)).filter(function(a) { return a.uid === uid; });
  var sessions = sheetToObjects(getSheet(SHEETS.SESSIONS)).filter(function(s) { return s.uid === uid; });
  return { success: true, data: { answers: answers, sessions: sessions } };
}

// ─── Stars & Achievements ─────────────────────────────────────────────────────

function getStars(uid) {
  var all  = sheetToObjects(getSheet(SHEETS.STARS));
  var row  = all.find(function(r) { return r.uid === uid; });
  return { success: true, data: row || { uid: uid, total_stars: 0 } };
}

function addStars(body) {
  var sheet   = getSheet(SHEETS.STARS);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var uidCol  = headers.indexOf('uid');
  var starCol = headers.indexOf('total_stars') + 1;
  var now     = new Date().toISOString();

  for (var i = 1; i < data.length; i++) {
    if (data[i][uidCol] === body.uid) {
      var current = Number(data[i][starCol - 1]) || 0;
      sheet.getRange(i + 1, starCol).setValue(current + (body.stars || 0));
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(now);
      return { success: true, total_stars: current + body.stars };
    }
  }
  // New row
  appendRow(SHEETS.STARS, { uid: body.uid, total_stars: body.stars || 0, updated_at: now });
  return { success: true, total_stars: body.stars || 0 };
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function getDashboard(uid) {
  var sessionsResult  = getSessions(uid);
  var starsResult     = getStars(uid);
  var progressResult  = getUserProgress(uid);

  return {
    success: true,
    data: {
      sessions: sessionsResult.data,
      stars:    starsResult.data,
      progress: progressResult.data,
    },
  };
}
