export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 422);
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function handleActionError(err: unknown): { success: false; error: string; code?: string } {
  if (err instanceof AppError) {
    return { success: false, error: err.message, code: err.code };
  }
  if (err instanceof Error) {
    return { success: false, error: err.message };
  }
  return { success: false, error: "An unexpected error occurred" };
}
