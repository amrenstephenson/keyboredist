const crypto = require('crypto'); // Used for generating random entity IDs.
const fs = require('fs');

// Modified from https://dev.to/lvidakovic/custom-error-types-in-node-js-491a [accessed 13 Dec 2021]
class EntityNotFoundError extends Error {
	constructor (message) {
		super(message);
		this.name = 'EntityNotFoundError';
		Error.captureStackTrace(this, EntityNotFoundError);
	}
}

// Modified from https://dev.to/lvidakovic/custom-error-types-in-node-js-491a [accessed 13 Dec 2021]
class EntityParentNotFoundError extends Error {
	constructor (message) {
		super(message);
		this.name = 'EntityParentNotFoundError';
		Error.captureStackTrace(this, EntityParentNotFoundError);
	}
}

// Modified from https://dev.to/lvidakovic/custom-error-types-in-node-js-491a [accessed 13 Dec 2021]
class EntityParentsBadRequestError extends Error {
	constructor (message) {
		super(message);
		this.name = 'EntityParentsBadRequestError';
		Error.captureStackTrace(this, EntityParentsBadRequestError);
	}
}

// Modified from https://dev.to/lvidakovic/custom-error-types-in-node-js-491a [accessed 13 Dec 2021]
class EntityIDGenerationError extends Error {
	constructor (message) {
		super(message);
		this.name = 'EntityIDGenerationError';
		Error.captureStackTrace(this, EntityIDGenerationError);
	}
}

/**
 * Represents an entity (e.g. a user/keyboard/comment). The data for the entities are always stored in a JSON file by the end of a function call.
 */
class Entity {
	/**
	 * Construct a new entity.
	 * @param {string} nameSingular
	 * @param {string} namePlural
	 * @param {boolean} isTesting
	 */
	constructor (nameSingular, namePlural, isTesting) {
		this.nameSingular = nameSingular;
		this.namePlural = namePlural;

		function capitalizeFirst (str) {
			return str.substring(0, 1).toUpperCase() + str.substring(1);
		}

		this.nameSingularCap = capitalizeFirst(nameSingular);
		this.namePluralCap = capitalizeFirst(namePlural);

		const suffix = isTesting ? '-test' : '';
		this.path = `./json/${namePlural}${suffix}`;
		this.listPath = this.path + '.json';
		this.templatePath = this.path + '-template.json';

		if (isTesting) {
			// Replace entity-test.json with entity-test-template.json.
			if (fs.existsSync(this.templatePath)) {
				fs.copyFileSync(this.templatePath, this.listPath);
			}
		} else {
			// If entity.json doesn't exist, then create it.
			if (!fs.existsSync(this.listPath)) {
				fs.writeFileSync(this.listPath, '{"entities":[]}', (err) => {
					if (err) throw err;
				});
			}
		}

		this.parentStructure = {};
		this.childStructure = {};
	}

	/**
	 * Setup a many-to-one relationship between entities.
	 * @param {Entity} many The entity of which there are many.
	 * @param {Entity} one The entity of which there is one.
	 */
	static setManyToOne (many, one) {
		many.parentStructure[one.nameSingular] = one;
		one.childStructure[many.namePlural] = many;
	}

	/**
	 * Check if a parents object has all of the necessary parents specified, and that they exist.
	 * @param {Object} parents
	 * @throws {EntityParentsBadRequestError}
	 * @throws {EntityParentNotFoundError}
	 */
	async validateParents (parents) {
		if (Object.prototype.toString.call(parents) !== '[object Object]') {
			throw new EntityParentsBadRequestError();
		}
		const parentKeys = JSON.stringify(Object.keys(parents));
		const parentStructureKeys = JSON.stringify(Object.keys(this.parentStructure));
		if (parentKeys !== parentStructureKeys) {
			throw new EntityParentsBadRequestError();
		}

		for (const parentName of Object.keys(parents)) {
			const parentID = parents[parentName];
			try {
				// If this entity doesn't exists this will throw EntityNotFoundError.
				await this.parentStructure[parentName].get(parentID);
			} catch (err) {
				if (err instanceof EntityNotFoundError) {
					// Replace EntityNotFoundError with EntityParentNotFoundError.
					throw new EntityParentNotFoundError();
				} else {
					// Rethrow other errors.
					throw err;
				}
			}
		}
	}

