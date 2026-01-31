// Automated AI Testing Script
// This tests all AI functionality with your configured OpenAI API key

const SUPABASE_URL = 'https://tfnoogotbyshsznpjspk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbm9vZ290YnlzaHN6bnBqc3BrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDY2ODAsImV4cCI6MjA4MzA4MjY4MH0.RGOuBG_vrZhtrtSfhQ_ij72ctznWn0dAkQHYjT7FT_M';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

let accessToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse response: ${text}`);
  }
}

// Step 1: Authenticate
async function authenticate() {
  console.log(`\n${colors.blue}${colors.bold}Step 1: Authenticating...${colors.reset}`);

  try {
    const response = await makeRequest(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'jennifer.clinician@aimrehab.ca',
        password: 'Demo2026!Clinician'
      })
    });

    if (response.access_token) {
      accessToken = response.access_token;
      console.log(`${colors.green}✓ Authentication successful${colors.reset}`);
      console.log(`  User: ${response.user.email}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Authentication failed${colors.reset}`);
      console.log(`  Response:`, response);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Authentication error: ${error.message}${colors.reset}`);
    return false;
  }
}

// Helper to call OpenAI edge function
async function callOpenAI(messages, model = 'gpt-4o-mini', maxTokens = 1000) {
  const response = await makeRequest(`${SUPABASE_URL}/functions/v1/openai-assistant`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      messages,
      model,
      temperature: 0.7,
      max_tokens: maxTokens
    })
  });

  return response;
}

