/** Authorization middleware for administrative routes. */

const EXPECTED_ADMIN_ID = process.env.ADMIN_ID || 'abc123';
const EXPECTED_ADMIN_PW = process.env.ADMIN_PASSWORD || 'ERer00*#';

export function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const adminId = req.headers['x-admin-id'];
  const adminPass = req.headers['x-admin-password'];

  // Check custom headers or Basic auth
  let isAuthorized = false;

  if (adminId === EXPECTED_ADMIN_ID && adminPass === EXPECTED_ADMIN_PW) {
    isAuthorized = true;
  } else if (authHeader && authHeader.startsWith('Basic ')) {
    const creds = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii');
    const [user, pass] = creds.split(':');
    if (user === EXPECTED_ADMIN_ID && pass === EXPECTED_ADMIN_PW) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Access denied: valid administrative credentials required.',
    });
  }

  req.adminUser = {
    id: EXPECTED_ADMIN_ID,
    role: 'Disaster Operations Administrator',
  };

  next();
}
