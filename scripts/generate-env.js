// scripts/generate-env.js
const fs = require("fs");
const path = require("path");

// Netlify will expose environment variables defined in its UI (e.g., VITE_API_KEY)
// to the build process, which this Node.js script runs within.
export const apiKey = process.env.VITE_API_KEY;

if (!apiKey) {
  console.error(
    "ERROR: VITE_API_KEY environment variable is not set in Netlify. Please add it to your site settings."
  );
  process.exit(1); // Exit with an error code to fail the Netlify build
}

// Define the content of the generated JavaScript file
// This file will export the API key as a constant.
const content = `export const FIREBASE_API_KEY = "${apiKey}";\n`;

// Define the output path for the generated file.
// It will be placed in the 'public' directory, which is served by Netlify.
const outputPath = path.join(__dirname, "..", "public", "firebase-env.js");

// Ensure the 'public' directory exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

// Write the content to the file
fs.writeFileSync(outputPath, content);

console.log(`Successfully generated ${outputPath} with Firebase API Key.`);
