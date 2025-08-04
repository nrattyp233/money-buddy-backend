const express = require("express");
const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require("plaid");
const { createClient } = require('@supabase/supabase-js');
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'; // 'sandbox', 'development', or 'production'
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Plaid client
const plaidEnvironment = PLAID_ENV === 'production' ? PlaidEnvironments.production :
                        PLAID_ENV === 'development' ? PlaidEnvironments.development :
                        PlaidEnvironments.sandbox;

const plaidClient = new PlaidApi(new Configuration({
    basePath: plaidEnvironment,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
            'PLAID-SECRET': PLAID_SECRET,
        },
    },
}));

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 1. POST /api/create_link_token
// Purpose: Generate a link_token for Plaid Link initialization
app.post("/api/create_link_token", async (request, response) => {
    try {
        const { user_id } = request.body;
        
        // Create a unique client_user_id if not provided
        const clientUserId = user_id || 'user-id-' + Date.now();
        
        const tokenResponse = await plaidClient.linkTokenCreate({
            user: { client_user_id: clientUserId },
            client_name: 'Money Buddy',
            products: [Products.Transactions, Products.Auth],
            country_codes: [CountryCode.Us],
            language: 'en',
            // Optional: Add webhook URL if you want to receive updates
            // webhook: 'https://your-app.render.com/webhook',
        });
        
        response.json({ 
            link_token: tokenResponse.data.link_token,
            expiration: tokenResponse.data.expiration,
            request_id: tokenResponse.data.request_id
        });
    } catch (error) {
        console.error("Error creating link token:", error.response ? error.response.data : error);
        response.status(500).json({ 
            error: "Failed to create link token",
            message: error.response ? error.response.data : error.message
        });
    }
});

// 2. POST /api/exchange_and_create_accounts  
// Purpose: Exchange public_token for access_token and create accounts in database
app.post("/api/exchange_and_create_accounts", async (request, response) => {
    try {
        const { public_token, user_id, metadata } = request.body;
        
        if (!public_token || !user_id) {
            return response.status(400).json({ 
                error: "Missing required fields: public_token and user_id are required" 
            });
        }

        // Step 1: Exchange public_token for access_token
        console.log("Exchanging public token for access token...");
        const exchangeResponse = await plaidClient.itemPublicTokenExchange({
            public_token: public_token,
        });

        const accessToken = exchangeResponse.data.access_token;
        const itemId = exchangeResponse.data.item_id;

        // Step 2: Get account balances and details
        console.log("Fetching account balances...");
        const balanceResponse = await plaidClient.accountsBalanceGet({
            access_token: accessToken,
        });

        const accounts = balanceResponse.data.accounts;
        
        // Step 3: Store access_token securely in database (you might want a separate table for this)
        console.log("Storing access token in database...");
        const { error: tokenError } = await supabase
            .from('user_tokens')
            .upsert({
                user_id: user_id,
                access_token: accessToken,
                item_id: itemId,
                institution_id: metadata?.institution?.institution_id || null,
                institution_name: metadata?.institution?.name || null,
                updated_at: new Date().toISOString()
            });

        if (tokenError) {
            console.error("Error storing access token:", tokenError);
            // Continue execution as accounts creation is more important
        }

        // Step 4: Insert/update accounts in the database
        console.log(`Storing ${accounts.length} accounts in database...`);
        const accountsToInsert = accounts.map(account => ({
            user_id: user_id,
            account_id: account.account_id,
            item_id: itemId,
            name: account.name,
            official_name: account.official_name,
            type: account.type,
            subtype: account.subtype,
            balance_available: account.balances.available,
            balance_current: account.balances.current,
            balance_limit: account.balances.limit,
            iso_currency_code: account.balances.iso_currency_code,
            mask: account.mask,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));

        const { data: insertedAccounts, error: accountsError } = await supabase
            .from('accounts')
            .upsert(accountsToInsert, { 
                onConflict: 'account_id',
                ignoreDuplicates: false 
            })
            .select();

        if (accountsError) {
            console.error("Error storing accounts:", accountsError);
            return response.status(500).json({ 
                error: "Failed to store accounts in database",
                message: accountsError.message
            });
        }

        // Step 5: Return success response
        response.json({
            success: true,
            message: "Accounts successfully created",
            accounts_created: insertedAccounts?.length || accounts.length,
            item_id: itemId,
            institution: metadata?.institution || null,
            accounts: accounts.map(acc => ({
                account_id: acc.account_id,
                name: acc.name,
                type: acc.type,
                subtype: acc.subtype,
                balance_current: acc.balances.current,
                balance_available: acc.balances.available
            }))
        });

    } catch (error) {
        console.error("Error in exchange_and_create_accounts:", error.response ? error.response.data : error);
        response.status(500).json({ 
            error: "Failed to exchange token and create accounts",
            message: error.response ? error.response.data : error.message
        });
    }
});

// Health check endpoint
app.get("/health", (request, response) => {
    response.json({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        environment: PLAID_ENV
    });
});

// Root endpoint
app.get("/", (request, response) => {
    response.json({ 
        message: "Money Buddy Backend API",
        version: "1.0.0",
        endpoints: [
            "POST /api/create_link_token",
            "POST /api/exchange_and_create_accounts",
            "GET /health"
        ]
    });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log("Your app is listening on port " + port);
});
