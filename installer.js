const ENDPOINT_INSTALLER = 'https://noah.energy/api/1.1/wf/get_installer_details';
const ENDPOINT_INSTALLER_VERSION_TEST = 'https://noah.energy/version-test/api/1.1/wf/get_installer_details';
const INSTALLER_FOLDER = '1PSatAXl3hOdnFyHEv0qkD7Ju57Te21wr';
const INSTALLER_UAT_FOLDER = '1rJThPkTKZPMAzayV3VAMbLMdDC2JrX2q';
const FILENAME_AGREEMENT_INSTALLER = 'Acuerdo del Plan de Pago - noah energy'
let TEMPLATE_INSTALLER_BASE = '1l6dFsIKRGStT7fZkFJz3jlrFLrQU6twMVEZJ9sDRtcQ';
let TABLE_BNPL =  '1tiuLu00mjr3OhaZne0B7nauXmWLnQvMrg4xsr1LIthc';
let TABLE_LL = '1GNJYgaHZhf47zsgqZhzMrBTSVHfjIewpI__vwdhGKKQ';

function prepareContractsInstaller(companyID, key) {
  const companyUniqueId = companyID;
  // Retrieve loan details from the portal.
  const data = getDataFromAPI(
    key === 'UAT' ? ENDPOINT_INSTALLER_VERSION_TEST : ENDPOINT_INSTALLER,
    {
      company: companyUniqueId,
    },
    "application/x-www-form-urlencoded"
  );
  if (!data) return 'Error, please try again later';
  // Build list of template replacements.
  const replacements = {
    "company.registered_name": data.company_registered_name,
    "company.registration_number": data.company_registration_number,
    "user.first_name": data.user_first_name,
    "user.last_name": data.user_last_name,
    "user.phone_number": data.user_phone_number,
    "user.email": data.user_email,
    "user.id_number": data.user_id_number,
    "user.id_type": data.user_id_type,
    "user.position": data.user_position,
    "user.id_expiry": Utilities.formatDate(new Date(data.user_id_expiry), "GMT+1", "dd/MM/yyyy"),
    "company.source_of_revenue": data.company_source_of_revenue,
    "company.economic_activity": data.company_economic_activity,
    "company.registered_address": data.company_registered_address,
    "company.iban": data.company_iban,
    "company.entity_type": data.company_entity_type || 'Autónomo',
    "company.price_6m": data.price_6m,
    "company.price_12m": data.price_12m,
    "company.price_18m": data.price_18m,
    "company.price_24m": data.price_24m,
    "company.price_30m": data.price_30m,
    "company.price_36m": data.price_36m,
    "company.payment_schedule": data.payment_schedule,
    "company.products_available":data.company_products_available
  };
  let response = checkReplacements(replacements);
  if(response && response.includes('Error')) return response;

  // Open template and save a copy into the loan's folder.
  var folder = getOrCreateFolder(
      key === 'UAT' ? INSTALLER_UAT_FOLDER : INSTALLER_FOLDER,
      data.company_registered_name,
      companyUniqueId
    ),
    template = DriveApp.getFileById('1l6dFsIKRGStT7fZkFJz3jlrFLrQU6twMVEZJ9sDRtcQ'),
    contract = copyTemplate(template, folder, FILENAME_AGREEMENT_INSTALLER);
    if (data.company_products_available.length === 1 && data.company_products_available[0] === 'Buy now pay later (BNPL)') {
      contract = mergeDocs(contract, TABLE_BNPL)
    }
    else if (data.company_products_available.length === 1 && data.company_products_available[0] === 'Long loan (LL)') {
      contract = mergeDocs(contract, TABLE_LL)
    } else {
      contract = mergeDocs(contract, TABLE_BNPL, TABLE_LL)
    }
  
  if (contract === "Error") {
    return "Error: contracts already exist";
  } else {
    // Replace placeholders with retrieved data.
    addOwners(contract, data.owners);
    replaceData(contract, replacements);
    // Save into the installer's folder.
    let returnV = saveAsPDF(contract, folder);
    return "Success: contract generated " + returnV;
  }

}

/**
 * Copies the beneficial owners data in to the table
 * @param   File contract file to overwrite.
 * @param   Array of objects owners List of beneficial owners coming from Bubble
 * @return  void
 */
function addOwners(contract, owners) {
  var body = contract.getBody();

  // Delete second row
  let table = body.getTables()[1];
  table.removeRow(1);
  // Make Row
  for (var i = 0; i < owners.length; i++) {
    let tableRow = table.appendTableRow();
    owners[i]["Full Name"] !== undefined &&
      tableRow.appendTableCell(owners[i]["Full Name"]);
    owners[i]["Nationality"] !== undefined &&
      tableRow.appendTableCell(LanguageApp.translate(owners[i]["Nationality"], 'en', 'es'));
    owners[i]["Residence"] !== undefined &&
      tableRow.appendTableCell(LanguageApp.translate(owners[i]["Residence"], 'en', 'es'));
    owners[i]["ID Type"] !== undefined &&
      owners[i]["ID Number"] !== undefined &&
      tableRow.appendTableCell(
        owners[i]["ID Type"] + ": " + owners[i]["ID Number"]
      );
    owners[i]["Shareholding"] !== undefined &&
      tableRow.appendTableCell(owners[i]["Shareholding"]);
  }
}


function mergeDocs(contract, table1, table2) {
  var docIDs = table2 ? [contract, table1, table2] : [contract, table1];
  var baseDoc = contract;

  var body = baseDoc.getActiveSection();

  for (var i = 1; i < docIDs.length; ++i) {
    var otherBody = DocumentApp.openById(docIDs[i]).getActiveSection();
    var totalElements = otherBody.getNumChildren();
    for (var j = 0; j < totalElements; ++j) {
      var element = otherBody.getChild(j).copy();
      var type = element.getType();
      if (type == DocumentApp.ElementType.PARAGRAPH) body.appendParagraph(element);
      else if (type == DocumentApp.ElementType.TABLE) body.appendTable(element);
      else if (type == DocumentApp.ElementType.LIST_ITEM) body.appendListItem(element);
      else throw Logger.log(new Error('Unknown element type: ' + type));
    }
  }
  return baseDoc
}

