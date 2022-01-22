const entities = require('./entities');
const path = require('path');

let isTesting = false;

/**
 * Set whether we are currently testing.
 * @param {boolean} testing
 */
function setTesting (testing) {
	isTesting = testing;
}

function registerFallback (app) {
	app.get(/.*/, (req, resp) => {
		resp.sendFile(path.join(__dirname, 'client/index.html'));
	});
}

/**
 * Register the Express routes for a given entity.
 * @param {Express} app The app to register the routes to.
 * @param {entities.Entity} entity The entity to register the routes for.
 */
function registerEntity (app, entity) {
	// Get list of existing entities.
	app.get(`/api/${entity.namePlural}`, async function (req, resp) {
		try {
			resp.json(await entity.getList(req.query));
		} catch (err) {
			handleRouteError(err, entity, resp);
		}
	});

	// Get existing entity with given ID.
	app.get(`/api/${entity.namePlural}/:id`, async function (req, resp) {
		try {
			resp.json(await entity.get(req.params.id));
		} catch (err) {
			handleRouteError(err, entity, resp);
		}
	});

	// Add new entity.
	app.post(`/api/${entity.namePlural}`, async function (req, resp) {
		try {
			resp.send(await entity.create(req.body.name, req.body.parents));
		} catch (err) {
			handleRouteError(err, entity, resp);
		}
	});

	// Delete entity with given ID.
	app.delete(`/api/${entity.namePlural}/:id`, async function (req, resp) {
		try {
			await entity.remove(req.params.id);
			resp.send('Success.');
		} catch (err) {
			handleRouteError(err, entity, resp);
		}
	});

	// Update existing entity with given ID.
	app.post(`/api/${entity.namePlural}/:id`, async function (req, resp) {
		try {
			await entity.update(req.params.id, req.body);
			resp.send('Success.');
		} catch (err) {
			handleRouteError(err, entity, resp);
		}
	});
}

/**
 * Register an easter egg route.
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418
 * https://en.wikipedia.org/wiki/Utah_teapot#Appearances.
 * @param {Express} app The app to register the route to.
 */
function registerEasterEgg (app) {
	app.get('/coffee', async function (_req, resp) {
		resp.status(418).send('HTTP Status 418. Cannot brew coffee. I am permanently the newly discovered Teapotahedron, which is the 6th platonic solid.');
	});
}

/**
 * Send an appropriate response based on an error that was thrown while processing a route.
 * @param {Error} err The error that was thrown.
 * @param {entities.Entity} entity The entity that the route is register for.
 * @param {import('express').Response} resp The response to the route's request.
 */
function handleRouteError (err, entity, resp) {
	if (err instanceof entities.EntityParentsBadRequestError) {
		resp.status(400).send(`The ${entity.nameSingular}'s parents were not specified or incorrectly provided.`);
	} else if (err instanceof entities.EntityNotFoundError) {
		resp.status(404).send(`${entity.nameSingularCap} not found.`);
	} else if (err instanceof entities.EntityParentNotFoundError) {
		resp.status(404).send('An entity specified as a parent was not found.');
	} else if (err instanceof entities.EntityIDGenerationError) {
		resp.status(500).send(`Error generating ${entity.nameSingular} ID, please try again.`);
	} else {
		if (isTesting) {
			console.log(err);
		}
		resp.status(500).send('Unknown internal server error.');
	}
}

exports.setTesting = setTesting;
exports.register = registerEntity;
exports.registerEasterEgg = registerEasterEgg;
exports.registerFallback = registerFallback;
