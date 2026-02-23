const axios = require('axios');

async function debugDashboard() {
    try {
        console.log('Debugging dashboard API...');
        
        // First, let's login to get a valid token
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'admin@example.com', // Replace with actual credentials
            password: 'password123'        // Replace with actual password
        });
        
        console.log('Login successful');
        const token = loginResponse.data.token;
        
        // Now call the dashboard API
        const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/summary', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Dashboard API Response:');
        console.log(JSON.stringify(dashboardResponse.data, null, 2));
        
        // Let's also check what bills exist
        const billsResponse = await axios.get('http://localhost:5000/api/bills', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('\nBills data:');
        console.log(JSON.stringify(billsResponse.data, null, 2));
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

debugDashboard();