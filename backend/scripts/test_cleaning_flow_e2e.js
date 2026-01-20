
// Native fetch is available in Node 18+

const BASE_URL = 'http://localhost:7001/api/v1';

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m"
};

function log(msg, color = colors.reset) {
    console.log(`${color}${msg}${colors.reset}`);
}

async function api(method, endpoint, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${endpoint}`, opts);
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }

    if (!res.ok) {
        log(`API Error [${method} ${endpoint}]: ${res.status}`, colors.red);
        log(`Response: ${typeof data === 'object' ? JSON.stringify(data) : data}`, colors.red);
    }

    return { status: res.status, data };
}

async function runTest() {
    log("🚀 Starting E2E Test for Cleaning Service Flow...", colors.cyan);

    // 1. Admin Login
    log("\n1️⃣  Admin Login...", colors.blue);
    let adminToken;
    try {
        const res = await api('POST', '/auth/login', {
            email: 'scrapto@scrapto.com',
            password: 'scrapto@123'
        });
        if (!res.data.success) throw new Error(res.data.message);
        adminToken = res.data.data.token;
        log("✅ Admin Logged in successfully", colors.green);
    } catch (err) {
        log(`❌ Admin Login Failed: ${err.message}`, colors.red);
        process.exit(1);
    }

    // 2. Setup Service Price (Admin)
    log("\n2️⃣  Setting up 'Deep Home Cleaning' Service Price...", colors.blue);
    try {
        const res = await api('POST', '/admin/prices', {
            type: 'service',
            category: 'Deep Home Cleaning',
            price: 1200,
            regionCode: 'IN-DL',
            effectiveDate: new Date().toISOString()
        }, adminToken);

        if (res.data.success) {
            log("✅ Service Price configured", colors.green);
        } else {
            log(`⚠️  Price setup note: ${res.data.message}`, colors.yellow);
        }
    } catch (err) {
        log(`❌ Price Setup Failed: ${err.message}`, colors.red);
    }

    // 3. User Setup (Signup/Login)
    log("\n3️⃣  User Login (9876543210)...", colors.blue);
    let userToken;
    const userPhone = "9876543210";
    try {
        // Try register first
        const regRes = await api('POST', '/auth/register', {
            name: "Test User",
            email: `testuser_${Date.now()}@example.com`,
            phone: userPhone,
            password: "password123",
            role: "user"
        });
        log(`   Register response: ${regRes.status} ${JSON.stringify(regRes.data)}`, colors.cyan);

        // Login OTP
        await api('POST', '/auth/login-otp', { phone: userPhone, role: 'user' });

        // Verify OTP
        const res = await api('POST', '/auth/verify-otp', {
            phone: userPhone,
            otp: '123456',
            role: 'user'
        });

        if (!res.data.success) throw new Error(res.data.message);
        userToken = res.data.data.token;
        log("✅ User Logged in", colors.green);
        log(`   Token Length: ${userToken ? userToken.length : 'null'}`, colors.cyan);
    } catch (err) {
        log(`❌ User Login Failed: ${err.message}`, colors.red);
        process.exit(1);
    }

    // 4. Scrapper Setup
    log("\n4️⃣  Scrapper Login (8888888888)...", colors.blue);
    let scrapperToken;
    let scrapperId;
    const scrapperPhone = "8888888888";
    try {
        // Try register
        const regRes = await api('POST', '/auth/register', {
            name: "Test Scrapper",
            email: `testscrapper_${Date.now()}@example.com`,
            phone: scrapperPhone,
            password: "password123",
            role: "scrapper"
        });
        log(`   Register response: ${regRes.status} ${JSON.stringify(regRes.data)}`, colors.cyan);

        // Login OTP
        await api('POST', '/auth/login-otp', { phone: scrapperPhone, role: 'scrapper' });

        // Verify OTP
        const res = await api('POST', '/auth/verify-otp', {
            phone: scrapperPhone,
            otp: '123456',
            role: 'scrapper'
        });

        if (!res.data.success) throw new Error(res.data.message);

        scrapperToken = res.data.data.token;
        scrapperId = res.data.data.user._id;

        log("✅ Scrapper Logged in", colors.green);
    } catch (err) {
        log(`❌ Scrapper Login Failed: ${err.message}`, colors.red);
        process.exit(1);
    }

    // 5. Create Order (User)
    log("\n5️⃣  Creating Cleaning Order...", colors.blue);
    let orderId;
    try {
        const res = await api('POST', '/orders', {
            orderType: 'cleaning_service',
            serviceDetails: {
                serviceType: 'Deep Home Cleaning',
                description: '3BHK Cleaning Required'
            },
            serviceFee: 1200,
            pickupAddress: {
                street: "123 Test St",
                city: "Delhi",
                state: "Delhi",
                pincode: "110001",
                coordinates: { lat: 28.7041, lng: 77.1025 }
            },
            pickupSlot: {
                dayName: "Today",
                date: "2025-01-01",
                slot: "10:00 AM - 12:00 PM",
                timestamp: Date.now()
            }
        }, userToken);

        if (!res.data.success) throw new Error(res.data.message);
        const order = res.data.data.order;
        orderId = order._id;
        log(`✅ Order Created: ${order._id}`, colors.green);
        log(`   Type: ${order.orderType}`, colors.cyan);
        log(`   Fee: ${order.totalAmount}`, colors.cyan);

        if (order.totalAmount !== 1200) {
            log("❌ Error: Total amount mismatch!", colors.red);
        }
    } catch (err) {
        log(`❌ Order Creation Failed: ${err.message}`, colors.red);
        process.exit(1);
    }

    // 6. Scrapper: Get Available and Accept
    log("\n6️⃣  Scrapper Accepting Order...", colors.blue);
    try {
        // Check available
        const availRes = await api('GET', '/orders/available', null, scrapperToken);
        const found = availRes.data.data.orders.find(o => o._id === orderId);

        if (!found) {
            log("⚠️  Order not in 'available' list (might be logic or pagination). Attempting direct accept...", colors.yellow);
        } else {
            log("✅ Order found in available list", colors.green);
        }

        // Accept
        const acceptRes = await api('POST', `/orders/${orderId}/accept`, {}, scrapperToken);
        if (!acceptRes.data.success) throw new Error(acceptRes.data.message);

        log("✅ Order Accepted", colors.green);
        // Note: Response order schema might differ
        const acceptedOrder = acceptRes.data.data.order;
        if (acceptedOrder.status !== 'confirmed') {
            log(`❌ Status mismatch: expected confirmed, got ${acceptedOrder.status}`, colors.red);
        }
    } catch (err) {
        log(`❌ Scrapper Accept Failed: ${err.message}`, colors.red);
        process.exit(1);
    }

    // 7. Scrapper: Update Status to In Progress
    log("\n7️⃣  Scrapper Starting Service (In Progress)...", colors.blue);
    try {
        const res = await api('PUT', `/orders/${orderId}/status`, {
            status: 'in_progress'
        }, scrapperToken);

        if (!res.data.success) throw new Error(res.data.message);
        log("✅ Status updated to in_progress", colors.green);
    } catch (err) {
        log(`❌ Update Status Failed: ${err.message}`, colors.red);
    }

    // 8. Complete Order & Payment
    log("\n8️⃣  Completing Order & Payment...", colors.blue);
    try {
        const res = await api('PUT', `/orders/${orderId}/status`, {
            status: 'completed',
            paymentStatus: 'completed'
        }, scrapperToken);

        if (!res.data.success) throw new Error(res.data.message);

        const finalOrder = res.data.data.order;
        log("✅ Order Completed", colors.green);
        log(`   Status: ${finalOrder.status}`, colors.cyan);
        log(`   Payment Status: ${finalOrder.paymentStatus}`, colors.cyan);

        if (finalOrder.status === 'completed' && finalOrder.paymentStatus === 'completed') {
            log("\n✨ SUCCESS: End-to-End Flow Verified! ✨", colors.magenta);
        } else {
            log("\n❌ FAILURE: Final statuses incorrect", colors.red);
        }

    } catch (err) {
        log(`❌ Completion Failed: ${err.message}`, colors.red);
    }

}

runTest();
