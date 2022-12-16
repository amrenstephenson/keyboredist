# Keyboredist
## Server-Side Code Review
These are some of the more significant files that you may want to review (but feel free to poke around elsewhere too!):
- [app.js](https://github.com/amrenstephenson/keyboredist/blob/main/app.js) - A high-level file that represents the main server-side application.
- [entities.js](https://github.com/amrenstephenson/keyboredist/blob/main/entities.js) - A file that manages the asynchronous storage and relationships of entities (keyboards, users, comments), as well as appropriate error handling. It uses JSON, as we were unfortunately not allowed to use databases for this piece of coursework.
- [routes.js](https://github.com/amrenstephenson/keyboredist/blob/main/routes.js) - A file containing functions that are used to register Express routes and handle related errors.
- [app.test.js](https://github.com/amrenstephenson/keyboredist/blob/main/app.test.js) - A file that tests the functionality of the server with 91.44% of statements covered.

## About
Keyboredist is a simple website that allows people to customise, share, and discuss virtual keyboard sounds. The main focus of the project was developing a server that could manage a single-page web app and store information persistently. It was made as a part of my programming module in my first year of university.

## Running the Project
1. Clone the repository, and navigate into it using your preferred shell.
2. Install dependencies using `npm install`.
3. Run the project using `npm start`.
4. Access the website at [http://127.0.0.1:8090](http://127.0.0.1:8090).
