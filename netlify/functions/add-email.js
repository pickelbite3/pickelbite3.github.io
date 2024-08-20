// netlify/functions/add-email.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    const { email } = JSON.parse(event.body);

    if (!email) {
        return {
            statusCode: 400,
            body: 'Email is required'
        };
    }

    const response = await fetch('https://api.github.com/repos/picklebyte5/picklebyte5.github.io/dispatches', {
        method: 'POST',
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${process.env.MAIL_LIST_PAT}`
        },
        body: JSON.stringify({
            event_type: 'new-email',
            client_payload: { email }
        })
    });

    if (response.ok) {
        return {
            statusCode: 200,
            body: 'Success'
        };
    } else {
        return {
            statusCode: response.status,
            body: 'Failed to add email'
        };
    }
};
