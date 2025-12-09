const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/user');

// Wait for app to be ready - configurable timeout
const APP_READY_TIMEOUT = parseInt(process.env.TEST_APP_READY_TIMEOUT) || 3000;
const waitForApp = () => new Promise(resolve => setTimeout(resolve, APP_READY_TIMEOUT));

describe('Auth API', () => {
    let testToken;
    const testUser = {
        fullName: 'Test User',
        email: 'testuser@test.com',
        password: 'testpass123'
    };

    beforeAll(async () => {
        await waitForApp();
    });

    afterAll(async () => {
        // Clean up test user
        await User.deleteOne({ email: testUser.email });
    });

    describe('POST /api/auth/register', () => {
        it('should register a new passenger', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('email', testUser.email);
            expect(res.body.user.role).toBe('passenger');
            testToken = res.body.token;
        });

        it('should not register duplicate email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).toBe(409);
        });

        it('should validate required fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'invalid' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should reject invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user with valid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.user).toHaveProperty('email', testUser.email);
        });

        it('should reject request without token', async () => {
            const res = await request(app)
                .get('/api/auth/me');

            expect(res.statusCode).toBe(401);
        });
    });
});

describe('Search API', () => {
    beforeAll(async () => {
        await waitForApp();
    });

    describe('GET /api/search/airports', () => {
        it('should return list of airports', async () => {
            const res = await request(app)
                .get('/api/search/airports');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('airports');
            expect(Array.isArray(res.body.airports)).toBe(true);
        });

        it('should filter airports by query', async () => {
            const res = await request(app)
                .get('/api/search/airports')
                .query({ q: 'new york' });

            expect(res.statusCode).toBe(200);
            expect(res.body.airports.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('GET /api/search/flights', () => {
        it('should search flights with valid parameters', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 5);
            
            const res = await request(app)
                .get('/api/search/flights')
                .query({
                    from: 'JFK',
                    to: 'LAX',
                    date: tomorrow.toISOString().split('T')[0]
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('trips');
            expect(Array.isArray(res.body.trips)).toBe(true);
        });

        it('should validate required search parameters', async () => {
            const res = await request(app)
                .get('/api/search/flights');

            expect(res.statusCode).toBe(400);
        });
    });
});

describe('Airlines API', () => {
    beforeAll(async () => {
        await waitForApp();
    });

    describe('GET /api/airlines', () => {
        it('should return list of airlines (public)', async () => {
            const res = await request(app)
                .get('/api/airlines');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('airlines');
            expect(Array.isArray(res.body.airlines)).toBe(true);
        });
    });
});

// Close database connection after all tests
afterAll(async () => {
    await mongoose.connection.close();
});
