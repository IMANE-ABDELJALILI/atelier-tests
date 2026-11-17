const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');

beforeEach(async () => {
  await db.query('DROP TABLE IF EXISTS users');
  await db.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      nom VARCHAR(100) NOT NULL
    )
  `);
  await db.query(
    'INSERT INTO users (nom) VALUES ($1)',
    ['Alice']
  );
});

afterAll(async () => {
  await db.end();
});

describe('API Users', () => {
  test('retourne un utilisateur existant', async () => {
    const response = await request(app).get('/users/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1, nom: 'Alice' });
  });

  test('retourne 404 si utilisateur inexistant', async () => {
    const response = await request(app).get('/users/999');

    expect(response.status).toBe(404);
  });

  test('retourne 400 si ID invalide', async () => {
    const response = await request(app).get('/users/abc');

    expect(response.status).toBe(400);
  });

  test('protège contre une injection SQL', async () => {
    const id = encodeURIComponent('1; DROP TABLE users;--');
    const response = await request(app).get(`/users/${id}`);

    expect(response.status).toBe(400);

    const result = await db.query('SELECT COUNT(*) FROM users');
    expect(Number(result.rows[0].count)).toBe(1);
  });
});
