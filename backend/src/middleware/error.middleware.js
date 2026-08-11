const { AppError } = require("../utils/error");

function errorMiddleware(
  err,
  req,
  res,
  next
) {
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,

      error: {
        code: err.code,

        message: err.message,
      },
    });
  }

  return res.status(500).json({
    success: false,

    error: {
      code: "INTERNAL_SERVER_ERROR",

      message:
        "Something went wrong on the server.",
    },
  });
}

module.exports = errorMiddleware;