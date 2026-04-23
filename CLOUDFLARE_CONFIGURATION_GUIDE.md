# Cloudflare Configuration Guide for Mobile App OTP Issues

## Overview

Cloudflare WAF, rate limiting, and bot detection can interfere with mobile app requests if not configured correctly. This guide helps you identify and fix Cloudflare-specific issues.

---

## Quick Diagnosis

### Does Cloudflare Block Mobile Requests?

**Test Method 1: Direct Comparison**

```bash
# Test from desktop (via Swagger or curl)
curl -X POST https://getmyneurocare.org/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@example.com","otp":"123456"}' \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n"

# Test from mobile device (via app)
# Note the response code:
# 200 = Success
# 403 = Forbidden (Cloudflare blocking)
# 429 = Rate limited
# 520/522 = Server error
# cf_challenge = Bot challenge
```

**Test Method 2: Check Cloudflare Logs**

1. Go to **Cloudflare Dashboard** → Your Domain
2. Click **Analytics** → **Traffic**
3. Filter for `/auth/verify-otp` requests
4. Look at **Status Code** breakdown:
   - Large number of `4xx` → Cloudflare blocking
   - Large number of `429` → Rate limiting
   - Requests from mobile IPs blocked → WAF issue

**Test Method 3: User-Agent Analysis**

1. **Analytics** → **Traffic**
2. Look for mobile User-Agents (iPhone, Android)
3. Check if they have different status codes than desktop

---

## Issue 1: Bot Challenge on Mobile Requests

### Symptoms

- Mobile users see a "checking your browser" page
- Request hangs or times out
- Desktop/Swagger requests work fine

### Root Cause

Cloudflare thinks mobile app requests are bots and shows a challenge page:

- Mobile user can't solve the challenge (no browser)
- Request fails silently

### How to Fix

#### Option 1: Whitelist Your Mobile App

1. **Cloudflare Dashboard** → **Security** → **WAF**
2. Click **Create Rule**

   ```
   Rule Name: Allow Mobile App Auth

   When incoming requests match:
   - User Agent contains "MyAppName" OR
   - User Agent contains "Android" OR
   - User Agent contains "iPhone"

   Then:
   - Action: Allow
   - Priority: 1 (highest)
   ```

#### Option 2: Disable Bot Challenge for Auth Endpoints

1. **Cloudflare Dashboard** → **Security** → **Bot Management**
2. Look for bot challenge rules
3. Add exception:

   ```
   Path: /auth/*
   or /verify-otp

   Action: Allow (bypass challenge)
   ```

#### Option 3: Adjust Bot Score Threshold

1. **Security** → **Bot Management**
2. Change bot score threshold from default to higher
   - Default: 50 (aggressive)
   - Better for mobile: 25 (less aggressive)
   - **Settings** → **Security Level** → Set to "Low" temporarily to test

---

## Issue 2: Rate Limiting Blocking Mobile (429 Errors)

### Symptoms

- Mobile user gets "Too many requests" after 1-2 attempts
- Swagger works fine
- Error message: `429 Too Many Requests`

### Root Cause

Mobile devices frequently change IPs:

- Switching between cellular towers = new IP
- Network switch (cellular to Wi-Fi) = new IP
- Each IP thought to be different user
- Rate limiting applies per IP → blocks "new" user after 2-3 requests

### How to Fix

#### Option 1: Increase Rate Limit

1. **Cloudflare Dashboard** → **Security** → **Rate Limiting**
2. Find rule for `/auth/verify-otp` (if exists)
3. Increase threshold:
   - Default: 10 requests per 10 seconds
   - Better: 20 requests per 60 seconds
   - Best: 5 requests per 60 seconds BUT whitelist mobile

#### Option 2: Disable Rate Limiting for Auth Endpoints

1. **Rate Limiting** → Edit rules
2. Add exception:

   ```
   Path: /auth/*

   Action: Allow / Bypass
   Priority: 1
   ```

#### Option 3: Rate Limit Based on User ID, Not IP

Unfortunately Cloudflare doesn't support this easily, but you can:

1. Use rate limiting in your **application code** (already have middleware!)
2. Disable Cloudflare rate limiting for `/auth/*`
3. Implement it in Express middleware

---

## Issue 3: WAF Rules Blocking Mobile Requests

### Symptoms

- Mobile requests consistently fail
- Swagger requests work
- Status code: 403 Forbidden
- Cloudflare logs show "WAF rule triggered"

### Root Cause

WAF rules might be too aggressive:

