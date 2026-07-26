const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// The signing secret is self-configuring so a missing environment variable
// can never take the app down. JWT_SECRET is used when set; otherwise a
// stable secret is derived from DATABASE_URL (which always exists, since
// the app cannot run without a database). Deriving rather than randomly
// generating matters: a random per-boot secret would silently log everyone
// out on every restart.
function resolveSigningSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const seed = process.env.DATABASE_URL || 'trainee-tracker-local-development-only';
  return crypto.createHash('sha256').update(`trainee-tracker::${seed}`).digest('hex');
}

const SIGNING_SECRET = resolveSigningSecret();

if (!process.env.JWT_SECRET) {
  console.log('[auth] JWT_SECRET not set - using a stable secret derived from DATABASE_URL.');
}

// Management session token - full app access (subject to the admin-only
// gates applied at the route level for account/relationship administration).
function signSessionToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name, role: user.role, scope: 'management' },
    SIGNING_SECRET,
    { expiresIn: '7d' }
  );
}

// Trainee self-report session token - deliberately narrow. Carries a scope
// claim the middleware checks so this token can never be used against any
// management route, even if someone tries.
function signTraineeSessionToken(trainee) {
  return jwt.sign(
    { traineeId: trainee.id, name: trainee.name, scope: 'trainee' },
    SIGNING_SECRET,
    { expiresIn: '12h' }
  );
}

function verifySessionToken(token) {
  return jwt.verify(token, SIGNING_SECRET);
}

module.exports = { signSessionToken, signTraineeSessionToken, verifySessionToken, SIGNING_SECRET };
