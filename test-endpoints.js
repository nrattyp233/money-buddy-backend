// Test script for Money Buddy Backend API
// Run with: node test-endpoints.js

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

async function testHealthEndpoint() {
    try {
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();
        console.log('✅ Health check:', data);
        return true;
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        return false;
    }
}

async function testCreateLinkToken() {
    try {
        const response = await fetch(`${BASE_URL}/api/create_link_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: 'test-user-' + Date.now()
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Link token created:', {
                link_token: data.link_token ? '✓ Present' : '✗ Missing',
                expiration: data.expiration,
                request_id: data.request_id
            });
            return data.link_token;
        } else {
            console.error('❌ Link token creation failed:', data);
            return null;
        }
    } catch (error) {
        console.error('❌ Link token creation error:', error.message);
        return null;
    }
}

async function runTests() {
    console.log('🧪 Testing Money Buddy Backend API\n');
    console.log('📍 Base URL:', BASE_URL);
    console.log('');
    
    // Test health endpoint
    const healthOk = await testHealthEndpoint();
    
    if (healthOk) {
        // Test link token creation
        const linkToken = await testCreateLinkToken();
        
        if (linkToken) {
            console.log('\n✅ All tests passed! The API is working correctly.');
            console.log('\n📝 Next steps:');
            console.log('1. Set up your Plaid and Supabase environment variables');
            console.log('2. Deploy to Render using the instructions in README.md');
            console.log('3. Test with real Plaid Link integration from your frontend');
        } else {
            console.log('\n⚠️  Link token test failed - check your Plaid credentials');
        }
    } else {
        console.log('\n❌ Health check failed - server may not be running');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testHealthEndpoint, testCreateLinkToken, runTests };
