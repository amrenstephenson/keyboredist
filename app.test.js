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

		test('Succeeds with filter and returns JSON.', () => {
			return request(app)
				.get('/api/users?name=Alice')
				.expect(200)
				.expect('Content-type', /json/);
		});

		test('Filter with no results gives 200.', () => {
			return request(app)
				.get('/api/users?name=Alice123')
				.expect(200);
		});
	});

	describe('GET /api/users/:id', () => {
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

		test('Invalid name gives 400.', () => {
			const params = { name: '' };
			return request(app)
				.post('/api/users')
				.send(params)
				.expect(400);
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

	describe('POST /api/users/:id', () => {
		test('Valid update data gives 200.', () => {
			const params = { data: 'This is a test' };
			return request(app)
				.post('/api/users/YoY5-sD7NE')
				.send(params)
				.expect(200);
		});

		test('Invalid id gives 404.', () => {
			const params = { data: 'This is a test' };
			return request(app)
				.post('/api/users/invalid')
				.send(params)
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

	test('Relationships of invalid user ID gives 404.', () => {
		const params = { name: 'Alice\'s Keyboard', parents: { user: 'invalid' } };
		return request(app)
			.post('/api/keyboards')
			.send(params)
			.expect(404);
	});

	describe('GET /api/keyboards', () => {
		test('Succeeds and returns JSON.', () => {
			return request(app)
				.get('/api/keyboards')
				.expect(200)
				.expect('Content-type', /json/);
		});
	});

	describe('GET /api/keyboards/:id', () => {
		test('Invalid ID gives 404.', () => {
			return request(app)
				.get('/api/keyboards/definitely-not-a-keyboard')
				.expect(404);
		});
	});

	describe('POST /api/keyboards', () => {
		test('Parents of array gives 400.', () => {
			const params = { name: 'Test Keyboard', parents: [{ user: 'test' }] };
			return request(app)
				.post('/api/keyboards')
				.send(params)
				.expect(400);
		});

		test('Relationships of invalid relationship gives 400.', () => {
			const params = { name: 'Test Keyboard', keyboards: { user: 'test' } };
			return request(app)
				.post('/api/keyboards')
				.send(params)
				.expect(400);
		});
	});

	describe('POST /api/keyboards/:id', () => {
		test('Valid update data gives 200.', () => {
			const params = { data: { attack: 10, decay: 10, sustain: 10, release: 10 } };
			return request(app)
				.post('/api/keyboards/zumXBAiALS')
				.send(params)
				.expect(200);
		});

		test('Invalid id gives 404.', () => {
			const params = { data: { attack: 10, decay: 10, sustain: 10, release: 10 } };
			return request(app)
				.post('/api/keyboards/invalid')
				.send(params)
				.expect(404);
		});
	});
});

describe('Test /coffee', () => {
	test('Eater egg gives 418.', () => {
		return request(app)
			.get('/coffee')
			.expect(418);
	});

	test('Invalid normal location gives 200.', () => {
		return request(app)
			.get('/invalid')
			.expect(200);
	});
});

describe('Test /inavlid and /api/invalid', () => {
	test('Invalid api location gives 404.', () => {
		return request(app)
			.get('/api/invalid')
			.expect(404);
	});

	test('Invalid normal location gives 200.', () => {
		return request(app)
			.get('/invalid')
			.expect(200);
	});
});
