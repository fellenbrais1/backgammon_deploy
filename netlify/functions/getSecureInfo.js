/////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Logic to retrieve the contents of an environmental variable stored on netlify

'use strict';

/////////////////////////////////////////////////////////////////////////////////////////
// EVENT LISTENERS

exports.handler = async (event, context) => {
  try {
    const secretApiKey = process.env.API_KEY; // Access the environment variable securely!

    // IMPORTANT: Do NOT return `secretApiKey` directly in the body.
    // That would expose it to the client.

    if (!secretApiKey) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'API key (APIKEY) not configured on Netlify.',
        }),
      };
    }

    const confirmationMessage =
      'API key was successfully accessed by the serverless function.';

    const clientSafeToken = secretApiKey;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: confirmationMessage,
        clientToken: clientSafeToken,
      }),
    };
  } catch (error) {
    console.error('Error in secure information function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'An internal server error occurred.' }),
    };
  }
};

// CODE END
/////////////////////////////////////////////////////////////////////////////////////////
