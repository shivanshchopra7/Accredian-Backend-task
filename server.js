require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const app = express();
const prisma = new PrismaClient();

app.use(bodyParser.json());

// Endpoint to handle referral form submission
app.post('/referrals', async (req, res) => {
  const { name, email, referralCode } = req.body;

  // Validate input fields
  if (!name || !email || !referralCode) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // Create referral entry in the database
    const referral = await prisma.referral.create({
      data: {
        name,
        email,
        referralCode,
      },
    });

    // Send referral email
    await sendReferralEmail(email, referralCode);

    res.status(201).json(referral);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating referral' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Function to send referral email using nodemailer
const sendReferralEmail = async (email, referralCode) => {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Referral Code',
    text: `Your referral code is ${referralCode}`,
  };

  await transporter.sendMail(mailOptions);
};

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  // Ensure the Prisma client is connected
  try {
    await prisma.$connect();
    console.log('Connected to the database');
  } catch (error) {
    console.error('Failed to connect to the database', error);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
  });
});
