# Email Sending Setup Guide

## ✅ What's Been Implemented

Email sending functionality has been fully integrated into your application!

### Features Added:
1. ✅ **Resend API Integration** - Email sending service installed
2. ✅ **Backend API Endpoint** - `/api/emails/send` endpoint created
3. ✅ **Frontend API Service** - `emailsApi.sendEmail()` function added
4. ✅ **Drafts Page Integration** - Send button now actually sends emails
5. ✅ **Email Preview Panel** - Send functionality connected
6. ✅ **Database Updates** - Email status updated to "sent" after sending

---

## 🚀 Setup Instructions

### Step 1: Get Resend API Key

1. Go to [Resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free tier)
3. Go to **API Keys** section
4. Click **Create API Key**
5. Copy your API key

### Step 2: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=InboxAI Assistant
```

**Important Notes:**
- `RESEND_FROM_EMAIL`: Use a domain you've verified in Resend, or use `onboarding@resend.dev` for testing
- `RESEND_FROM_NAME`: The display name for sent emails
- If `RESEND_FROM_EMAIL` is not set, it defaults to `onboarding@resend.dev` (Resend's test domain)

### Step 3: Verify Domain (Optional but Recommended)

For production use:

1. In Resend dashboard, go to **Domains**
2. Add your domain (e.g., `yourdomain.com`)
3. Add the DNS records Resend provides
4. Wait for verification
5. Update `RESEND_FROM_EMAIL` to use your verified domain

### Step 4: Restart Server

After adding environment variables:

1. Stop the auth server (Ctrl+C)
2. Restart it:
   ```bash
   npm run dev:auth
   ```

You should see:
```
✅ Better Auth server running on https://api.inboxiq.debx.co.in
📡 Auth API available at https://api.inboxiq.debx.co.in/api/auth
📧 Email API available at https://api.inboxiq.debx.co.in/api/emails/send
```

---

## 📧 How to Use

### From Drafts Page:

1. Go to **Drafts** page
2. Click on any draft to open the preview panel
3. Review/edit the email if needed
4. Click **Send Email** button
5. Email will be sent and draft will be removed from the list

### From Email Preview Panel:

1. Click **Review & Send** on any draft
2. Edit the email content if needed
3. Click **Send Email** button
4. Email will be sent via Resend API

---

## 🔧 API Details

### Backend Endpoint

**POST** `/api/emails/send`

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "<p>Email body HTML</p>",
  "fromEmail": "optional@example.com",
  "fromName": "Optional Name"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "resend_message_id",
  "message": "Email sent successfully"
}
```

### Frontend API

```typescript
import { emailsApi } from "@/lib/api";

// Send email
await emailsApi.sendEmail(
  emailId,           // Email ID from database
  userId,            // Better Auth user ID
  {
    to: "recipient@example.com",
    subject: "Subject",
    body: "<p>Body</p>",
    fromEmail: "optional@example.com",
    fromName: "Optional Name"
  }
);
```

---

## 🐛 Troubleshooting

### "Email service not configured"

**Error:** `RESEND_API_KEY environment variable is not set`

**Fix:**
1. Add `RESEND_API_KEY` to `.env.local`
2. Restart the auth server

### "Failed to send email"

**Possible causes:**
1. Invalid API key - Check your Resend API key
2. Unverified domain - Use `onboarding@resend.dev` for testing
3. Rate limit exceeded - Check Resend dashboard for limits
4. Invalid email address - Check recipient email format

### Email not appearing in sent folder

- Check Resend dashboard → **Emails** section
- Check spam folder
- Verify recipient email address

### Database status not updating

- Check browser console for errors
- Verify user authentication
- Check Supabase connection

---

## 📊 Email Status Tracking

After sending, the email status in the database is automatically updated:
- `status`: Changed to `"sent"`
- `sent_at`: Set to current timestamp

You can query sent emails:
```typescript
const sentEmails = await emailsApi.search(userId, "status:sent");
```

---

## 🔒 Security Notes

1. **API Key Security:**
   - Never commit `.env.local` to git (already in .gitignore)
   - Use environment variables, never hardcode API keys
   - Rotate API keys regularly

2. **Email Validation:**
   - Always validate email addresses before sending
   - Implement rate limiting for production
   - Monitor for abuse

3. **Domain Verification:**
   - Use verified domains in production
   - Don't use test domains (`onboarding@resend.dev`) in production

---

## 🎯 Next Steps

### Enhancements You Can Add:

1. **Email Templates**
   - Create reusable email templates
   - Store templates in database
   - Template variables substitution

2. **Email Tracking**
   - Track opens and clicks
   - Use Resend webhooks
   - Store analytics in database

3. **Scheduled Sending**
   - Add scheduling functionality
   - Queue emails for later
   - Background job processing

4. **Email Editing**
   - Save edited drafts before sending
   - Version history
   - Undo functionality

5. **Bulk Sending**
   - Send to multiple recipients
   - Email campaigns
   - Batch processing

---

## 📝 Testing

### Test Email Sending:

1. Create a test draft in your database
2. Go to Drafts page
3. Click on the draft
4. Click "Send Email"
5. Check Resend dashboard for sent email
6. Verify email was received

### Test with Test Domain:

If you don't have a verified domain:
- Use `onboarding@resend.dev` as `RESEND_FROM_EMAIL`
- This works for testing but emails may go to spam
- For production, verify your own domain

---

## ✅ Checklist

- [ ] Resend account created
- [ ] API key obtained
- [ ] `RESEND_API_KEY` added to `.env.local`
- [ ] `RESEND_FROM_EMAIL` configured (optional)
- [ ] Auth server restarted
- [ ] Test email sent successfully
- [ ] Email received in inbox
- [ ] Database status updated correctly

---

## 🎉 You're All Set!

Email sending is now fully functional. Users can send emails directly from the Drafts page!

**Need help?** Check the troubleshooting section or review the Resend documentation: https://resend.com/docs









