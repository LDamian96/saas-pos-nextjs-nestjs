const puppeteer = require('puppeteer');
const fs = require('fs');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function screenshot(page, name) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  console.log(`  📸 Screenshot: ${name}.png`);
}

// Helper para encontrar y hacer clic en botones por texto
async function clickButtonByText(page, text) {
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const btnText = await page.evaluate(el => el.textContent, button);
    if (btnText && btnText.toLowerCase().includes(text.toLowerCase())) {
      await button.click();
      return true;
    }
  }
  // Buscar en links también
  const links = await page.$$('a');
  for (const link of links) {
    const linkText = await page.evaluate(el => el.textContent, link);
    if (linkText && linkText.toLowerCase().includes(text.toLowerCase())) {
      await link.click();
      return true;
    }
  }
  return false;
}

// Helper para llenar input por placeholder o name
async function fillInput(page, identifier, value) {
  const selectors = [
    `input[name="${identifier}"]`,
    `input[placeholder*="${identifier}" i]`,
    `input[id="${identifier}"]`,
    `textarea[name="${identifier}"]`,
    `textarea[placeholder*="${identifier}" i]`,
  ];

  for (const selector of selectors) {
    const input = await page.$(selector);
    if (input) {
      await input.click({ clickCount: 3 }); // Seleccionar todo
      await input.type(value);
      return true;
    }
  }
  return false;
}

