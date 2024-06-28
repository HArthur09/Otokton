document.getElementById('signUp').addEventListener('click', () => {
    document.querySelector('.container').classList.add('right-panel-active');
});

document.getElementById('signIn').addEventListener('click', () => {
    document.querySelector('.container').classList.remove('right-panel-active');
});

document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const pseudo = document.getElementById('pseudo').value;
    const name = document.getElementById('name').value;
    const prenom = document.getElementById('prenom').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const telephone = document.getElementById('telephone').value;

    const userData = {
        pseudo: pseudo,
        name: name,
        prenom: prenom,
        email: email,
        password: password,
        telephone: telephone
    };

    fetch('/EnregUtilisateur', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Compte créé avec succès!');
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Erreur lors de la création du compte.');
    });
});

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const loginData = {
        email: email,
        password: password
    };

    fetch('/ConnexCompte', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        if (data.success) {
            alert('Connexion réussie!');
            window.location.href = '/profile';
        } else {
            alert('Erreur de connexion: ' + data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Erreur lors de la connexion.');
    });
});
