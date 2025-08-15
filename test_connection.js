// Test script to verify API connection
const API_BASE_URL = '192.168.1.10:8000';

async function testConnection() {
  console.log('🔍 Testing API connection...');
  console.log(`Base URL: ${API_BASE_URL}`);
  
  try {
    // Test health check
    console.log('\n1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response:`, healthData);
    
    if (healthResponse.ok) {
      console.log('   ✅ Health check successful!');
    } else {
      console.log('   ❌ Health check failed!');
      return false;
    }
    
    // Test registration endpoint
    console.log('\n2. Testing registration endpoint...');
    const testUser = {
      email: 'test@example.com',
      full_name: 'Test User',
      password: 'testpass123'
    };
    
    const registerResponse = await fetch(`${API_BASE_URL}/api/v1/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    console.log(`   Status: ${registerResponse.status}`);
    
    if (registerResponse.ok) {
      const userData = await registerResponse.json();
      console.log('   ✅ Registration successful!');
      console.log('   User data:', userData);
    } else if (registerResponse.status === 400) {
      console.log('   ⚠️  User might already exist (this is expected)');
    } else {
      const errorText = await registerResponse.text();
      console.log('   ❌ Registration failed!');
      console.log('   Error:', errorText);
      return false;
    }
    
    console.log('\n🎉 All tests passed! Your React Native app should work now.');
    return true;
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure your backend is running: python start.py');
    console.log('2. Make sure both devices are on the same network');
    console.log('3. Check if your firewall is blocking the connection');
    console.log('4. Try using your computer\'s IP address: 192.168.1.10');
    return false;
  }
}

// Run the test
testConnection(); 