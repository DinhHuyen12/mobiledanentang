const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

    if (!token) {
        return res.status(401).json({ message: "No token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ message: "Invalid token" });
    }

};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userRoleId = Number(req.user.role_id || req.user.role);
        const userRoleName = String(req.user.role_name || "").toLowerCase();

        const isAllowed = allowedRoles.some((allowedRole) => {
            if (typeof allowedRole === "number") {
                return allowedRole === userRoleId;
            }

            return String(allowedRole).toLowerCase() === userRoleName;
        });

        if (!isAllowed) {
            return res.status(403).json({ message: "Forbidden" });
        }

        next();
    };
};

module.exports = verifyToken;
module.exports.authorizeRoles = authorizeRoles;
