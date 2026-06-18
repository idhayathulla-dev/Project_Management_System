const BASE_URL = 'http://localhost:5000';

async function runTests() {
  const results = [];

  function logResult(endpoint, method, expectedStatus, actualStatus, outcome, details = '') {
    results.push({
      endpoint,
      method,
      expectedStatus,
      actualStatus,
      outcome: outcome ? 'PASS ✅' : 'FAIL ❌',
      details
    });
    console.log(`[${outcome ? 'PASS' : 'FAIL'}] ${method} ${endpoint} - Expected: ${expectedStatus}, Actual: ${actualStatus} ${details}`);
  }

  // Generate unique emails to prevent conflict with existing db records
  const time = Date.now();
  const emailA = `a_${time}@test.com`;
  const emailB = `b_${time}@test.com`;
  const password = 'Password123!';

  let cookieA = '';
  let cookieB = '';
  let userA_project_id = '';
  let userA_task_id = '';

  console.log('--- STARTING BACKEND SECURITY AND ENDPOINT TEST ---');

  // --- USER A FLOW ---
  // 1. Auth: Register User A
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'User A', email: emailA, password })
    });
    const data = await res.json();
    logResult('/api/auth/register', 'POST', 201, res.status, res.status === 201, `Email: ${emailA}`);
  } catch (err) {
    logResult('/api/auth/register', 'POST', 201, 'ERROR', false, err.message);
  }

  // 2. Auth: Login User A
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password })
    });
    cookieA = res.headers.get('set-cookie') || '';
    logResult('/api/auth/login', 'POST', 200, res.status, res.status === 200, `Cookie retrieved: ${cookieA ? 'Yes' : 'No'}`);
  } catch (err) {
    logResult('/api/auth/login', 'POST', 200, 'ERROR', false, err.message);
  }

  // 3. Auth: Verify /api/auth/me
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: { 'Cookie': cookieA }
    });
    const data = await res.json();
    logResult('/api/auth/me', 'GET', 200, res.status, res.status === 200 && data.success === true);
  } catch (err) {
    logResult('/api/auth/me', 'GET', 200, 'ERROR', false, err.message);
  }

  // 4. Project: Create Project (User A)
  try {
    const res = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookieA
      },
      body: JSON.stringify({
        projectName: 'User A Project',
        description: 'Project created by User A',
        startDate: '2026-06-18T00:00:00.000Z',
        endDate: '2026-06-25T00:00:00.000Z',
        status: 'IN_PROGRESS'
      })
    });
    const data = await res.json();
    userA_project_id = data.data?.project?.id || '';
    logResult('/api/projects', 'POST', 201, res.status, res.status === 201 && userA_project_id !== '', `Project ID: ${userA_project_id}`);
  } catch (err) {
    logResult('/api/projects', 'POST', 201, 'ERROR', false, err.message);
  }

  // 5. Project: Get List (User A)
  try {
    const res = await fetch(`${BASE_URL}/api/projects`, {
      method: 'GET',
      headers: { 'Cookie': cookieA }
    });
    const data = await res.json();
    logResult('/api/projects', 'GET', 200, res.status, res.status === 200 && data.data?.projects?.length > 0);
  } catch (err) {
    logResult('/api/projects', 'GET', 200, 'ERROR', false, err.message);
  }

  // 6. Validation Test: 400 Bad Request (Project creation invalid dates)
  try {
    const res = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookieA
      },
      body: JSON.stringify({
        projectName: '', // Empty name (should trigger validation error)
        description: 'Bad Project',
        startDate: '2026-06-25T00:00:00.000Z',
        endDate: '2026-06-18T00:00:00.000Z', // End date before start date
        status: 'INVALID_STATUS' // Invalid status
      })
    });
    const data = await res.json();
    logResult('/api/projects (Validation)', 'POST', 400, res.status, res.status === 400, `Message: ${data.message || JSON.stringify(data.errors)}`);
  } catch (err) {
    logResult('/api/projects (Validation)', 'POST', 400, 'ERROR', false, err.message);
  }

  // 7. Task: Create Task under User A's project
  try {
    const res = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookieA
      },
      body: JSON.stringify({
        taskName: 'User A Task',
        description: 'Task created by User A',
        dueDate: '2026-06-24T00:00:00.000Z',
        priority: 'HIGH',
        status: 'PENDING',
        projectId: userA_project_id
      })
    });
    const data = await res.json();
    userA_task_id = data.data?.task?.id || '';
    logResult('/api/tasks', 'POST', 201, res.status, res.status === 201 && userA_task_id !== '', `Task ID: ${userA_task_id}`);
  } catch (err) {
    logResult('/api/tasks', 'POST', 201, 'ERROR', false, err.message);
  }

  // 8. Stats: Verify /api/stats Dashboard Endpoints
  try {
    const res = await fetch(`${BASE_URL}/api/stats`, {
      method: 'GET',
      headers: { 'Cookie': cookieA }
    });
    const data = await res.json();
    logResult('/api/stats', 'GET', 200, res.status, res.status === 200 && data.success === true, `Total Projects: ${data.data?.totalProjects}`);
  } catch (err) {
    logResult('/api/stats', 'GET', 200, 'ERROR', false, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/stats/project-status`, {
      method: 'GET',
      headers: { 'Cookie': cookieA }
    });
    const data = await res.json();
    logResult('/api/stats/project-status', 'GET', 200, res.status, res.status === 200 && typeof data.inProgress === 'number');
  } catch (err) {
    logResult('/api/stats/project-status', 'GET', 200, 'ERROR', false, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/stats/task-status`, {
      method: 'GET',
      headers: { 'Cookie': cookieA }
    });
    const data = await res.json();
    logResult('/api/stats/task-status', 'GET', 200, res.status, res.status === 200 && typeof data.pending === 'number');
  } catch (err) {
    logResult('/api/stats/task-status', 'GET', 200, 'ERROR', false, err.message);
  }

  // 9. Auth: Logout User A
  try {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Cookie': cookieA }
    });
    logResult('/api/auth/logout', 'POST', 200, res.status, res.status === 200);
  } catch (err) {
    logResult('/api/auth/logout', 'POST', 200, 'ERROR', false, err.message);
  }

  // 10. Auth/Security: 401 Unauthorized Test (Access /api/projects without session)
  try {
    const res = await fetch(`${BASE_URL}/api/projects`, {
      method: 'GET'
    });
    logResult('/api/projects (No Session)', 'GET', 401, res.status, res.status === 401);
  } catch (err) {
    logResult('/api/projects (No Session)', 'GET', 401, 'ERROR', false, err.message);
  }

  // --- USER B FLOW ---
  // 11. Auth: Register User B
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'User B', email: emailB, password })
    });
    logResult('/api/auth/register (User B)', 'POST', 201, res.status, res.status === 201, `Email: ${emailB}`);
  } catch (err) {
    logResult('/api/auth/register (User B)', 'POST', 201, 'ERROR', false, err.message);
  }

  // 12. Auth: Login User B
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailB, password })
    });
    cookieB = res.headers.get('set-cookie') || '';
    logResult('/api/auth/login (User B)', 'POST', 200, res.status, res.status === 200);
  } catch (err) {
    logResult('/api/auth/login (User B)', 'POST', 200, 'ERROR', false, err.message);
  }

  // 13. Security/Authorization: 403 Forbidden (User B tries to read User A's project)
  try {
    const res = await fetch(`${BASE_URL}/api/projects/${userA_project_id}`, {
      method: 'GET',
      headers: { 'Cookie': cookieB }
    });
    const data = await res.json();
    logResult(`/api/projects/${userA_project_id} (Cross-user)`, 'GET', 403, res.status, res.status === 403, `Message: ${data.message}`);
  } catch (err) {
    logResult(`/api/projects/${userA_project_id} (Cross-user)`, 'GET', 403, 'ERROR', false, err.message);
  }

  // 14. Security/Authorization: 403 Forbidden (User B tries to update User A's project)
  try {
    const res = await fetch(`${BASE_URL}/api/projects/${userA_project_id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookieB 
      },
      body: JSON.stringify({
        projectName: 'Hacked Project Name',
        status: 'COMPLETED'
      })
    });
    const data = await res.json();
    logResult(`/api/projects/${userA_project_id} (Cross-user update)`, 'PUT', 403, res.status, res.status === 403, `Message: ${data.message}`);
  } catch (err) {
    logResult(`/api/projects/${userA_project_id} (Cross-user update)`, 'PUT', 403, 'ERROR', false, err.message);
  }

  // 15. Security/Authorization: 403 Forbidden (User B tries to read User A's task)
  try {
    const res = await fetch(`${BASE_URL}/api/tasks/${userA_task_id}`, {
      method: 'GET',
      headers: { 'Cookie': cookieB }
    });
    const data = await res.json();
    logResult(`/api/tasks/${userA_task_id} (Cross-user)`, 'GET', 403, res.status, res.status === 403, `Message: ${data.message}`);
  } catch (err) {
    logResult(`/api/tasks/${userA_task_id} (Cross-user)`, 'GET', 403, 'ERROR', false, err.message);
  }

  // 16. Security/Authorization: 403 Forbidden (User B tries to delete User A's task)
  try {
    const res = await fetch(`${BASE_URL}/api/tasks/${userA_task_id}`, {
      method: 'DELETE',
      headers: { 'Cookie': cookieB }
    });
    const data = await res.json();
    logResult(`/api/tasks/${userA_task_id} (Cross-user delete)`, 'DELETE', 403, res.status, res.status === 403, `Message: ${data.message}`);
  } catch (err) {
    logResult(`/api/tasks/${userA_task_id} (Cross-user delete)`, 'DELETE', 403, 'ERROR', false, err.message);
  }

  // 17. Routing/Resource: 404 Not Found (Get project with valid UUID but non-existent ID)
  const nonExistentId = '00000000-0000-0000-0000-000000000000';
  try {
    const res = await fetch(`${BASE_URL}/api/projects/${nonExistentId}`, {
      method: 'GET',
      headers: { 'Cookie': cookieB }
    });
    const data = await res.json();
    logResult(`/api/projects/${nonExistentId} (Not Found)`, 'GET', 404, res.status, res.status === 404, `Message: ${data.message}`);
  } catch (err) {
    logResult(`/api/projects/${nonExistentId} (Not Found)`, 'GET', 404, 'ERROR', false, err.message);
  }

  // 18. Cleanup: Logout User B
  try {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Cookie': cookieB }
    });
  } catch (err) {}

  console.log('\n--- VERIFICATION REPORT ---');
  let table = '| Endpoint | Method | Expected Status | Actual Status | Result |\n';
  table += '| --- | --- | --- | --- | --- |\n';
  for (const r of results) {
    table += `| \`${r.endpoint}\` | **${r.method}** | \`${r.expectedStatus}\` | \`${r.actualStatus}\` | ${r.outcome} |\n`;
  }
  console.log(table);
}

runTests();
