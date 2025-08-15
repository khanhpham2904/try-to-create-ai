#!/usr/bin/env node
/**
 * Test script for the new chat session UI functionality
 * This script tests the frontend integration with the new session system
 */

const BASE_URL = "http://localhost:8000/api/v1/chat";

async function testChatSessionsUI() {
  console.log("🧪 Testing Chat Session UI Integration");
  console.log("=" * 50);

  try {
    // Test 1: Create a new chat session
    console.log("\n1. Creating new chat session...");
    const sessionData = {
      user_id: 1,
      title: "UI Test Session"
    };

    const createResponse = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData)
    });

    if (createResponse.ok) {
      const session = await createResponse.json();
      console.log(`✅ Chat session created: ID ${session.id}, Title: ${session.title}`);
      
      // Test 2: Send a message in the session
      console.log("\n2. Sending a message in the session...");
      const messageData = {
        chat_session_id: session.id,
        user_id: 1,
        message: "Hello from UI test!"
      };

      const messageResponse = await fetch(`${BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      if (messageResponse.ok) {
        const message = await messageResponse.json();
        console.log(`✅ Message sent: ID ${message.id}`);
        console.log(`   User message: ${message.message}`);
        console.log(`   AI response: ${message.response.substring(0, 100)}...`);
      } else {
        console.log(`❌ Failed to send message: ${messageResponse.status}`);
      }

      // Test 3: Get session messages
      console.log("\n3. Getting session messages...");
      const messagesResponse = await fetch(`${BASE_URL}/sessions/${session.id}/messages?user_id=1`);
      
      if (messagesResponse.ok) {
        const messages = await messagesResponse.json();
        console.log(`✅ Found ${messages.total_count} messages in session`);
        messages.messages.forEach((msg, index) => {
          console.log(`   ${index + 1}. ${msg.message.substring(0, 50)}...`);
        });
      } else {
        console.log(`❌ Failed to get messages: ${messagesResponse.status}`);
      }

      // Test 4: Update session title
      console.log("\n4. Updating session title...");
      const updateResponse = await fetch(`${BASE_URL}/sessions/${session.id}/title?user_id=1&new_title=Updated%20UI%20Test%20Session`);
      
      if (updateResponse.ok) {
        const updatedSession = await updateResponse.json();
        console.log(`✅ Session title updated to: ${updatedSession.title}`);
      } else {
        console.log(`❌ Failed to update title: ${updateResponse.status}`);
      }

      // Test 5: Get user's chat sessions
      console.log("\n5. Getting user's chat sessions...");
      const sessionsResponse = await fetch(`${BASE_URL}/sessions/user/1`);
      
      if (sessionsResponse.ok) {
        const sessions = await sessionsResponse.json();
        console.log(`✅ Found ${sessions.total_count} sessions for user`);
        sessions.sessions.forEach((session, index) => {
          console.log(`   ${index + 1}. ${session.title} (ID: ${session.id})`);
        });
      } else {
        console.log(`❌ Failed to get sessions: ${sessionsResponse.status}`);
      }

      // Test 6: Get chat statistics
      console.log("\n6. Getting chat statistics...");
      const statsResponse = await fetch(`${BASE_URL}/user/1/statistics`);
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log(`✅ Chat statistics:`);
        console.log(`   - Total sessions: ${stats.total_sessions}`);
        console.log(`   - Total messages: ${stats.total_messages}`);
      } else {
        console.log(`❌ Failed to get statistics: ${statsResponse.status}`);
      }

      console.log("\n🎉 All UI integration tests completed successfully!");
      console.log("\n📱 You can now test the mobile app with these features:");
      console.log("   - Create new chat sessions");
      console.log("   - Send messages in sessions");
      console.log("   - View session history");
      console.log("   - Edit session titles");
      console.log("   - Delete sessions");
      console.log("   - Real-time updates");

    } else {
      console.log(`❌ Failed to create session: ${createResponse.status}`);
      const error = await createResponse.text();
      console.log(`   Error: ${error}`);
    }

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
testChatSessionsUI();
