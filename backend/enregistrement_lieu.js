document.getElementById('eventForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;
    const location = document.getElementById('location').value;

    const eventData = {
        name: name,
        description: description,
        date: date,
        location: location
    };

    fetch('/api/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Événement ajouté avec succès!');
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Erreur lors de l\'ajout de l\'événement.');
    });
});
