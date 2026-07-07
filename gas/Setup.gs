/**
 * Setup.gs — ตั้งค่า Google Sheets ครั้งแรก
 * รัน setupSpreadsheet() ครั้งเดียวเพื่อสร้างชีทและ header ทั้งหมด
 */

var SHEET_SCHEMAS = {
  Users:        ['uid', 'name', 'grade', 'avatar', 'created_at'],
  Sessions:     ['session_id', 'uid', 'date', 'score', 'total', 'duration_sec', 'created_at'],
  Answers:      ['answer_id', 'session_id', 'uid', 'question_json', 'answer', 'is_correct', 'time_taken_sec', 'created_at'],
  Questions:    ['question_id', 'grade', 'topic', 'operation', 'difficulty', 'content_json', 'is_active', 'created_at'],
  Levels:       ['level_id', 'grade', 'topic', 'level_no', 'name', 'pass_score', 'created_at'],
  Achievements: ['achv_id', 'uid', 'achv_key', 'earned_at'],
  Stars:        ['uid', 'total_stars', 'updated_at'],
};

function setupSpreadsheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Object.keys(SHEET_SCHEMAS).forEach(function(name) {
    var headers = SHEET_SCHEMAS[name];
    var sheet   = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    // Set header row
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    // Format header
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#4285F4')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  });

  // Seed default levels
  seedDefaultLevels(ss);

  Logger.log('✅ Setup complete!');
}

function seedDefaultLevels(ss) {
  var sheet = ss.getSheetByName('Levels');
  var now   = new Date().toISOString();

  var defaultLevels = [
    // KG2 — อนุบาล 2
    ['lvl_kg2_add_1', 'kg2', 'addition',    1, 'บวกเลข 1-5',        7, now],
    ['lvl_kg2_add_2', 'kg2', 'addition',    2, 'บวกเลข 1-10',       7, now],
    ['lvl_kg2_sub_1', 'kg2', 'subtraction', 1, 'ลบเลข 1-5',         7, now],
    ['lvl_kg2_sub_2', 'kg2', 'subtraction', 2, 'ลบเลข 1-10',        7, now],
    // P2 — ป.2
    ['lvl_p2_add_1',  'p2',  'addition',    1, 'บวกเลข 1-20',       7, now],
    ['lvl_p2_add_2',  'p2',  'addition',    2, 'บวกเลข 1-100',      7, now],
    ['lvl_p2_sub_1',  'p2',  'subtraction', 1, 'ลบเลข 1-20',        7, now],
    ['lvl_p2_sub_2',  'p2',  'subtraction', 2, 'ลบเลข 1-100',       7, now],
    ['lvl_p2_mul_1',  'p2',  'multiplication',1,'สูตรคูณแม่ 1-5',  7, now],
    ['lvl_p2_mul_2',  'p2',  'multiplication',2,'สูตรคูณแม่ 6-12', 7, now],
  ];

  // Only seed if no rows exist
  if (sheet.getLastRow() <= 1) {
    defaultLevels.forEach(function(row) {
      sheet.appendRow(row);
    });
    Logger.log('✅ Default levels seeded');
  }
}
