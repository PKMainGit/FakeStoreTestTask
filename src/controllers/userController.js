// src/controllers/userController.js
import jwt from "jsonwebtoken";

export const checkAdminRole = (req, res) => {
  const token = req.cookies?.token; // беремо токен з куки

  if (!token) {
    console.log("No token provided in request");
    return res.status(401).json({ message: "No token provided" });
	}
	
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    if (decoded.role === "admin") {
      return res.status(200).json({ message: "User is admin" });
    } else {
      return res.status(403).json({ message: "User is not admin" });
    }
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};
