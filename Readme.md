# Case Closed Incorporated

## Running the server locally

1. Create a postgresql database titled "case_closed_db". Note that knex will run migrations for you when starting up the server. Please refer to the environment variables below to connect to your local db instance.

2. Set the following variables in a .env file (inside "server/")

    - DB_HOST=localhost
    - DB_PORT=5432
    - DB_USER=postgres
    - DB_PASSWORD=[password]
    - DB_NAME=case_closed_db

3. Start the server

    ```
    $ cd server
    $ npm install
    $ npm start / npm run dev
    ```

## Npm libraries used (and audited with npm)

1. Backend libraries:

    - express: javascript api
    - dotenv: for accessing environment variables
    - knex: secure and easy to use query builder to interact with pg
    - http-status-codes: api status codes and standardized reasons
    - winston: for logging
    - node-cron: for scheduled functions
    - joi: used for input data validation