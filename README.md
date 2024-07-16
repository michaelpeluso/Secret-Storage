# Secret Storage README

A simple project providing an in-depth exploration of authentication and security. Topics include user registration, encryption, hashing, salting, cookie and session handling, and OAuth implementations.

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [File Structure](#file-structure)
7. [Routes](#routes)
    - [GET Routes](#get-routes)
    - [POST Routes](#post-routes)
8. [Authentication](#authentication)
9. [Database](#database)
10. [Contributing](#contributing)
11. [License](#license)

## Introduction
Secret Storage is a web application that allows users to register, log in, and submit secrets. The app supports local authentication and Google OAuth2 for user authentication. It uses PostgreSQL as the database for storing user information and secrets.

## Features
- User registration and login
- Password hashing with bcrypt
- Session management with express-session
- Local authentication with passport-local
- Google OAuth2 authentication with passport-google-oauth2
- Securely store and display user secrets

## Installation
To install and run Secret Storage on your local machine, follow these steps:

1. Clone the repository:
    ```sh
    git clone https://github.com/your-username/Secret Storage.git
    ```
2. Navigate to the project directory:
    ```sh
    cd Secret Storage
    ```
3. Install the dependencies:
    ```sh
    npm install
    ```

## Configuration
1. Create a `.env` file in the root directory of the project and add the following environment variables:
    ```env
    USER=your_pg_user
    HOST=your_pg_host
    DATABASE=your_pg_database
    PASSWORD=your_pg_password
    PG_PORT=your_pg_port
    SESSION_SECRET=your_session_secret
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    ```

2. Ensure your PostgreSQL database is set up and running.

## Usage
To start the server, run:
```sh
npm start
```
The server will run on port 3000 by default. Open your browser and navigate to `http://localhost:3000`.


## File Structure
Here is an overview of the project directory structure:
```
secret-storage/
│
├── node_modules/
│
├── partials/
│   ├── footer.ejs
│   ├── header.ejs
│
├── public/
│   ├── css/
│   │   └── styles.css
│
├── views/
│   ├── partials/
│   │   ├── footer.ejs
│   │   ├── header.ejs
│   ├── home.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── secrets.ejs
│   ├── submit.ejs
│
├── .env
├── .gitignore
├── index.js
├── package-lock.json
├── package.json
└── queries.sql
```


## Routes

### GET Routes
- `/` - Home page, displays a welcome message.
- `/login` - Login page for users to enter their credentials.
- `/logout` - Logout the current user and redirect to the home page.
- `/register` - Registration page for new users.
- `/secrets` - Displays the user's secret if authenticated, otherwise redirects to the login page.
- `/auth/google` - Initiates Google OAuth2 authentication.
- `/auth/google/secrets` - Callback route for Google OAuth2, redirects to the secrets page upon successful authentication.
- `/submit` - Page for submitting a new secret, accessible only to authenticated users.

### POST Routes
- `/login` - Authenticates the user and redirects to the secrets page on success.
- `/register` - Registers a new user and redirects to the secrets page on success.
- `/submit` - Submits a new secret and updates the database.

## Authentication
Secret Storage uses `passport` for authentication, with both local strategy and Google OAuth2 strategy implemented.

### Local Authentication
- **Strategy**: `passport-local`
- **Password Hashing**: `bcrypt`

### Google OAuth2 Authentication
- **Strategy**: `passport-google-oauth2`
- **Client ID** and **Client Secret** should be configured in the `.env` file.

## Database
Secret Storage uses PostgreSQL for storing user data and secrets. The user table schema is as follows:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    secret TEXT
);
```

## Contributing
Contributions are welcome! Please follow these steps to contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Feel free to reach out if you have any questions or need further assistance. Happy coding!
