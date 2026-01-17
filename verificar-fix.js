const puppeteer = require('puppeteer');

async function verificarFix() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('localhost:3000'));

  if (!page) {
    console.log('No se encontro pagina del POS');
    return;
  }

  // Forzar refresh
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Verificar reportes
  await page.goto('http://localhost:3000/reportes', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshots/fix-reportes.png', fullPage: true });
  console.log('Screenshot reportes guardado');

  // Verificar productos
  await page.goto('http://localhost:3000/productos', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshots/fix-productos.png', fullPage: true });
  console.log('Screenshot productos guardado');

  console.log('\\nVerificacion completada. Revisa los screenshots.');
}

verificarFix().catch(console.error);
