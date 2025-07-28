const express = require("express");
const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require("plaid");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;

const plaidClient = new PlaidApi(new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
            'PLAID-SECRET': PLAID_SECRET,
        },
    },
}));

app.post("/api/create_link_token", async (request, response) => {
    try {
        const tokenResponse = await plaidClient.linkTokenCreate({
            user: { client_user_id: 'user-id-' + Date.now() },
            client_name: 'Money Buddy',
            products: [Products.Transactions, Products.Auth],
            country_codes: [CountryCode.Us],
            language: 'en',
        });
        response.json(tokenResponse.data);
    } catch (e) {
        console.error("Error creating link token:", e.response ? e.response.data : e);
        response.status(500).json({ error: "Failed to create link token." });
    }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log("Your app is listening on port " + port);
});
