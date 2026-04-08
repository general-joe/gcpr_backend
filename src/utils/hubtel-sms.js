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
  try {
    const res = await axios.get(
      `https://smsc.hubtel.com/v1/messages/send?clientsecret=${process.env.HUBTEL_SECRET}&clientid=${process.env.HUBTEL_CLIENTID}&from=${process.env.HUBTEL_SENDER}&to=${To}&content=${Content}`,
    );
    return res;
  } catch (error) {
    console.log(error.message);
    return error.message;
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
  try {
    const data = {
      senderId: process.env.HUBTEL_SENDER,
      phoneNumber: To,
      countryCode: "GH",
    };
    const headers = getOTPAuthHeader();
    const res = await axios.post(`https://api-otp.hubtel.com/otp/send`, data, {
      headers,
    });
    return res.data;
  } catch (error) {
    const details = getAxiosErrorMessage(error);
    console.log(details);
    throw new Error(`Failed to send OTP: ${details}`);
  }
};

export const VerifyOTP = async (requestId, prefix, code) => {
  try {
    const data = {
      requestId,
      prefix,
      code,
    };
    console.log(data);
    const headers = getOTPAuthHeader();
    const res = await axios.post(
      `https://api-otp.hubtel.com/otp/verify`,
      data,
      {
        headers,
      },
    );
    return res.status === 200;
  } catch (error) {
    // If Hubtel responded with an HTTP error (wrong code, expired, etc.)
    // treat it as an invalid OTP rather than a server crash
    if (error?.response) {
      console.log("Hubtel OTP verify rejected:", getAxiosErrorMessage(error));
      return false;
    }
    // Network / timeout / no response — escalate as a real error
    const details = getAxiosErrorMessage(error);
    console.log("Hubtel OTP verify network error:", details);
    throw new Error(`Failed to verify OTP: ${details}`);
  }
};

export const ResendOTP = async (requestId) => {
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
      },
    );
    return res.data;
  } catch (error) {
    const details = getAxiosErrorMessage(error);
    console.log(details);
    throw new Error(`Failed to resend OTP: ${details}`);
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
