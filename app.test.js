const request = require('supertest');
const app = require('./app');

describe('Test the user part of the API.', () => {
	test('GET /api/users succeeds and returns JSON.', () => {
		return request(app)
			.get('/api/users')
			.expect(200)
			.expect('Content-type', /json/);
	});

	test('PUT /api/users succeeds and returns ID, then DELETE /api/users/:id succeeds in removing user with ID.', () => {
		const params = { name: 'Test User' };
		return request(app)
			.put('/api/users')
			.send(params)
			.expect(200)
			.then(res => {
				return request(app)
					.delete(`/api/users/${res.text}`)
					.expect(200);
			});
	});

	test('GET /api/users/:id 404s for invalid ID.', () => {
		return request(app)
			.get('/api/users/definitely-not-a-user')
			.expect(404);
	});

	test('DELETE /api/users/:id 404s for invalid ID.', () => {
		return request(app)
			.delete('/api/users/definitely-not-a-user')
			.expect(404);
	});
});
