/**
 * @description - Error class for handling errors.
 * @param {string} message - The error message
 * @param {number} statusCode - The error status code
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.message = message
    }
}

module.exports = AppError;