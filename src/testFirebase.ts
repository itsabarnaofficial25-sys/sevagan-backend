import admin from "./config/firebase";

async function test() {
  try {
    const result = await admin.auth().listUsers(1);
    console.log("Firebase working ✔ Users:", result.users.length);
  } catch (error) {
    console.log("Error:", error);
  }
}

test();