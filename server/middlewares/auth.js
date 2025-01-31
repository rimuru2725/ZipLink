const auth = (req, res, next) => {
    const { password } = req.query;
    if (req.fileData && req.fileData.password && req.fileData.password !== password) {
        return res.status(403).json({ message: 'Invalid password' });
    }
    next();
};

module.exports = auth;