const express = require('express');
const app = express();
const entities = require('./entities');

app.use(express.static('client'));
app.use(express.json());

const isTesting = process.env.JEST_WORKER_ID !== undefined;

const users = new entities.Entity('user', 'users', isTesting);
const keyboards = new entities.Entity('keyboard', 'keyboards', isTesting);
const comments = new entities.Entity('keyboard', 'keyboards', isTesting);

keyboards.addRelationship(users);
comments.addRelationship(users);
comments.addRelationship(keyboards);

registerRoutes(users);
registerRoutes(keyboards);
registerRoutes(comments);
registerEasterEgg();

// TODO: Make single error handling function.
function registerRoutes (entity) {
	// Get list of existing entities.
	app.get(`/api/${entity.namePlural}`, async function (req, resp) {
		try {
			resp.json(await entity.getList());
		} catch (err) {
			handleError(err, entity, resp);
		}
	});

	// Get existing entity with given ID.
	app.get(`/api/${entity.namePlural}/:id`, async function (req, resp) {
		try {
			resp.json(await entity.get(req.params.id));
		} catch (err) {
			handleError(err, entity, resp);
		}
	});

	// Add new entity.
	app.post(`/api/${entity.namePlural}`, async function (req, resp) {
		try {
			resp.send(await entity.create(req.body.name, req.body.relationships));
		} catch (err) {
			handleError(err, entity, resp);
		}
	});

	// Delete entity with given ID.
	app.delete(`/api/${entity.namePlural}/:id`, async function (req, resp) {
		try {
			await entity.remove(req.params.id);
			resp.send('Success.');
		} catch (err) {
			handleError(err, entity, resp);
		}
	});

	// Update existing entity with given ID.
	app.post(`/api/${entity.namePlural}/:id`, async function (req, resp) {
		try {
			await entity.update(req.params.id, req.body);
			resp.send('Success.');
		} catch (err) {
			handleError(err, entity, resp);
		}
	});
}

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418
// https://en.wikipedia.org/wiki/Utah_teapot#Appearances
function registerEasterEgg () {
	app.get('/coffee', async function (req, resp) {
		resp.status(418).send('Cannot brew coffee. I am permanently the newly discovered Teapotahedron, which is the 6th platonic solid.');
	});
}

function handleError (err, entity, resp) {
	if (err instanceof entities.EntityMalformedRelationshipError) {
		resp.status(400).send(`The ${entity.nameSingular}'s relationships were missing or malformed.`);
	} else if (err instanceof entities.EntityNotFoundError) {
		resp.status(404).send(`${entity.nameSingularCap} not found.`);
	} else if (err instanceof entities.EntityNotFoundInRelationshipError) {
		resp.status(404).send('An entity specified as a relationship was not found.');
	} else if (err instanceof entities.EntityIDGenerationError) {
		resp.status(500).send(`Error generating ${entity.nameSingular} ID, please try again.`);
	} else {
		if (isTesting) {
			console.log(err);
		}
		resp.status(500).send('Unknown internal server error.');
	}
}

module.exports = app;
