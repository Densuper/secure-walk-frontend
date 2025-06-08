const request = require('supertest');
const { app, server } = require('../server');
const { db } = require('../database');

describe('Admin user management endpoints', () => {
  let adminToken;

  beforeAll(async () => {
    // Login as admin to obtain a JWT token
    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({ username: 'adminuser', password: 'adminpass123' });

    if (loginRes.statusCode !== 200 || !loginRes.body.token) {
      throw new Error('Failed to login as adminuser');
    }
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
    await new Promise(resolve => db.close(resolve));
  });

  it('should create a new user and then delete it', async () => {
    const newUsername = `tempuser_${Date.now()}`;

    // Create the user
    const createRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: newUsername, password: 'tempPass123', role: 'user' });

    expect(createRes.statusCode).toEqual(201);
    expect(createRes.body).toHaveProperty('id');
    expect(createRes.body).toHaveProperty('username', newUsername);

    const createdUserId = createRes.body.id;

    // Clean up by deleting the user
    const deleteRes = await request(app)
      .delete(`/api/admin/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body).toHaveProperty('message', 'User deleted successfully.');
  });
});
