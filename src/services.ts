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

export function isInvalidId(id: unknown): boolean {
  return typeof id !== "string" || id.trim() === "" || !Number.isFinite(Number(id));
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

export function createHttpError(status: number, message: string): HttpError {
  const error = new Error(message) as HttpError;
  error.status = status;
  return error;
}