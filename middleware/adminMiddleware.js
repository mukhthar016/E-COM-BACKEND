const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next(); // proceed to the next handler
  } else {
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

module.exports = adminMiddleware;
