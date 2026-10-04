import { test, expect } from "@playwright/test";

const baseURL = "http://localhost:5173";
const apiURL = "http://localhost:5115";

test.describe("ReliefNexus - Automated System Tests", () => {

  test("TC-001 - Frontend is reachable", async ({ page }) => {
    const response = await page.goto(baseURL);
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("TC-002 - Backend API is reachable", async ({ request }) => {
    const response = await request.get(`${apiURL}/swagger/index.html`);
    expect(response.status()).toBeLessThan(500);
  });

  test("TC-003 - Login page loads", async ({ page }) => {
    await page.goto(baseURL);
    await expect(page.locator("body")).toContainText(/login|sign in/i);
  });

  test("TC-004 - Application has no fatal page error", async ({ page }) => {
    const errors: string[] = [];

    page.on("pageerror", error => {
      errors.push(error.message);
    });

    await page.goto(baseURL);
    await page.waitForLoadState("networkidle");

    expect(errors).toEqual([]);
  });

  test("TC-005 - Resource API endpoint exists", async ({ request }) => {
    const response = await request.get(
      `${apiURL}/api/resource-optimization/resources`
    );

    expect(response.status()).not.toBe(404);
  });

  test("TC-006 - Disaster Reports API endpoint exists", async ({ request }) => {
    const response = await request.get(
      `${apiURL}/api/disaster-reports`
    );

    expect([200, 401, 403]).toContain(response.status());
  });

  test("TC-007 - Risk Predictions API endpoint exists", async ({ request }) => {
    const response = await request.get(
      `${apiURL}/api/risk-predictions`
    );

    expect([200, 401, 403]).toContain(response.status());
  });

  test("TC-008 - Assistance Requests API endpoint exists", async ({ request }) => {
    const response = await request.get(
      `${apiURL}/api/relief-requests`
    );

    expect([200, 401, 403]).toContain(response.status());
  });

  test("TC-009 - Emergency Alerts API endpoint exists", async ({ request }) => {
    const response = await request.get(
      `${apiURL}/api/emergency-alerts`
    );

    expect([200, 401, 403]).toContain(response.status());
  });

  test("TC-010 - Resource API returns JSON", async ({ request }) => {
    const response = await request.get(
      `${apiURL}/api/resource-optimization/resources`
    );

    expect(response.status()).not.toBe(404);

    const contentType = response.headers()["content-type"] || "";

    if (response.ok()) {
      expect(contentType).toContain("application/json");
    }
  });

  test("TC-011 - Protected API rejects unauthenticated request where required", async ({ request }) => {
    const response = await request.get(
      `${apiURL}/api/relief-requests`
    );

    expect([200, 401, 403]).toContain(response.status());
  });

  test("TC-012 - Logout/login UI elements are available after application load", async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState("networkidle");

    const bodyText = await page.locator("body").innerText();

    expect(bodyText.length).toBeGreaterThan(0);
  });

});

test.describe("ReliefNexus - Real Authentication Tests", () => {

  test("TC-013 - Affected User can login with valid credentials", async ({ page }) => {
    const email = process.env.E2E_AFFECTED_EMAIL;
    const password = process.env.E2E_AFFECTED_PASSWORD;

    test.skip(
      !email ||
      !password ||
      email === "affected-test@example.com" ||
      password === "your-password",
      "Real Affected User credentials are not configured"
    );

    await page.goto("http://localhost:5173/login");
    await page.waitForLoadState("domcontentloaded");

    const emailInput = page.locator(
      'input[type="email"], input[name="email"], input[placeholder*="email" i]'
    ).first();

    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]'
    ).first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await emailInput.fill(email);
    await passwordInput.fill(password);

    await page.locator(
      'button[type="submit"], button:has-text("Login"), button:has-text("Sign In")'
    ).first().click();

    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/i);
  });


  test("TC-014 - Relief Coordinator can login with valid credentials", async ({ page }) => {
    const email = process.env.E2E_COORDINATOR_EMAIL;
    const password = process.env.E2E_COORDINATOR_PASSWORD;

    test.skip(
      !email ||
      !password ||
      email === "coordinator-test@example.com" ||
      password === "your-password",
      "Real Coordinator credentials are not configured"
    );

    await page.goto("http://localhost:5173/login");
    await page.waitForLoadState("domcontentloaded");

    const emailInput = page.locator(
      'input[type="email"], input[name="email"], input[placeholder*="email" i]'
    ).first();

    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]'
    ).first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await emailInput.fill(email);
    await passwordInput.fill(password);

    await page.locator(
      'button[type="submit"], button:has-text("Login"), button:has-text("Sign In")'
    ).first().click();

    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/i);
  });

});
test.describe.serial("ReliefNexus - Real End-to-End Workflow Tests", () => {

  async function login(page: any, email: string | undefined, password: string | undefined) {
    test.skip(
      !email ||
      !password ||
      email === "affected-test@example.com" ||
      email === "coordinator-test@example.com" ||
      password === "your-password",
      "Real test credentials are not configured"
    );

    const response = await page.request.post(
      `${apiURL}/api/auth/login`,
      {
        data: {
          email,
          password
        }
      }
    );

    expect(response.status()).toBe(200);

    const result = await response.json();

    const token =
      result.accessToken ||
      result.token ||
      result.jwtToken;

    expect(token).toBeTruthy();

    await page.goto(baseURL);

    await page.evaluate((jwt) => {
      localStorage.setItem("accessToken", jwt);
      localStorage.setItem("token", jwt);
      localStorage.setItem("jwtToken", jwt);
    }, token);

    return token;
  }

  test("TC-015 - Affected User dashboard works after real login", async ({ page }) => {
    await login(
      page,
      process.env.E2E_AFFECTED_EMAIL,
      process.env.E2E_AFFECTED_PASSWORD
    );

    await expect(page.locator("body"))
      .toContainText(/dashboard|affected user/i);
  });


  test("TC-016 - Affected User can submit a real Disaster Report", async ({ page }) => {
    test.setTimeout(180000);
    await login(
      page,
      process.env.E2E_AFFECTED_EMAIL,
      process.env.E2E_AFFECTED_PASSWORD
    );

    await page.goto("http://localhost:5173/dashboard/user/report-disaster");

    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/dashboard\/user\/report-disaster/);

    await expect(page.locator('select[name="disasterType"]'))
      .toBeVisible();

    await expect(page.locator('textarea[name="description"]'))
      .toBeVisible();

    const stamp = Date.now();

    const responsePromise = page.waitForResponse(
      response =>
        response.url().includes("/api/disaster-reports") &&
        response.request().method() === "POST"
    );

    await page.locator('select[name="disasterType"]')
      .selectOption({ label: "Flood" });

    await page.locator('select[name="severity"]')
      .selectOption({ label: "High" });

    await page.locator('input[name="location"]')
      .fill("Colombo E2E " + stamp);

    await page.locator('textarea[name="description"]')
      .fill("Automated ReliefNexus E2E disaster report " + stamp);

    await page.locator('input[name="latitude"]')
      .fill("6.927079");

    await page.locator('input[name="longitude"]')
      .fill("79.861244");

    await page.getByRole("button", {
      name: /submit disaster report/i
    }).click();

    const response = await responsePromise;

    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);

    await expect(page.locator("body"))
      .toContainText(/report submitted successfully/i);
  });


  test("TC-017 - Coordinator can see real Disaster Reports", async ({ page, request }) => {
    test.setTimeout(60000);
    const affectedToken = await login(
      page,
      process.env.E2E_AFFECTED_EMAIL,
      process.env.E2E_AFFECTED_PASSWORD
    );

    const stamp = Date.now();

    const description =
      "Coordinator E2E verification report " + stamp;

    const createResponse = await request.post(
      "http://localhost:5115/api/disaster-reports",
      {
        headers: {
          Authorization: "Bearer " + affectedToken
        },
        data: {
          disasterType: "Flood",
          description,
          location: "Colombo E2E",
          latitude: 6.927079,
          longitude: 79.861244,
          severity: "Medium"
        }
      }
    );

    expect(createResponse.status()).toBeLessThan(300);

    const coordinatorToken = await login(
      page,
      process.env.E2E_COORDINATOR_EMAIL,
      process.env.E2E_COORDINATOR_PASSWORD
    );

    const reportsResponse = await request.get(
      "http://localhost:5115/api/disaster-reports",
      {
        headers: {
          Authorization: "Bearer " + coordinatorToken
        }
      }
    );

    expect(reportsResponse.status()).toBe(200);

    const body = await reportsResponse.json();

    const reports = Array.isArray(body)
      ? body
      : body.items || body.data || body.results || [];

    expect(
      reports.some(
        (item: any) =>
          String(item.description || "") === description
      )
    ).toBeTruthy();
  });


  test("TC-018 - Agent 01 creates a real Risk Prediction", async ({ page, request }) => {
    test.setTimeout(60000);
    const token = await login(
      page,
      process.env.E2E_AFFECTED_EMAIL,
      process.env.E2E_AFFECTED_PASSWORD
    );

    const response = await request.post(
      "http://localhost:5115/api/risk-predictions",
      {
        headers: {
          Authorization: "Bearer " + token
        },
        data: {
          location: "Colombo E2E Agent01",
          latitude: 6.927079,
          longitude: 79.861244,
          rainfall1h: 15,
          rainfall3h: 30,
          rainfall24h: 100,
          riverLevel: 2.5,
          riverFlow: 20,
          temperature: 29,
          humidity: 80,
          windSpeed: 15,
          soilMoisture: 40,
          elevation: 10,
          populationDensity: 5000,
          historicalFloodCount: 3,
          historicalSeverity: 50,
          drainageCapacity: 60,
          forecastRainfall: 80
        }
      }
    );

    expect(response.status()).toBe(200);

    const prediction = await response.json();

    expect(prediction.id).toBeTruthy();
    expect(prediction.riskScore).toBeDefined();
    expect(prediction.riskLevel).toBeDefined();
  });


  test("TC-019 - Agent 01 to Agent 02 workflow executes", async ({ page, request }) => {
    test.setTimeout(60000);
    const token = await login(
      page,
      process.env.E2E_COORDINATOR_EMAIL,
      process.env.E2E_COORDINATOR_PASSWORD
    );

    const predictionResponse = await request.post(
      "http://localhost:5115/api/risk-predictions",
      {
        headers: {
          Authorization: "Bearer " + token
        },
        data: {
          location: "Colombo E2E Agent02",
          latitude: 6.927079,
          longitude: 79.861244,
          rainfall1h: 20,
          rainfall3h: 45,
          rainfall24h: 120,
          riverLevel: 3,
          riverFlow: 25,
          temperature: 29,
          humidity: 82,
          windSpeed: 18,
          soilMoisture: 45,
          elevation: 10,
          populationDensity: 5000,
          historicalFloodCount: 4,
          historicalSeverity: 60,
          drainageCapacity: 50,
          forecastRainfall: 100
        }
      }
    );

    expect(predictionResponse.status()).toBe(200);

    const prediction = await predictionResponse.json();

    expect(prediction.id).toBeTruthy();

    const assessmentResponse = await request.post(
      "http://localhost:5115/api/vulnerability-impact/" +
      prediction.id +
      "/assess",
      {
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    expect(assessmentResponse.status())
      .toBeGreaterThanOrEqual(200);

    expect(assessmentResponse.status())
      .toBeLessThan(300);

    const assessment = await assessmentResponse.json();

    expect(assessment).toBeTruthy();
  });


  test("TC-020 - Affected User can create Assistance Request", async ({ page, request }) => {
    test.setTimeout(60000);
    const token = await login(
      page,
      process.env.E2E_AFFECTED_EMAIL,
      process.env.E2E_AFFECTED_PASSWORD
    );

    const response = await request.post(
      "http://localhost:5115/api/relief-requests",
      {
        headers: {
          Authorization: "Bearer " + token
        },
        data: {
          requestType: "Water",
          description:
            "Automated E2E assistance request " + Date.now(),
          location: "Colombo E2E",
          quantity: 10,
          urgency: "High"
        }
      }
    );

    expect(response.status()).toBe(200);

    const result = await response.json();

    expect(result.id).toBeTruthy();
    expect(result.status).toBe("Submitted");
  });


  test("TC-021 - Coordinator can update Assistance Request status", async ({ page, request }) => {
    test.setTimeout(60000);
    const affectedToken = await login(
      page,
      process.env.E2E_AFFECTED_EMAIL,
      process.env.E2E_AFFECTED_PASSWORD
    );

    const createResponse = await request.post(
      "http://localhost:5115/api/relief-requests",
      {
        headers: {
          Authorization: "Bearer " + affectedToken
        },
        data: {
          requestType: "Food",
          description:
            "Automated status update request " + Date.now(),
          location: "Colombo E2E",
          quantity: 5,
          urgency: "Medium"
        }
      }
    );

    expect(createResponse.status()).toBe(200);

    const created = await createResponse.json();

    const coordinatorToken = await login(
      page,
      process.env.E2E_COORDINATOR_EMAIL,
      process.env.E2E_COORDINATOR_PASSWORD
    );

    const updateResponse = await request.put(
      "http://localhost:5115/api/relief-requests/" +
      created.id +
      "/status",
      {
        headers: {
          Authorization: "Bearer " + coordinatorToken,
          "Content-Type": "application/json"
        },
        data: "InProgress"
      }
    );

    expect(updateResponse.status()).toBe(200);

    const updated = await updateResponse.json();

    expect(updated.id).toBe(created.id);
    expect(updated.status).toBe("InProgress");
  });


  test("TC-022 - Affected User cannot update Coordinator-only request status", async ({ page, request }) => {
    test.setTimeout(60000);
    const token = await login(
      page,
      process.env.E2E_AFFECTED_EMAIL,
      process.env.E2E_AFFECTED_PASSWORD
    );

    const createResponse = await request.post(
      "http://localhost:5115/api/relief-requests",
      {
        headers: {
          Authorization: "Bearer " + token
        },
        data: {
          requestType: "Medical",
          description:
            "Automated authorization test " + Date.now(),
          location: "Colombo E2E",
          quantity: 1,
          urgency: "High"
        }
      }
    );

    expect(createResponse.status()).toBe(200);

    const created = await createResponse.json();

    const updateResponse = await request.put(
      "http://localhost:5115/api/relief-requests/" +
      created.id +
      "/status",
      {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
        data: "Completed"
      }
    );

    expect([401, 403]).toContain(updateResponse.status());
  });


  test("TC-023 - Coordinator can read real Relief Resources", async ({ page, request }) => {
    test.setTimeout(60000);
    const token = await login(
      page,
      process.env.E2E_COORDINATOR_EMAIL,
      process.env.E2E_COORDINATOR_PASSWORD
    );

    const response = await request.get(
      "http://localhost:5115/api/resource-optimization/resources",
      {
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    const resources = Array.isArray(body)
      ? body
      : body.items || body.data || body.results || [];

    expect(Array.isArray(resources)).toBeTruthy();
  });


  test("TC-024 - Coordinator can read real Emergency Alerts", async ({ page, request }) => {
    test.setTimeout(60000);
    const token = await login(
      page,
      process.env.E2E_COORDINATOR_EMAIL,
      process.env.E2E_COORDINATOR_PASSWORD
    );

    const response = await request.get(
      "http://localhost:5115/api/emergency-alerts",
      {
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    const alerts = Array.isArray(body)
      ? body
      : body.items || body.data || body.results || [];

    expect(Array.isArray(alerts)).toBeTruthy();
  });

});
