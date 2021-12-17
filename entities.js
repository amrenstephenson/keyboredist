const crypto = require('crypto');
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
class EntityIDGenerationError extends Error {
	constructor (message) {
		super(message);
		this.name = 'EntityIDGenerationError';
		Error.captureStackTrace(this, EntityIDGenerationError);
	}
}

class Entity {
	constructor (nameSingular, namePlural, isTesting) {
		this.nameSingular = nameSingular;
		this.namePlural = namePlural;

		function capitalizeFirst (str) {
			return str.substring(0, 1).toUpperCase() + str.substring(1);
		}

		this.nameSingularCap = capitalizeFirst(nameSingular);
		this.namePluralCap = capitalizeFirst(namePlural);

		const suffix = isTesting ? '-test' : '';
		this.filePath = `./json/${namePlural}${suffix}.json`;

		if (!fs.existsSync(this.filePath)) {
			fs.writeFileSync(this.filePath, '{"entities":[]}', (err) => {
				if (err) throw err;
			});
		}
	}

	async getList () {
		const fileData = await fs.promises.readFile(this.filePath);

		// If the entity JSON file is empty, initialise it.
		if (fileData.toString('utf8') === '') {
			return { entities: [] };
		}

		const entityList = await JSON.parse(fileData);
		return entityList;
	}

	async create (name) {
		const entityList = await this.getList();

		const newEntity = { id: this.getUniqueEntityID(entityList), name: name };
		entityList.entities.push(newEntity);

		await this.updateEntityListFile(entityList);

		return newEntity.id;
	}

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

	async update (id) {
		const entityList = await this.getList();
		let foundEntity = false;

		entityList.entities.forEach((entity, index) => {
			if (entity.id === id) {
				foundEntity = true;
				// Do updating here.
			}
		});

		if (!foundEntity) {
			throw new EntityNotFoundError();
		}

		await this.updateEntityListFile(entityList);
	}

	async updateEntityListFile (entityList) {
		const jsonData = JSON.stringify(entityList);
		await fs.promises.writeFile(this.filePath, jsonData);
	}

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
module.exports.EntityIDGenerationError = EntityIDGenerationError;
