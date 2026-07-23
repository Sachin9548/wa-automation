# WhatsApp Client Setup — Quick Reference Card

## 📝 5-Step Checklist (30 Minutes Total)

```
[ ] Step 1: Add client's business to your access (5 min)
[ ] Step 2: Connect client's WhatsApp number (10 min)
[ ] Step 3: Generate permanent access token (5 min)
[ ] Step 4: Create message templates (10 min)
[ ] Step 5: Save credentials in admin panel
```

---

## 🔗 Key URLs

| Action | URL |
|--------|-----|
| Client Business | https://business.facebook.com |
| Your Dev App | https://developers.facebook.com/apps |
| System Users | https://business.facebook.com/latest/settings |

---

## 🔑 4 Values You Need From Each Client

```
1. Phone Number ID: 120364xxxxxxxxxx
   → WhatsApp → API Setup → Select number

2. WABA ID: 9876543210987654
   → WhatsApp Manager → Settings

3. Access Token: EAAxxxxxxxxxxxxxxxxxxxxxxxxxx
   → System Users → Generate Token

4. Template Names: abandoned_cart_reminder, order_confirmed
   → Message Templates → Create
```

---

## 💰 Client Pricing (India, July 2026)

| Message Type | Cost |
|--------------|------|
| Marketing | ₹1.09/msg |
| Utility | ₹0.145/msg |
| Service replies | FREE |

**Client pays Meta directly — you don't handle this!**

---

## 🚫 Don't Break

- [ ] Don't spam (block rate >10% = ban)
- [ ] Don't send marketing without template
- [ ] Don't use number on WhatsApp app AND Cloud API
- [ ] Always honor "STOP" replies

---

## 🆘 Common Issues

| Problem | Quick Fix |
|---------|-----------|
| Number not registering | Make sure it's not on WhatsApp app |
| Token expired | Generate new one (show only once!) |
| Templates rejected | Remove links from first 3 words |
| 403 error | Check system user has "Admin" role |

---

## 📱 Phone Number Requirements

```
✅ Can be: Any Indian number (+91XXXXXXXXXX)
❌ Cannot be: Active on WhatsApp app currently
✅ After setup: Can receive calls/SMS (just not WhatsApp)
```

**If number is on WhatsApp:**
1. Open WhatsApp → Settings → Account
2. Click "Delete my account"
3. Wait 1 minute
4. Now register for Cloud API

---

## 🎯 Client Must Do

1. Add you as admin to their business (email invitation)
2. Add payment method to their Meta Business Account
3. Receive OTP on phone number

**You do everything else!**

---

## 📊 Tier Limits (Default = Tier 1)

| Tier | Messages/Day | Verification |
|------|--------------|--------------|
| 1 | 1,000 | None needed |
| 2 | 10,000 | Business verified |
| 3 | 100,000 | High volume |

**Small businesses:** Tier 1 is enough!

---

## 💡 Pro Tips

1. **Create templates first** → Wait for approval before testing
2. **Use utility templates** for order confirmations (cheaper!)
3. **Test with your number** first before going live
4. **Save all tokens** in secure password manager
5. **Monitor block rates** in Meta dashboard

---

## 📞 Quick Script for Client

**You say:**
> "I'll connect your WhatsApp in 30 minutes. I need you to:
> 1. Add me as admin to your Meta Business Account
> 2. Receive an OTP on your business number
> 3. Add a credit card to your Meta account (for message charges)
> 
> The card is only for Meta to charge per message — I'll still bill you monthly for my service."

---

## ✅ Verification Checklist

Before moving client to production:

- [ ] Permanent token saved in database
- [ ] Phone Number ID configured
- [ ] Template "abandoned_cart_reminder" approved
- [ ] Template "order_confirmed" approved
- [ ] Test message sent successfully
- [ ] Client receives message on their WhatsApp
- [ ] Client sees token in their Meta Business Account
- [ ] Client has added payment method

---

**Updated:** July 15, 2026  
**API Version:** v23.0  
**Pricing Source:** Meta Official Docs