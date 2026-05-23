export type ErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_ID"
  | "NOT_FOUND"
  | "DUPLICATE_SLUG"
  | "BAD_REQUEST"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static validation(message: string, details?: unknown): ApiError {
    return new ApiError(400, "VALIDATION_ERROR", message, details);
  }

  static invalidId(message = "Invalid product id"): ApiError {
    return new ApiError(400, "INVALID_ID", message);
  }

  static notFound(message = "Product not found"): ApiError {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static duplicateSlug(message = "A product with this slug already exists"): ApiError {
    return new ApiError(409, "DUPLICATE_SLUG", message);
  }

  static internal(message = "Internal server error"): ApiError {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}
