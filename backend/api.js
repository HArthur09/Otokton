const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const db = require('./BD');
const mysql = require('mysql2');
const connection = require('./BD');

global.sharedData = {};
const code = 2;


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });

app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), gyroscope=(), magnetometer=(), microphone=(), usb=(), geolocation=()');
  next();
});

// Middleware pour parser le JSON des requêtes POST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Route par défaut
const htmlPath = 'C:/Users/Arthur/Desktop/Otokton/frontend';
app.get('/', (req, res) => {
  res.sendFile(path.join(htmlPath, 'connexion.html'));
});



app.use(express.static(htmlPath));



//endpoint pour enregistrer un compte
app.post('/EnregUtilisateur', (req, res) => {
  const { pseudo, name, prenom, email, password, telephone } = req.body;

  const sql = 'INSERT INTO utilisateur (pseudo, motdepasse, nom, prenom, email, telephone) VALUES (?, ?, ?, ?, ?, ?)';

  db.query(sql, [pseudo, password, name, prenom, email, telephone], (err, result) => {
    if (err) {
      console.log(pseudo, password, name, prenom, email, telephone);
      console.error('Erreur lors de l\'insertion :', err.stack);
      return res.status(500).send('Erreur de serveur');
    }
    res.status(201).send('Enregistrement réussi');
  });
});

//endpoint pour se connecter
app.post('/ConnexCompte', (req, res) => {
  // console.log(req.body)
  const { email, motdepasse } = req.body;
  if (!email || !motdepasse) {
      return res.status(400).json({ message: 'email et password sont requis' });
  }

  db.query('SELECT * FROM utilisateur WHERE email = ? and motdepasse = ?', [email, motdepasse], (error, results) => {
      if (error) {
          return res.status(500).json({ message: 'Erreur base de données', error });
      }

      else if (results.length === 0) {
          return res.status(400).json({ message: 'Email ou mot de passe invalid' });
      }
      else{
        global.sharedData.userId = results[0].code;
        const a = global.sharedData.userId;
        return res.status(200).json({ message: 'Connexion réussi', a });
      }

  });
});

// Endpoint pour modifier un compte utilisateur
app.put('/ModifierUtilisateur/:id', (req, res) => {
  const userId = global.sharedData.userId;
  const { pseudo, name, prenom, email, password, telephone } = req.body;

  const sql = 'UPDATE utilisateur SET pseudo = ?, motdepasse = ?, nom = ?, prenom = ?, email = ?, telephone = ? WHERE code = ?';

  db.query(sql, [pseudo, password, name, prenom, email, telephone, userId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour :', err.stack);
      return res.status(500).send('Erreur de serveur');
      
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('Utilisateur non trouvé');
    }
    res.status(200).send('Modification réussie a l\'ID');
  });
});

// Endpoint pour supprimer un compte utilisateur
app.delete('/SupprimerUtilisateur/:id', (req, res) => {
  const userId = global.sharedData.userId;

  // Récupérer les informations de l'utilisateur avant de le supprimer
  const selectSql = 'SELECT * FROM utilisateur WHERE code = ?';
  db.query(selectSql, [userId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la sélection :', err.stack);
      return res.status(500).send('Erreur de serveur');
    }
    if (result.length === 0) {
      return res.status(404).send('Utilisateur non trouvé');
    }

    const user = result[0];

    // Insérer les informations de l'utilisateur dans la table utilisateurs_supprimes
    const insertSql = 'INSERT INTO utilisateurs_supprimes (pseudo, motdepasse, nom, prenom, email, telephone) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(insertSql, [user.pseudo, user.motdepasse, user.nom, user.prenom, user.email, user.telephone], (err, result) => {
      if (err) {
        console.error('Erreur lors de l\'insertion dans utilisateurs_supprimes :', err.stack);
        return res.status(500).send('Erreur de serveur');
      }

      // Supprimer l'utilisateur de la table utilisateur
      const deleteSql = 'DELETE FROM utilisateur WHERE code = ?';
      db.query(deleteSql, [userId], (err, result) => {
        if (err) {
          console.error('Erreur lors de la suppression :', err.stack);
          return res.status(500).send('Erreur de serveur');
        }
        res.status(200).send('Suppression réussie');
      });
    });
  });
});

