const express = require('express');
const app = express();
const entities = require('./entities');
const routes = require('./routes');

app.use(express.static('client'));
app.use(express.json());

const isTesting = process.env.JEST_WORKER_ID !== undefined;

const users = new entities.Entity('user', 'users', isTesting);
const keyboards = new entities.Entity('keyboard', 'keyboards', isTesting);
const comments = new entities.Entity('keyboard', 'keyboards', isTesting);

keyboards.addRelationship(users);
comments.addRelationship(users);
comments.addRelationship(keyboards);

routes.register(app, users);
routes.register(app, keyboards);
routes.register(app, comments);
routes.registerEasterEgg(app);

module.exports = app;
