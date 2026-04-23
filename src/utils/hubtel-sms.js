import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const getAxiosErrorMessage = (error) => {
  if (error?.response?.data) {
    return typeof error.response.data === "string"
      ? error.response.data
      : JSON.stringify(error.response.data);
  }

  return error?.message || "Unknown Hubtel error";
};

export const SendSMS = async (To, Content) => {
  const maxRetries = 2;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await axios.get(
        `https://smsc.hubtel.com/v1/messages/send?clientsecret=${process.env.HUBTEL_SECRET}&clientid=${process.env.HUBTEL_CLIENTID}&from=${process.env.HUBTEL_SENDER}&to=${To}&content=${Content}`,
        {
          timeout: 10000, // 10 second timeout
        },
      );

      WRITE.info("SMS sent successfully", {
        phoneNumber: To,
        attempt,
      });

      return res;
    } catch (error) {
      lastError = error;

      // For SMS, don't retry too much - fire and forget is acceptable
      const retryDelay = attempt * 100;

      if (attempt < maxRetries) {
        WRITE.warn(
          `SMS send attempt ${attempt} failed, retrying in ${retryDelay}ms`,
          {
            phoneNumber: To,
            error: error.message,
            nextRetry: attempt + 1,
          },
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        WRITE.warn("SMS send failed after retries (non-critical)", {
          phoneNumber: To,
          attempts: maxRetrToies,
          error: error.message,
        });
        // Don't throw - SMS is informational, not critical
        return error.message;
      }
    }
  }
};

// Create Basic Auth header for OTP API
const getOTPAuthHeader = () => {
  const credentials = `${process.env.HUBTEL_CLIENTID}:${process.env.HUBTEL_SECRET}`;
  const encodedCredentials = Buffer.from(credentials).toString("base64");
  return {
    Authorization: `Basic ${encodedCredentials}`,
    "Content-Type": "application/json",
  };
};

export const SendOTP = async (To) => {
  function normalizeGhPhone(phone) {
    const raw = String(phone).replace(/\s+/g, "");
    if (raw.startsWith("+233")) return raw.slice(1);
    if (raw.startsWith("233")) return raw;
    if (raw.startsWith("0")) return `233${raw.slice(1)}`;
    return raw;
  }

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = {
        senderId: process.env.HUBTEL_SENDER,
        phoneNumber: normalizeGhPhone(To),
        countryCode: "GH",
      };
      const headers = getOTPAuthHeader();
      const res = await axios.post(
        `https://api-otp.hubtel.com/otp/send`,
        data,
        {
          headers,
          timeout: 10000, // 10 second timeout
        },
      );

      WRITE.info("OTP sent successfully to Hubtel", {
        phoneNumber: To,
        attempt,
        requestId: res.data?.requestId,
      });

      return res.data;
    } catch (error) {
      lastError = error;

      // If Hubtel responded with HTTP error, check if retryable
      if (error?.response) {
        const statusCode = error?.response?.status;
        const errorMsg = getAxiosErrorMessage(error);

        // Don't retry on client errors (4xx)
        if (statusCode >= 400 && statusCode < 500) {
          WRITE.error("Hubtel OTP send failed with client error", {
            phoneNumber: To,
            statusCode,
            error: errorMsg,
          });
          throw new Error(`Failed to send OTP: ${errorMsg}`);
        }

        // Retry on server errors (5xx)
        if (statusCode >= 500 && attempt < maxRetries) {
          const retryDelay = Math.pow(2, attempt - 1) * 100;
          WRITE.warn(
            `OTP send attempt ${attempt} failed with server error, retrying in ${retryDelay}ms`,
            {
              phoneNumber: To,
              statusCode,
              nextRetry: attempt + 1,
            },
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }
      }

      // Network / timeout — retry with exponential backoff
      const details = getAxiosErrorMessage(error);
      const retryDelay = Math.pow(2, attempt - 1) * 100;

      if (attempt < maxRetries) {
        WRITE.warn(
          `OTP send attempt ${attempt} failed, retrying in ${retryDelay}ms`,
          {
            phoneNumber: To,
            error: details,
            nextRetry: attempt + 1,
          },
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        WRITE.error("OTP send failed after all retries", {
          phoneNumber: To,
          attempts: maxRetries,
          finalError: details,
        });
        throw new Error(
          `Failed to send OTP after ${maxRetries} attempts: ${details}`,
        );
      }
    }
  }
};

