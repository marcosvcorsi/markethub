import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PaginatedResponse, PaginationDto } from '../dto/pagination.dto';

describe('PaginationDto', () => {
  it('should use defaults when no values provided', () => {
    const dto = new PaginationDto();
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });

  it('should calculate skip correctly', () => {
    const dto = plainToInstance(PaginationDto, { page: 3, limit: 10 });
    expect(dto.skip).toBe(20);
  });

  it('should reject negative page', async () => {
    const dto = plainToInstance(PaginationDto, { page: -1 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject limit over 100', async () => {
    const dto = plainToInstance(PaginationDto, { limit: 200 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should accept valid values', async () => {
    const dto = plainToInstance(PaginationDto, { page: 2, limit: 50 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('PaginatedResponse', () => {
  it('should calculate totalPages correctly', () => {
    const pagination = plainToInstance(PaginationDto, { page: 1, limit: 10 });
    const response = new PaginatedResponse(['a', 'b', 'c'], 25, pagination);

    expect(response.data).toEqual(['a', 'b', 'c']);
    expect(response.meta).toEqual({
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it('should return 0 totalPages for empty results', () => {
    const pagination = new PaginationDto();
    const response = new PaginatedResponse([], 0, pagination);

    expect(response.meta.totalPages).toBe(0);
    expect(response.meta.total).toBe(0);
  });
});
