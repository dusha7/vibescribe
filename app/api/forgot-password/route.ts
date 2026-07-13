export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.password) {
      // Generate token
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Delete any existing tokens for this email
      await prisma.passwordResetToken.deleteMany({ where: { email } });

      // Create new token
      await prisma.passwordResetToken.create({
        data: { email, token, expires },
      });

      // Send email via Resend (or any transactional email service)
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      const htmlBody = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #ffffff; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🖋️ VibeScribe</h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Password Reset</p>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px; line-height: 1.6; color: #d1d5db;">Hi ${user.name || 'there'},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #d1d5db;">We received a request to reset your password. Click the button below to create a new one:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">Reset Password</a>
            </div>
            <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
            <p style="font-size: 12px; color: #4b5563; margin: 0;">VibeScribe — AI-Powered Story Creation</p>
          </div>
        </div>
      `;

      try {
        // ========================================
        // EMAIL PROVIDER: Choose ONE of the options below
        // ========================================

        // --- OPTION 1: Resend (recommended) ---
        // Set RESEND_API_KEY in your .env
        if (process.env.RESEND_API_KEY) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'VibeScribe <noreply@vibescribe.com>',
              to: email,
              subject: 'Reset your VibeScribe password',
              html: htmlBody,
            }),
          });
        }

        // --- OPTION 2: SendGrid ---
        // Set SENDGRID_API_KEY in your .env
        else if (process.env.SENDGRID_API_KEY) {
          await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email }] }],
              from: { email: process.env.EMAIL_FROM || 'noreply@vibescribe.com' },
              subject: 'Reset your VibeScribe password',
              content: [{ type: 'text/html', value: htmlBody }],
            }),
          });
        }

        // --- OPTION 3: No email provider configured ---
        else {
          console.warn('⚠️ No email provider configured. Set RESEND_API_KEY or SENDGRID_API_KEY in .env');
          console.log('Password reset link:', resetLink);
        }
      } catch (emailErr) {
        console.error('Email send error:', emailErr);
      }
    }

    // Always return success
    return NextResponse.json({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
