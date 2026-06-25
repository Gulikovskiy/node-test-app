"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTaskInput = validateTaskInput;
exports.isInvalidId = isInvalidId;
exports.isString = isString;
exports.isNonEmptyString = isNonEmptyString;
exports.createHttpError = createHttpError;
function validateTaskInput(params, { partial = false } = {}) {
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
function isInvalidId(id) {
    return typeof id !== "string" || id.trim() === "" || !Number.isFinite(Number(id));
}
function isString(value) {
    return typeof value === 'string';
}
function isNonEmptyString(value) {
    return isString(value) && value.trim().length > 0;
}
function createHttpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}
