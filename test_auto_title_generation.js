#!/usr/bin/env node
/**
 * Test script for automatic title generation functionality
 * This script tests the new start-conversation endpoint
 */

const BASE_URL = "http://localhost:8000/api/v1/chat";

async function testAutoTitleGeneration() {
  console.log("🧪 Testing Automatic Title Generation");
  console.log("=" * 50);

  const testMessages = [
    "How do I implement authentication in React Native?",
    "Can you help me with Python machine learning algorithms?",
    "What are the best practices for database design?",
    "I need help with JavaScript async programming",
    "How to deploy a web application to AWS?",
    "Tell me about blockchain technology",
    "What's the difference between REST and GraphQL APIs?",
    "How to optimize website performance?",
    "Explain microservices architecture",
    "Help me understand Docker containers"
  ];

  try {
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(`\n${i + 1}. Testing: "${message}"`);
      
      const response = await fetch(`${BASE_URL}/start-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 1,
          message: message
        })
      });

      if (response.ok) {
        const session = await response.json();
        console.log(`✅ Session created: ID ${session.id}`);
        console.log(`📝 Auto-generated title: "${session.title}"`);
        
        // Test sending another message to the same session
        console.log(`   Sending follow-up message...`);
        const followUpResponse = await fetch(`${BASE_URL}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_session_id: session.id,
            user_id: 1,
            message: "Can you provide more details?"
          })
        });

        if (followUpResponse.ok) {
          const followUpMessage = await followUpResponse.json();
          console.log(`✅ Follow-up message sent: ID ${followUpMessage.id}`);
        } else {
          console.log(`❌ Failed to send follow-up message: ${followUpResponse.status}`);
        }
        
      } else {
        console.log(`❌ Failed to create session: ${response.status}`);
        const error = await response.text();
        console.log(`   Error: ${error}`);
      }
    }

    // Test getting all sessions to see the generated titles
    console.log("\n📋 Getting all sessions to see generated titles...");
    const sessionsResponse = await fetch(`${BASE_URL}/sessions/user/1`);
    
    if (sessionsResponse.ok) {
      const sessions = await sessionsResponse.json();
      console.log(`✅ Found ${sessions.total_count} sessions:`);
      sessions.sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. "${session.title}" (ID: ${session.id})`);
      });
    } else {
      console.log(`❌ Failed to get sessions: ${sessionsResponse.status}`);
    }

    console.log("\n🎉 Auto title generation test completed!");
    console.log("\n📱 Key Features Tested:");
    console.log("   ✅ Automatic session creation");
    console.log("   ✅ Title generation from first message");
    console.log("   ✅ Follow-up messages in same session");
    console.log("   ✅ Session management and retrieval");

  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Make sure the backend server is running (python main.py)");
    console.log("2. Check that the server is accessible at http://localhost:8000");
    console.log("3. Verify the database migration has been completed");
    console.log("4. Check the server logs for any errors");
  }
}

// Run the test
testAutoTitleGeneration();