export const VerifyOTP = async (requestId, prefix, code) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = {
        requestId,
        prefix,
        code,
      };

      const headers = getOTPAuthHeader();
      const res = await axios.post(
        `https://api-otp.hubtel.com/otp/verify`,
        data,
        {
          headers,
          timeout: 10000, // 10 second timeout
        },
      );

      WRITE.debug("OTP verified successfully with Hubtel", {
        requestId,
        attempt,
      });

      return res.status === 200;
    } catch (error) {
      lastError = error;

      // If Hubtel responded with an HTTP error (wrong code, expired, etc.)
      // treat it as an invalid OTP rather than a server crash
      if (error?.response) {
        const errorMsg = getAxiosErrorMessage(error);
        WRITE.debug("Hubtel OTP verify rejected", {
          attempt,
          error: errorMsg,
          statusCode: error?.response?.status,
        });
        return false; // Don't retry on HTTP errors
      }

      // Network / timeout / no response — retry with exponential backoff
      const details = getAxiosErrorMessage(error);
      const retryDelay = Math.pow(2, attempt - 1) * 100; // 100ms, 200ms, 400ms

      if (attempt < maxRetries) {
        WRITE.warn(
          `OTP verification attempt ${attempt} failed, retrying in ${retryDelay}ms`,
          {
            requestId,
            error: details,
            nextRetry: attempt + 1,
          },
        );
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        WRITE.error("OTP verification failed after all retries", {
          requestId,
          attempts: maxRetries,
          finalError: details,
        });
      }
    }
  }

  // All retries failed
  const details = getAxiosErrorMessage(lastError);
  throw new Error(
    `Failed to verify OTP after ${maxRetries} attempts: ${details}`,
  );
};

export const ResendOTP = async (requestId) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = {
        requestId,
      };
      const headers = getOTPAuthHeader();
      const res = await axios.post(
        `https://api-otp.hubtel.com/otp/resend`,
        data,
        {
          headers,
          timeout: 10000, // 10 second timeout
        },
      );

      WRITE.info("OTP resent successfully", {
        requestId,
        attempt,
      });

      return res.data;
    } catch (error) {
      lastError = error;

      if (error?.response) {
        const statusCode = error?.response?.status;
        const errorMsg = getAxiosErrorMessage(error);

        // Don't retry on client errors
        if (statusCode >= 400 && statusCode < 500) {
          WRITE.error("Hubtel OTP resend failed with client error", {
            requestId,
            statusCode,
            error: errorMsg,
          });
          throw new Error(`Failed to resend OTP: ${errorMsg}`);
        }

        // Retry on server errors
        if (statusCode >= 500 && attempt < maxRetries) {
          const retryDelay = Math.pow(2, attempt - 1) * 100;
          WRITE.warn(
            `OTP resend attempt ${attempt} failed, retrying in ${retryDelay}ms`,
            {
              requestId,
              statusCode,
              nextRetry: attempt + 1,
            },
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }
      }

      const details = getAxiosErrorMessage(error);
      const retryDelay = Math.pow(2, attempt - 1) * 100;

      if (attempt < maxRetries) {
        WRITE.warn(
          `OTP resend attempt ${attempt} failed, retrying in ${retryDelay}ms`,
          {
            requestId,
            error: details,
            nextRetry: attempt + 1,
          },
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        WRITE.error("OTP resend failed after all retries", {
          requestId,
          attempts: maxRetries,
          finalError: details,
        });
        throw new Error(
          `Failed to resend OTP after ${maxRetries} attempts: ${details}`,
        );
      }
    }
  }
};

// exports.ProcessedMessage = ({ sender_name, invoice_no, recipient_name, pickup_location }) => {
//     const res = `Hello ${sender_name} your package with reference ${invoice_no} to ${recipient_name} at ${pickup_location} has been processed. You will be notified upon delivery, thank you.`;
//     return res;
// };

// exports.DispatchedMessage = ({ recipient_name, sender_name, delivery_location, biker_name, biker_telephone, cod }) => {
//     const res = `Dear ${recipient_name}, your package from ${sender_name} has been processed for  delivery today at ${delivery_location}. Our Courier executive ${biker_name}(${biker_telephone}) will call and schedule the delivery time with you. Kindly pick up his call as your package will not be sent out if he does not reach you. You are to  make payment of Ghc${cod}.00 to the rider upon receipt of the package. Thanks for choosing QCS.`;
//     return res;
// };
// exports.DeliveredMessage = ({ sender_name, invoice_no, recipient_name, telephone }) => {
//     const res = `Dear ${sender_name} your package with reference ${invoice_no} has been received by ${recipient_name} (${telephone}). Thanks for choosing QCS.`;
//     return res;
// };
// // send password to client
// exports.PasswordMessage = ({ sender_name, password }) => {
//     const res = `Dear ${sender_name} your new password is ${password}`;
//     return res;
// };

// send  otp text message to client
export const OTPMessage = ({ user_name, OTP }) => {
  const res = `Dear ${user_name} your otp is ${OTP}`;
  return res;
};

// export const PasswordMessageBiker = ({ biker_name, password }) => {
//     const res = `Dear ${biker_name} your new password is ${password} `;
//     return res;
// };
