#!/usr/bin/env node

const axios = require('axios');

async function testLegacyAPI() {
  const url = 'http://octopi.local.frostbyte.us:8080/api/printer/printhead';

  const testRequest = {
    jog: {
      command: 'jog',
      z: 0.5  // Move Z up 0.5mm
    }
  };

  console.log('Testing legacy API endpoint:', url);
  console.log('Request body:', JSON.stringify(testRequest, null, 2));

  try {
    const response = await axios.post(url, testRequest, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log('❌ Request timed out after 10s');
    } else if (error.response) {
      console.log('❌ Error response:');
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testLegacyAPI();
