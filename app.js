const express = require('express');
const app = express();
const entities = require('./entities');

const UNKNOWN_ERR_MESSAGE = 'Unknown internal server error.';

app.use(express.static('client'));
app.use(express.json());

registerRoutes(new entities.Entity('user', 'users', './json/users.json'));
registerRoutes(new entities.Entity('keyboard', 'keyboards', './json/keyboards.json'));

function registerRoutes (entity) {
	// Get list of existing entities.
	app.get(`/api/${entity.namePlural}`, async function (req, resp) {
		const entityList = await entity.getList();
		resp.json(entityList);
	});

	// Get existing entity with given ID.
	app.get(`/api/${entity.namePlural}/:id`, async function (req, resp) {
		try {
			resp.json(await entity.get(req.params.id));
		} catch (err) {
			console.log(err);
			if (err instanceof entities.EntityNotFoundError) {
				resp.status(500).send(`${entity.nameSingularCap} not found.`);
			} else {
				resp.status(500).send(UNKNOWN_ERR_MESSAGE);
			}
		}
	});

	// Add new entity.
	app.put(`/api/${entity.namePlural}`, async function (req, resp) {
		try {
			await entity.create(req.body.name);
			resp.send('Success');
		} catch (err) {
			if (err instanceof entities.EntityIDGenerationError) {
				resp.status(500).send(`Error generating ${entity.nameSingular} ID, please try again.`);
			} else {
				resp.status(500).send(UNKNOWN_ERR_MESSAGE);
			}
		}
	});

	// Delete entity with given ID.
	app.delete(`/api/${entity.namePlural}/:id`, async function (req, resp) {
		try {
			await entity.remove(req.params.id);
			resp.send('Success');
		} catch (err) {
			if (err instanceof entities.EntityNotFoundError) {
				resp.status(500).send(`${entity.nameSingularCap} not found.`);
			} else {
				resp.status(500).send(UNKNOWN_ERR_MESSAGE);
			}
		}
	});

	// Update existing entity with given ID.
	app.post(`/api/${entity.namePlural}/:id`, async function (req, resp) {

	});
}

module.exports = app;
