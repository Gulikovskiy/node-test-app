import { HttpError} from "./types";

export function validateTaskInput(
  params: { name: unknown; description: unknown },
  { partial = false }: { partial?: boolean } = {}
): HttpError | undefined {
  const { name, description } = params;

  if (!partial || name !== undefined) {
    if (!isNonEmptyString(name)) {
      return createHttpError(400, "Name must be a non-empty string");
    }
  }
  if (!partial || description !== undefined) {
    if (!isString(description)) {
      return createHttpError(400, "Description is invalid");
    }
  }
  if (partial && name === undefined && description === undefined) {
    return createHttpError(400, "At least one field must be provided");
  }
  return undefined;
}

export function validateRegisterInput(params: {
  email: unknown;
  password: unknown;
}): HttpError | undefined {
  const { email, password } = params;

  if (!isString(email) || !isValidEmail(email)) {
    return createHttpError(400, "Email must be a valid email address");
  }
  if (!isString(password) || password.length < 8) {
    return createHttpError(400, "Password must be at least 8 characters");
  }
  return undefined;
}

export function validateLoginInput(params: {
  email: unknown;
  password: unknown;
}): HttpError | undefined {
  const { email, password } = params;

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return createHttpError(400, "Email and password are required");
  }
  return undefined;
}

export function isInvalidId(id: unknown): boolean {
  return typeof id !== "string" || id.trim() === "" || !Number.isFinite(Number(id));
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function createHttpError(status: number, message: string): HttpError {
  const error = new Error(message) as HttpError;
  error.status = status;
  return error;
}


export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
