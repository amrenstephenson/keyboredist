const request = require('supertest');
const app = require('./app');

describe('Test /api/users', () => {
	describe('GET /api/users', () => {
		test('Succeeds and returns JSON.', () => {
			return request(app)
				.get('/api/users')
				.expect(200)
				.expect('Content-type', /json/);
		});
	});

	describe('GET /api/users/:id', () => {
		/* test('Valid ID gives 200.', () => {
			return request(app)
				.get('/api/users/definitely-not-a-user')
				.expect(200);
		}); */

		test('Invalid ID gives 404.', () => {
			return request(app)
				.get('/api/users/definitely-not-a-user')
				.expect(404);
		});
	});

	describe('POST /api/users', () => {
		test('Relationships of undefined gives 200.', () => {
			const params = { name: 'Test User' };
			return request(app)
				.post('/api/users')
				.send(params)
				.expect(200);
		});

		test('Relationships of [] gives 200.', () => {
			const params = { name: 'Test User', relationships: [] };
			return request(app)
				.post('/api/users')
				.send(params)
				.expect(200);
		});

		test('Relationships of non-array gives 400.', () => {
			const params = { name: 'Test User', relationships: { user: 'test' } };
			return request(app)
				.post('/api/users')
				.send(params)
				.expect(400);
		});

		test('Relationships of invalid relationship gives 400.', () => {
			const params = { name: 'Test User', relationships: [{ user: 'test' }] };
			return request(app)
				.post('/api/users')
				.send(params)
				.expect(400);
		});
	});

	describe('Multistage tests.', () => {
		test('POST /api/users succeeds and returns ID, then DELETE /api/users/:id succeeds in removing user with ID.', () => {
			const params = { name: 'Test User' };
			return request(app)
				.post('/api/users')
				.send(params)
				.expect(200)
				.then(res => {
					return request(app)
						.delete(`/api/users/${res.text}`)
						.expect(200); // Note this can fail if create fails! TODO: Add extra test.
				});
		});
	});

	describe('DELETE /api/users/:id', () => {
		test('Invalid ID gives 404.', () => {
			return request(app)
				.delete('/api/users/definitely-not-a-user')
				.expect(404);
		});
	});
});
