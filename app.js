const express = require('express');
const app = express();
const entities = require('./entities');

const UNKNOWN_ERR_MESSAGE = 'Unknown internal server error.';

app.use(express.static('client'));
app.use(express.json());

let suffix = '';
if (process.env.JEST_WORKER_ID !== undefined) {
	suffix = '-test';
}

registerRoutes(new entities.Entity('user', 'users', `./json/users${suffix}.json`));
registerRoutes(new entities.Entity('keyboard', 'keyboards', `./json/keyboards${suffix}.json`));

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
	app.put(`/api/${entity.namePlural}`, async function (req, resp) {
		try {
			resp.send(await entity.create(req.body.name));
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

function handleError (err, entity, resp) {
	if (err instanceof entities.EntityNotFoundError) {
		resp.status(404).send(`${entity.nameSingularCap} not found.`);
	} else if (err instanceof entities.EntityIDGenerationError) {
		resp.status(500).send(`Error generating ${entity.nameSingular} ID, please try again.`);
	} else {
		resp.status(500).send(UNKNOWN_ERR_MESSAGE);
	}
}

module.exports = app;
