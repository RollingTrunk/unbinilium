import * as admin from "firebase-admin";

// We use a distinct app name so it doesn't conflict with the default data app
const AUTH_APP_NAME = "hest-admin-auth-app";

let authApp: admin.app.App;

if (!admin.apps.find((app) => app?.name === AUTH_APP_NAME)) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = `firebase-adminsdk-fbsvc@${projectId}.iam.gserviceaccount.com`;
  const privateKey = process.env.FIREBASE_AUTH_PRIVATE_KEY;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (clientEmail && privateKey && projectId) {
    authApp = admin.initializeApp(
      {
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      },
      AUTH_APP_NAME
    );
  } else if (serviceAccount) {
    authApp = admin.initializeApp(
      {
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      },
      AUTH_APP_NAME
    );
  } else {
    authApp = admin.initializeApp(
      {
        projectId,
      },
      AUTH_APP_NAME
    );
  }
} else {
  authApp = admin.app(AUTH_APP_NAME);
}

export const adminAuth = authApp.auth();
