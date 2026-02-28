export class ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;

  constructor(partial: Partial<ApiErrorResponse>) {
    Object.assign(this, partial);
  }
}
