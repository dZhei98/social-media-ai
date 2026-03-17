import { createApp } from "./app.js";
import { connectToDatabase } from "./config/db.js";
import { ensureRequiredEnv, env } from "./config/env.js";

ensureRequiredEnv();

const app = createApp();

try {
  await connectToDatabase();

  app.listen(env.port, () => {
    console.log(`MERN Social listening on http://localhost:${env.port}`);
  });
} catch (error) {
  console.error("Failed to start server");
  console.error(error);
  process.exit(1);
}
