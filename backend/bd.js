// db.js
const mysql = require('mysql2');

// Créer une connexion à la base de données
const connection = mysql.createConnection({
  host: 'localhost',     // Hôte où MySQL est exécuté, généralement 'localhost' pour WampServer
  user: 'root', // Votre nom d'utilisateur MySQL
  password: '', // Votre mot de passe MySQL
  database: 'otokton' // Le nom de la base de données à laquelle vous voulez vous connecter
});

// Connexion à la base de données
connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err.stack);
    return;
  }
  console.log('Connecté à la base de données MySQL avec l\'ID', connection.threadId);
});

// Exporter la connexion pour pouvoir l'utiliser dans d'autres fichiers
module.exports = connection;
