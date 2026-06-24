const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Gmail SMTP transporter — uses GMAIL_USER + GMAIL_APP_PASSWORD env vars
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, otp) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your InkFlow Verification Code</title>
</head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f13;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#1a1a24;border-radius:16px;overflow:hidden;border:1px solid rgba(139,92,246,0.2);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                ✦ InkFlow
              </div>
              <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;letter-spacing:0.5px;">
                Modern Blogging Studio
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f1f0ff;">
                Verify your email
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#a09cc0;line-height:1.6;">
                Use the code below to complete your sign-in. It expires in <strong style="color:#c4b5fd;">10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background:#0f0f13;border:1px solid rgba(139,92,246,0.35);border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#a78bfa;font-family:'Courier New',Courier,monospace;">
                  ${otp}
                </div>
              </div>

              <p style="margin:0;font-size:13px;color:#6b6882;line-height:1.6;">
                If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:#4a4760;text-align:center;">
                © ${new Date().getFullYear()} InkFlow — Modern Blogging Studio
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `InkFlow <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `${otp} is your InkFlow verification code`,
    html,
  });
}


function createToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verified: false,
      otp,
      otpExpiry,
    });

    await sendOTPEmail(email, otp);

    res.status(201).json({ message: 'OTP sent', userId: user._id });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.verified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = createToken(user);
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(user.email, otp);

    res.json({ message: 'OTP resent' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.verified) {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOTPEmail(user.email, otp);
      return res.json({ needsVerification: true, userId: user._id });
    }

    const token = createToken(user);
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpiry');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ _id: user._id, name: user.name, email: user.email, avatar: user.avatar });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Google OAuth — verify ID token, upsert user, return JWT
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' });
    }

    // Verify the Google ID token using Google's tokeninfo endpoint
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    const payload = await response.json();

    if (payload.error_description || !payload.email_verified) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { sub: googleId, email, name, picture } = payload;

    // Find by googleId first, then by email (handles linking existing accounts)
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      // Update googleId + avatar if not already set
      if (!user.googleId) user.googleId = googleId;
      if (picture) user.avatar = picture;
      user.verified = true;
      await user.save();
    } else {
      // Create new Google-only user (no password)
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture || '',
        verified: true,
      });
    }

    const token = createToken(user);
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
