require('dotenv').config();
const jwt = require("jsonwebtoken");

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: "Access token missing or invalid" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') { // Assuming your JWT has a role claim
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    req.admin = { adminId: decoded.adminId, username: decoded.username, accessToken: decoded.accessToken };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = { authenticateAdmin };
