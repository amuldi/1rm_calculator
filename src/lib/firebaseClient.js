import { getFirebaseConfig, getSyncStatus } from "./syncConfig.js";

let cachedApp = null;
let pendingApp = null;
let cachedAuthServices = null;
let pendingAuthServices = null;
let cachedFirestoreServices = null;
let pendingFirestoreServices = null;

function getUnconfiguredServices(status) {
  return {
    configured: false,
    app: null,
    auth: null,
    db: null,
    provider: null,
    status,
  };
}

async function getFirebaseApp(status) {
  if (cachedApp) return cachedApp;
  if (pendingApp) return pendingApp;

  pendingApp = import("firebase/app").then((appApi) => {
    cachedApp = appApi.getApps().length
      ? appApi.getApp()
      : appApi.initializeApp(getFirebaseConfig());
    return cachedApp;
  });

  return pendingApp;
}

export async function getFirebaseAuthServices() {
  const status = getSyncStatus();
  if (!status.configured) return getUnconfiguredServices(status);

  if (cachedAuthServices) return cachedAuthServices;
  if (pendingAuthServices) return pendingAuthServices;

  pendingAuthServices = Promise.all([
    getFirebaseApp(status),
    import("firebase/auth"),
  ]).then(([app, authApi]) => {
    cachedAuthServices = {
      configured: true,
      app,
      auth: authApi.getAuth(app),
      db: null,
      provider: new authApi.GoogleAuthProvider(),
      authApi,
      status,
    };
    return cachedAuthServices;
  });

  return pendingAuthServices;
}

export async function getFirebaseFirestoreServices() {
  const status = getSyncStatus();
  if (!status.configured) return getUnconfiguredServices(status);

  if (cachedFirestoreServices) return cachedFirestoreServices;
  if (pendingFirestoreServices) return pendingFirestoreServices;

  pendingFirestoreServices = Promise.all([
    getFirebaseApp(status),
    import("firebase/firestore/lite"),
  ]).then(([app, firestoreApi]) => {
    cachedFirestoreServices = {
      configured: true,
      app,
      auth: null,
      db: firestoreApi.getFirestore(app),
      provider: null,
      firestoreApi,
      status,
    };
    return cachedFirestoreServices;
  });

  return pendingFirestoreServices;
}

export async function getFirebaseServices() {
  const [authServices, firestoreServices] = await Promise.all([
    getFirebaseAuthServices(),
    getFirebaseFirestoreServices(),
  ]);

  return {
    ...authServices,
    db: firestoreServices.db,
    firestoreApi: firestoreServices.firestoreApi,
  };
}
