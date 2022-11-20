const ROLES = {
    Admin: 'ROLE_ADMIN',
    User: 'ROLE_USER',
};

/**
 * @description - This middleware calls next only if the user role matches the role passed in the route.
 * 
 * @param  {...Array} roles - roles to check
 * @returns {function} - next middleware
 * @returns {error} - if user is not authorized
 */
const v2CheckRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).send({ message: "Unauthorized" });
    }
    const hasRole = roles.find(role => req.user.role === role);
    if (!hasRole) {
        return res.status(401).send({ message: "Unauthorized" });
    }
    return next();
};

const v2Role = { ROLES, v2CheckRole };

module.exports = v2Role;