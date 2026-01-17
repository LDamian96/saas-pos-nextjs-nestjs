const puppeteer = require('puppeteer');
const fs = require('fs');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function screenshot(page, name) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  console.log(`Screenshot: ${name}.png`);
}

async function testCRUD() {
  // Crear carpeta screenshots
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('localhost:3000'));

  if (!page) {
    page = await browser.newPage();
  }

  console.log('\n=== PRUEBA CRUD FRONTEND ===\n');

  // 1. IR A CATALOGOS > CATEGORIAS
  console.log('1. Navegando a Categorías...');
  await page.goto('http://localhost:3000/catalogos/categorias');
  await delay(2000);
  await screenshot(page, '01-categorias-lista');

  // 2. CREAR CATEGORIA
  console.log('2. Creando categoría...');
  // Buscar botón "Nueva Categoría" o similar
  const btnNuevo = await page.$('button:has-text("Nuevo"), button:has-text("Nueva"), button:has-text("Crear"), a:has-text("Nuevo")');
  if (btnNuevo) {
    await btnNuevo.click();
    await delay(1000);
    await screenshot(page, '02-categorias-modal');
  } else {
    // Intentar con selector más específico
    await page.click('button');
    await delay(1000);
  }

  // Llenar formulario
  const inputNombre = await page.$('input[name="nombre"], input[placeholder*="nombre" i], input[id="nombre"]');
  if (inputNombre) {
    await inputNombre.type('Electronica');
    await delay(500);
  }

  const inputDesc = await page.$('textarea[name="descripcion"], textarea[placeholder*="descripcion" i], input[name="descripcion"]');
  if (inputDesc) {
    await inputDesc.type('Productos electronicos');
    await delay(500);
  }

  await screenshot(page, '03-categorias-form-lleno');

  // Guardar
  const btnGuardar = await page.$('button[type="submit"], button:has-text("Guardar"), button:has-text("Crear")');
  if (btnGuardar) {
    await btnGuardar.click();
    await delay(2000);
  }

  await screenshot(page, '04-categorias-despues-crear');

  // 3. IR A MARCAS
  console.log('3. Navegando a Marcas...');
  await page.goto('http://localhost:3000/catalogos/marcas');
  await delay(2000);
  await screenshot(page, '05-marcas-lista');

  // 4. IR A PRODUCTOS
  console.log('4. Navegando a Productos...');
  await page.goto('http://localhost:3000/productos');
  await delay(2000);
  await screenshot(page, '06-productos-lista');

  // 5. IR AL POS
  console.log('5. Navegando al POS...');
  await page.goto('http://localhost:3000/pos');
  await delay(2000);
  await screenshot(page, '07-pos');

  // 6. IR A CLIENTES
  console.log('6. Navegando a Clientes...');
  await page.goto('http://localhost:3000/clientes');
  await delay(2000);
  await screenshot(page, '08-clientes');

  console.log('\n=== PRUEBA COMPLETADA ===');
  console.log('Screenshots guardados en carpeta: screenshots/');
}

testCRUD().catch(err => {
  console.error('Error:', err.message);
});
