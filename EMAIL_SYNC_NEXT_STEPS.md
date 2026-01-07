# Email Sync - Next Steps After IMAP Connection

## ✅ What You've Done

You've successfully connected your email account via IMAP! The connection is stored in the database and ready to use.

---

## 🎯 What's Next: Email Sync

Now that your email is connected, you need to **sync emails** from your account into the application. Here's what to do:

### Option 1: Manual Sync (Quick Test)

1. **Go to Settings → Email tab**
2. **Find your connected email** in the list
3. **Click "Sync Now"** button (if available)
4. **Check the Inbox page** - emails should appear

### Option 2: Automatic Sync (Recommended)

Set up automatic email syncing so new emails appear automatically.

---

## 🚀 Implementation Options

### Option A: Simple Backend Sync (Recommended for Start)

**What it does:**
- Backend endpoint that fetches emails from IMAP
- Stores emails in the database
- Can be triggered manually or on a schedule

**Steps:**
1. Install IMAP library: `npm install imap mailparser @types/imap`
2. Implement sync service (see `server/email-sync.ts` - already created)
3. Add sync endpoint to server
4. Add "Sync Now" button in Settings

**Pros:**
- Full control
- Works with any IMAP provider
- Can customize sync logic

**Cons:**
- Requires IMAP credentials storage
- More complex to implement

---

### Option B: Use Email Service API (Easier)

**What it does:**
- Use a service like Nylas, Mailgun, or SendGrid
- They handle IMAP/OAuth complexity
- Simple API calls to sync emails

**Steps:**
1. Sign up for email service (e.g., Nylas)
2. Configure API keys
3. Use their SDK to sync emails

**Pros:**
- Much easier to implement
- Handles OAuth refresh automatically
- Better error handling

**Cons:**
- Costs money (usually)
- Less control

---

## 📋 Quick Implementation Guide

### Step 1: Install IMAP Dependencies

```bash
npm install imap mailparser @types/imap
```

### Step 2: Update Email Sync Service

The file `server/email-sync.ts` is already created with the structure. You need to:

1. **Uncomment and implement the IMAP sync function**
2. **Add error handling**
3. **Test with your IMAP credentials**

### Step 3: Add Sync Endpoint

The endpoint is already added to `server/index.ts` at:
```
POST /api/email-connections/:connectionId/sync
```

### Step 4: Add Frontend Sync Button

1. **Update Settings page** to show "Sync Now" button
2. **Call `emailConnectionsApi.sync(connectionId)`**
3. **Show sync status**

### Step 5: Store IMAP Credentials Securely

**Important:** For IMAP connections, you need to store the password securely:

1. **Update `ConnectEmailDialog`** to save IMAP password in `metadata` field
2. **Encrypt passwords** before storing (use environment variable for encryption key)
3. **Or use OAuth** instead of IMAP (more secure)

---

## 🔒 Security Considerations

### For IMAP:
- **Never store passwords in plain text**
- Use encryption (AES-256) before storing
- Consider using App Passwords instead of main password
- Rotate credentials regularly

### For OAuth (Gmail/Outlook):
- Tokens are automatically refreshed
- More secure than IMAP
- Better user experience

---

## 🎯 Recommended Next Steps

### Immediate (To Test):
1. ✅ Add "Sync Now" button in Settings page
2. ✅ Test manual sync
3. ✅ Verify emails appear in Inbox

### Short Term:
1. Implement automatic sync (every 15 minutes)
2. Add sync status indicator
3. Show last sync time
4. Handle sync errors gracefully

### Long Term:
1. Switch to OAuth for Gmail/Outlook (more secure)
2. Implement incremental sync (only new emails)
3. Add webhook support for real-time updates
4. Add email filtering rules

---

## 📝 Code Examples

### Add Sync Button to Settings

```tsx
// In Settings.tsx, add to email connection card:
<Button
  onClick={async () => {
    try {
      await emailConnectionsApi.sync(connection.id);
      toast.success("Email sync started");
      loadEmailConnections(); // Reload to show updated last_sync_at
    } catch (err) {
      toast.error("Sync failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }}
>
  Sync Now
</Button>
```

### Store IMAP Password Securely

```typescript
// When connecting IMAP, store password in metadata:
await emailConnectionsApi.connect(userId, {
  provider: "imap",
  email: imapCredentials.email,
  // Store password in metadata (encrypt in production)
  metadata: {
    password: imapCredentials.password, // TODO: Encrypt this
    imapServer: imapCredentials.imapServer,
    imapPort: imapCredentials.imapPort,
  },
});
```

---

## ✅ Checklist

- [ ] IMAP connection working ✅ (You've done this!)
- [ ] Install IMAP dependencies
- [ ] Implement email sync service
- [ ] Add "Sync Now" button
- [ ] Test manual sync
- [ ] Verify emails appear in Inbox
- [ ] Add automatic sync (optional)
- [ ] Encrypt IMAP passwords (important!)

---

## 🎉 You're Making Great Progress!

Your email connection is working! The next step is to sync emails so they appear in your Inbox. Choose the implementation option that works best for you, and you'll have a fully functional email management system!

**Need help?** Check the `server/email-sync.ts` file for the sync service structure, or implement the simpler "Sync Now" button first to test the flow.









