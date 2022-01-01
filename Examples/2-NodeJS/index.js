const express = require('express');

// initialise le serveur
const app = express();

app.get('/about', (req, res) => {
  res.send('Hello from about page');
});

// envoie une réponse
app.get('/', (req, res) => {
  res.send('Hello world');
});

// écoute sur le port 8000
app.listen(8000, () => {
  console.log('Listening on port 8000')
})
