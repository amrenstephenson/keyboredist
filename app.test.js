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
		test('Parents of undefined gives 200.', () => {
			const params = { name: 'Test User' };
			return request(app)
				.post('/api/users')
				.send(params)
				.expect(200);
		});

		test('Parents of {} gives 200.', () => {
			const params = { name: 'Test User', parents: {} };
			return request(app)
				.post('/api/users')
				.send(params)
				.expect(200);
		});

		test('Parents of array gives 400.', () => {
			const params = { name: 'Test User', parents: [{ user: 'test' }] };
			return request(app)
				.post('/api/users')
				.send(params)
				.expect(400);
		});

		test('Relationships of invalid relationship gives 400.', () => {
			const params = { name: 'Test User', parents: { user: 'test' } };
			return request(app)
				.post('/api/users')
				.send(params)
				.expect(400);
		});
	});

	// TODO Add update tests.

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
						.expect(200);
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

describe('Test /api/keyboards', () => {
	test('Relationships of valid user ID gives 200.', () => {
		const params = { name: 'Alice\'s Keyboard', parents: { user: 'YoY5-sD7NE' } };
		return request(app)
			.post('/api/keyboards')
			.send(params)
			.expect(200);
	});

	test('Sucessive children of same parents gives 200s.', () => {
		const params = { name: 'Bob\'s Double Keyboards', parents: { user: 'j9iUbjb5n8' } };
		return request(app)
			.post('/api/keyboards')
			.send(params)
			.expect(200)
			.then(async () => {
				return request(app)
					.post('/api/keyboards')
					.send(params)
					.expect(200);
			});
	});
});
