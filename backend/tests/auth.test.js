process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.SEED_DEMO_DATA = 'true';

const request = require('supertest');
const { app, server } = require('../server'); // Assuming server.js exports app and server
const { db } = require('../database');

describe('Auth API Endpoints', () => {

    afterAll(async () => {
        await new Promise(resolve => server.close(resolve)); // Close the server
        await new Promise(resolve => db.close(resolve)); // Close the database connection
    });

    // Test User Login
    describe('POST /api/login', () => {
        it('should login testuser successfully with correct credentials', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should fail to login testuser with incorrect password', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpassword'
                });
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('message', 'Invalid credentials.');
        });

        it('should fail to login non-existent user', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({
                    username: 'nonexistentuser',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(401); // Or 404 depending on implementation, 401 for "Invalid credentials" is common
            expect(res.body).toHaveProperty('message', 'Invalid credentials.');
        });
    });

    // Test Admin Login
    describe('POST /api/admin/login', () => {
        it('should login adminuser successfully with correct credentials', async () => {
            const res = await request(app)
                .post('/api/admin/login')
                .send({
                    username: 'adminuser',
                    password: 'adminpass123'
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should fail to login adminuser with incorrect password', async () => {
            const res = await request(app)
                .post('/api/admin/login')
                .send({
                    username: 'adminuser',
                    password: 'wrongpassword'
                });
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('message', 'Invalid credentials.');
        });

        it('should fail to login testuser (non-admin) to admin endpoint', async () => {
            const res = await request(app)
                .post('/api/admin/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(403); // Forbidden, as user is not an admin
            expect(res.body).toHaveProperty('message', 'Access denied. Not an admin.');
        });

         it('should fail to login non-existent user to admin endpoint', async () => {
            const res = await request(app)
                .post('/api/admin/login')
                .send({
                    username: 'nonexistentadmin',
                    password: 'adminpass123'
                });
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('message', 'Invalid credentials.');
        });
    });
});
