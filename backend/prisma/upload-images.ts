/**
 * Script para subir imágenes de productos a Cloudinary
 * Usa imágenes de Unsplash (gratis, alta calidad)
 * Ejecutar: npx ts-node --compiler-options '{"module":"commonjs"}' prisma/upload-images.ts
 */

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dnqkkd5nj',
  api_key: process.env.CLOUDINARY_API_KEY || '388425642996986',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'r_S3rJO1yYVeEKgaIKQad44DWGQ',
});

// Imágenes de productos reales de Unsplash (free, no copyright)
const productImages: Record<string, string> = {
  // ZAPATILLAS
  'zapatilla-running-nike': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
  'zapatilla-running-adidas': 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop',
  'zapatilla-urbana-blanca': 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&h=400&fit=crop',
  'zapatilla-urbana-negra': 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop',
  'zapatilla-jordan': 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop',
  'zapatilla-training': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop',
  'zapatilla-futbol': 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=400&h=400&fit=crop',
  'zapatilla-basket': 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=400&h=400&fit=crop',
  'sandalia-deportiva': 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&h=400&fit=crop',
  'bota-casual': 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400&h=400&fit=crop',
  // POLOS / CAMISETAS
  'polo-basico-negro': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
  'polo-basico-blanco': 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&h=400&fit=crop',
  'polo-deportivo': 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop',
  'camiseta-estampada': 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop',
  'polo-oversize': 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop',
  'polo-manga-larga': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop',
  // PANTALONES
  'jean-azul': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
  'jean-negro': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop',
  'jogger-deportivo': 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&h=400&fit=crop',
  'pantalon-chino': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop',
  'short-deportivo': 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=400&fit=crop',
  'bermuda-casual': 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=400&fit=crop',
  // CASACAS / CHAQUETAS
  'casaca-cortaviento': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop',
  'casaca-deportiva': 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&h=400&fit=crop',
  'hoodie-negro': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
  'hoodie-gris': 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop',
  'chaqueta-denim': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=400&fit=crop',
  'chaleco-puffer': 'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=400&h=400&fit=crop',
  // GORROS / ACCESORIOS
  'gorra-deportiva': 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=400&h=400&fit=crop',
  'gorro-beanie': 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=400&h=400&fit=crop',
  'mochila-deportiva': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
  'bolso-gym': 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop',
  'medias-deportivas': 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&h=400&fit=crop',
  'cinturon-casual': 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400&h=400&fit=crop',
  // ROPA DEPORTIVA
  'leggins-mujer': 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=400&fit=crop',
  'top-deportivo': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop',
  'shorts-running': 'https://images.unsplash.com/photo-1562886812-41775a01195d?w=400&h=400&fit=crop',
  'camiseta-dryfit': 'https://images.unsplash.com/photo-1581291518633-83b4eef1d2f2?w=400&h=400&fit=crop',
  'tank-top': 'https://images.unsplash.com/photo-1503341504253-dff4f94032fc?w=400&h=400&fit=crop',
  'conjunto-deportivo': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop',
};

async function uploadImages() {
  console.log('Subiendo imágenes a Cloudinary...\n');
  const results: Record<string, string> = {};
  let count = 0;
  const total = Object.keys(productImages).length;

  for (const [key, url] of Object.entries(productImages)) {
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: 'pos-productos',
        public_id: key,
        overwrite: true,
        transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
      });
      results[key] = result.secure_url;
      count++;
      console.log(`  [${count}/${total}] ✓ ${key}`);
    } catch (err: any) {
      console.error(`  [${count + 1}/${total}] ✗ ${key}: ${err.message}`);
      count++;
    }
  }

  console.log(`\n✓ ${Object.keys(results).length} imágenes subidas a Cloudinary\n`);

  // Output as JSON for the seed
  console.log('=== CLOUDINARY_URLS ===');
  console.log(JSON.stringify(results, null, 2));
  console.log('=== END_URLS ===');
}

uploadImages().catch(console.error);
