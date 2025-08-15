// Network Connection Test Script
// Run this to diagnose network connectivity issues

const API_BASE_URL = 'http://192.168.1.10:8000';
const FALLBACK_URLS = [
  'http://192.168.1.10:8000',
  'http://192.168.1.11:8000',
  'http://10.0.2.2:8000',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

async function testUrl(url, endpoint = '/health') {
  const fullUrl = `${url}${endpoint}`;
  console.log(`\n🔍 Testing: ${fullUrl}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log(`✅ SUCCESS (${latency}ms): ${fullUrl}`);
      console.log(`   Response:`, data);
      return { success: true, url, latency, data };
    } else {
      console.log(`❌ HTTP ERROR (${response.status}): ${fullUrl}`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      return { success: false, url, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ NETWORK ERROR: ${fullUrl}`);
    console.log(`   Error: ${error.message}`);
    return { success: false, url, error: error.message };
  }
}

async function testAllUrls() {
  console.log('🚀 Starting Network Connection Test...');
  console.log('=====================================');
  
  const results = [];
  
  // Test all URLs
  for (const url of FALLBACK_URLS) {
    const result = await testUrl(url);
    results.push(result);
    
    // If we found a working URL, we can stop testing
    if (result.success) {
      console.log(`\n🎉 Found working URL: ${result.url}`);
      break;
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const workingUrls = results.filter(r => r.success);
  const failedUrls = results.filter(r => !r.success);
  
  if (workingUrls.length > 0) {
    console.log(`✅ Working URLs: ${workingUrls.length}`);
    workingUrls.forEach(r => {
      console.log(`   - ${r.url} (${r.latency}ms)`);
    });
  }
  
  if (failedUrls.length > 0) {
    console.log(`❌ Failed URLs: ${failedUrls.length}`);
    failedUrls.forEach(r => {
      console.log(`   - ${r.url}: ${r.error}`);
    });
  }
  
  // Recommendations
  console.log('\n🔧 Recommendations:');
  console.log('==================');
  
  if (workingUrls.length === 0) {
    console.log('❌ No working URLs found. Please check:');
    console.log('   1. Is your backend server running?');
    console.log('   2. Is it listening on port 8000?');
    console.log('   3. Is it configured to accept external connections?');
    console.log('   4. Are you on the same network as your server?');
    console.log('   5. Is your firewall blocking the connection?');
    
    console.log('\n🔧 Backend Setup Commands:');
    console.log('   # Start your FastAPI server with:');
    console.log('   uvicorn main:app --host 0.0.0.0 --port 8000 --reload');
    
    console.log('\n🔧 Network Troubleshooting:');
    console.log('   # Check if port 8000 is open:');
    console.log('   netstat -an | grep 8000');
    console.log('   # Check your IP address:');
    console.log('   ipconfig (Windows) or ifconfig (Mac/Linux)');
  } else {
    console.log('✅ Network connection is working!');
    console.log(`   Use this URL in your app: ${workingUrls[0].url}`);
  }
  
  return results;
}

// Run the test
testAllUrls().catch(error => {
  console.error('❌ Test failed:', error);
});
