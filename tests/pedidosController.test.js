const { criarPedido } = require('../src/controllers/pedidosController');
const pedidoService = require('../src/services/pedidoService');
const subscriptionService = require('../src/services/subscriptionService');
const envioController = require('../src/controllers/envioController');
const logService = require('../src/services/logService');
const { validationResult } = require('express-validator');

jest.mock('../src/services/pedidoService');
jest.mock('../src/services/subscriptionService');
jest.mock('../src/controllers/envioController');
jest.mock('../src/services/logService');

jest.mock('express-validator', () => {
  const chain = { trim: () => chain, notEmpty: () => chain, withMessage: () => chain, isMobilePhone: () => chain };
  return {
    body: jest.fn(() => chain),
    validationResult: jest.fn()
  };
});

describe('pedidosController.criarPedido', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      db: {},
      venomClient: {},
      user: { id: 1 },
      body: { nome: 'John', telefone: '11999999999', produto: 'Book', codigoRastreio: 'AAA' },
      broadcast: jest.fn()
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
    subscriptionService.getUserSubscription.mockResolvedValue({ id: 10, monthly_limit: -1, usage: 0 });
    pedidoService.findPedidoByTelefone.mockResolvedValue(null);
    pedidoService.criarPedido.mockResolvedValue({ id: 5 });
    jest.clearAllMocks();
  });

  test('creates a new pedido', async () => {
    await criarPedido[3](req, res);

    expect(pedidoService.criarPedido).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('returns 409 when pedido exists', async () => {
    pedidoService.findPedidoByTelefone.mockResolvedValue({ id: 1 });

    await criarPedido[3](req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});