- Missing headers (mobile doesn't send some headers)
- Custom mobile User-Agent not recognized
- Request format slightly different
- IP reputation (mobile ISP IP flagged as suspicious)

### How to Find the Blocking Rule

1. **Cloudflare Dashboard** → **Security** → **Events**
2. Filter for `/auth/verify-otp`
3. Look for "Blocked" entries
4. Click on one to see which rule blocked it
5. Note the rule name (e.g., "OWASP SQL injection")

### How to Fix

#### For Each Blocking Rule:

1. **Security** → **WAF**
2. Find the rule that's blocking
3. Click **Edit**
4. Add exception:

   ```
   Path: /auth/verify-otp

   Expression:
   (cf_threat_score < 50) AND (cf_bot_score > 30)

   Action: Allow
   Priority: 1 (highest)
   ```

#### Common Rules That Block Mobile:

- **OWASP ModSecurity SQL Injection** - False positives common
- **OWASP Query String Too Long** - Mobile might send different format
- **Bad Bot Fight Mode** - Too aggressive for legitimate apps
- **IP Reputation** - Mobile ISP IPs often flagged

---

## Issue 4: SSL/TLS Certificate Issues

### Symptoms

- Mobile app: Connection refused / Certificate error
- Swagger: Works fine
- Development: Works with self-signed certs

### Root Cause

Cloudflare's SSL certificates might not be recognized by mobile:

- Certificate pinning in app expects different cert
- Mobile OS doesn't trust Cloudflare's intermediate cert
- Cloudflare SSL mode mismatch

### How to Check

1. Test from mobile device:

   ```
   Try to connect to https://yourdomain.com

   If you get:
   - "Certificate not trusted" → SSL issue
   - Connection times out → WAF/blocking issue
   ```

2. Test certificate chain:
   ```
   curl -I https://yourdomain.com
   # Check certificate issuer
   ```

### How to Fix

#### Option 1: Set Cloudflare SSL Mode

1. **Cloudflare Dashboard** → **SSL/TLS**
2. Set **Encryption Mode** to **Full**:
   - Not "Flexible" (that's insecure)
   - Full (strict) is best if your origin supports it

#### Option 2: Whitelist Cloudflare Certificate

If mobile app has certificate pinning:

1. Get Cloudflare's certificate chain
2. Add it to mobile app's pinned certificates
3. OR disable pinning for development

#### Option 3: Add Certificate Authority

1. Check which CA issued Cloudflare certs
2. Add that CA to mobile app's trust store
3. Requires app update

---

## Issue 5: Geolocation/ISP Blocking

### Symptoms

- Works in one location, fails in another
- Works on different ISP
- Mobile user on specific cellular provider fails

### Root Cause

Cloudflare rules based on:

- Geo-location (country/city)
- ASN (network provider)
- ISP reputation
- Data centers (blocking certain DC providers)

### How to Check

1. **Cloudflare Dashboard** → **Analytics** → **WAF Events**
2. Filter for `/auth/verify-otp`
3. Look at **Client IP Country** column
4. See which countries/IPs are blocked

### How to Fix

#### Option 1: Disable Geo-blocking for Auth

1. **Security** → **Tools**
2. Look for Geo-blocking rules
3. Remove `/auth/*` from blocked countries

#### Option 2: Whitelist Mobile User IPs

1. Note the IP addresses of failing users
2. **Security** → **WAF**
3. Create allow rule:

   ```
   Client IP is 197.111.x.x/24 (example)

   Action: Allow
   Priority: 1
   ```

**Note:** Mobile IPs change frequently, so this is temporary fix only

#### Option 3: Check ISP/ASN Reputation

1. **Security** → **ASN** filters
2. Look for blocking rules by ASN (Autonomy System Number)
3. Check if mobile ISP is blocked
4. Remove or whitelist if needed

---

## Issue 6: API Endpoint Specific Configuration

### Recommended Configuration for `/auth/verify-otp`

Go through these in order and apply what fits your needs:

#### Step 1: Security Level

```
Cloudflare → Security → Security Level
Set to: "Low" (for auth endpoints)

OR

Create page rule:
Path: yourdomain.com/auth/*
Security Level: Low
Priority: 1
```

#### Step 2: Bot Management

```
Cloudflare → Security → Bot Management
Create rule:
Path: /auth/verify-otp
Bot Score: > 30 (allow legitimate traffic)
Action: Allow
```

#### Step 3: Rate Limiting

```
Cloudflare → Security → Rate Limiting
Edit existing rules or create new:

Path: /auth/verify-otp
Requests: 20 per 60 seconds (allows retries)
Action: Block (or challenge)
```

#### Step 4: WAF Rules

```
Cloudflare → Security → WAF
Create exception rule:
Path: /auth/verify-otp
Sensitivity: Low
OR
Disable specific aggressive rules for this path
```

#### Step 5: Cache Settings

```
Cloudflare → Caching → Cache Rules
Create rule:
Path: /auth/verify-otp
TTL: 0 (do NOT cache!)
Reason: OTP responses are user-specific
```

---

## Step-by-Step Fix Process

### 1. Baseline Testing

```bash
# Test 1: Disable Cloudflare
1. Cloudflare → DNS
2. See your domain's DNS record
3. Change from "Proxied" to "DNS only"
4. Test from mobile app
5. If works → Cloudflare is the problem
6. If fails → Problem is elsewhere

# Change back to Proxied when done
```

### 2. Test with Minimal Rules

```
If Cloudflare is the problem:

1. Cloudflare → Security → WAF
2. Disable ALL rules temporarily
3. Cloudflare → Security → Rate Limiting
4. Disable ALL rate limits
5. Test from mobile
6. If works → identify which rule is blocking
```

### 3. Add Rules Back One by One

```
1. Enable one WAF rule
2. Test mobile
3. If fails → that rule is problematic
4. Disable that rule with exception
5. Repeat with next rule
```

### 4. Create Whitelist Rule

```
Create highest priority rule:
If User-Agent contains "YourMobileAppName"
Then Action: Allow
Priority: 1

This bypasses all other rules for your mobile app
```

---

## Recommended Production Configuration

### For Auth Endpoints (`/auth/*`)

```
Security Level: Low
Bot Management: Score > 20 (allow legitimate)
Rate Limiting: 20 requests/60 seconds
WAF: Disable for exceptions OR set to low sensitivity
Cache: Bypass cache (TTL 0)
SSL: Full (strict)
```

### For Critical Endpoints (`/verify-otp`)

```
Security Level: Low
Bot Management: Whitelist (score > 10)
Rate Limiting: 10 requests/60 seconds (allows rapid retries)
WAF: Whitelist with high priority
Cache: Never cache
SSL: Full (strict)
User Rate Limit in App Code: 3 attempts/60 seconds
```

---

## Testing Checklist

After making Cloudflare changes:

- [ ] Test from Swagger (desktop)
- [ ] Test from iPhone (Wi-Fi)
- [ ] Test from iPhone (cellular)
- [ ] Test from Android (Wi-Fi)
- [ ] Test from Android (cellular)
- [ ] Test rapid retries (5 requests in 10 seconds)
- [ ] Test after 1 minute delay
- [ ] Test from different location/ISP
- [ ] Check Cloudflare logs for any blocks
- [ ] Verify no more 403/429 responses

---

## Monitoring Cloudflare

### Create Alerts

1. **Cloudflare Dashboard** → **Notifications**
2. Add alert for:
   - [ ] Status code 403 on `/auth/` paths
   - [ ] Status code 429 spike
   - [ ] WAF rule triggered > 10 times/minute
   - [ ] Bot challenge issued

### Regular Review

- [ ] Weekly: Check WAF events for `/auth/*`
- [ ] Weekly: Check rate limiting logs
- [ ] Daily during launch: Monitor bot challenges
- [ ] Review false positives: Rules blocking legitimate users

---

## Temporary Workarounds

If you need to deploy quickly while fixing Cloudflare:

### Workaround 1: Bypass Cloudflare for Auth

```
Use a separate subdomain for auth that bypasses Cloudflare:
- auth.yourdomain.com → DNS only (no Cloudflare proxy)
- api.yourdomain.com → Proxied through Cloudflare

Mobile app uses auth.yourdomain.com for OTP
Web uses api.yourdomain.com for other APIs
```

### Workaround 2: API Token Based Whitelist

```
Cloudflare → Custom Rules
If header "X-API-Token" = "your-mobile-app-token"
Then Action: Allow
This bypasses all other rules for requests with header
```

### Workaround 3: IP Whitelist (if ISPs block)

```
Get list of your users' ISP IP ranges
Cloudflare → Firewall Rules
Allow all IPs from those ranges
```

---

## Contact Cloudflare Support

If you've gone through this guide and still have issues:

1. Prepare info:
   - [ ] Domain name
   - [ ] Specific paths affected (`/auth/verify-otp`)
   - [ ] Status codes seen (429, 403, etc.)
   - [ ] WAF rules blocking
   - [ ] Affected clients (iOS, Android)
   - [ ] Geo-locations affected

2. Contact:
   - **Cloudflare Community**: https://community.cloudflare.com
   - **Cloudflare Support**: Dashboard → Get help

3. Ask for:
   - [ ] Enable/disable specific WAF rules by path
   - [ ] Adjust bot score thresholds
   - [ ] Whitelist mobile app user agents

---

## Summary

**Most Common Fixes:**

1. ✅ Whitelist mobile User-Agent
2. ✅ Increase rate limit or exclude `/auth/*`
3. ✅ Disable aggressive WAF rules for `/auth/*`
4. ✅ Set Security Level to "Low" for auth
5. ✅ Disable bot challenge for OTP endpoint

**If all else fails:**

- Use separate subdomain without Cloudflare proxy
- Or temporarily disable Cloudflare proxy for testing
- Or contact Cloudflare support
