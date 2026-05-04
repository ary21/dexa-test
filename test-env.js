require('dotenv').config({ path: '.env' });
console.log("Raw:", JSON.stringify(process.env.FIREBASE_PRIVATE_KEY));
const replaced = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
console.log("Replaced:", JSON.stringify(replaced));