// Test 1: Basic Connectivity
async function testBasicConnectivity() {
  testResults.total++;
  console.log(`\n${colors.blue}${colors.bold}Test 1: Basic AI Connectivity${colors.reset}`);
  console.log('Testing if OpenAI API is working...');

  try {
    const result = await callOpenAI([
      { role: 'user', content: 'Say "Hello from AIM OS!" and nothing else.' }
    ]);

    if (result.choices && result.choices[0]) {
      const message = result.choices[0].message.content;
      console.log(`${colors.green}✓ SUCCESS${colors.reset}`);
      console.log(`  Response: "${message}"`);
      console.log(`  Model: ${result.model}`);
      console.log(`  Tokens used: ${result.usage.total_tokens}`);
      testResults.passed++;
      return true;
    } else {
      console.log(`${colors.red}✗ FAILED - Unexpected response format${colors.reset}`);
      testResults.failed++;
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ FAILED${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    testResults.failed++;
    return false;
  }
}

// Test 2: Schedule Optimization
async function testScheduleOptimization() {
  testResults.total++;
  console.log(`\n${colors.blue}${colors.bold}Test 2: Schedule Optimization Analysis${colors.reset}`);
  console.log('Testing AI analysis of clinic schedule...');

  try {
    const scheduleData = {
      date: '2026-02-03',
      providers: [
        { name: 'Jennifer Wong', role: 'Physiotherapist', utilization: 75 }
      ],
      appointments: [
        { patient: 'John Doe', type: 'Initial Assessment', time: '08:00-09:00' },
        { patient: 'Jane Smith', type: 'Treatment', time: '09:15-09:45' },
        { patient: 'Bob Wilson', type: 'Follow-up', time: '10:00-10:30' },
        { gap: 'Lunch break', time: '12:00-14:00' },
        { patient: 'Alice Johnson', type: 'Re-assessment', time: '14:00-15:00' }
      ]
    };

    const result = await callOpenAI([
      {
        role: 'system',
        content: 'You are an expert in healthcare scheduling optimization. Provide 3 specific recommendations.'
      },
      {
        role: 'user',
        content: `Analyze this clinic schedule and provide optimization recommendations:\n\n${JSON.stringify(scheduleData, null, 2)}`
      }
    ]);

    if (result.choices && result.choices[0]) {
      const analysis = result.choices[0].message.content;
      console.log(`${colors.green}✓ SUCCESS${colors.reset}`);
      console.log(`\n${colors.cyan}AI Analysis:${colors.reset}`);
      console.log(analysis.split('\n').map(line => `  ${line}`).join('\n'));
      console.log(`\n  Tokens used: ${result.usage.total_tokens}`);
      testResults.passed++;
      return true;
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset}`);
      testResults.failed++;
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ FAILED${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    testResults.failed++;
    return false;
  }
}

// Test 3: Scheduling Recommendations
async function testSchedulingRecommendations() {
  testResults.total++;
  console.log(`\n${colors.blue}${colors.bold}Test 3: Scheduling Recommendations${colors.reset}`);
  console.log('Testing AI recommendations for schedule improvements...');

  try {
    const data = {
      issues: {
        gaps: ['2-hour gap between 11:00-13:00 for Jennifer Wong'],
        underutilized: ['Sarah Mitchell: 3.5 hours booked, target 7 hours'],
        overbooked: ['14:00 slot has 5 appointments']
      }
    };

    const result = await callOpenAI([
      {
        role: 'system',
        content: 'You are a healthcare scheduling expert. Provide specific, actionable recommendations.'
      },
      {
        role: 'user',
        content: `Based on these scheduling issues, provide 3 prioritized recommendations:\n\n${JSON.stringify(data, null, 2)}`
      }
    ]);

    if (result.choices && result.choices[0]) {
      const recommendations = result.choices[0].message.content;
      console.log(`${colors.green}✓ SUCCESS${colors.reset}`);
      console.log(`\n${colors.cyan}AI Recommendations:${colors.reset}`);
      console.log(recommendations.split('\n').map(line => `  ${line}`).join('\n'));
      console.log(`\n  Tokens used: ${result.usage.total_tokens}`);
      testResults.passed++;
      return true;
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset}`);
      testResults.failed++;
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ FAILED${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    testResults.failed++;
    return false;
  }
}

// Test 4: Financial Analysis
async function testFinancialAnalysis() {
  testResults.total++;
  console.log(`\n${colors.blue}${colors.bold}Test 4: Financial Data Analysis${colors.reset}`);
  console.log('Testing AI analysis of financial metrics...');

  try {
    const financialData = {
      revenue: { current: 125000, previous: 118000, target: 135000 },
      collections: { rate: 92, aging30: 15000, aging60: 8000 },
      appointments: { completed: 450, cancelled: 23, noShow: 12 }
    };

    const result = await callOpenAI([
      {
        role: 'user',
        content: `Analyze this financial data and provide 3 key insights:\n\n${JSON.stringify(financialData, null, 2)}`
      }
    ]);

    if (result.choices && result.choices[0]) {
      const analysis = result.choices[0].message.content;
      console.log(`${colors.green}✓ SUCCESS${colors.reset}`);
      console.log(`\n${colors.cyan}AI Financial Insights:${colors.reset}`);
      console.log(analysis.split('\n').map(line => `  ${line}`).join('\n'));
      console.log(`\n  Tokens used: ${result.usage.total_tokens}`);
      testResults.passed++;
      return true;
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset}`);
      testResults.failed++;
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ FAILED${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    testResults.failed++;
    return false;
  }
}

// Test 5: Operational Metrics
async function testOperationalMetrics() {
  testResults.total++;
  console.log(`\n${colors.blue}${colors.bold}Test 5: Operational Metrics Analysis${colors.reset}`);
  console.log('Testing AI analysis of operational performance...');

  try {
    const metricsData = {
      utilization: { current: 78, target: 85, trend: 'increasing' },
      waitTime: { avg: 12, max: 35, target: 15 },
      satisfaction: { score: 4.6, responses: 234 },
      productivity: { treatments_per_day: 8.2, target: 9.0 }
    };

    const result = await callOpenAI([
      {
        role: 'user',
        content: `Analyze these operational metrics and identify 3 improvement opportunities:\n\n${JSON.stringify(metricsData, null, 2)}`
      }
    ]);

    if (result.choices && result.choices[0]) {
      const analysis = result.choices[0].message.content;
      console.log(`${colors.green}✓ SUCCESS${colors.reset}`);
      console.log(`\n${colors.cyan}AI Operational Insights:${colors.reset}`);
      console.log(analysis.split('\n').map(line => `  ${line}`).join('\n'));
      console.log(`\n  Tokens used: ${result.usage.total_tokens}`);
      testResults.passed++;
      return true;
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset}`);
      testResults.failed++;
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ FAILED${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    testResults.failed++;
    return false;
  }
}

// Print final results
function printResults() {
  console.log(`\n\n${colors.bold}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  TEST RESULTS SUMMARY${colors.reset}`);
  console.log(`${colors.bold}${'='.repeat(60)}${colors.reset}\n`);

  console.log(`  Total Tests: ${testResults.total}`);
  console.log(`  ${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${testResults.failed}${colors.reset}`);

  const successRate = Math.round((testResults.passed / testResults.total) * 100);
  console.log(`  Success Rate: ${successRate}%`);

  if (testResults.failed === 0) {
    console.log(`\n  ${colors.green}${colors.bold}✓ ALL TESTS PASSED!${colors.reset}`);
    console.log(`\n  ${colors.cyan}Your AI features are working perfectly!${colors.reset}`);
    console.log(`  The OpenAI integration is fully functional.`);
    console.log(`\n  Next Steps:`);
    console.log(`  1. Start using AI insights in the scheduler`);
    console.log(`  2. Click the "Get AI Insights" button in AIM OS → Scheduler`);
    console.log(`  3. Review AI recommendations for your schedules`);
  } else {
    console.log(`\n  ${colors.red}${colors.bold}✗ SOME TESTS FAILED${colors.reset}`);
    console.log(`\n  Please check:`);
    console.log(`  1. OpenAI API key is correctly set in Supabase`);
    console.log(`  2. OpenAI account has sufficient credits`);
    console.log(`  3. Edge function is deployed and running`);
  }

  console.log(`\n${colors.bold}${'='.repeat(60)}${colors.reset}\n`);
}

// Main execution
async function runAllTests() {
  console.log(`\n${colors.bold}${colors.cyan}`);
  console.log(`╔════════════════════════════════════════════════════════╗`);
  console.log(`║                                                        ║`);
  console.log(`║           🧠 AI FUNCTIONALITY TEST SUITE 🧠            ║`);
  console.log(`║                                                        ║`);
  console.log(`║              Testing OpenAI Integration               ║`);
  console.log(`║                                                        ║`);
  console.log(`╚════════════════════════════════════════════════════════╝`);
  console.log(colors.reset);

  // Authenticate
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log(`\n${colors.red}${colors.bold}Cannot proceed without authentication${colors.reset}\n`);
    process.exit(1);
  }

  // Run all tests
  await testBasicConnectivity();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay between tests

  await testScheduleOptimization();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testSchedulingRecommendations();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testFinancialAnalysis();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testOperationalMetrics();

  // Print results
  printResults();
}

// Run the tests
runAllTests().catch(error => {
  console.error(`\n${colors.red}${colors.bold}Unexpected error:${colors.reset}`, error);
  process.exit(1);
});
