import { getAuth } from '../config/better-auth.js';
import { errorResponse } from '../utils/response.js';

export async function authenticate(req, res, next) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return errorResponse(res, 'Authentication required', [], 401);
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch {
    return errorResponse(res, 'Authentication required', [], 401);
  }
}
