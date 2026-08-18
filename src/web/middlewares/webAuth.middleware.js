const ROLE_HOME = {
  Client: "/client/home",
  Commerce: "/commerce/home",
  Delivery: "/delivery/home",
  Admin: "/admin/dashboard",
};

export function getRoleHome(role) {
  return ROLE_HOME[role] || "/auth/login";
}

/**
 * Si el usuario ya tiene sesión activa, lo redirige a su Home
 * (usado en /auth/login para no dejarlo ver el login de nuevo).
 */
export function redirectIfAuthenticated(req, res, next) {
  if (req.session?.user) {
    return res.redirect(getRoleHome(req.session.user.role));
  }
  return next();
}

/**
 * Exige una sesión activa. Si no existe, redirige al login recordando
 * a dónde volver (returnTo), para que el usuario pueda seguir exactamente
 * donde se quedó después de iniciar sesión (ej. retomar su checkout).
 */
export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    req.session.returnTo = req.body?.returnTo || req.originalUrl;
    req.flash("errors", "Debes iniciar sesión para continuar.");
    return res.redirect("/auth/login");
  }
  return next();
}

/**
 * Exige uno de los roles indicados. Se usa después de requireAuth.
 */
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

/**
 * Expone el usuario de sesión y los mensajes flash a todas las vistas.
 */
export function exposeLocals(req, res, next) {
  res.locals.currentUser = req.session?.user || null;
  res.locals.successMessages = req.flash("success");
  res.locals.errorMessages = req.flash("errors");
  next();
}
