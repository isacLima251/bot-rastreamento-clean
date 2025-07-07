const authController = require('../src/controllers/authController');
const userService = require('../src/services/userService');
const subscriptionService = require('../src/services/subscriptionService');

jest.mock('../src/services/userService');
jest.mock('../src/services/subscriptionService');

describe('authController.register', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      db: {
        get: jest.fn((sql, params, cb) => cb(null, { id: 1 })),
        run: jest.fn((sql, params, cb) => cb && cb(null))
      },
      body: {}
    };
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

  test('creates free plan automatically when missing', async () => {
    req.body = { email: 'free@example.com', password: '123' };
    req.db.get.mockImplementationOnce((sql, params, cb) => cb(null, undefined));
    userService.findUserByEmail.mockResolvedValue(null);
    userService.createUser.mockResolvedValue({ id: 2, email: 'free@example.com', api_key: 'key2' });
    subscriptionService.createSubscription.mockResolvedValue();

    await authController.register(req, res);

    expect(req.db.run).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 2, email: 'free@example.com', apiKey: 'key2' });
  });

  test('returns 409 when user exists', async () => {
    req.body = { email: 'exist@example.com', password: '123' };
    userService.findUserByEmail.mockResolvedValue({ id: 1 });

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Usuário já existe.' });
  });
});
