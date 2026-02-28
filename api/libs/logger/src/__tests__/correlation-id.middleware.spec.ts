import {
  CorrelationIdMiddleware,
  CORRELATION_ID_HEADER,
} from '../correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
    mockReq = { headers: {} };
    mockRes = { setHeader: jest.fn() };
    mockNext = jest.fn();
  });

  it('should generate a UUID if no correlation ID header exists', () => {
    middleware.use(mockReq, mockRes, mockNext);

    expect(mockReq[CORRELATION_ID_HEADER]).toBeDefined();
    expect(mockReq[CORRELATION_ID_HEADER]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_HEADER,
      mockReq[CORRELATION_ID_HEADER],
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use existing correlation ID header if present', () => {
    const existingId = 'existing-correlation-id';
    mockReq.headers[CORRELATION_ID_HEADER] = existingId;

    middleware.use(mockReq, mockRes, mockNext);

    expect(mockReq[CORRELATION_ID_HEADER]).toBe(existingId);
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_HEADER,
      existingId,
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should always call next', () => {
    middleware.use(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
