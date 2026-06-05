const { BrevoClient, BrevoEnvironment } = require('@getbrevo/brevo');

const sendEmail = async ({ to, subject, html }) => {
  try {
    const client = new BrevoClient({
      environment: BrevoEnvironment.Production,
      apiKey: process.env.BREVO_API_KEY
    });

    await client.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html,
      sender: { name: 'Kotahi Tāra', email: 'your-brevo-registered-email@gmail.com' },
      to: [{ email: to }]
    });

    console.log('✅ Email sent to:', to);
  } catch (err) {
    console.error('❌ Email failed:', err.message);
    throw err;
  }
};

module.exports = sendEmail;
