const ROLE_HOME = {
  Client: "/client/home",
  Commerce: "/commerce/home",
  Delivery: "/delivery/home",
  Admin: "/admin/dashboard",
};

export function getRoleHome(role) {
  return ROLE_HOME[role] || "/auth/login";
}

export function redirectIfAuthenticated(req, res, next) {
  if (req.session?.user) {
    return res.redirect(getRoleHome(req.session.user.role));
  }
  return next();
}

export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    req.session.returnTo = req.body?.returnTo || req.originalUrl;
    req.flash("errors", "Debes iniciar sesión para continuar.");
    return res.redirect("/auth/login");
  }
  return next();
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.redirect("/auth/login");
    }
    if (!allowedRoles.includes(req.session.user.role)) {
      req.flash("errors", "No tienes permiso para acceder a esa sección.");
      return res.redirect(getRoleHome(req.session.user.role));
    }
    return next();
  };
}

export function exposeLocals(req, res, next) {
  res.locals.currentUser = req.session?.user || null;
  res.locals.successMessages = req.flash("success");
  res.locals.errorMessages = req.flash("errors");
  next();
}
