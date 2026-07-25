/**
 * Custom HTTP Exception class for handling application errors
 */
class HttpException extends Error {
  constructor(status, message, options = {}) {
    if (message instanceof Error) {
      super(message.message);
      this.stack = message.stack;
    } else {
      super(message ? message.toString() : '');
      this.name = ' ';
    }

    this.status = status;
    this.errorCode = options.errorCode;
    this.details = options.details;
    this.hint = options.hint;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default HttpException;
