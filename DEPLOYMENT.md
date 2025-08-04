# Deployment Checklist for Money Buddy Backend

## Pre-Deployment Setup

### 1. Plaid Account Setup
- [ ] Create Plaid account at https://plaid.com/
- [ ] Get your `PLAID_CLIENT_ID` from the dashboard
- [ ] Get your `PLAID_SECRET` key from the dashboard
- [ ] Choose environment: `sandbox` (testing) or `production` (live data)

### 2. Supabase Database Setup
- [ ] Create Supabase project at https://supabase.com/
- [ ] Get your project URL (`SUPABASE_URL`)
- [ ] Get your service role key (`SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Create required database tables:

```sql
-- Accounts table
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  account_id VARCHAR(255) UNIQUE NOT NULL,
  item_id VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  official_name VARCHAR(255),
  type VARCHAR(50),
  subtype VARCHAR(50),
  balance_available DECIMAL(12,2),
  balance_current DECIMAL(12,2),
  balance_limit DECIMAL(12,2),
  iso_currency_code VARCHAR(3),
  mask VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User tokens table (optional but recommended)
CREATE TABLE user_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  item_id VARCHAR(255) NOT NULL,
  institution_id VARCHAR(255),
  institution_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_account_id ON accounts(account_id);
CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
```

## Render Deployment

### 3. Create Render Service
- [ ] Go to https://render.com and create an account
- [ ] Click "New +" → "Web Service"
- [ ] Connect your GitHub repository
- [ ] Configure service settings:
  - **Name**: `money-buddy-backend`
  - **Environment**: `Node`
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Instance Type**: Free tier is fine for testing

### 4. Set Environment Variables on Render
In your Render service dashboard, go to "Environment" and add:

- [ ] `PLAID_CLIENT_ID` = `your_plaid_client_id`
- [ ] `PLAID_SECRET` = `your_plaid_secret_key`
- [ ] `PLAID_ENV` = `sandbox` or `production`
- [ ] `SUPABASE_URL` = `https://your-project.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `your_service_role_key`
- [ ] `PORT` = `10000` (Render's default, or leave empty)

### 5. Deploy and Test
- [ ] Click "Deploy Latest Commit"
- [ ] Wait for deployment to complete
- [ ] Test health endpoint: `https://your-app.onrender.com/health`
- [ ] Test link token creation: `https://your-app.onrender.com/api/create_link_token`

## Post-Deployment

### 6. Update Frontend Configuration
Update your frontend to use the new backend URL:
```javascript
const API_BASE_URL = 'https://your-money-buddy-backend.onrender.com';
```

### 7. Test Full Integration
- [ ] Test Plaid Link flow from frontend
- [ ] Verify accounts are created in Supabase
- [ ] Check error handling and logging

## Troubleshooting

### Common Issues:

**500 Error on link token creation:**
- Check Plaid credentials are correct
- Verify PLAID_ENV matches your Plaid dashboard environment

**Database connection errors:**
- Verify Supabase URL and service role key
- Check database tables exist
- Ensure service role key has necessary permissions

**CORS errors:**
- Backend includes CORS middleware, but verify frontend domain if needed

**Render deployment fails:**
- Check build logs in Render dashboard
- Verify package.json has all required dependencies
- Ensure start command is correct

### Useful Commands:

```bash
# Test locally with environment variables
PLAID_CLIENT_ID=your_id PLAID_SECRET=your_secret npm start

# Test endpoints locally
npm test

# Check logs on Render
# Use the Render dashboard or CLI
```

## Security Best Practices

- [ ] Never commit `.env` files to git
- [ ] Use strong service role keys
- [ ] Regularly rotate API keys
- [ ] Monitor access logs
- [ ] Use HTTPS only (Render provides this automatically)

## Monitoring

- [ ] Set up Render service monitoring
- [ ] Monitor Plaid API usage in dashboard
- [ ] Set up Supabase database monitoring
- [ ] Consider adding application-level logging service

---

Once all checkboxes are complete, your Money Buddy backend should be successfully deployed and ready for production use!
