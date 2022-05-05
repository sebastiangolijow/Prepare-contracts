// const MAIN_TEST_TITLE_ = 'QUnitGS2 Test';
// var QUnit = QUnitGS2.QUnit;

// let testEndpoint = 'https://noah.energy/version-test/api/1.1/obj/Company';
// const endpoint = 'https://noah.energy/version-test/api/1.1/wf/get_installer_details';
// let template = DriveApp.getFileById('1uzV4u4k_Y93Sly8I7ZD4B3fvR27rkfTxOWt6VoFDlc8');
// let folder = DriveApp.getFolderById('1rJThPkTKZPMAzayV3VAMbLMdDC2JrX2q');
// const replacements = {
//     'company.registered_name': 'testing',
//     'company.registration_number': 'testing',
//     'user.first_name': 'testing',
// };
// const payload = {
//   title:'contracts',
//   "contract": {
//     "filename": FILENAME_AGREEMENT_INSTALLER,
//     "contents": Utilities.base64Encode(template.getBlob().getBytes()),
//     "private": false,
//   },
// };

// function doTest() {
//   QUnit.config.title = MAIN_TEST_TITLE_
//   Logger.log('test');
//   QUnitGS2.init();
//   tests();
//   QUnit.start();
//   return QUnitGS2.getHtml()
// }

// function tests() {
// let contract = copyTemplate(template, folder, 'testing');
//   QUnit.module( "group a" );

//   QUnit.test("Prepare Contracts Testing", function(assert) {
//     assert.equal(copyTemplate(template, folder, 'Testing'), 'Document');
//     assert.ok(replaceData(contract, replacements), 'non-empty string')
//     assert.ok(getLoanFolder('1rJThPkTKZPMAzayV3VAMbLMdDC2JrX2q', 'Testing', '1234'), 'non-empty string');
//     assert.ok(saveAsPDF(contract, folder), 'non-empty string');
//     assert.ok(getDataFromAPI(
//       ENDPOINT_INSTALLER, 
//       {
//           'company': '1635536612552x566891881786507260'
//       }, 
//       'application/x-www-form-urlencoded'
//     ), 'non-empty string' );
//    });

// }
 

// function getResultsFromServer() {
//   return QUnitGS2.getResultsFromServer()
// }

// let TEMPLATE_INSTALLER_BASE = '1l6dFsIKRGStT7fZkFJz3jlrFLrQU6twMVEZJ9sDRtcQ';
// let TABLE_BNPL =  '1tiuLu00mjr3OhaZne0B7nauXmWLnQvMrg4xsr1LIthc';
// let TABLE_LL = '1GNJYgaHZhf47zsgqZhzMrBTSVHfjIewpI__vwdhGKKQ';

// function mergeGoogleDocs() {
//   var docIDs = [TEMPLATE_INSTALLER_BASE, TABLE_BNPL, TABLE_LL];
//   var baseDoc = DocumentApp.openById(docIDs[0]);

//   var body = baseDoc.getActiveSection();

//   for (var i = 1; i < docIDs.length; ++i) {
//     var otherBody = DocumentApp.openById(docIDs[i]).getActiveSection();
//     var totalElements = otherBody.getNumChildren();
//     for (var j = 0; j < totalElements; ++j) {
//       var element = otherBody.getChild(j).copy();
//       var type = element.getType();
//       if (type == DocumentApp.ElementType.PARAGRAPH) body.appendParagraph(element);
//       else if (type == DocumentApp.ElementType.TABLE) body.appendTable(element);
//       else if (type == DocumentApp.ElementType.LIST_ITEM) body.appendListItem(element);
//       else throw Logger.log(new Error('Unknown element type: ' + type));
//     }
//   }
//   return Logger.log(baseDoc.getUrl())
// }

