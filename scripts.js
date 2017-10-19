function init() {
  // reset page
  document.getElementById('error-msg').style.display = "none";
  document.getElementById('details').style.display = "none";

  var url = window.location.href;
  if (url.indexOf('http://url/ticket_details.html') !== -1) {
    if (url.indexOf('access_token=') !== -1) {
      var access_token = readUrlParam(url, 'access_token');
      localStorage.setItem('zauth', access_token);
      var ticket_id = localStorage.getItem('ticket_id');
      document.getElementById('ticket-id').value = ticket_id;
      window.location.hash = "";
      makeRequest(access_token, ticket_id);
    }

    if (url.indexOf('error=') !== -1) {
      var error_desc = readUrlParam(url, 'error_description');
      var msg = 'Authorization error: ' + error_desc;
      showError(msg);
    }
  }
}

function getTicket(event) {
  event.preventDefault();
  document.getElementById('error-msg').style.display = "none";  // clear error messages
  var ticket_id = document.getElementById('ticket-id').value;
  if ((!ticket_id) || isNaN(ticket_id)) {
  showError('Oops, the field value should be a ticket id.');
  return;
  }
  if (localStorage.getItem('zauth')) {
    var access_token = localStorage.getItem('zauth');
    makeRequest(access_token, ticket_id);
  } else {
    localStorage.setItem('ticket_id', ticket_id);
    startAuthFlow();
  }
}

function makeRequest(token, ticket_id) {
  var request = new XMLHttpRequest();

  request.onreadystatechange = function() {
    if (request.readyState === 4) {
      if (request.status === 200) {
        var data = JSON.parse(request.responseText);
        var ticket = data.ticket;
        var details_html =
          '<p>' +
          'Subject: ' + ticket.subject + '<br/>' +
          'Status: <strong>' + ticket.status.toUpperCase() + '</strong><br/>' +
          'Created: ' + ticket.created_at +
          '</p>';
        document.getElementById('details').innerHTML = details_html;
        document.getElementById('details').style.display = "inherit";
      } else {
        document.getElementById('details').style.display = "none";
        if (request.status === 0) {
          showError('There was a problem with the request. Make sure you\'re an agent or admin in Zendesk Support.');
        } else {
          showError('Oops, the request returned \"' + request.status + ' ' + request.statusText + '\".');
        }
      }
    }
  };

  var url = 'https://replace.zendesk.com/api/v2/tickets/' + ticket_id + '.json';
  request.open('GET', url, true);
  request.setRequestHeader("Authorization", "Bearer " + token);
  request.send();
}

function showError(msg) {
  document.getElementById('error-msg').innerHTML = '<p> ' +  msg +  '</p>';
  document.getElementById('error-msg').style.display = "inherit";
}

function readUrlParam(url, param) {
  param += '=';
  if (url.indexOf(param) !== -1) {
    var start = url.indexOf(param) + param.length;
    var value = url.substr(start);
    if (value.indexOf('&') !== -1) {
      var end = value.indexOf('&');
      value = value.substring(0, end);
    }
      return value;
    } else {
      return false;
    }
}

function startAuthFlow() {
  var endpoint = 'https://replace.zendesk.com/oauth/authorizations/new';
  var url_params = '?' +
  'response_type=token' + '&' +
  'redirect_uri=http://localhost:8887/ticket_details.html' + '&' +
  'client_id=replace_zendedk_wdc' + '&' +
  'scope=' + encodeURIComponent('read write');
  window.location = endpoint + url_params;
}

window.addEventListener('load', init, false);
document.getElementById('get-btn').addEventListener('click', getTicket, false);
