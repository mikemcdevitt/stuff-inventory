const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function allowedEmails() {
  return (process.env.ALLOWED_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

exports.googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Missing credential' });

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Invalid Google credential' });
  }

  if (!payload.email_verified || !allowedEmails().includes((payload.email || '').toLowerCase())) {
    return res.status(403).json({ error: 'This Google account is not authorized' });
  }

  const user = { email: payload.email, name: payload.name, picture: payload.picture };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({ token, user });
};

exports.me = (req, res) => {
  res.json({ user: req.user });
};
