const API_TOKEN = 'a122c11578195d89c24bc4c1ecabf8bf';

/**
 * Receives the Get Request from Bubble and execute the prepareContractCustomer function or the prepareContractInstaller function.
 * @param   e event with the parameters 
 * @return  content of the event 
 */
function doGet(e) {
  if(e.parameter.name === 'remove'){
    e.parameter.folder === 'installer' && e.parameter.key === 'UAT' && remove(INSTALLER_UAT_FOLDER, e.parameter.id, e.parameter.filename);
    e.parameter.folder === 'installer' && e.parameter.key === 'prod' && remove(INSTALLER_FOLDER, e.parameter.id, e.parameter.filename);
    e.parameter.folder === 'customer' && e.parameter.key === 'UAT' && remove(CUSTOMER_UAT_FOLDER, e.parameter.id, e.parameter.filename);
    e.parameter.folder === 'customer' && e.parameter.key === 'prod' && remove(CUSTOMER_FOLDER, e.parameter.id, e.parameter.filename);
    // e.parameter.folder === 'installer' ?  remove('1PSatAXl3hOdnFyHEv0qkD7Ju57Te21wr', e.parameter.id, e.parameter.filename) : remove('1pmvGhudb9ohHakmNgL67UF6AYcxQ_7uR', e.parameter.id, e.parameter.filename);
    return ContentService.createTextOutput('Success: Contracts deleted succefully');
  } 
  if(e.parameter.name === 'customer') {
    let response = prepareContractsCustomer(e.parameter.loanID, e.parameter.key);
    return ContentService.createTextOutput(response);
  } 
  else if(e.parameter.name === 'installer') {
    let response =  prepareContractsInstaller(e.parameter.companyID, e.parameter.key);
    return ContentService.createTextOutput(response);
  }
  else if (e.parameter.name === 'test') return doTest();
  return ContentService.createTextOutput(JSON.stringify(e));

}


/**
 * Copies a template file into the provided destination folder.
 * If a file with the same name already exists at the destination, it will be trashed.
 * 
 * @param   File    originalFile      File to copy.
 * @param   Folder  destinationFolder Folder to save a copy into
 * @param   string  filename          Name to give to the copied file.
 * @return  Document  The copied template.
 */
function copyTemplate(originalFile, destinationFolder, filename) {

  // Trash any existing files with this name.
  let files =  destinationFolder.getFiles();
  while(files.hasNext()) {
    let file = files.next();
    if (file.getName().includes(`${filename}.pdf`)) return 'Error';
  }
  // Make the copy.
  var copy = originalFile
    .makeCopy(destinationFolder)
    .setName(filename);
  return DocumentApp.openById(copy.getId());

}

/**
 * Retrieves data from the Bubble API.
 * 
 * Currently, no error handling is implemented.
 * 
 * @param   string  endpoint  The API endpoint to call.
 * @param   object  payload   Data to POST to the endpoint.
 * @return  object  The parsed JSON response from the endpoint.
 */
function getDataFromAPI(endpoint, payload, contentType) {

    var response = UrlFetchApp.fetch(
      endpoint, 
      {
        'method' : 'post',
        'contentType': contentType,
        'muteHttpExceptions': true,
        'headers': {
          'Authorization': 'Bearer ' + API_TOKEN,
        },
        'payload': payload
      }
    );

  return JSON.parse(response).response;

}

/**
 * Returns the documentation folder for the loan with the specified ID.
 * If the folder does not exist, it will be created.
 * 
 * @param   string  lastName  The customer's last name.
 * @param   string  firstName The customer's first name.
 * @param   string  loadId    The loan's Bubble Unique ID.
 * @return  Folder
 */
// function getLoanFolder(folderId, name, Id) {

//   var folder, 
//       root = DriveApp.getFolderById(folderId),
//       folderName = name +' [' + Id + ']',
//       search = root.getFoldersByName(folderName);

//   if (search.hasNext()) {
//     folder = search.next();
//   } else {
//     folder = root.createFolder(folderName);
//   }

//   return folder;

// }

function getOrCreateFolder(rootFolderId, folderName, id) {

  let rootFolder = DriveApp.getFolderById(rootFolderId);
  let folderIterator = rootFolder.getFolders();
  let flag = false;
  while(folderIterator.hasNext()) {
    let tempFolder = folderIterator.next();
     if(tempFolder.getName().includes(folderName && id)) {
        flag = true;
        return  tempFolder;
    } 
  }
  if(!folderIterator.hasNext() && flag === false) {
    let userFolder = rootFolder.createFolder(folderName + ' [' + id + ']');
    return userFolder;
    
  }
}
/**
 * Replaces text within the body of the provided document.
 * 
 * @param   Document  doc           The document to replace text within.
 * @param   object    replacements  Key/value list of placeholders/replacements.
 * @return  void
 */
function replaceData(doc, replacements) {

  var body = doc.getBody();
  var header = doc.getHeader();
  // Replace placeholders with retrieved data.
  for (let [placeholder, replacement] of Object.entries(replacements)) {
    header && header.replaceText('{{' + placeholder + '}}', replacement);
    body.replaceText('{{' + placeholder + '}}', replacement);
  }
  doc.saveAndClose();
  return Logger.log(typeof(doc));
  
}

/**
 * Saves the provided document as a PDF.
 * 
 * The PDF file will have the same name as the original
 * document, with a '.pdf' extension.
 * 
 * @param   Document  doc    Document to save as a PDF.
 * @param   Folder    folder Folder in which to save the PDF.
 * @return  void
 */
function saveAsPDF(doc, folder) {

  let name = (Utilities.formatDate(new Date(), "GMT+1", "yyy/MM/dd") + ' ' + 'noah ' + doc.getName() + '.pdf');
  var pdfContent = doc.getAs('application/pdf')
    .setName(name);
  var file = folder.createFile(pdfContent);
  let files = folder.getFiles()
  while(files.hasNext()) {
   let file = files.next()
   !file.getName().includes('pdf') && file.setTrashed(true)
  }
  Logger.log(file.getUrl())
  return file.getUrl();

}


function remove(folderID, id, filename) {
  let root = DriveApp.getFolderById(folderID);
  let folders = root.getFolders();
  while (folders.hasNext()) {
    let newFolder = folders.next();
    if (newFolder.getName().includes(id)) {
      let files = newFolder.getFiles();
      while (files.hasNext()) {
        let file = files.next();
        file.getName().includes(filename) && file.setTrashed(true);
      }
    }
  }
}


function checkReplacements(replacements) {

  for (const [key, value] of Object.entries(replacements)) {
    if(value === undefined) return `Error: Missing data: ${key}`;
  }

}
