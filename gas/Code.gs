/**
 * homeworkanyaimoon - Google Apps Script Backend
 * Main entry point for GAS Web App
 * 
 * Sheets structure:
 *  - Users        : uid | name | grade | avatar | created_at
 *  - Sessions     : session_id | uid | date | score | total | duration_sec | created_at
 *  - Answers      : answer_id | session_id | uid | question_json | answer | is_correct | time_taken_sec | created_at
 *  - Questions    : question_id | grade | topic | operation | difficulty | content_json | is_active | created_at
 *  - Levels       : level_id | grade | topic | level_no | name | pass_score | created_at
 *  - Achievements : achv_id | uid | achv_key | earned_at
 *  - Stars        : uid | total_stars | updated_at
 */

// ─── CORS & Router ────────────────────────────────────────────────────────────

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var output;
  try {
    var action = e.parameter.action || (e.postData && JSON.parse(e.postData.contents).action);
    var params = e.parameter;
    var body   = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    switch (action) {
      // Users
      case 'getUsers':       output = getUsers();               break;
      case 'createUser':     output = createUser(body);         break;
      case 'getUser':        output = getUser(params.uid);      break;

      // Sessions & Answers
      case 'createSession':  output = createSession(body);      break;
      case 'saveAnswers':    output = saveAnswers(body);        break;
      case 'getSessions':    output = getSessions(params.uid);  break;

      // Questions
      case 'getQuestions':   output = getQuestions(params);     break;
      case 'createQuestion': output = createQuestion(body);     break;

      // Levels & Progress
      case 'getLevels':      output = getLevels(params.grade);  break;
      case 'getUserProgress':output = getUserProgress(params.uid); break;

      // Stars & Achievements
      case 'getStars':       output = getStars(params.uid);     break;
      case 'addStars':       output = addStars(body);           break;

      // Admin
      case 'getDashboard':   output = getDashboard(params.uid); break;

      default:
        output = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    output = { success: false, error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
