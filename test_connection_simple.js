// Simple connection test for Android emulator
const urls = [
  'http://10.0.2.2:8000',  // Android emulator
  'http://localhost:8000', // Local testing
  'http://127.0.0.1:8000', // Alternative localhost
  '192.168.1.10:8000', // Your computer's IP
];

async function testUrl(url) {
  try {
    console.log(`Testing: ${url}`);
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ SUCCESS: ${url} - ${JSON.stringify(data)}`);
      return true;
    } else {
      console.log(`❌ FAILED: ${url} - Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${url} - ${error.message}`);
    return false;
  }
}

async function testAllUrls() {
  console.log('🔍 Testing all URLs for Android emulator...\n');
  
  for (const url of urls) {
    const success = await testUrl(url);
    if (success) {
      console.log(`\n🎉 Use this URL in your config: ${url}`);
      break;
    }
    console.log(''); // Empty line for readability
  }
}

// Run the test
testAllUrls(); 