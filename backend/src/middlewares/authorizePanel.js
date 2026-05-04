const { AppError } = require("../utils/AppError");

/** Admin panel tokenları (admins tablosu); super_admin ve Yönetici vb. */
function authorizePanel(req, res, next) {
  if (!req.user) {
    return next(new AppError(401, "Authentication required"));
  }
  if (!req.user.isPanelAdmin) {
    return next(new AppError(403, "Panel erisimi gerekli"));
  }
  next();
}

module.exports = { authorizePanel };
