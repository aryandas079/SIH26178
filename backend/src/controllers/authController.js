import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbClient } from '../../../database/dbClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPECTED_ADMIN_ID = process.env.ADMIN_ID || 'abc123';
const EXPECTED_ADMIN_PW = process.env.ADMIN_PASSWORD || 'ERer00*#';

// Ensure dedicated logs directory exists at workspace root
const ROOT_DIR = path.resolve(__dirname, '../../../');
const ROOT_LOGS_DIR = path.join(ROOT_DIR, 'logs');
const LOCAL_LOGS_DIR = path.resolve(process.cwd(), 'logs');

for (const dir of [ROOT_LOGS_DIR, LOCAL_LOGS_DIR]) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {}
}

const ROOT_AUTH_LOG = path.join(ROOT_LOGS_DIR, 'auth_access.log');
const LOCAL_AUTH_LOG = path.join(LOCAL_LOGS_DIR, 'auth_access.log');

export function appendAuthLogFile(line) {
  const written = new Set();
  for (const logPath of [ROOT_AUTH_LOG, LOCAL_AUTH_LOG]) {
    try {
      if (!written.has(logPath)) {
        fs.appendFileSync(logPath, line, 'utf-8');
        written.add(logPath);
      }
    } catch (err) {
      console.error('[AuthLog] Failed to append to log file:', logPath, err.message);
    }
  }
}

export function logAuthAccess(req, res) {
  const { provider, displayName, email, phoneNumber, uid, role } = req.body || {};
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const timestamp = new Date().toISOString();

  const provName = (provider || 'UNKNOWN').toUpperCase();
  const userName = displayName || 'Anonymous User';
  const userEmail = email || 'N/A';
  const userPhone = phoneNumber || 'N/A';
  const userUid = uid || 'N/A';

  const logLine = `[${timestamp}] AUTH_ACCESS_SUCCESS | Provider: ${provName} | Name: "${userName}" | Gmail: "${userEmail}" | Phone: "${userPhone}" | UID: ${userUid} | IP: ${ip}\n`;

  appendAuthLogFile(logLine);

  dbClient.logAudit({
    userId: userEmail !== 'N/A' ? userEmail : (userPhone !== 'N/A' ? userPhone : userUid),
    userName: userName,
    userRole: role || (provName === 'GOOGLE' ? 'Google Authenticated User' : (provName === 'PHONE' ? 'Phone Verified Officer' : 'Administrator')),
    action: `LOGIN_${provName}`,
    resource: '/api/auth/log-access',
    status: 'SUCCESS',
    ipAddress: ip,
    metadata: JSON.stringify({ email: userEmail, phone: userPhone, provider: provName }),
  });

  console.log(`[AuthAuditLog] Recorded session: ${provName} -> ${userName} (${userEmail !== 'N/A' ? userEmail : userPhone})`);

  res.json({
    success: true,
    message: 'Authentication access logged successfully.',
    timestamp,
  });
}

export function verifyAdmin(req, res) {
  const { adminId, password } = req.body || {};
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const timestamp = new Date().toISOString();

  if (adminId === EXPECTED_ADMIN_ID && password === EXPECTED_ADMIN_PW) {
    const logLine = `[${timestamp}] AUTH_ACCESS_SUCCESS | Provider: ADMIN | Name: "System Administrator" | Gmail: "admin@disaster-command.gov.in" | Phone: N/A | UID: admin-${adminId} | IP: ${ip}\n`;
    appendAuthLogFile(logLine);

    dbClient.logAudit({
      userId: adminId,
      userName: 'System Administrator',
      userRole: 'ADMINISTRATOR',
      action: 'ADMIN_LOGIN_SUCCESS',
      resource: '/api/auth/verify-admin',
      status: 'SUCCESS',
      ipAddress: ip,
    });

    return res.json({
      success: true,
      message: 'Administrative authorization verified.',
      user: {
        uid: 'admin-' + adminId,
        displayName: 'System Administrator',
        email: 'admin@disaster-command.gov.in',
        role: 'Disaster Operations Administrator',
        provider: 'admin',
      },
      token: 'admin-sess-' + Buffer.from(`${adminId}:${Date.now()}`).toString('base64'),
    });
  }

  const failLine = `[${timestamp}] AUTH_ACCESS_FAILED | Provider: ADMIN | Name: "Unknown" | AdminID: "${adminId || 'unknown'}" | IP: ${ip}\n`;
  appendAuthLogFile(failLine);

  dbClient.logAudit({
    userId: adminId || 'unknown',
    userName: 'Unknown',
    userRole: 'GUEST',
    action: 'ADMIN_LOGIN_FAILED',
    resource: '/api/auth/verify-admin',
    status: 'DENIED',
    ipAddress: ip,
  });

  return res.status(401).json({
    success: false,
    error: 'INVALID_CREDENTIALS',
    message: 'ACCESS DENIED // INVALID ADMIN ID OR PASSWORD',
  });
}

export function getAuditLogs(req, res) {
  const limit = parseInt(req.query.limit, 10) || 50;
  const logs = dbClient.getAuditLogs(limit);
  res.json({
    success: true,
    count: logs.length,
    logs,
  });
}
