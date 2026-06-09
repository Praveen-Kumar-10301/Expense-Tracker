import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', code: 401 });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Session expired, please log in again', code: 401 });
  }
}
