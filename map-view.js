/**
 * map_view_gs.js
 * 地図表示用のスポットデータを取得する Google Apps Script
 */

// ★★★ ご自身のスプレッドシートIDに変更してください ★★★
const SPREADSHEET_ID = "1XWirleOXBpzKw-cvyl_FVbfoqhCiXmYCefoAFJzZMd8";
// ★★★ ご自身のシート名に変更してください ★★★
const SHEET_NAME = 'シート1';

/**
 * スプレッドシートの列インデックス定義
 * Spot List View_gs.js と同じ定義を基本とする
 * ★★★ 最新のシート構成に合わせてください ★★★
 */
const COL = {
  ID: 1,             // A列: ユニークID
  NAME: 2,           // B列: スポット名
  LAT: 3,            // C列: 緯度
  LNG: 4,            // D列: 経度
  ADDRESS: 5,        // E列: 住所
  PREFECTURE: 6,     // F列: 都道府県
  TEAM: 7,           // G列: ギルド種別
  ENEMY_GUILD: 8,    // H列: 敵ギルド名
  LEVEL: 9,          // I列: 拠点レベル
  OWNER: 10,         // J列: 登録者名
  IDENTIFIED: 11,    // K列: 特定状況
  IMAGE_URL: 12,     // L列: Google Drive 画像URL
  CREATED_AT: 13,    // M列: 登録日時 / 更新日時
  IMAGE_BASE64: 14,  // N列: 画像Base64データ (容量注意)
  DISPLAY_ORDER: 15  // O列: 表示順 (地図データとしては必須ではないが、念のため)
};

/**
 * Web アプリへの GET リクエストを処理
 * action=getMapSpots でスポットデータを返す
 */
function doGet(e) {
  let response = {};
  try {
    const action = e.parameter.action;
    Logger.log(`🚀 doGet (Map View) received action: ${action}`);

    if (action === 'getMapSpots') {
      const spotsData = getMapSpotData();
      response = { status: 'success', data: spotsData };
      Logger.log(`✅ Returning ${spotsData.length} spots for map.`);
    } else {
      throw new Error('Invalid action specified.');
    }

    return ContentService.createTextOutput(JSON.stringify(response))
                       .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log(`❌ Error in doGet (Map View): ${error.message}\nStack: ${error.stack}`);
    response = { status: 'error', message: error.message };
    return ContentService.createTextOutput(JSON.stringify(response))
                       .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * スプレッドシートから地図表示に必要なデータを取得する
 * @returns {Array<Object>} スポット情報の配列
 */
function getMapSpotData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!ss) throw new Error(`Spreadsheet not found with ID: ${SPREADSHEET_ID}`);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet not found with name: ${SHEET_NAME}`);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('No data found in sheet.');
    return []; // データがない場合は空配列を返す
  }

  // 必要な最大の列番号を計算 (Base64 を含める場合 COL.IMAGE_BASE64)
  // Base64が不要なら COL.CREATED_AT など、必要な最後の列にする
  const lastCol = COL.IMAGE_BASE64; // ★★★ Base64を含めるか判断 ★★★

  const range = sheet.getRange(2, 1, lastRow - 1, lastCol);
  const values = range.getValues();
  Logger.log(`📊 Read ${values.length} rows from sheet.`);

  const spots = values.map((row, index) => {
    // 緯度と経度を数値に変換
    const lat = parseFloat(row[COL.LAT - 1]);
    const lng = parseFloat(row[COL.LNG - 1]);

    // 緯度経度が有効な数値でない場合はスキップ
    if (isNaN(lat) || isNaN(lng)) {
      Logger.log(`⚠️ Skipping row ${index + 2} due to invalid Lat/Lng: ${row[COL.LAT - 1]}, ${row[COL.LNG - 1]}`);
      return null;
    }

    // Base64データを含めるかどうかの判断
    // 容量が大きいので、もし地図上で画像表示が必須でなければ、URLだけにするか、
    // もしくはBase64を返さないようにする方がパフォーマンスが良い場合があります。
    const includeBase64 = true; // ★★★ Base64を含める場合は true ★★★

    return {
      id: row[COL.ID - 1] || '',
      name: row[COL.NAME - 1] || '(名前なし)',
      lat: lat,
      lng: lng,
      address: row[COL.ADDRESS - 1] || '',
      prefecture: row[COL.PREFECTURE - 1] || '',
      team: row[COL.TEAM - 1] || 'neutral',
      enemyGuildName: row[COL.ENEMY_GUILD - 1] || '',
      level: row[COL.LEVEL - 1] || '',
      owner: row[COL.OWNER - 1] || '',
      identified: row[COL.IDENTIFIED - 1] || '未特定',
      imageUrl: row[COL.IMAGE_URL - 1] || '',
      createdAt: row[COL.CREATED_AT - 1] || '',
      // Base64データ (含める場合)
      imageBase64: includeBase64 ? (row[COL.IMAGE_BASE64 - 1] || '') : undefined
      // displayOrder: parseInt(row[COL.DISPLAY_ORDER - 1]) || 9999 // 必要であれば
    };
  }).filter(spot => spot !== null); // 緯度経度が無効だった null を除去

  return spots;
}

// --- doPost 関数 ---
// このファイルでは基本的に doGet のみ使用しますが、
// 将来的に地図から何かを更新する必要が出た場合のために残しておいても良いでしょう。
// 不要であれば削除しても構いません。
/*
function doPost(e) {
  // 地図からの更新処理が必要な場合はここに実装
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'POST method not implemented for map view.' }))
                     .setMimeType(ContentService.MimeType.JSON);
}
*/
