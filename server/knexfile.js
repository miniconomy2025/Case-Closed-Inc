import dotenv from "dotenv";
dotenv.config();

let knexEnv = {
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Explicitly disable SSL for local/test environments
    // In production with RDS, this would be { rejectUnauthorized: false }
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  },
  migrations: {
    directory: "./migrations",
    extension: "js",
  },
  pool: {
    min: 2,
    max: 10,
  },
};

export default knexEnv;
