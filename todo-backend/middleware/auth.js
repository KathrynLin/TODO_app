const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization');
    console.log("Received Token:", token); // 🛠 这里会打印请求头的 token

    if (!token) return res.status(401).json({ message: '未授权访问' });

    try {
        const tokenWithoutBearer = token.replace("Bearer ", "").trim();
        console.log("Processed Token:", tokenWithoutBearer); // 🛠 这里会打印去掉 "Bearer " 的 token

        const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
        req.user = decoded;
        console.log("Decoded Token:", decoded); // 🛠 这里会打印解码后的 token 数据

        next();
    } catch (err) {
        console.error("JWT Verification Error:", err);
        res.status(400).json({ message: '无效的 token' });
    }
};
