const puppeteer = require('puppeteer');

async function checkProductos() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('localhost:3000'));

  if (!page) {
    console.log('No se encontró página del POS');
    return;
  }

  // Ir a productos
  await page.goto('http://localhost:3000/productos', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Tomar screenshot
  await page.screenshot({ path: 'screenshots/check-productos.png', fullPage: true });
  console.log('Screenshot guardado: check-productos.png');

  // Contar productos en la tabla
  const productos = await page.$$('table tbody tr');
  console.log(`Productos en tabla: ${productos.length}`);

  // Ir a reportes para verificar fix
  await page.goto('http://localhost:3000/reportes', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshots/check-reportes.png', fullPage: true });
  console.log('Screenshot reportes guardado: check-reportes.png');
}

checkProductos().catch(console.error);
