export const generateGoogleFormScript = (
  webhookUrl: string,
) => `function onFormSubmit(e) {
  var formResponse = e.response;
  var itemResponses = formResponse.getItemResponses();

  // Build responses object
  var responses = {};
  for (var i = 0; i < itemResponses.length; i++) {
    var itemResponse = itemResponses[i];
    responses[itemResponse.getItem().getTitle()] = itemResponse.getResponse();
  }

  // Prepare webhook payload
  var payload = {
    formId: e.source.getId(),
    formTitle: e.source.getTitle(),
    responseId: formResponse.getId(),
    timestamp: formResponse.getTimestamp(),
    respondentEmail: formResponse.getRespondentEmail(),
    responses: responses
  };

  // Send to webhook
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true,
    'headers': {
      'ngrok-skip-browser-warning': 'true'
    }
  };

  var WEBHOOK_URL = '${webhookUrl}';

  try {
    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var statusCode = response.getResponseCode();
    var responseBody = response.getContentText();

    if (statusCode < 200 || statusCode >= 300) {
      throw new Error('Webhook returned ' + statusCode + ': ' + responseBody);
    }
  } catch(error) {
    console.error('Webhook failed:', error);
  }
}`;