async function testCompleto() {
  // Crear carpeta screenshots
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  console.log('\n🚀 INICIANDO PRUEBAS CRUD FRONTEND\n');
  console.log('=' .repeat(50));

  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('localhost:3000'));

  if (!page) {
    page = await browser.newPage();
  }

  // ============================================
  // PASO 1: LOGIN
  // ============================================
  console.log('\n📍 PASO 1: LOGIN');
  console.log('-'.repeat(30));

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await delay(1000);
  await screenshot(page, '01-login');

  // Click en "Entrar como Demo"
  console.log('  Haciendo clic en "Entrar como Demo"...');
  const clicked = await clickButtonByText(page, 'Demo');
  if (clicked) {
    await delay(3000); // Esperar redirección
    await screenshot(page, '02-despues-login');
    console.log('  ✅ Login exitoso');
  } else {
    console.log('  ❌ No se encontró botón Demo');
  }

  // Verificar que estamos en dashboard
  const currentUrl = page.url();
  console.log(`  URL actual: ${currentUrl}`);

  // ============================================
  // PASO 2: CATEGORÍAS
  // ============================================
  console.log('\n📍 PASO 2: CATEGORÍAS');
  console.log('-'.repeat(30));

  await page.goto('http://localhost:3000/catalogos/categorias', { waitUntil: 'networkidle2' });
  await delay(2000);
  await screenshot(page, '03-categorias-lista');

  const categorias = ['Electrónica', 'Ropa', 'Alimentos', 'Hogar', 'Deportes'];

  for (let i = 0; i < categorias.length; i++) {
    console.log(`  Creando categoría: ${categorias[i]}...`);

    // Buscar botón para crear
    const btnNuevo = await clickButtonByText(page, 'Nuevo') ||
                     await clickButtonByText(page, 'Nueva') ||
                     await clickButtonByText(page, 'Crear') ||
                     await clickButtonByText(page, 'Agregar');

    if (btnNuevo) {
      await delay(1000);
      await screenshot(page, `04-categoria-modal-${i+1}`);

      // Llenar formulario
      await fillInput(page, 'nombre', categorias[i]);
      await delay(300);

      // Buscar y hacer clic en guardar
      await clickButtonByText(page, 'Guardar') || await clickButtonByText(page, 'Crear');
      await delay(2000);

      console.log(`  ✅ Categoría "${categorias[i]}" creada`);
    } else {
      console.log(`  ⚠️ No se encontró botón para crear categoría`);
      break;
    }
  }

  await screenshot(page, '05-categorias-final');

  // ============================================
  // PASO 3: MARCAS
  // ============================================
  console.log('\n📍 PASO 3: MARCAS');
  console.log('-'.repeat(30));

  await page.goto('http://localhost:3000/catalogos/marcas', { waitUntil: 'networkidle2' });
  await delay(2000);
  await screenshot(page, '06-marcas-lista');

  const marcas = ['Samsung', 'Apple', 'Nike', 'Adidas', 'Sony'];

  for (let i = 0; i < marcas.length; i++) {
    console.log(`  Creando marca: ${marcas[i]}...`);

    const btnNuevo = await clickButtonByText(page, 'Nuevo') ||
                     await clickButtonByText(page, 'Nueva') ||
                     await clickButtonByText(page, 'Crear');

    if (btnNuevo) {
      await delay(1000);

      await fillInput(page, 'nombre', marcas[i]);
      await delay(300);

      await clickButtonByText(page, 'Guardar') || await clickButtonByText(page, 'Crear');
      await delay(2000);

      console.log(`  ✅ Marca "${marcas[i]}" creada`);
    } else {
      console.log(`  ⚠️ No se encontró botón para crear marca`);
      break;
    }
  }

  await screenshot(page, '07-marcas-final');

  // ============================================
  // PASO 4: PRODUCTOS
  // ============================================
  console.log('\n📍 PASO 4: PRODUCTOS');
  console.log('-'.repeat(30));

  await page.goto('http://localhost:3000/productos', { waitUntil: 'networkidle2' });
  await delay(2000);
  await screenshot(page, '08-productos-lista');

  const productos = [
    { nombre: 'iPhone 15', precio: 3999, sku: 'IPH15' },
    { nombre: 'Samsung Galaxy S24', precio: 3499, sku: 'SGS24' },
    { nombre: 'Camiseta Nike', precio: 149, sku: 'CNK01' },
    { nombre: 'Zapatillas Adidas', precio: 399, sku: 'ZAD01' },
    { nombre: 'TV Sony 55"', precio: 2499, sku: 'TVS55' },
  ];

  for (let i = 0; i < productos.length; i++) {
    console.log(`  Creando producto: ${productos[i].nombre}...`);

    const btnNuevo = await clickButtonByText(page, 'Nuevo') ||
                     await clickButtonByText(page, 'Crear');

    if (btnNuevo) {
      await delay(1500);
      await screenshot(page, `09-producto-form-${i+1}`);

      await fillInput(page, 'nombre', productos[i].nombre);
      await delay(200);
      await fillInput(page, 'sku', productos[i].sku);
      await delay(200);
      await fillInput(page, 'precio', productos[i].precio.toString());
      await delay(200);

      await clickButtonByText(page, 'Guardar') || await clickButtonByText(page, 'Crear');
      await delay(2000);

      console.log(`  ✅ Producto "${productos[i].nombre}" creado`);
    } else {
      console.log(`  ⚠️ No se encontró botón para crear producto`);
      break;
    }
  }

  await screenshot(page, '10-productos-final');

  // ============================================
  // PASO 5: POS - REALIZAR VENTA
  // ============================================
  console.log('\n📍 PASO 5: PUNTO DE VENTA');
  console.log('-'.repeat(30));

  await page.goto('http://localhost:3000/pos', { waitUntil: 'networkidle2' });
  await delay(2000);
  await screenshot(page, '11-pos-inicial');

  console.log('  Buscando productos para vender...');

  // Intentar buscar un producto
  const searchInput = await page.$('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="producto" i]');
  if (searchInput) {
    await searchInput.type('iPhone');
    await delay(1000);
    await screenshot(page, '12-pos-busqueda');
  }

  // Intentar agregar producto al carrito haciendo clic
  const productCards = await page.$$('[class*="product"], [class*="card"], [class*="item"]');
  if (productCards.length > 0) {
    await productCards[0].click();
    await delay(1000);
    console.log('  ✅ Producto agregado al carrito');
  }

  await screenshot(page, '13-pos-con-producto');

  // Buscar botón de cobrar
  const btnCobrar = await clickButtonByText(page, 'Cobrar') ||
                    await clickButtonByText(page, 'Pagar') ||
                    await clickButtonByText(page, 'Finalizar');

  if (btnCobrar) {
    await delay(1500);
    await screenshot(page, '14-pos-modal-pago');

    // Seleccionar efectivo
    await clickButtonByText(page, 'Efectivo') || await clickButtonByText(page, 'Cash');
    await delay(500);

    // Confirmar venta
    await clickButtonByText(page, 'Confirmar') ||
    await clickButtonByText(page, 'Completar') ||
    await clickButtonByText(page, 'Finalizar');

    await delay(2000);
    console.log('  ✅ Venta completada');
  }

  await screenshot(page, '15-pos-venta-completada');

  // ============================================
  // PASO 6: REVISAR REPORTES
  // ============================================
  console.log('\n📍 PASO 6: REPORTES');
  console.log('-'.repeat(30));

  await page.goto('http://localhost:3000/reportes', { waitUntil: 'networkidle2' });
  await delay(2000);
  await screenshot(page, '16-reportes');

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('✅ PRUEBAS COMPLETADAS');
  console.log('='.repeat(50));
  console.log('\n📁 Screenshots guardados en: screenshots/');
  console.log('\nRevisa las imágenes para ver el flujo completo.');
}

testCompleto().catch(err => {
  console.error('\n❌ Error:', err.message);
});
