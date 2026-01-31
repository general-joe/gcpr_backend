/**
 * Custom HTTP Exception class for handling application errors
 */
class HttpException extends Error {
  constructor(status, message) {
    if (message instanceof Error) {
      super(message.message);
      this.stack = message.stack;
    } else {
      super(message ? message.toString() : '');
      this.name = ' ';
    }

    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default HttpException;
