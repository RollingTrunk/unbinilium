import * as admin from "firebase-admin";

// We use a distinct app name so it doesn't conflict with the default data app
const AUTH_APP_NAME = "hest-admin-auth-app";

let authApp: admin.app.App;

if (!admin.apps.find((app) => app?.name === AUTH_APP_NAME)) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccount) {
    authApp = admin.initializeApp(
      {
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      },
      AUTH_APP_NAME
    );
  } else {
    authApp = admin.initializeApp(
      {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      },
      AUTH_APP_NAME
    );
  }
} else {
  authApp = admin.app(AUTH_APP_NAME);
}

export const adminAuth = authApp.auth();
