// Simple test script for authentication endpoints
import fetch from "node-fetch";

const BASE_URL = "http://localhost:5001/api/v1";

const testAuth = async () => {
  try {
    console.log("🧪 Testing Authentication Endpoints...\n");

    // Test 1: Register a new user
    console.log("1. Testing Registration...");
    const registerData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    const registerResponse = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerData),
    });

    const registerResult = await registerResponse.json();
    console.log("Register Response:", JSON.stringify(registerResult, null, 2));

    if (registerResult.status === 201) {
      console.log("✅ Registration successful!\n");

      // Test 2: Login with the registered user
      console.log("2. Testing Login...");
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const loginResponse = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const loginResult = await loginResponse.json();
      console.log("Login Response:", JSON.stringify(loginResult, null, 2));

      if (loginResult.status === 200) {
        console.log("✅ Login successful!\n");

        // Test 3: Access protected route
        console.log("3. Testing Protected Route...");
        const token = loginResult.data.token;

        const profileResponse = await fetch(`${BASE_URL}/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const profileResult = await profileResponse.json();
        console.log(
          "Profile Response:",
          JSON.stringify(profileResult, null, 2)
        );

        if (profileResult.status === 200) {
          console.log("✅ Protected route access successful!\n");
        } else {
          console.log("❌ Protected route access failed!\n");
        }
      } else {
        console.log("❌ Login failed!\n");
      }
    } else {
      console.log("❌ Registration failed!\n");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
};

// Run the test
testAuth();
