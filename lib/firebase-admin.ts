import * as admin from "firebase-admin";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = `firebase-adminsdk-fbsvc@${projectId}.iam.gserviceaccount.com`;
const privateKey = process.env.NODE_ENV === "development" ? process.env.DEV_FIREBASE_PRIVATE_KEY : process.env.PROD_FIREBASE_PRIVATE_KEY;
const serviceAccount = process.env.NODE_ENV === "development" ? process.env.DEV_FIREBASE_SERVICE_ACCOUNT : process.env.PROD_FIREBASE_SERVICE_ACCOUNT;

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

