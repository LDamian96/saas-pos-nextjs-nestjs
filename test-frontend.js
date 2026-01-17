const puppeteer = require('puppeteer');

async function testFrontend() {
  // Conectar al Chrome existente con debugging
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null
  });

  // Obtener las páginas abiertas
  const pages = await browser.pages();

  // Buscar la página del POS
  let page = pages.find(p => p.url().includes('localhost:3000'));

  if (!page) {
    page = await browser.newPage();
    await page.goto('http://localhost:3000/dashboard');
  }

  console.log('Página actual:', await page.title());
  console.log('URL:', page.url());

  // Tomar screenshot
  await page.screenshot({ path: 'screenshot-dashboard.png', fullPage: true });
  console.log('Screenshot guardado: screenshot-dashboard.png');

  // No cerrar el browser porque es del usuario
  // await browser.disconnect();
}

testFrontend().catch(console.error);
