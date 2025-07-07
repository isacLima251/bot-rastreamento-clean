const authController = require('../src/controllers/authController');
const userService = require('../src/services/userService');
const subscriptionService = require('../src/services/subscriptionService');

jest.mock('../src/services/userService');
jest.mock('../src/services/subscriptionService');

describe('authController.register', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { db: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  test('creates a new user', async () => {
    req.body = { email: 'test@example.com', password: '123' };
    userService.findUserByEmail.mockResolvedValue(null);
    userService.createUser.mockResolvedValue({ id: 1, email: 'test@example.com', api_key: 'key' });
    subscriptionService.createSubscription.mockResolvedValue();

    await authController.register(req, res);

    expect(userService.createUser).toHaveBeenCalledWith(req.db, 'test@example.com', '123', 0, 1, 0);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1, email: 'test@example.com', apiKey: 'key' });
  });

  test('returns 409 when user exists', async () => {
    req.body = { email: 'exist@example.com', password: '123' };
    userService.findUserByEmail.mockResolvedValue({ id: 1 });

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Usuário já existe.' });
  });
});
