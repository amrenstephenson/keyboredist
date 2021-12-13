const express = require('express');
const app = express();
const users = require('./users');

app.use(express.static('client'));
app.use(express.json());

// Get list of existing users.
app.get('/api/users', async function (req, resp) {
	const userList = await users.getList();
	resp.json(userList);
});

// Get existing user with userID.
app.get('/api/users/:id', async function (req, resp) {
	try {
		const user = await users.get(req.params.id);
		resp.json(user);
	} catch (err) {
		if (err instanceof users.UserNotFoundError) {
			resp.status(500).send('User not found');
		} else {
			resp.status(500).send('Unknown internal server error');
		}
	}
});

// Add new user with userID.
app.put('/api/users/', async function (req, resp) {
	try {
		await users.create(req.body.name);
		resp.send('Success');
	} catch (err) {
		console.log(err);
		if (err instanceof users.UserIDGenerationError) {
			resp.status(500).send('Error generating user ID, please try again.');
		} else {
			resp.status(500).send('Unknown internal server error');
		}
	}
});

// Delete user with userID.
app.delete('/api/users/:id', async function (req, resp) {
	try {
		await users.remove(req.params.id);
		resp.send('Success');
	} catch (err) {
		if (err instanceof users.UserNotFoundError) {
			resp.status(500).send('User not found');
		} else {
			resp.status(500).send('Unknown internal server error');
		}
	}
});

// Update existing user with userID.
app.post('/api/users/:id', async function (req, resp) {

});

module.exports = app;
