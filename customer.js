const ENDPOINT_LOAN = 'https://noah.energy/api/1.1/wf/get_loan_details';
const ENDPOINT_LOAN_VERSION_TEST = 'https://noah.energy/version-test/api/1.1/wf/get_loan_details';
const CUSTOMER_CONTRACT_ENDPOIN = 'https://noah.energy/api/1.1/wf/upload_contract_customer'
const CUSTOMER_CONTRACT_ENDPOIN_VERSION_TEST = 'https://noah.energy/version-test/api/1.1/wf/upload_contract_customer'
const CUSTOMER_FOLDER = '1pmvGhudb9ohHakmNgL67UF6AYcxQ_7uR';
const CUSTOMER_UAT_FOLDER = '1O66qQrlXifRWbYDifWFHnZAeUxTHbLvH'
const TEMPLATE_PRECONTRACTUAL_CUSTOMER = '1f2X3GlinCqGgTxfa4MD8Qh_3Ja9uYT3QvlkOykE5Rp8';
const TEMPLATE_AGREEMENT_CUSTOMER = '1XnWPvYYhULjozN7QjPHTKZkR_LzJ5UzzM2GerL1ZKPI';
const FILENAME_PRECONTRACTUAL_CUSTOMER = 'Informacion Normalizada Europea Credito Al Consumo - noah energy'
const FILENAME_AGREEMENT_CUSTOMER = 'Acuerdo del Plan de Pago - noah energy'

function prepareContractsCustomer(loanID, key) {

const loanId = loanID;

  // Retrieve loan details from the portal.
  const data = getDataFromAPI(
      key === 'UAT' ? ENDPOINT_LOAN_VERSION_TEST : ENDPOINT_LOAN, 
      {
          'loan': loanId
      },
      'application/x-www-form-urlencoded'
    );
  // Build list of template replacements.
  if (!data) return 'Error, please try again later';
  let refactorDisbursement = undefined;
  let refactorPayback = undefined;
  if (data.payment_plan_disbursement === 'Installer') {
    refactorDisbursement = 'Noah paga al instalador en tu nombre después de que ambos hayáis confirmado que la instalación ha sido completada';
    refactorPayback =  'El primer pago se tomará en la primera fecha de pago mensual una vez se haya completado la instalación de tu sistema de energía.'
  }
  if(data.payment_plan_disbursement === 'Customer') {
    refactorDisbursement = 'Noah ingresará los fondos asociados al plan de pago en la cuenta bancaria que nos hayas indicado durante el proceso de solicitud una vez hayas aceptado el Acuerdo de financiación.'
    refactorPayback = 'El primer pago se tomará en la primera fecha de pago mensual que nos hayas indicado una vez te hayamos transferido los fondos a la cuenta bancaria indicada.' 
  };
  const replacements = {
    'user.first_name': data.Customer_FirstName,
    'user.surname': data.Customer_Surname,
    'Application_Date': Utilities.formatDate(new Date(data.Application_Date), "GMT+1", "dd/MM/yyyy"),
    'user.street_address': data.Customer_StreetAddress,
    'user.city': data.Customer_City,
    'user.phone_number': data.user_phone_number,
    'user.nif': data.Customer_Nif,
    'user.province': data.Customer_Province,
    'loan.unique_id': loanId,
    'payment_plan.term': data.payment_plan_type === 'Buy now pay later (BNPL)' ? data.payment_plan_term.replace(/[^0-9]/g,'') : '120',
    'payment_plan.total_amount': data.payment_plan_type === 'Buy now pay later (BNPL)' ?  data.payment_plan_loan_amount : (data.loanAmount + (data.loan_monthly_repay * 120) - data.loanAmount).toFixed(2),
    'payment_plan.monthly_amount': (Number(data.payment_plan_monthly_amount)).toFixed(2),
    'loan.monthly_fee': '5.99',
    'loan.total_fee': data.payment_plan_type === 'Buy now pay later (BNPL)' ? Number(data.loan_term * 5.99).toFixed(2) : (data.loan_monthly_repay * 120 - data.loanAmount).toFixed(2),
    'loan.installation_date': Utilities.formatDate(new Date(data.loan_installation_date), "GMT+1", "dd/MM/yyyy"),
    'loan.installation_address': data.loan_installation_address,
    'user.residential_address': data.Customer_StreetAddress,
    'user.email': data.Customer_Email,
    'loan.company': data.loan_company,
    'payment_plan.APR': data.payment_plan_type === 'Long loan (LL)' ? data.loan_TAE : new Intl.NumberFormat('de-DE', { maximumSignificantDigits: 3 }).format((((1 + RATE(data.payment_plan_term, -data.payment_plan_monthly_amount, data.payment_plan_total_amount)) ** 12 - 1) * 100).toFixed(2)), // arg1 payment period, arg2     monthly fee, arg3 total loan amount
    'payment_plan.RRP': data.loan_amount,
    'user.residence': data.user_residence,
    'loan.monthly_payment': (Number(data.loan_monthly_amount)).toFixed(2),
    'user.id_type': data.user_id_type,
    'user.id_number': data.user_id_number,
    'user.id_expiry': Utilities.formatDate(new Date(data.user_id_expiry), "GMT+1", "dd/MM/yyyy"),
    'user.nationality': 'Español',
    'user.source_of_income': data.user_source_of_income === 'Retired' ? 'Pension' : 'Empleo',
    'loan.panel_manufacturer': data.loan_panel_manufacturer,
    'loan.panel_model': data.loan_panel_model,
    'loan.inverter_manufacturer': data.loan_inverter_manufacturer,
    'loan.inverter_model': data.loan_inverter_model,
    'loan.total_repayable': data.payment_plan_type === 'Buy now pay later (BNPL)' ? data.total_repayable : (data.loanAmount + (data.loan_monthly_repay * 120) - data.loanAmount).toFixed(2),
    'loan.monthly_amount': data.loan_monthly_amount,
    'payment_plan.type': data.payment_plan_type === 'Long loan (LL)' ? 'Préstamo con tipo de interés fijo' : 'Préstamo sin intereses',
    'loan.interest_rate': data.payment_plan_type === 'Long loan (LL)' ? data.loan_interest_rate + '%' : '0.00%',
    'payment_plan.disbursement':refactorDisbursement,
    'payment_plan.payback': refactorPayback,
    'loan.interest_rate_eu': data.payment_plan_type === 'Long loan (LL)' ?  ((data.loan_monthly_repay - 5.99) * 120 - data.loanAmount).toFixed(2) : 0
  };
  let response = checkReplacements(replacements);
  if(response && response.includes('Error')) return response;
  // Open template and save a copy into the loan's folder.
  const INE = createDocuments(loanId, replacements, TEMPLATE_PRECONTRACTUAL_CUSTOMER, FILENAME_PRECONTRACTUAL_CUSTOMER, data, key);
  const contract = createDocuments(loanId, replacements, TEMPLATE_AGREEMENT_CUSTOMER, FILENAME_AGREEMENT_CUSTOMER, data, key);

  if(contract !== 'Error' && INE !== 'Error'){
    const payload = {
      loanID: loanID,
      "contract": {
        "filename": FILENAME_AGREEMENT_CUSTOMER + '.pdf',
        "contents": Utilities.base64Encode(contract.contract.getBlob().getBytes()),
        "private": false,
      },
      "INE": {
        "filename": FILENAME_PRECONTRACTUAL_CUSTOMER + '.pdf',
        "contents": Utilities.base64Encode(INE.contract.getBlob().getBytes()),
        "private": false,
      },
    };
    getDataFromAPI(key === 'UAT' ? CUSTOMER_CONTRACT_ENDPOIN_VERSION_TEST : CUSTOMER_CONTRACT_ENDPOIN, JSON.stringify(payload), 'application/json');
  }

  contract === 'Error' || INE === 'Error' ? returnV = 'Error: contracts already exits' : returnV = 'Success: contract generated: ' + contract.returnV + ' ' + INE.returnV;
  return returnV;
}

