const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'Mail server is running',
    timestamp: new Date().toISOString(),
  });
});

app.post('/send', async (req, res) => {
  const { to, subject, html, cc, bcc } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({
      message: 'Missing required fields: to, subject, html',
    });
  }

  // Check environment variables
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    return res.status(500).json({
      message:
        'Mail configuration missing. Please set MAIL_USER and MAIL_PASS environment variables.',
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to,
      subject,
      html,
    };

    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;

    await transporter.sendMail(mailOptions);
    res.json({ message: '✅ Email sent successfully!' });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({
      message: 'Failed to send email',
      error: err.message,
    });
  }
});

// Only listen locally — Vercel uses module.exports instead
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Mail server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
