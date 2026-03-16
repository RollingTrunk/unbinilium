import * as admin from "firebase-admin";

const serviceAccount = process.env.NODE_ENV === "development" ? process.env.DEV_FIREBASE_SERVICE_ACCOUNT : process.env.PROD_FIREBASE_SERVICE_ACCOUNT;
const clientEmail = process.env.NODE_ENV === "development" ? process.env.DEV_FIREBASE_CLIENT_EMAIL : process.env.PROD_FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.NODE_ENV === "development" ? process.env.DEV_FIREBASE_PRIVATE_KEY : process.env.PROD_FIREBASE_PRIVATE_KEY;
const projectId = process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_DEV_PROJECT_ID : process.env.NEXT_PUBLIC_PROD_PROJECT_ID;

const isDefaultInitialized = admin.apps.some(app => app?.name === "[DEFAULT]");

if (!isDefaultInitialized) {
  if (clientEmail && privateKey && projectId) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Netlify and Vercel sometimes escape newlines in env variables
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  } else {
    admin.initializeApp({
      projectId,
    });
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminAuth, adminDb };

