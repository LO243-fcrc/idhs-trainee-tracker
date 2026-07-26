const jwt = require('jsonwebtoken');
const { verifySessionToken } = require('../utils/token');

function decodeBearer(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.split(' ')[1];
  try {
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

// Any logged-in management account (ADMIN or MANAGEMENT role). This is the
// baseline for nearly every /api/admin/* route - trainer and manager have
// identical access to trainee data day-to-day.
function requireAuth(req, res, next) {
  const decoded = decodeBearer(req);
  if (!decoded || decoded.scope !== 'management') {
    return res.status(401).json({ error: 'Missing or invalid session token' });
  }
  req.user = decoded; // { userId, email, name, role, scope }
  next();
}

// Stacks on top of requireAuth. Only for account/relationship administration:
// creating management accounts, assigning trainer/direct manager, issuing
// trainee self-report credentials. Not for anything about scoring or
// day-to-day trainee data - that stays open to every management account.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Administrator privileges required' });
  }
  next();
}

// A trainee's own narrowly-scoped session via self-report token.
// Only valid against the self-report routes. Validates token against database.
async function requireTraineeAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = header.split(' ')[1];
  console.log(`[AUTH] Validating self-report token: ${token.substring(0, 8)}...`);
  
  try {
    const prisma = require('../config/db');
    const trainee = await prisma.trainee.findUnique({
      where: { selfReportToken: token },
      select: { id: true, name: true },
    });

    if (!trainee) {
      console.error(`[AUTH] Token not found in database: ${token.substring(0, 8)}...`);
      
      // Debug: try to find ANY trainee with any token
      const allTokens = await prisma.trainee.findMany({
        select: { id: true, name: true, selfReportToken: true }
      });
      console.log(`[DEBUG] All trainees and tokens:`, allTokens.map(t => ({ name: t.name, hasToken: !!t.selfReportToken })));
      
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.log(`[AUTH] Token validated for trainee: ${trainee.name}`);
    req.trainee = { traineeId: trainee.id, name: trainee.name };
    next();
  } catch (err) {
    console.error('[AUTH] Token validation error:', err.message);
    res.status(500).json({ error: `Token validation failed: ${err.message}` });
  }
}

module.exports = { requireAuth, requireAdmin, requireTraineeAuth };
