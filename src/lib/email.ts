import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.SMTP_FROM || 'Buzzify <noreply@buzzify.com>';

  // 1. Try Resend via REST API if API Key is configured
  if (resendApiKey) {
    try {
      console.log('Attempting to send email via Resend API to:', to);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: subject,
          html: html
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Email sent successfully via Resend:', data);
        return { success: true, id: data.id };
      } else {
        const errorText = await res.text();
        console.error('Resend API failed:', errorText);
      }
    } catch (err) {
      console.error('Error sending email via Resend:', err);
    }
  }

  // 2. Fall back to SMTP via nodemailer
  console.log('Attempting to send email via SMTP to:', to);
  
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('Email service configuration missing. Logging email body to console instead:');
    console.log('----------------------------------------');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML Body:`);
    console.log(html);
    console.log('----------------------------------------');
    return { success: true, loggedToConsole: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
    });
    console.log('Email sent successfully via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error sending email via SMTP:', err);
    throw new Error('Gagal mengirim email: ' + (err as Error).message);
  }
}
