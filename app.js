const express = require('express');
const app = express();
const entities = require('./entities');
const routes = require('./routes');

app.use(express.static('client'));
app.use(express.json());

const isTesting = process.env.JEST_WORKER_ID !== undefined;

const users = new entities.Entity('user', 'users', isTesting);
const keyboards = new entities.Entity('keyboard', 'keyboards', isTesting);
const comments = new entities.Entity('comment', 'comments', isTesting);

entities.Entity.setManyToOne(keyboards, users);
entities.Entity.setManyToOne(comments, users);
entities.Entity.setManyToOne(comments, keyboards);

routes.setTesting(isTesting);

routes.register(app, users);
routes.register(app, keyboards);
routes.register(app, comments);
routes.registerEasterEgg(app);

module.exports = app;
