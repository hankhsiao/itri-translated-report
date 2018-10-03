const express = require('express');
const translateReport = require('./lib/translateReport');

const app = express();

app.set('port', (process.env.PORT || 5000));

app.get('/', function(request, response) {
  translateReport(output => {
    response.send(output);
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
