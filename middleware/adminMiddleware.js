const adminMiddleware = (req, res, next) => {
  console.log("🧑‍💼 Admin middleware req.user:", req.user);
  console.log("admin middleware req.isAdmin",req.isAdmin)
  if (req.user && req.user.isAdmin) {
    next(); // proceed to the next handler
  } else {
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

module.exports = adminMiddleware;
