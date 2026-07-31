export const sendSuccess = (res, message, data = null, pagination = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(pagination !== null && { pagination }),
  };
  return res.status(statusCode).json(response);
};

export const sendError = (res, message, statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors !== null && { errors }),
  };
  return res.status(statusCode).json(response);
};
