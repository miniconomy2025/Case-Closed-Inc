require("dotenv").config();
console.log(
  "DB_PASSWORD:",
  process.env.DB_PASSWORD,
  typeof process.env.DB_PASSWORD
);
console.log("DB_USER:", process.env.DB_USER, typeof process.env.DB_USER);
console.log("DB_HOST:", process.env.DB_HOST, typeof process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT, typeof process.env.DB_PORT);
console.log("DB_NAME:", process.env.DB_NAME, typeof process.env.DB_NAME);
