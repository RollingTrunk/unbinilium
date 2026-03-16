import * as admin from "firebase-admin";

const serviceAccount = process.env.NODE_ENV === "development" ? process.env.DEV_FIREBASE_SERVICE_ACCOUNT : process.env.PROD_FIREBASE_SERVICE_ACCOUNT;

const isDefaultInitialized = admin.apps.some(app => app?.name === "[DEFAULT]");

if (!isDefaultInitialized) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  } else {
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminAuth, adminDb };

