const { AppError } = require("../utils/AppError");

function requireSuperAdmin(req, res, next) {
  if (!req.user?.isPanelAdmin) {
    return next(new AppError(401, "Kimlik dogrulama gerekli"));
  }
  if (req.user.role !== "super_admin") {
    return next(new AppError(403, "This operation is restricted to Super Admins"));
  }
  next();
}

module.exports = { requireSuperAdmin };