	/**
	 * Get a list of all entities.
	 * @returns {[Object]}
	 */
	async getList () {
		const fileData = await fs.promises.readFile(this.listPath);

		// If the entity JSON file is empty, initialise it.
		if (fileData.toString('utf8') === '') {
			return { entities: [] };
		}

		const entityList = await JSON.parse(fileData);
		return entityList;
	}

	/**
	 * Create an entity.
	 * @param {string} entityName
	 * @param {Object} parents
	 * @returns {string} The ID of the created entity.
	 * @throws {EntityParentsBadRequestError}
	 * @throws {EntityParentNotFoundError}
	 */
	async create (entityName, parents) {
		if (parents === undefined) {
			parents = {};
		}
		await this.validateParents(parents);
		// TODO this.validateName(entityName);

		const entityList = await this.getList();
		const entityID = this.getUniqueEntityID(entityList);
		const children = {};
		Object.keys(this.childStructure).forEach(key => {
			children[key] = [];
		});
		const newEntity = { id: entityID, name: entityName, parents: parents, children: children };
		entityList.entities.push(newEntity);

		// Add entity as a child of each of its parents.
		Object.keys(parents).forEach(async entityType => {
			const parentID = parents[entityType];
			const parentData = await this.parentStructure[entityType].get(parentID);
			parentData.children[this.namePlural].push(entityID);
			this.parentStructure[entityType].update(parentID, parentData);
		});

		this.updateEntityListFile(entityList);

		return newEntity.id;
	}

	/**
	 * Get an entity.
	 * @param {string} id The ID of the entity to get.
	 * @returns {Object}
	 * @throws {EntityNotFoundError}
	 */
	async get (id) {
		const entityList = await this.getList();

		for (const index in entityList.entities) {
			const entity = entityList.entities[index];
			if (entity.id === id) {
				return entity;
			}
		}

		throw new EntityNotFoundError();
	}

	/**
	 * Remove an entity.
	 * @param {*} id The ID of the entity to remove.
	 * @throws {EntityNotFoundError}
	 */
	async remove (id) {
		const entityList = await this.getList();
		let foundEntity = false;

		entityList.entities.forEach((entity, index) => {
			if (entity.id === id) {
				foundEntity = true;
				entityList.entities.splice(index, 1);
			}
		});

		if (!foundEntity) {
			throw new EntityNotFoundError();
		}

		await this.updateEntityListFile(entityList);
	}

	// TODO Check that newData is valid.
	/**
	 * Update an entity with new data.
	 * @param {string} id The ID of the entity to update.
	 * @param {Object} newData The new data for the entity.
	 * @throws {EntityNotFoundError}
	 */
	async update (id, newData) {
		const entityList = await this.getList();
		let foundEntity = false;

		entityList.entities.forEach((entity, index) => {
			if (entity.id === id) {
				foundEntity = true;
				entityList.entities[index] = newData;
			}
		});

		if (!foundEntity) {
			throw new EntityNotFoundError();
		}

		await this.updateEntityListFile(entityList);
	}

	/**
	 * Update the entity list file.
	 * @param {[Object]} entityList
	 */
	async updateEntityListFile (entityList) {
		const jsonData = JSON.stringify(entityList);
		await fs.promises.writeFile(this.listPath, jsonData);
	}

	/**
	 * Generate a base64 encoded unique 8-byte ID.
	 * @param {[Object]} entityList
	 * @returns {string}
	 * @throws {EntityIDGenerationError}
	 */
	getUniqueEntityID (entityList) {
		const randomID = crypto.randomBytes(8).toString('base64').replace('/', '-').slice(0, -2);

		// Check that this entity ID is unique for this type of entity. Given that we have 2^64 possibilities a collision should not happen very often!
		entityList.entities.forEach(entity => {
			if (entity.id === randomID) {
				throw new EntityIDGenerationError();
			}
		});

		return randomID;
	}
}

module.exports.Entity = Entity;
module.exports.EntityNotFoundError = EntityNotFoundError;
module.exports.EntityParentNotFoundError = EntityParentNotFoundError;
module.exports.EntityIDGenerationError = EntityIDGenerationError;
module.exports.EntityParentsBadRequestError = EntityParentsBadRequestError;
