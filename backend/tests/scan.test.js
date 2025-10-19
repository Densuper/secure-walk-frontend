process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.SEED_DEMO_DATA = 'true';

const request = require('supertest');
const { app, server } = require('../server');
const { db } = require('../database');

describe('Scan API Endpoint', () => {
    let userToken;

    beforeAll(async () => {
        // Login as testuser to get a token for scan tests
        const loginRes = await request(app)
            .post('/api/login')
            .send({
                username: 'testuser',
                password: 'password123'
            });
        if (loginRes.statusCode !== 200 || !loginRes.body.token) {
            throw new Error('Failed to login testuser to get token for scan tests');
        }
        userToken = loginRes.body.token;
    });

    afterAll(async () => {
        await new Promise(resolve => server.close(resolve));
        await new Promise(resolve => db.close(resolve));
    });

    describe('POST /api/scan', () => {
        it('should record a scan successfully with a valid QR code and token', async () => {
            const res = await request(app)
                .post('/api/scan')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    qr_code_identifier: 'CP001' // Assumes CP001 is a valid, pre-populated checkpoint
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('message', 'Checkpoint scanned successfully');
            expect(res.body).toHaveProperty('scanId');
            expect(res.body.checkpoint.qr_code_identifier).toEqual('CP001');
        });

        it('should fail to record a scan with an invalid QR code and a valid token', async () => {
            const res = await request(app)
                .post('/api/scan')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    qr_code_identifier: 'INVALIDQR00X'
                });
            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('message', 'Invalid QR Code. Checkpoint not found.');
        });

        it('should fail to record a scan with a valid QR code but no token', async () => {
            const res = await request(app)
                .post('/api/scan')
                .send({
                    qr_code_identifier: 'CP001'
                });
            expect(res.statusCode).toEqual(401); // Or 403 depending on middleware
            expect(res.body).toHaveProperty('message', 'Access denied. No token provided.');
        });

        it('should fail to record a scan with a valid QR code but an invalid token', async () => {
            const res = await request(app)
                .post('/api/scan')
                .set('Authorization', 'Bearer invalidtoken123')
                .send({
                    qr_code_identifier: 'CP001'
                });
            expect(res.statusCode).toEqual(401); // Or 403
            expect(res.body).toHaveProperty('message', 'Invalid token.');
        });

        it('should fail if qr_code_identifier is missing', async () => {
            const res = await request(app)
                .post('/api/scan')
                .set('Authorization', `Bearer ${userToken}`)
                .send({}); // Missing qr_code_identifier
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('message', 'QR code identifier is required.');
        });
    });
});
