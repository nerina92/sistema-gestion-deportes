#!/usr/bin/env node

/**
 * Script de prueba para la autenticación
 * Prueba las funciones de login, verificación de token y logout
 */

const BASE_URL = 'http://localhost:3000';

async function testAuth() {
  console.log('🧪 Iniciando pruebas de autenticación...\n');

  try {
    // 1. Probar login con credenciales correctas
    console.log('1️⃣ Probando login con credenciales correctas...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@deporteslaboulaye.com',
        password: 'Admin123!',
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Status:', loginResponse.status);
    console.log('Response:', loginData);

    if (loginResponse.ok) {
      console.log('✅ Login exitoso');
      
      // Extraer cookies del header
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('Cookies:', cookies);
    } else {
      console.log('❌ Login falló');
    }

    console.log('\n---\n');

    // 2. Probar login con credenciales incorrectas
    console.log('2️⃣ Probando login con credenciales incorrectas...');
    const badLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@deporteslaboulaye.com',
        password: 'WrongPassword',
      }),
    });

    const badLoginData = await badLoginResponse.json();
    console.log('Status:', badLoginResponse.status);
    console.log('Response:', badLoginData);

    if (!badLoginResponse.ok) {
      console.log('✅ Login incorrecto rechazado correctamente');
    } else {
      console.log('❌ Login incorrecto aceptado (error!)');
    }

    console.log('\n---\n');

    // 3. Probar acceso a ruta protegida sin autenticación
    console.log('3️⃣ Probando acceso a dashboard sin autenticación...');
    const dashboardResponse = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual', // No seguir redirects automáticamente
    });

    console.log('Status:', dashboardResponse.status);
    if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      const location = dashboardResponse.headers.get('location');
      console.log('Redirect to:', location);
      if (location?.includes('/login')) {
        console.log('✅ Redireccionado a login correctamente');
      } else {
        console.log('❌ Redireccionado a lugar incorrecto');
      }
    } else {
      console.log('❌ No se redireccionó como se esperaba');
    }

    console.log('\n🎉 Pruebas completadas!');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

// Ejecutar pruebas si el servidor está corriendo
testAuth().catch(console.error);