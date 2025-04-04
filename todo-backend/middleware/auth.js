const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  console.log("🔥 Received Auth Header:", authHeader); // check Authorization header

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: "AUTH_FAILED", message: "身份验证失败，请重新登录" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log("🔥 Decoded Token:", decoded); 
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error("🔥 JWT Verification Error:", error.message);
    return res.status(401).json({ code: "AUTH_FAILED", message: "身份验证失败，请重新登录" });
  }
};
