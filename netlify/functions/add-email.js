const fetch = require('node-fetch');

exports.handler = async (event) => {
    // Check if the HTTP method is POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    // Parse the email from the request body
    let email;
    try {
        const data = JSON.parse(event.body);
        email = data.email;
    } catch (error) {
        return {
            statusCode: 400,
            body: 'Invalid request body'
        };
    }

    // Check if email is provided
    if (!email) {
        return {
            statusCode: 400,
            body: 'Email is required'
        };
    }

    // Define GitHub API URL and options
    const apiUrl = 'https://api.github.com/repos/picklebyte5/picklebyte5.github.io/dispatches';
    const options = {
        method: 'POST',
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${process.env.MAIL_LIST_PAT}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            event_type: 'new-email',
            client_payload: { email }
        })
    };

    // Send the request to GitHub API
    try {
        const response = await fetch(apiUrl, options);

        if (response.ok) {
            return {
                statusCode: 200,
                body: 'Success'
            };
        } else {
            return {
                statusCode: response.status,
                body: `Failed to add email: ${response.statusText}`
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: `Error: ${error.message}`
        };
    }
};
