import * as admin from "firebase-admin";
import serviceAccount from "../../secrets/serviceAccountKey.json";

const fixedServiceAccount = {
  ...serviceAccount,
  private_key: serviceAccount.private_key.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(fixedServiceAccount as admin.ServiceAccount),
});

export default admin;