document.getElementById('emailForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const responseMessage = document.getElementById('responseMessage');

    const response = await fetch('/.netlify/functions/add-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    });

    if (response.ok) {
        responseMessage.textContent = "Thank you for subscribing!";
    } else {
        responseMessage.textContent = "There was an error. Please try again.";
    }
});
