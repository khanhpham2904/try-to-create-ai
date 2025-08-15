// Test script for Android emulator connection
const ANDROID_EMULATOR_URL = 'http://10.0.2.2:8000';

async function testAndroidConnection() {
  console.log('🔍 Testing Android Emulator Connection...');
  console.log(`URL: ${ANDROID_EMULATOR_URL}`);
  
  try {
    // Test health check
    console.log('\n1. Testing health check...');
    const healthResponse = await fetch(`${ANDROID_EMULATOR_URL}/health`);
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
      email: `android_test_${Date.now()}@example.com`,
      full_name: 'Android Test User',
      password: 'testpass123'
    };
    
    const registerResponse = await fetch(`${ANDROID_EMULATOR_URL}/api/v1/users/`, {
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
    
    console.log('\n🎉 Android emulator connection test passed!');
    console.log('Your React Native app should work now.');
    return true;
    
  } catch (error) {
    console.log('❌ Android emulator connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure your backend is running: cd "BE ChatApp" && python start.py');
    console.log('2. Make sure you\'re using Android emulator (not physical device)');
    console.log('3. The URL 10.0.2.2:8000 is correct for Android emulator');
    console.log('4. Check if your backend is accessible from localhost:8000');
    return false;
  }
}

// Run the test
testAndroidConnection(); 