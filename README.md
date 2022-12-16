# Keyboredist
## Code Review
These are some of the more significant files that you may want to review (but feel free to poke around elsewhere too!):
- [app.js](https://github.com/amrenstephenson/keyboredist/blob/main/app.js) - A high-level file that represents the main server-side application.
- [entities.js](https://github.com/amrenstephenson/keyboredist/blob/main/entities.js) - A file that manages the asynchronous storage and relationships of entities (keyboards, users, comments), as well as appropriate error handling. It uses JSON, as we were unfortunately not allowed to use databases for this piece of coursework.
- [routes.js](https://github.com/amrenstephenson/keyboredist/blob/main/routes.js) - A file containing functions that are used to register Express routes and handle related errors.
- [app.test.js](https://github.com/amrenstephenson/keyboredist/blob/main/app.test.js) - A file that tests the responses that the server gives for different routes.

## About
Keyboredist is a simple website that allows people to customise and share virtual keyboard sounds. It was made as a part of my programming module in my first year of university.

## Running the Project
1. Clone the repository, and navigate into it using your preferred shell.
2. Install dependencies using `npm install`.
3. Run the project using `npm start`.
4. Access the website at [http://localhost:8090](http://localhost:8090).
