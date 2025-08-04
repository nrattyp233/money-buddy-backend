# Money Buddy Backend

Backend API for the Money Buddy application, providing Plaid integration for financial data.

## Features

- **Plaid Link Token Creation**: Generates secure link tokens for frontend Plaid Link initialization
- **Account Data Management**: Exchanges temporary tokens for permanent access tokens and stores account data
- **Supabase Integration**: Securely stores account information and access tokens

## API Endpoints

### POST /api/create_link_token
Creates a link token for Plaid Link initialization.

**Request Body:**
```json
{
  "user_id": "optional-user-id"
}
```

**Response:**
```json
{
  "link_token": "link-sandbox-12345...",
  "expiration": "2025-08-04T12:00:00Z",
  "request_id": "request-123"
}
```

### POST /api/exchange_and_create_accounts
Exchanges public token for access token and creates user accounts.

**Request Body:**
```json
{
  "public_token": "public-sandbox-12345...",
  "user_id": "user-123",
  "metadata": {
    "institution": {
      "institution_id": "ins_123",
      "name": "Chase Bank"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Accounts successfully created",
  "accounts_created": 2,
  "item_id": "item-123",
  "accounts": [
    {
      "account_id": "account-123",
      "name": "Checking Account",
      "type": "depository",
      "subtype": "checking",
      "balance_current": 1500.00,
      "balance_available": 1450.00
    }
  ]
}
```

### GET /health
Health check endpoint.

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `PLAID_CLIENT_ID`: Your Plaid client ID
- `PLAID_SECRET`: Your Plaid secret key
- `PLAID_ENV`: Environment (sandbox/development/production)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `PORT`: Server port (optional, defaults to 3001)

## Database Schema

### Required Supabase Tables

#### `accounts` table:
```sql
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
```

#### `user_tokens` table (optional but recommended):
```sql
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
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. Start the server:
   ```bash
   npm start
   ```

The server will start on `http://localhost:3001` (or your specified PORT).

## Deployment on Render

1. **Create a new Web Service** on [Render](https://render.com)

2. **Connect your repository** and select the `money-buddy-backend` folder

3. **Configure the service:**
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Set Environment Variables** in Render dashboard:
   - `PLAID_CLIENT_ID`
   - `PLAID_SECRET`
   - `PLAID_ENV` (set to `production` for live data)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

5. **Deploy** - Render will automatically deploy your service

## Security Notes

- **Access Tokens**: Stored securely in Supabase with service role key
- **Environment Variables**: All sensitive data stored as environment variables
- **CORS**: Configured to allow frontend access
- **Error Handling**: Comprehensive error handling with logging

## Testing

Test your endpoints:

```bash
# Health check
curl https://your-app.onrender.com/health

# Create link token
curl -X POST https://your-app.onrender.com/api/create_link_token \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user"}'
```
