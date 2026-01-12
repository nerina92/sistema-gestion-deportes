const fetch = require('node-fetch');

async function test() {
  // Login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@deporteslaboulaye.com', password: 'Admin123!' })
  });
  
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Cookie:', cookie ? 'OK' : 'FAIL');
  
  // Get products
  const prodsRes = await fetch('http://localhost:3000/api/products?page=1&pageSize=1', {
    headers: { Cookie: cookie }
  });
  
  const data = await prodsRes.json();
  console.log('Response keys:', Object.keys(data));
  console.log('Products count:', data.products?.length);
}

test();
