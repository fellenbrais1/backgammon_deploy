'use strict';

// netlify/functions/get-secure-info.js

exports.handler = async (event, context) => {
  try {
    const secretApiKey = process.env.APIKEY; // Access the environment variable securely!

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

    // --- This is where you'd use your APIKEY to do something useful ---
    // Examples:
    // 1. Generate a temporary, client-safe token using the APIKEY
    //    const clientSafeToken = generateClientToken(secretApiKey);
    // 2. Perform a small calculation or check that requires the APIKEY
    //    const someDerivedValue = calculateValueBasedOnKey(secretApiKey);
    // 3. Simply confirm the key was present (for testing/debugging, but usually you'd do more)
    const confirmationMessage =
      'API key was successfully accessed by the serverless function.';

    const clientSafeToken = secretApiKey;
    // Return the processed data or a safe confirmation, NOT the raw API key.
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: confirmationMessage,
        clientToken: clientSafeToken,
        // If you generated a client-safe token or derived value, include it here:
        // derivedValue: someDerivedValue,
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
