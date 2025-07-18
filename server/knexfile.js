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
    ssl: {
      rejectUnauthorized: false
    },
  },
  migrations: {
    directory: "./migrations",
    extension: "js",
  },
};

export default knexEnv;
