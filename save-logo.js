const fs = require('fs');
fetch('http://localhost:3000/api/settings').then(r => r.json()).then(data => {
  console.log("Settings data", data);
});
