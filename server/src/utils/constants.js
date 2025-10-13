export const API_RESPONSE = (
  status,
  data = null,
  error = null,
  message = ""
) => {
  return {
    status,
    data: data,
    error: error,
    message: message,
  };
};

export const PORT = process.env.PORT;
export const MONGO_URI = process.env.MONGO_URI;
export const JWT_SECRET = process.env.JWT_SECRET;
