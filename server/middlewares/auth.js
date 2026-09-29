const auth = async (req, res, next) => {
    try {
        // If an Authorization header is present, attach it as the user id for now.
        // Replace this with real token validation as needed.
        const authHeader = req.headers?.authorization || req.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            req.userId = token || 'user';
            req.free_usage = 0;
            req.plan = 'free';
        } else {
            req.userId = 'guest';
            req.free_usage = 0;
            req.plan = 'free';
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export { auth };
export default auth;