function createDocuments(loanId, replacements, templateId, templateName, data, key) {

  let name = data.Customer_Surname + ' ' + data.Customer_FirstName
  var folder = getOrCreateFolder(key === 'UAT' ? CUSTOMER_UAT_FOLDER : CUSTOMER_FOLDER, name, loanId),
      template = DriveApp.getFileById(templateId),
      contract = copyTemplate(template, folder, templateName);

      if(contract === 'Error') {
        return 'Error';
      } else {
        // Replace placeholders with retrieved data.
        replaceData(contract, replacements);
        // Save into the customer's folder.
        let returnV = saveAsPDF(contract, folder);
        return {contract, returnV};
      }

}

/**
 * 
 * @param   periods the payment period in monthsa (6, 12, 24, 30, 36).
 * @param   payment the payment that must make in each period 
 * @param   present  the total loan amount.
 * @param   future[optional]  The future value, or desired cash balance after last payment.
 * @param   type[optional]    When payments are due. 0 = end of period. 1 = beginning of period.
 * @param   guess[optional]  Your guess on the rate. Default is 10%
 */
function RATE (periods, payment, present, future, type, guess) {
    guess = guess === undefined ? 0.01 : guess;
    future = future === undefined ? 0 : future;
    type = type === undefined ? 0 : type;

    // Set maximum epsilon for end of iteration
    var epsMax = 1e-10;

    // Set maximum number of iterations
    var iterMax = 128;

    // Implement Newton's method
    var y,
        y0,
        y1,
        x0,
        x1 = 0,
        f = 0,
        i = 0;
    var rate = guess;
    if (Math.abs(rate) < epsMax) {
        y =
            present * (1 + periods * rate) +
            payment * (1 + rate * type) * periods +
            future;
    } else {
        f = Math.exp(periods * Math.log(1 + rate));
        y = present * f + payment * (1 / rate + type) * (f - 1) + future;
    }
    y0 = present + payment * periods + future;
    y1 = present * f + payment * (1 / rate + type) * (f - 1) + future;
    i = x0 = 0;
    x1 = rate;
    while (Math.abs(y0 - y1) > epsMax && i < iterMax) {
        rate = (y1 * x0 - y0 * x1) / (y1 - y0);
        x0 = x1;
        x1 = rate;
        if (Math.abs(rate) < epsMax) {
            y =
                present * (1 + periods * rate) +
                payment * (1 + rate * type) * periods +
                future;
        } else {
            f = Math.exp(periods * Math.log(1 + rate));
            y = present * f + payment * (1 / rate + type) * (f - 1) + future;
        }
        y0 = y1;
        y1 = y;
        ++i;
    }
    return rate;
};
