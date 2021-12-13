const crypto = require('crypto');
const fs = require('fs');

const USERS_FILE = './json/users.json';

// Modified from https://dev.to/lvidakovic/custom-error-types-in-node-js-491a [accessed 13 Dec 2021]
class UserNotFoundError extends Error {
	constructor (message) {
		super(message);
		this.name = 'UserNotFoundError';
		Error.captureStackTrace(this, UserNotFoundError);
	}
}

// Modified from https://dev.to/lvidakovic/custom-error-types-in-node-js-491a [accessed 13 Dec 2021]
class UserIDGenerationError extends Error {
	constructor (message) {
		super(message);
		this.name = 'UserIDGenerationError';
		Error.captureStackTrace(this, UserIDGenerationError);
	}
}

module.exports = {
	async getList () {
		const fileData = await fs.promises.readFile(USERS_FILE);

		// If the users JSON file is empty, initialise it.
		if (fileData.toString('utf8') === '') {
			return { users: [] };
		}

		const userList = await JSON.parse(fileData);
		return userList;
	},

	async create (name) {
		const userList = await this.getList();

		const newUser = { id: this.getUniqueUserID(userList), name: name };
		userList.users.push(newUser);

		await this.updateUserListFile(userList);
	},

	async get (id) {
		const userList = await this.getList();

		for (const index in userList.users) {
			const user = userList.users[index];
			if (user.id === id) {
				return user;
			}
		}

		throw new UserNotFoundError();
	},

	async remove (id) {
		const userList = await this.getList();
		let foundUser = false;

		userList.users.forEach((user, index) => {
			if (user.id === id) {
				foundUser = true;
				userList.users.splice(index, 1);
			}
		});

		if (!foundUser) {
			throw new UserNotFoundError();
		}

		await this.updateUserListFile(userList);
	},

	getUniqueUserID (userList) {
		const randomID = crypto.randomBytes(8).toString('base64').replace('/', '-').slice(0, -2);

		// Check that this userID is unique. Given that we have 2^64 possibilities this should not happen often!
		userList.users.forEach(user => {
			if (user.id === randomID) {
				throw new UserIDGenerationError();
			}
		});

		return randomID;
	},

	async updateUserListFile (userList) {
		const jsonData = await JSON.stringify(userList);
		await fs.promises.writeFile(USERS_FILE, jsonData);
	}
};

module.exports.UserNotFoundError = UserNotFoundError;
module.exports.UserIDGenerationError = UserIDGenerationError;
