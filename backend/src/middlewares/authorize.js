const { AppError } = require("../utils/AppError");

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, "Insufficient permissions"));
    }
    next();
  };
}

module.exports = { authorize };
