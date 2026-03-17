import dotenv from "dotenv";

dotenv.config();

export const env = {
  mongoUri: process.env.MONGODB_URI || "",
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || "development-jwt-secret",
  nodeEnv: process.env.NODE_ENV || "development",
};

export function ensureRequiredEnv() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is required to start the application.");
  }
}