// Endpoint pour ajouter un lieu
app.post('/EnregistrerLieu', (req, res) => {
  const { nom, email_proprio, description_lieu, longitude, latitude, contact, text_descriptif, categorie } = req.body;
  const localisation = `POINT(${longitude} ${latitude})`;
  const sql = 'INSERT INTO lieux (nom, email_proprio, description_lieu, localisation, contact, texte_descriptif, categorie) VALUES (?,?,?,ST_GeomFromText(?),?,?,?)';

  db.query(sql, [nom, email_proprio, description_lieu, localisation, contact, text_descriptif, categorie], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'insertion :', err.stack);
      return res.status(500).send('Erreur de serveur');
    }
    res.status(201).json({ message: 'Lieu ajouté avec succès!' });
  });
});

// Endpoint pour sélectionner tous les lieux enregistrés
app.get('/selectionner_lieux', (req, res) => {
  const query = 'SELECT id, nom, ST_AsText(localisation) as localisation, description_lieu, contact, texte_descriptif, categorie FROM lieux';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des lieux :', err);
      return res.status(500).json({ message: 'Erreur lors de la récupération des lieux.' });
    }
    res.status(200).json(results);
  });
});

// Endpoint pour supprimer un lieu par son ID
app.delete('/supprimer_lieu', (req, res) => {
  lieuId = 2;
  // Récupérer les informations de l'utilisateur avant de le supprimer
  const selectSql = 'SELECT * FROM lieux WHERE id = ?';
  db.query(selectSql, [lieuId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la sélection :', err.stack);
      return res.status(500).send('Erreur de serveur');
    }
    if (result.length === 0) {
      return res.status(404).send('Lieux non trouvé');
    }
  
  const query = 'DELETE FROM lieux WHERE id = ?';

  db.query(query, [lieuId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression du lieu :', err);
      return res.status(500).json({ message: 'Erreur lors de la suppression du lieu.' });
    }
    res.status(200).json({ message: 'Lieu supprimé avec succès!' });
  });
  });
});



// Endpoint pour ajouter un événement
app.post('/evenement', (req, res) => {
  const { nom, latitude, longitude, description_lieu, date_debut, date_fin, heure_debut, heure_fin, contact, statut } = req.body;
  const localisation = `POINT(${longitude} ${latitude})`;
  /*if (!name || !description || !date || !location) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }*/

  const query = 'INSERT INTO evenement (nom, localisation, description_lieu, date_debut, date_fin, heure_debut, heure_fin, contact, statut) VALUES (?, ST_GeomFromText(?), ?, ?, ?, ?, ?, ?, ?)';

  db.query(query, [nom, localisation, description_lieu, date_debut, date_fin, heure_debut, heure_fin, contact, statut], (err, results) => {
      if (err) {
          console.error('Erreur lors de l\'insertion de l\'événement:', err);
          return res.status(500).json({ message: 'Erreur lors de l\'insertion de l\'événement.' });
      }
      res.status(201).json({ message: 'Événement ajouté avec succès!', eventId: results.insertId });
  });
});

// Endpoint pour sélectionner tous les événements enregistrés
app.get('/selectionner_evenements', (req, res) => {
  const query = 'SELECT id, nom, ST_AsText(localisation) as localisation, description_lieu, date_debut, date_fin, heure_debut, heure_fin, contact FROM evenement';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des événements :', err);
      return res.status(500).json({ message: 'Erreur lors de la récupération des événements.' });
    }
    res.status(200).json(results);
  });
});

// Endpoint pour supprimer un événement par son ID
app.delete('/supprimer_evenement', (req, res) => {
  eventId = 2;
  // Récupérer les informations de l'utilisateur avant de le supprimer
  const selectSql = 'SELECT * FROM evenement WHERE id = ?';
  db.query(selectSql, [eventId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la sélection :', err.stack);
      return res.status(500).send('Erreur de serveur');
    }
    if (result.length === 0) {
      return res.status(404).send('evenement non trouvé');
    }

  const query = 'DELETE FROM evenement WHERE id = ?';

  db.query(query, [eventId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression de l\'événement :', err);
      return res.status(500).json({ message: 'Erreur lors de la suppression de l\'événement.' });
    }
    res.status(200).json({ message: 'Événement supprimé avec succès!' });
  });
  });
});

