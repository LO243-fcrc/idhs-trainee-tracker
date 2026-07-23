const prisma = require('../config/db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signSessionToken, signTraineeSessionToken } = require('../utils/token');
const { seedStarterContent } = require('../startup/bootstrap');

// Deliberately generic error message on both "no such account" and "wrong
// password" so login can't be used to enumerate valid accounts/usernames.
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';
const INVALID_TRAINEE_CREDENTIALS_MESSAGE = 'Invalid username or password';

// Management login - trainers, direct managers, admins. Same credential
// check for all of them; the resulting token just carries whichever role
// the account has.
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(401).json({ error: INVALID_CREDENTIALS_MESSAGE });
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: INVALID_CREDENTIALS_MESSAGE });
    }

    const sessionToken = signSessionToken(user);

    res.status(200).json({
      token: sessionToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// Trainee self-report login - a completely separate credential space from
// management. A trainee's username/password only ever unlocks the
// self-report routes (enforced by requireTraineeAuth checking the token's
// scope claim, not by anything here).
async function traineeLogin(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const trainee = await prisma.trainee.findUnique({ where: { selfReportUsername: normalizedUsername } });

    if (!trainee || !trainee.selfReportPasswordHash) {
      return res.status(401).json({ error: INVALID_TRAINEE_CREDENTIALS_MESSAGE });
    }

    const passwordMatches = await verifyPassword(password, trainee.selfReportPasswordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: INVALID_TRAINEE_CREDENTIALS_MESSAGE });
    }

    const sessionToken = signTraineeSessionToken(trainee);

    res.status(200).json({
      token: sessionToken,
      trainee: { id: trainee.id, name: trainee.name },
    });
  } catch (err) {
    next(err);
  }
}

// Tells the login screen whether ANY account exists yet. When the database
// is empty the UI offers "Create the administrator account"; once an
// account exists it offers a plain sign-in. No sensitive data is exposed -
// only whether setup has happened.
async function getSetupStatus(req, res, next) {
  try {
    const userCount = await prisma.user.count();
    res.status(200).json({ needsSetup: userCount === 0 });
  } catch (err) {
    next(err);
  }
}

// In-app account creation. The FIRST account ever created becomes the
// ADMIN - that is the whole setup step, no environment variables and no
// seed script. After that, self-signup is CLOSED: additional management
// accounts are created by the administrator in Settings. Leaving signup
// open would let anyone who finds the URL create an account and read every
// trainee's record, which is not acceptable for this data.
async function register(req, res, next) {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      return res.status(403).json({
        error: 'An administrator account already exists. Ask your administrator to create an account for you in Settings.',
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: String(name).trim(),
        passwordHash,
        role: 'ADMIN',
      },
    });

    // First admin now exists, so the starter courses and Highway Training
    // weeks can be created right away rather than on the next restart.
    seedStarterContent().catch((err) => console.error('[register] seeding failed:', err.message));

    const sessionToken = signSessionToken(user);
    res.status(201).json({
      token: sessionToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    next(err);
  }
}

module.exports = { login, register, getSetupStatus, verifySelfReportToken };

// Verify a self-report token and return trainee info
async function verifySelfReportToken(req, res, next) {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' });
    }

    const trainee = await prisma.trainee.findUnique({
      where: { selfReportToken: token },
      select: { id: true, name: true },
    });

    if (!trainee) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    res.status(200).json({ traineeName: trainee.name, traineeId: trainee.id });
  } catch (err) {
    next(err);
  }
}