// Endpoint pour ajouter un commentaire sur un lieu
app.post('/commentaire_lieu', (req, res) => {
  const { id_utilisateur, id_lieu, etoiles, commentaire } = req.body;

  const query = 'INSERT INTO commenter (id_utilisateur, id_lieu, etoiles, commentaire) VALUES (?, ?, ?, ?)';

  db.query(query, [id_utilisateur, id_lieu, etoiles, commentaire], (err, results) => {
      if (err) {
          console.error('Erreur lors de l\'insertion du commentaire:', err);
          return res.status(500).json({ message: 'Erreur lors de l\'insertion du commentaire.' });
      }
      res.status(201).json({ message: 'Enregistré avec succès!'});
  });
});

// Endpoint pour ajouter un commentaire sur un evenement
app.post('/commentaire_evenement', (req, res) => {
  const { id_utilisateur, id_evenement, etoiles, commentaire } = req.body;

  const query = 'INSERT INTO commenter (id_utilisateur, id_evenement, etoiles, commentaire) VALUES (?, ?, ?, ?)';

  db.query(query, [id_utilisateur, id_evenement, etoiles, commentaire], (err, results) => {
      if (err) {
          console.error('Erreur lors de l\'insertion du commentaire:', err);
          return res.status(500).json({ message: 'Erreur lors de l\'insertion du commentaire.' });
      }
      res.status(201).json({ message: 'Enregistré avec succès!'});
  });
});

// Endpoint pour sélectionner tous les commenentaires lieu
app.get('/selection_com_lieu', (req, res) => {
  const query = 'SELECT id_commentaire, id_utilisateur, id_lieu, etoiles, commentaire FROM commenter';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des commentaires :', err);
      return res.status(500).json({ message: 'Erreur lors de la récupération des commentaires.' });
    }
    res.status(200).json(results);
  });
});

// Endpoint pour selectionner les commentaires sur les evenements
app.get('/selection_com_evenements', (req, res) => {
  const query = 'SELECT id_commentaire, id_utilisateur, id_evenement, etoiles, commentaire FROM commenter';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des commentaires :', err);
      return res.status(500).json({ message: 'Erreur lors de la récupération des commentaires.' });
    }
    res.status(200).json(results);
  });
});

// Endpoint pour ajouter un favori
app.post('/favoris', (req, res) => {
  const { id_utilisateur, id_produit } = req.body;

  const query = 'INSERT INTO favoriser (id_utilisateur, id_produit) VALUES (?, ?)';

  db.query(query, [id_utilisateur, id_produit], (err, results) => {
      if (err) {
          console.error('Erreur lors de l\'ajout en favori:', err);
          return res.status(500).json({ message: 'Erreur lors de l\'ajout en favori' });
      }
      res.status(201).json({ message: 'Ajouté au favori!'});
  });
});

// Endpoint pour supprimer un favori
app.delete('/supprimer_favori', (req, res) => {
  favoriId = 1;
  // Récupérer les informations sur le favori avant de le supprimer
  const selectSql = 'SELECT * FROM favoriser WHERE id = ?';
  db.query(selectSql, [favoriId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la sélection :', err.stack);
      return res.status(500).send('Erreur de serveur');
    }
    if (result.length === 0) {
      return res.status(404).send('favori non trouvé');
    }

  const query = 'DELETE FROM favoriser WHERE id = ?';

  db.query(query, [favoriId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression du favori :', err);
      return res.status(500).json({ message: 'Erreur lors de la suppression du favori.' });
    }
    res.status(200).json({ message: 'Favori supprimé avec succès!' });
  });
  });
});

// Endpoint pour rechercher des lieux
app.get('/rechercheLieu', (req, res) => {
  const recherche = "res";
  const rechlike = `%${recherche}%`;
  let query = `SELECT * FROM lieux WHERE nom LIKE ? OR description_lieu LIKE ? OR texte_descriptif LIKE ? OR categorie LIKE ?`;

  db.query(query, [rechlike,rechlike,rechlike,rechlike], (err, results) => {
    if (err) {
      console.error('Erreur lors de la recherche des lieux :', err);
      return res.status(500).json({ message: 'Erreur lors de la recherche des lieux.' });
    }
    if (results.length === 0) {
      return res.status(404).send('Element non trouvé');
    }
    res.status(200).json(results);
  });
});


module.exports = app;