/**
 * @file seed.ts
 * @description Seed de datos iniciales: roles del sistema y permisos
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md
 * - RBAC: ver docs/arquitectura/17-ROLES-PERMISOS-RBAC.md
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // =====================================================
  // 1. PERMISOS DEL SISTEMA
  // =====================================================
  const permisos = [
    // Dashboard
    { codigo: 'dashboard.ver', nombre: 'Ver dashboard', modulo: 'dashboard' },
    { codigo: 'dashboard.reportes', nombre: 'Ver reportes', modulo: 'dashboard' },

    // Productos
    { codigo: 'productos.ver', nombre: 'Ver productos', modulo: 'productos' },
    { codigo: 'productos.crear', nombre: 'Crear productos', modulo: 'productos' },
    { codigo: 'productos.editar', nombre: 'Editar productos', modulo: 'productos' },
    { codigo: 'productos.eliminar', nombre: 'Eliminar productos', modulo: 'productos' },
    { codigo: 'productos.importar', nombre: 'Importar productos', modulo: 'productos' },
    { codigo: 'productos.exportar', nombre: 'Exportar productos', modulo: 'productos' },

    // Categorias
    { codigo: 'categorias.ver', nombre: 'Ver categorias', modulo: 'categorias' },
    { codigo: 'categorias.crear', nombre: 'Crear categorias', modulo: 'categorias' },
    { codigo: 'categorias.editar', nombre: 'Editar categorias', modulo: 'categorias' },
    { codigo: 'categorias.eliminar', nombre: 'Eliminar categorias', modulo: 'categorias' },

    // Inventario
    { codigo: 'inventario.ver', nombre: 'Ver inventario', modulo: 'inventario' },
    { codigo: 'inventario.ajustar', nombre: 'Ajustar stock', modulo: 'inventario' },
    { codigo: 'inventario.transferir', nombre: 'Transferir stock', modulo: 'inventario' },
    { codigo: 'inventario.lotes', nombre: 'Gestionar lotes', modulo: 'inventario' },

    // Ventas
    { codigo: 'ventas.ver', nombre: 'Ver ventas', modulo: 'ventas' },
    { codigo: 'ventas.crear', nombre: 'Crear ventas', modulo: 'ventas' },
    { codigo: 'ventas.anular', nombre: 'Anular ventas', modulo: 'ventas' },
    { codigo: 'ventas.descuento', nombre: 'Aplicar descuentos', modulo: 'ventas' },
    { codigo: 'ventas.devolucion', nombre: 'Procesar devoluciones', modulo: 'ventas' },

    // Caja
    { codigo: 'caja.abrir', nombre: 'Abrir caja', modulo: 'caja' },
    { codigo: 'caja.cerrar', nombre: 'Cerrar caja', modulo: 'caja' },
    { codigo: 'caja.arqueo', nombre: 'Realizar arqueo', modulo: 'caja' },
    { codigo: 'caja.movimientos', nombre: 'Ver movimientos', modulo: 'caja' },

    // Clientes
    { codigo: 'clientes.ver', nombre: 'Ver clientes', modulo: 'clientes' },
    { codigo: 'clientes.crear', nombre: 'Crear clientes', modulo: 'clientes' },
    { codigo: 'clientes.editar', nombre: 'Editar clientes', modulo: 'clientes' },
    { codigo: 'clientes.eliminar', nombre: 'Eliminar clientes', modulo: 'clientes' },

    // Usuarios
    { codigo: 'usuarios.ver', nombre: 'Ver usuarios', modulo: 'usuarios' },
    { codigo: 'usuarios.crear', nombre: 'Crear usuarios', modulo: 'usuarios' },
    { codigo: 'usuarios.editar', nombre: 'Editar usuarios', modulo: 'usuarios' },
    { codigo: 'usuarios.eliminar', nombre: 'Eliminar usuarios', modulo: 'usuarios' },
    { codigo: 'usuarios.roles', nombre: 'Asignar roles', modulo: 'usuarios' },

    // Sucursales
    { codigo: 'sucursales.ver', nombre: 'Ver sucursales', modulo: 'sucursales' },
    { codigo: 'sucursales.crear', nombre: 'Crear sucursales', modulo: 'sucursales' },
    { codigo: 'sucursales.editar', nombre: 'Editar sucursales', modulo: 'sucursales' },
    { codigo: 'sucursales.eliminar', nombre: 'Eliminar sucursales', modulo: 'sucursales' },

    // Reportes
    { codigo: 'reportes.ventas', nombre: 'Reportes de ventas', modulo: 'reportes' },
    { codigo: 'reportes.inventario', nombre: 'Reportes de inventario', modulo: 'reportes' },
    { codigo: 'reportes.financiero', nombre: 'Reportes financieros', modulo: 'reportes' },
    { codigo: 'reportes.clientes', nombre: 'Reportes de clientes', modulo: 'reportes' },

    // Configuracion
    { codigo: 'config.empresa', nombre: 'Configurar empresa', modulo: 'configuracion' },
    { codigo: 'config.impuestos', nombre: 'Configurar impuestos', modulo: 'configuracion' },
    { codigo: 'config.metodos_pago', nombre: 'Configurar metodos de pago', modulo: 'configuracion' },
    { codigo: 'config.facturacion', nombre: 'Configurar facturacion', modulo: 'configuracion' },
  ];

  console.log('Creando permisos...');
  for (const permiso of permisos) {
    await prisma.permiso.upsert({
      where: { codigo: permiso.codigo },
      update: {},
      create: permiso,
    });
  }
  console.log(`${permisos.length} permisos creados/actualizados`);

  // =====================================================
  // 2. ROLES DEL SISTEMA (empresaId = null)
  // =====================================================
  const rolesConfig = [
    {
      codigo: 'super_admin',
      nombre: 'Super Administrador',
      descripcion: 'Control total del sistema SaaS',
      nivel: 100,
      todosPermisos: true,
    },
    {
      codigo: 'admin',
      nombre: 'Administrador',
      descripcion: 'Administrador de empresa',
      nivel: 90,
      todosPermisos: true,
    },
    {
      codigo: 'supervisor',
      nombre: 'Supervisor',
      descripcion: 'Supervisor de tienda/sucursal',
      nivel: 70,
      permisosCodigos: [
        'dashboard.ver',
        'dashboard.reportes',
        'productos.ver',
        'productos.crear',
        'productos.editar',
        'categorias.ver',
        'categorias.crear',
        'categorias.editar',
        'inventario.ver',
        'inventario.ajustar',
        'inventario.lotes',
        'ventas.ver',
        'ventas.crear',
        'ventas.anular',
        'ventas.descuento',
        'ventas.devolucion',
        'caja.abrir',
        'caja.cerrar',
        'caja.arqueo',
        'caja.movimientos',
        'clientes.ver',
        'clientes.crear',
        'clientes.editar',
        'usuarios.ver',
        'reportes.ventas',
        'reportes.inventario',
      ],
    },
    {
      codigo: 'cajero',
      nombre: 'Cajero',
      descripcion: 'Cajero de punto de venta',
      nivel: 50,
      permisosCodigos: [
        'dashboard.ver',
        'productos.ver',
        'ventas.ver',
        'ventas.crear',
        'ventas.descuento',
        'caja.abrir',
        'caja.cerrar',
        'caja.movimientos',
        'clientes.ver',
        'clientes.crear',
      ],
    },
    {
      codigo: 'almacenero',
      nombre: 'Almacenero',
      descripcion: 'Encargado de almacen/inventario',
      nivel: 50,
      permisosCodigos: [
        'dashboard.ver',
        'productos.ver',
        'productos.crear',
        'productos.editar',
        'categorias.ver',
        'inventario.ver',
        'inventario.ajustar',
        'inventario.transferir',
        'inventario.lotes',
        'reportes.inventario',
      ],
    },
    {
      codigo: 'vendedor',
      nombre: 'Vendedor',
      descripcion: 'Vendedor (solo ventas)',
      nivel: 40,
      permisosCodigos: [
        'dashboard.ver',
        'productos.ver',
        'ventas.ver',
        'ventas.crear',
        'clientes.ver',
        'clientes.crear',
      ],
    },
  ];

  console.log('Creando roles del sistema...');

  // Obtener todos los permisos de la BD
  const todosPermisosDB = await prisma.permiso.findMany();

  for (const rolConfig of rolesConfig) {
    // Buscar si existe el rol del sistema (empresaId = null)
    let rol = await prisma.rol.findFirst({
      where: {
        codigo: rolConfig.codigo,
        empresaId: null,
      },
    });

    if (!rol) {
      // Crear rol
      rol = await prisma.rol.create({
        data: {
          codigo: rolConfig.codigo,
          nombre: rolConfig.nombre,
          descripcion: rolConfig.descripcion,
          esSistema: true,
          nivel: rolConfig.nivel,
          empresaId: null,
        },
      });
    } else {
      // Actualizar rol
      rol = await prisma.rol.update({
        where: { id: rol.id },
        data: {
          nombre: rolConfig.nombre,
          descripcion: rolConfig.descripcion,
          nivel: rolConfig.nivel,
        },
      });
    }

    // Determinar permisos a asignar
    const permisosAsignar = rolConfig.todosPermisos
      ? todosPermisosDB
      : todosPermisosDB.filter((p) => rolConfig.permisosCodigos?.includes(p.codigo));

    // Limpiar permisos anteriores
    await prisma.rolPermiso.deleteMany({
      where: { rolId: rol.id },
    });

    // Asignar permisos
    for (const permiso of permisosAsignar) {
      await prisma.rolPermiso.create({
        data: {
          rolId: rol.id,
          permisoId: permiso.id,
        },
      });
    }

    console.log(`  Rol "${rolConfig.nombre}" - ${permisosAsignar.length} permisos`);
  }

  // =====================================================
  // 3. EMPRESA Y USUARIO DEMO (para pruebas)
  // =====================================================
  console.log('\nCreando empresa y usuario demo...');

  // Importar bcrypt para hashear password
  const bcrypt = await import('bcrypt');
  const passwordHash = await bcrypt.hash('admin123', 12);

  // =====================================================
  // 3. SUPER ADMIN DEL SAAS (Sin empresa - Dueño del SaaS)
  // =====================================================
  console.log('\nCreando SuperAdmin del SaaS...');

  const rolSuperAdmin = await prisma.rol.findFirst({
    where: { codigo: 'super_admin', empresaId: null },
  });

  if (!rolSuperAdmin) {
    throw new Error('Rol super_admin no encontrado. Ejecuta el seed de nuevo.');
  }

  // Crear SuperAdmin (empresaId = null porque es dueño del SaaS)
  // Usamos findFirst + create/update porque el unique constraint no permite null en upsert
  const existingSuperAdmin = await prisma.usuario.findFirst({
    where: { email: 'superadmin@pos-saas.com', empresaId: null },
  });

  if (existingSuperAdmin) {
    await prisma.usuario.update({
      where: { id: existingSuperAdmin.id },
      data: { passwordHash },
    });
  } else {
    await prisma.usuario.create({
      data: {
        empresaId: null, // Sin empresa - es el dueño del SaaS
        sucursalId: null,
        rolId: rolSuperAdmin.id,
        email: 'superadmin@pos-saas.com',
        passwordHash,
        nombre: 'Super',
        apellido: 'Admin',
        todasSucursales: true,
        puedeAnularVenta: true,
        puedeVerCostos: true,
        puedeVerUtilidades: true,
        puedeModificarPrecios: true,
        activo: true,
      },
    });
  }
  console.log('  SuperAdmin: superadmin@pos-saas.com (Dueño del SaaS)');

  // Buscar rol admin
  const rolAdmin = await prisma.rol.findFirst({
    where: { codigo: 'admin', empresaId: null },
  });

  if (!rolAdmin) {
    throw new Error('Rol admin no encontrado. Ejecuta el seed de nuevo.');
  }

  // =====================================================
  // 4. EMPRESA DEMO Y SU ADMIN
  // =====================================================
  console.log('\nCreando Empresa Demo...');

  // Crear empresa demo
  const empresaDemo = await prisma.empresa.upsert({
    where: { codigo: 'DEMO-001' },
    update: {},
    create: {
      codigo: 'DEMO-001',
      nombreComercial: 'Tienda Demo',
      razonSocial: 'Tienda Demo SAC',
      ruc: '20123456789',
      email: 'demo@tiendademo.com',
      telefono: '987654321',
      pais: 'Peru',
      moneda: 'PEN',
      simboloMoneda: 'S/',
      zonaHoraria: 'America/Lima',
      plan: 'pro',
      maxSucursales: 5,
      maxUsuarios: 10,
      maxProductos: 5000,
    },
  });
  console.log(`  Empresa: ${empresaDemo.nombreComercial}`);

  // Crear sucursal principal
  const sucursalDemo = await prisma.sucursal.upsert({
    where: {
      empresaId_codigo: { empresaId: empresaDemo.id, codigo: 'SUC-PRINCIPAL' },
    },
    update: {},
    create: {
      empresaId: empresaDemo.id,
      codigo: 'SUC-PRINCIPAL',
      nombre: 'Sucursal Principal',
      direccion: 'Av. Demo 123, Lima',
      telefono: '987654321',
      esPrincipal: true,
      activo: true,
    },
  });
  console.log(`  Sucursal: ${sucursalDemo.nombre}`);

  // Crear usuario admin demo (dueño del negocio)
  const usuarioDemo = await prisma.usuario.upsert({
    where: {
      empresaId_email: { empresaId: empresaDemo.id, email: 'admin@demo.com' },
    },
    update: {
      passwordHash: passwordHash,
    },
    create: {
      empresaId: empresaDemo.id,
      sucursalId: sucursalDemo.id,
      rolId: rolAdmin.id,
      email: 'admin@demo.com',
      passwordHash: passwordHash,
      nombre: 'Carlos',
      apellido: 'Mendoza',
      activo: true,
    },
  });
  console.log(`  Usuario Admin: ${usuarioDemo.email}`);

  // Crear usuarios demo para cada rol
  const rolesDemo = [
    { codigo: 'supervisor', email: 'supervisor@demo.com', nombre: 'Maria', apellido: 'Garcia' },
    { codigo: 'cajero', email: 'cajero@demo.com', nombre: 'Juan', apellido: 'Lopez' },
    { codigo: 'almacenero', email: 'almacen@demo.com', nombre: 'Pedro', apellido: 'Sanchez' },
    { codigo: 'vendedor', email: 'vendedor@demo.com', nombre: 'Ana', apellido: 'Martinez' },
  ];

  for (const userData of rolesDemo) {
    const rol = await prisma.rol.findFirst({
      where: { codigo: userData.codigo, empresaId: null },
    });

    if (rol) {
      await prisma.usuario.upsert({
        where: {
          empresaId_email: { empresaId: empresaDemo.id, email: userData.email },
        },
        update: { passwordHash },
        create: {
          empresaId: empresaDemo.id,
          sucursalId: sucursalDemo.id,
          rolId: rol.id,
          email: userData.email,
          passwordHash,
          nombre: userData.nombre,
          apellido: userData.apellido,
          activo: true,
        },
      });
      console.log(`  Usuario ${userData.codigo}: ${userData.email}`);
    }
  }

  // =====================================================
  // 4. CATEGORÍAS DE PRUEBA
  // =====================================================
  console.log('\nCreando categorías...');

  const categoriasData = [
    { nombre: 'Ropa', slug: 'ropa', descripcion: 'Ropa y vestimenta', orden: 1 },
    { nombre: 'Electrónicos', slug: 'electronicos', descripcion: 'Dispositivos electrónicos', orden: 2 },
    { nombre: 'Alimentos', slug: 'alimentos', descripcion: 'Alimentos y bebidas', orden: 3 },
    { nombre: 'Hogar', slug: 'hogar', descripcion: 'Artículos para el hogar', orden: 4 },
    { nombre: 'Deportes', slug: 'deportes', descripcion: 'Artículos deportivos', orden: 5 },
  ];

  for (const cat of categoriasData) {
    await prisma.categoria.upsert({
      where: {
        empresaId_slug: { empresaId: empresaDemo.id, slug: cat.slug },
      },
      update: {},
      create: {
        empresaId: empresaDemo.id,
        nombre: cat.nombre,
        slug: cat.slug,
        descripcion: cat.descripcion,
        orden: cat.orden,
        activo: true,
      },
    });
  }
  console.log(`  ${categoriasData.length} categorías creadas`);

  // Subcategorías de Ropa
  const categoriaRopa = await prisma.categoria.findFirst({
    where: { empresaId: empresaDemo.id, slug: 'ropa' },
  });

  if (categoriaRopa) {
    const subcategoriasRopa = [
      { nombre: 'Camisas', slug: 'camisas', orden: 1 },
      { nombre: 'Pantalones', slug: 'pantalones', orden: 2 },
      { nombre: 'Zapatos', slug: 'zapatos', orden: 3 },
      { nombre: 'Accesorios', slug: 'accesorios', orden: 4 },
    ];

    for (const sub of subcategoriasRopa) {
      await prisma.categoria.upsert({
        where: {
          empresaId_slug: { empresaId: empresaDemo.id, slug: sub.slug },
        },
        update: {},
        create: {
          empresaId: empresaDemo.id,
          categoriaPadreId: categoriaRopa.id,
          nombre: sub.nombre,
          slug: sub.slug,
          orden: sub.orden,
          activo: true,
        },
      });
    }
    console.log(`  4 subcategorías de Ropa creadas`);
  }

  // =====================================================
  // 5. MARCAS DE PRUEBA
  // =====================================================
  console.log('\nCreando marcas...');

  const marcasData = [
    { nombre: 'Nike', slug: 'nike', descripcion: 'Ropa y calzado deportivo' },
    { nombre: 'Adidas', slug: 'adidas', descripcion: 'Artículos deportivos' },
    { nombre: 'Samsung', slug: 'samsung', descripcion: 'Electrónicos y tecnología' },
    { nombre: 'Apple', slug: 'apple', descripcion: 'Dispositivos premium' },
    { nombre: 'Sony', slug: 'sony', descripcion: 'Electrónicos y entretenimiento' },
    { nombre: 'LG', slug: 'lg', descripcion: 'Electrodomésticos y electrónicos' },
    { nombre: 'Levis', slug: 'levis', descripcion: 'Jeans y ropa casual' },
    { nombre: 'Genérico', slug: 'generico', descripcion: 'Productos sin marca' },
  ];

  for (const marca of marcasData) {
    await prisma.marca.upsert({
      where: {
        empresaId_slug: { empresaId: empresaDemo.id, slug: marca.slug },
      },
      update: {},
      create: {
        empresaId: empresaDemo.id,
        nombre: marca.nombre,
        slug: marca.slug,
        descripcion: marca.descripcion,
        activo: true,
      },
    });
  }
  console.log(`  ${marcasData.length} marcas creadas`);

  // =====================================================
  // 6. ATRIBUTOS DE PRUEBA
  // =====================================================
  console.log('\nCreando atributos...');

  // Atributo: Talla
  const atributoTalla = await prisma.atributo.upsert({
    where: {
      empresaId_slug: { empresaId: empresaDemo.id, slug: 'talla' },
    },
    update: {},
    create: {
      empresaId: empresaDemo.id,
      nombre: 'Talla',
      slug: 'talla',
      tipoVisual: 'select',
      tipoSistema: 'dinamico',
      orden: 1,
      activo: true,
    },
  });

  const tallaValores = [
    { valor: 'XS', slug: 'xs' },
    { valor: 'S', slug: 's' },
    { valor: 'M', slug: 'm' },
    { valor: 'L', slug: 'l' },
    { valor: 'XL', slug: 'xl' },
    { valor: 'XXL', slug: 'xxl' },
  ];
  for (let i = 0; i < tallaValores.length; i++) {
    await prisma.valorAtributo.upsert({
      where: {
        atributoId_slug: { atributoId: atributoTalla.id, slug: tallaValores[i].slug },
      },
      update: {},
      create: {
        atributoId: atributoTalla.id,
        valor: tallaValores[i].valor,
        slug: tallaValores[i].slug,
        orden: i + 1,
        activo: true,
      },
    });
  }
  console.log(`  Atributo "Talla" con ${tallaValores.length} valores`);

  // Atributo: Color
  const atributoColor = await prisma.atributo.upsert({
    where: {
      empresaId_slug: { empresaId: empresaDemo.id, slug: 'color' },
    },
    update: {},
    create: {
      empresaId: empresaDemo.id,
      nombre: 'Color',
      slug: 'color',
      tipoVisual: 'color',
      tipoSistema: 'dinamico',
      orden: 2,
      activo: true,
    },
  });

  const colorValores = [
    { valor: 'Negro', slug: 'negro', codigo: '#000000' },
    { valor: 'Blanco', slug: 'blanco', codigo: '#FFFFFF' },
    { valor: 'Rojo', slug: 'rojo', codigo: '#FF0000' },
    { valor: 'Azul', slug: 'azul', codigo: '#0000FF' },
    { valor: 'Verde', slug: 'verde', codigo: '#00FF00' },
    { valor: 'Amarillo', slug: 'amarillo', codigo: '#FFFF00' },
    { valor: 'Gris', slug: 'gris', codigo: '#808080' },
    { valor: 'Rosa', slug: 'rosa', codigo: '#FFC0CB' },
  ];

  for (let i = 0; i < colorValores.length; i++) {
    await prisma.valorAtributo.upsert({
      where: {
        atributoId_slug: { atributoId: atributoColor.id, slug: colorValores[i].slug },
      },
      update: {},
      create: {
        atributoId: atributoColor.id,
        valor: colorValores[i].valor,
        slug: colorValores[i].slug,
        codigoColor: colorValores[i].codigo,
        orden: i + 1,
        activo: true,
      },
    });
  }
  console.log(`  Atributo "Color" con ${colorValores.length} valores`);

  // Atributo: Material
  const atributoMaterial = await prisma.atributo.upsert({
    where: {
      empresaId_slug: { empresaId: empresaDemo.id, slug: 'material' },
    },
    update: {},
    create: {
      empresaId: empresaDemo.id,
      nombre: 'Material',
      slug: 'material',
      tipoVisual: 'select',
      tipoSistema: 'dinamico',
      orden: 3,
      activo: true,
    },
  });

  const materialValores = [
    { valor: 'Algodón', slug: 'algodon' },
    { valor: 'Poliéster', slug: 'poliester' },
    { valor: 'Cuero', slug: 'cuero' },
    { valor: 'Lana', slug: 'lana' },
    { valor: 'Seda', slug: 'seda' },
    { valor: 'Nylon', slug: 'nylon' },
  ];
  for (let i = 0; i < materialValores.length; i++) {
    await prisma.valorAtributo.upsert({
      where: {
        atributoId_slug: { atributoId: atributoMaterial.id, slug: materialValores[i].slug },
      },
      update: {},
      create: {
        atributoId: atributoMaterial.id,
        valor: materialValores[i].valor,
        slug: materialValores[i].slug,
        orden: i + 1,
        activo: true,
      },
    });
  }
  console.log(`  Atributo "Material" con ${materialValores.length} valores`);

  // Atributo: Capacidad (para electrónicos)
  const atributoCapacidad = await prisma.atributo.upsert({
    where: {
      empresaId_slug: { empresaId: empresaDemo.id, slug: 'capacidad' },
    },
    update: {},
    create: {
      empresaId: empresaDemo.id,
      nombre: 'Capacidad',
      slug: 'capacidad',
      tipoVisual: 'select',
      tipoSistema: 'dinamico',
      orden: 4,
      activo: true,
    },
  });

  const capacidadValores = [
    { valor: '32GB', slug: '32gb' },
    { valor: '64GB', slug: '64gb' },
    { valor: '128GB', slug: '128gb' },
    { valor: '256GB', slug: '256gb' },
    { valor: '512GB', slug: '512gb' },
    { valor: '1TB', slug: '1tb' },
  ];
  for (let i = 0; i < capacidadValores.length; i++) {
    await prisma.valorAtributo.upsert({
      where: {
        atributoId_slug: { atributoId: atributoCapacidad.id, slug: capacidadValores[i].slug },
      },
      update: {},
      create: {
        atributoId: atributoCapacidad.id,
        valor: capacidadValores[i].valor,
        slug: capacidadValores[i].slug,
        orden: i + 1,
        activo: true,
      },
    });
  }
  console.log(`  Atributo "Capacidad" con ${capacidadValores.length} valores`);

  // =====================================================
  // 7. VINCULAR ATRIBUTOS A CATEGORÍAS
  // =====================================================
  console.log('\nVinculando atributos a categorías...');

  // Vincular Talla y Color a categoría Ropa
  if (categoriaRopa) {
    await prisma.categoriaAtributo.upsert({
      where: {
        categoriaId_atributoId: { categoriaId: categoriaRopa.id, atributoId: atributoTalla.id },
      },
      update: {},
      create: {
        categoriaId: categoriaRopa.id,
        atributoId: atributoTalla.id,
        obligatorio: true,
        orden: 1,
      },
    });

    await prisma.categoriaAtributo.upsert({
      where: {
        categoriaId_atributoId: { categoriaId: categoriaRopa.id, atributoId: atributoColor.id },
      },
      update: {},
      create: {
        categoriaId: categoriaRopa.id,
        atributoId: atributoColor.id,
        obligatorio: true,
        orden: 2,
      },
    });

    await prisma.categoriaAtributo.upsert({
      where: {
        categoriaId_atributoId: { categoriaId: categoriaRopa.id, atributoId: atributoMaterial.id },
      },
      update: {},
      create: {
        categoriaId: categoriaRopa.id,
        atributoId: atributoMaterial.id,
        obligatorio: false,
        orden: 3,
      },
    });

    console.log(`  Categoría "Ropa" vinculada con Talla, Color, Material`);
  }

  // Vincular Capacidad y Color a categoría Electrónicos
  const categoriaElectronicos = await prisma.categoria.findFirst({
    where: { empresaId: empresaDemo.id, slug: 'electronicos' },
  });

  if (categoriaElectronicos) {
    await prisma.categoriaAtributo.upsert({
      where: {
        categoriaId_atributoId: { categoriaId: categoriaElectronicos.id, atributoId: atributoCapacidad.id },
      },
      update: {},
      create: {
        categoriaId: categoriaElectronicos.id,
        atributoId: atributoCapacidad.id,
        obligatorio: false,
        orden: 1,
      },
    });

    await prisma.categoriaAtributo.upsert({
      where: {
        categoriaId_atributoId: { categoriaId: categoriaElectronicos.id, atributoId: atributoColor.id },
      },
      update: {},
      create: {
        categoriaId: categoriaElectronicos.id,
        atributoId: atributoColor.id,
        obligatorio: false,
        orden: 2,
      },
    });

    console.log(`  Categoría "Electrónicos" vinculada con Capacidad, Color`);
  }

  // =====================================================
  // 8. MÉTODOS DE PAGO
  // =====================================================
  console.log('\nCreando métodos de pago...');

  const metodosPagoData = [
    { codigo: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo', orden: 1 },
    { codigo: 'tarjeta_debito', nombre: 'Tarjeta Débito', tipo: 'tarjeta', orden: 2 },
    { codigo: 'tarjeta_credito', nombre: 'Tarjeta Crédito', tipo: 'tarjeta', orden: 3 },
    { codigo: 'yape', nombre: 'Yape', tipo: 'digital', orden: 4 },
    { codigo: 'plin', nombre: 'Plin', tipo: 'digital', orden: 5 },
    { codigo: 'transferencia', nombre: 'Transferencia', tipo: 'transferencia', orden: 6 },
  ];

  for (const metodo of metodosPagoData) {
    await prisma.metodoPago.upsert({
      where: {
        empresaId_codigo: { empresaId: empresaDemo.id, codigo: metodo.codigo },
      },
      update: {},
      create: {
        empresaId: empresaDemo.id,
        codigo: metodo.codigo,
        nombre: metodo.nombre,
        tipo: metodo.tipo,
        orden: metodo.orden,
        activo: true,
      },
    });
  }
  console.log(`  ${metodosPagoData.length} métodos de pago creados`);

  // =====================================================
  // 9. SUBCATEGORÍAS ADICIONALES
  // =====================================================
  console.log('\nCreando subcategorías adicionales...');

  // Subcategorías de Electrónicos
  if (categoriaElectronicos) {
    const subcategoriasElectronicos = [
      { nombre: 'Smartphones', slug: 'smartphones', orden: 1 },
      { nombre: 'Tablets', slug: 'tablets', orden: 2 },
      { nombre: 'Laptops', slug: 'laptops', orden: 3 },
      { nombre: 'Audio', slug: 'audio', orden: 4 },
      { nombre: 'Accesorios Tech', slug: 'accesorios-tech', orden: 5 },
    ];

    for (const sub of subcategoriasElectronicos) {
      await prisma.categoria.upsert({
        where: {
          empresaId_slug: { empresaId: empresaDemo.id, slug: sub.slug },
        },
        update: {},
        create: {
          empresaId: empresaDemo.id,
          categoriaPadreId: categoriaElectronicos.id,
          nombre: sub.nombre,
          slug: sub.slug,
          orden: sub.orden,
          activo: true,
        },
      });
    }
    console.log(`  5 subcategorías de Electrónicos creadas`);
  }

  // Subcategorías de Deportes
  const categoriaDeportes = await prisma.categoria.findFirst({
    where: { empresaId: empresaDemo.id, slug: 'deportes' },
  });

  if (categoriaDeportes) {
    const subcategoriasDeportes = [
      { nombre: 'Zapatillas Deportivas', slug: 'zapatillas-deportivas', orden: 1 },
      { nombre: 'Ropa Deportiva', slug: 'ropa-deportiva', orden: 2 },
      { nombre: 'Equipos', slug: 'equipos', orden: 3 },
      { nombre: 'Accesorios Deportivos', slug: 'accesorios-deportivos', orden: 4 },
    ];

    for (const sub of subcategoriasDeportes) {
      await prisma.categoria.upsert({
        where: {
          empresaId_slug: { empresaId: empresaDemo.id, slug: sub.slug },
        },
        update: {},
        create: {
          empresaId: empresaDemo.id,
          categoriaPadreId: categoriaDeportes.id,
          nombre: sub.nombre,
          slug: sub.slug,
          orden: sub.orden,
          activo: true,
        },
      });
    }
    console.log(`  4 subcategorías de Deportes creadas`);

    // Vincular atributos a Deportes
    await prisma.categoriaAtributo.upsert({
      where: {
        categoriaId_atributoId: { categoriaId: categoriaDeportes.id, atributoId: atributoTalla.id },
      },
      update: {},
      create: {
        categoriaId: categoriaDeportes.id,
        atributoId: atributoTalla.id,
        obligatorio: true,
        orden: 1,
      },
    });

    await prisma.categoriaAtributo.upsert({
      where: {
        categoriaId_atributoId: { categoriaId: categoriaDeportes.id, atributoId: atributoColor.id },
      },
      update: {},
      create: {
        categoriaId: categoriaDeportes.id,
        atributoId: atributoColor.id,
        obligatorio: true,
        orden: 2,
      },
    });
    console.log(`  Categoría "Deportes" vinculada con Talla, Color`);
  }

  // Subcategorías de Hogar
  const categoriaHogar = await prisma.categoria.findFirst({
    where: { empresaId: empresaDemo.id, slug: 'hogar' },
  });

  if (categoriaHogar) {
    const subcategoriasHogar = [
      { nombre: 'Decoración', slug: 'decoracion', orden: 1 },
      { nombre: 'Cocina', slug: 'cocina', orden: 2 },
      { nombre: 'Baño', slug: 'bano', orden: 3 },
      { nombre: 'Muebles', slug: 'muebles', orden: 4 },
    ];

    for (const sub of subcategoriasHogar) {
      await prisma.categoria.upsert({
        where: {
          empresaId_slug: { empresaId: empresaDemo.id, slug: sub.slug },
        },
        update: {},
        create: {
          empresaId: empresaDemo.id,
          categoriaPadreId: categoriaHogar.id,
          nombre: sub.nombre,
          slug: sub.slug,
          orden: sub.orden,
          activo: true,
        },
      });
    }
    console.log(`  4 subcategorías de Hogar creadas`);

    // Vincular Color a Hogar
    await prisma.categoriaAtributo.upsert({
      where: {
        categoriaId_atributoId: { categoriaId: categoriaHogar.id, atributoId: atributoColor.id },
      },
      update: {},
      create: {
        categoriaId: categoriaHogar.id,
        atributoId: atributoColor.id,
        obligatorio: false,
        orden: 1,
      },
    });
    console.log(`  Categoría "Hogar" vinculada con Color`);
  }

  // Subcategorías de Alimentos
  const categoriaAlimentos = await prisma.categoria.findFirst({
    where: { empresaId: empresaDemo.id, slug: 'alimentos' },
  });

  if (categoriaAlimentos) {
    const subcategoriasAlimentos = [
      { nombre: 'Bebidas', slug: 'bebidas', orden: 1 },
      { nombre: 'Snacks', slug: 'snacks', orden: 2 },
      { nombre: 'Lácteos', slug: 'lacteos', orden: 3 },
      { nombre: 'Conservas', slug: 'conservas', orden: 4 },
    ];

    for (const sub of subcategoriasAlimentos) {
      await prisma.categoria.upsert({
        where: {
          empresaId_slug: { empresaId: empresaDemo.id, slug: sub.slug },
        },
        update: {},
        create: {
          empresaId: empresaDemo.id,
          categoriaPadreId: categoriaAlimentos.id,
          nombre: sub.nombre,
          slug: sub.slug,
          orden: sub.orden,
          activo: true,
        },
      });
    }
    console.log(`  4 subcategorías de Alimentos creadas`);
  }

  // =====================================================
  // 10. MARCAS ADICIONALES
  // =====================================================
  console.log('\nCreando marcas adicionales...');

  const marcasAdicionales = [
    { nombre: 'Puma', slug: 'puma', descripcion: 'Artículos deportivos' },
    { nombre: 'Under Armour', slug: 'under-armour', descripcion: 'Ropa deportiva' },
    { nombre: 'Xiaomi', slug: 'xiaomi', descripcion: 'Electrónicos accesibles' },
    { nombre: 'HP', slug: 'hp', descripcion: 'Computadoras e impresoras' },
    { nombre: 'Dell', slug: 'dell', descripcion: 'Computadoras' },
    { nombre: 'Lenovo', slug: 'lenovo', descripcion: 'Laptops y tablets' },
    { nombre: 'JBL', slug: 'jbl', descripcion: 'Audio profesional' },
    { nombre: 'Bose', slug: 'bose', descripcion: 'Audio premium' },
    { nombre: 'Tommy Hilfiger', slug: 'tommy-hilfiger', descripcion: 'Moda casual' },
    { nombre: 'Calvin Klein', slug: 'calvin-klein', descripcion: 'Moda y accesorios' },
    { nombre: 'Zara', slug: 'zara', descripcion: 'Moda rápida' },
    { nombre: 'H&M', slug: 'hm', descripcion: 'Moda accesible' },
    { nombre: 'Gloria', slug: 'gloria', descripcion: 'Productos lácteos' },
    { nombre: 'Coca-Cola', slug: 'coca-cola', descripcion: 'Bebidas' },
    { nombre: 'Pepsi', slug: 'pepsi', descripcion: 'Bebidas' },
    { nombre: 'Nestlé', slug: 'nestle', descripcion: 'Alimentos y bebidas' },
  ];

  for (const marca of marcasAdicionales) {
    await prisma.marca.upsert({
      where: {
        empresaId_slug: { empresaId: empresaDemo.id, slug: marca.slug },
      },
      update: {},
      create: {
        empresaId: empresaDemo.id,
        nombre: marca.nombre,
        slug: marca.slug,
        descripcion: marca.descripcion,
        activo: true,
      },
    });
  }
  console.log(`  ${marcasAdicionales.length} marcas adicionales creadas`);

  // =====================================================
  // 11. ATRIBUTO TAMAÑO (para productos varios)
  // =====================================================
  console.log('\nCreando atributo Tamaño...');

  const atributoTamano = await prisma.atributo.upsert({
    where: {
      empresaId_slug: { empresaId: empresaDemo.id, slug: 'tamano' },
    },
    update: {},
    create: {
      empresaId: empresaDemo.id,
      nombre: 'Tamaño',
      slug: 'tamano',
      tipoVisual: 'select',
      tipoSistema: 'dinamico',
      orden: 5,
      activo: true,
    },
  });

  const tamanoValores = [
    { valor: 'Pequeño', slug: 'pequeno' },
    { valor: 'Mediano', slug: 'mediano' },
    { valor: 'Grande', slug: 'grande' },
    { valor: 'Extra Grande', slug: 'extra-grande' },
  ];
  for (let i = 0; i < tamanoValores.length; i++) {
    await prisma.valorAtributo.upsert({
      where: {
        atributoId_slug: { atributoId: atributoTamano.id, slug: tamanoValores[i].slug },
      },
      update: {},
      create: {
        atributoId: atributoTamano.id,
        valor: tamanoValores[i].valor,
        slug: tamanoValores[i].slug,
        orden: i + 1,
        activo: true,
      },
    });
  }
  console.log(`  Atributo "Tamaño" con ${tamanoValores.length} valores`);

  // =====================================================
  // 12. 100 PRODUCTOS CON 400 VARIANTES
  // =====================================================
  console.log('\n========================================');
  console.log('CREANDO 100 PRODUCTOS CON 400 VARIANTES');
  console.log('========================================\n');

  // Obtener IDs de categorías, marcas y atributos
  const todasCategorias = await prisma.categoria.findMany({
    where: { empresaId: empresaDemo.id, activo: true },
  });
  const todasMarcas = await prisma.marca.findMany({
    where: { empresaId: empresaDemo.id, activo: true },
  });
  const todosAtributos = await prisma.atributo.findMany({
    where: { empresaId: empresaDemo.id, activo: true },
    include: { valores: { where: { activo: true } } },
  });

  // Helper para obtener valores de atributo
  const getValoresAtributo = (slug: string) => {
    const attr = todosAtributos.find((a) => a.slug === slug);
    return attr?.valores || [];
  };

  // Helper para generar precio aleatorio
  const randomPrice = (min: number, max: number) =>
    parseFloat((Math.random() * (max - min) + min).toFixed(2));

  // Helper para generar stock aleatorio
  const randomStock = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Helper para obtener categoría por slug
  const getCategoriaBySlug = (slug: string) => todasCategorias.find((c) => c.slug === slug);

  // Helper para obtener marca por slug
  const getMarcaBySlug = (slug: string) => todasMarcas.find((m) => m.slug === slug);

  let totalProductos = 0;
  let totalVariantes = 0;

  // =====================================================
  // PRODUCTOS DE ROPA (25 productos, ~150 variantes)
  // Atributos: Talla + Color + Material (algunos)
  // =====================================================
  console.log('Creando productos de ROPA...');

  const productosRopa = [
    { nombre: 'Camisa Casual Slim', categoria: 'camisas', marcas: ['levis', 'tommy-hilfiger', 'zara'], precioBase: 89.90, conMaterial: true },
    { nombre: 'Camisa Formal Premium', categoria: 'camisas', marcas: ['calvin-klein', 'tommy-hilfiger'], precioBase: 129.90, conMaterial: true },
    { nombre: 'Polo Básico', categoria: 'camisas', marcas: ['hm', 'zara', 'generico'], precioBase: 39.90, conMaterial: false },
    { nombre: 'Polo Deportivo', categoria: 'camisas', marcas: ['nike', 'adidas', 'puma'], precioBase: 79.90, conMaterial: false },
    { nombre: 'Camiseta Estampada', categoria: 'camisas', marcas: ['hm', 'zara'], precioBase: 49.90, conMaterial: false },
    { nombre: 'Pantalón Jean Clásico', categoria: 'pantalones', marcas: ['levis', 'tommy-hilfiger'], precioBase: 149.90, conMaterial: true },
    { nombre: 'Pantalón Chino', categoria: 'pantalones', marcas: ['zara', 'hm', 'calvin-klein'], precioBase: 99.90, conMaterial: false },
    { nombre: 'Pantalón Jogger', categoria: 'pantalones', marcas: ['nike', 'adidas', 'puma'], precioBase: 119.90, conMaterial: false },
    { nombre: 'Short Deportivo', categoria: 'pantalones', marcas: ['nike', 'adidas', 'under-armour'], precioBase: 59.90, conMaterial: false },
    { nombre: 'Pantalón Formal', categoria: 'pantalones', marcas: ['calvin-klein', 'tommy-hilfiger'], precioBase: 159.90, conMaterial: true },
    { nombre: 'Zapato Oxford', categoria: 'zapatos', marcas: ['generico', 'tommy-hilfiger'], precioBase: 199.90, conMaterial: true },
    { nombre: 'Zapato Mocasín', categoria: 'zapatos', marcas: ['generico', 'calvin-klein'], precioBase: 179.90, conMaterial: true },
    { nombre: 'Bota Casual', categoria: 'zapatos', marcas: ['levis', 'generico'], precioBase: 229.90, conMaterial: true },
    { nombre: 'Sandalia Casual', categoria: 'zapatos', marcas: ['nike', 'adidas', 'generico'], precioBase: 89.90, conMaterial: false },
    { nombre: 'Cinturón de Cuero', categoria: 'accesorios', marcas: ['levis', 'tommy-hilfiger', 'calvin-klein'], precioBase: 69.90, conMaterial: true },
    { nombre: 'Billetera Ejecutiva', categoria: 'accesorios', marcas: ['tommy-hilfiger', 'calvin-klein'], precioBase: 89.90, conMaterial: true },
    { nombre: 'Gorra Deportiva', categoria: 'accesorios', marcas: ['nike', 'adidas', 'puma'], precioBase: 49.90, conMaterial: false },
    { nombre: 'Bufanda de Lana', categoria: 'accesorios', marcas: ['zara', 'hm'], precioBase: 59.90, conMaterial: true },
    { nombre: 'Chaqueta Denim', categoria: 'accesorios', marcas: ['levis', 'zara'], precioBase: 189.90, conMaterial: true },
    { nombre: 'Sudadera con Capucha', categoria: 'camisas', marcas: ['nike', 'adidas', 'puma', 'under-armour'], precioBase: 139.90, conMaterial: false },
    { nombre: 'Camisa Hawaiana', categoria: 'camisas', marcas: ['hm', 'zara'], precioBase: 69.90, conMaterial: false },
    { nombre: 'Chaleco Acolchado', categoria: 'accesorios', marcas: ['nike', 'adidas', 'generico'], precioBase: 149.90, conMaterial: false },
    { nombre: 'Corbata de Seda', categoria: 'accesorios', marcas: ['tommy-hilfiger', 'calvin-klein'], precioBase: 79.90, conMaterial: true },
    { nombre: 'Pañuelo de Bolsillo', categoria: 'accesorios', marcas: ['tommy-hilfiger', 'calvin-klein'], precioBase: 29.90, conMaterial: true },
    { nombre: 'Blazer Casual', categoria: 'accesorios', marcas: ['zara', 'hm', 'tommy-hilfiger'], precioBase: 249.90, conMaterial: true },
  ];

  const tallas = getValoresAtributo('talla').slice(0, 4); // S, M, L, XL
  const colores = getValoresAtributo('color').slice(0, 4); // Negro, Blanco, Azul, Gris
  const materiales = getValoresAtributo('material').slice(0, 3); // Algodón, Poliéster, Cuero

  // Helper para crear o obtener variante
  const crearVariante = async (
    productoId: string,
    sku: string,
    nombre: string,
    precioVenta: number,
    precioCompra: number,
    stock: number,
  ) => {
    const existente = await prisma.variante.findFirst({
      where: { productoId, sku },
    });
    if (existente) return existente;

    return prisma.variante.create({
      data: {
        productoId,
        sku,
        nombreVariante: nombre,
        precioVenta,
        precioCompra,
        stock,
        activo: true,
      },
    });
  };

  for (let i = 0; i < productosRopa.length; i++) {
    const prodData = productosRopa[i];
    const categoria = getCategoriaBySlug(prodData.categoria);
    const marcaSlug = prodData.marcas[Math.floor(Math.random() * prodData.marcas.length)];
    const marca = getMarcaBySlug(marcaSlug);

    if (!categoria || !marca) continue;

    const codigoInterno = `ROPA-${String(i + 1).padStart(3, '0')}`;
    const slug = `${prodData.nombre.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`;

    const producto = await prisma.producto.upsert({
      where: {
        empresaId_codigoInterno: { empresaId: empresaDemo.id, codigoInterno },
      },
      update: {},
      create: {
        empresaId: empresaDemo.id,
        categoriaId: categoria.id,
        marcaId: marca.id,
        sku: codigoInterno,
        codigoInterno,
        nombre: prodData.nombre,
        slug,
        descripcionCorta: `${prodData.nombre} de ${marca.nombre}`,
        tipo: 'variable',
        precioVenta: prodData.precioBase,
        precioCompra: prodData.precioBase * 0.6,
        activo: true,
        visiblePos: true,
      },
    });
    totalProductos++;

    // Crear variantes con Talla + Color
    for (const talla of tallas) {
      for (const color of colores.slice(0, 2)) {
        // Solo 2 colores por talla para no explotar
        const varianteSku = `${codigoInterno}-${talla.slug.toUpperCase()}-${color.slug.toUpperCase()}`;
        const precioVariante = prodData.precioBase + randomPrice(-10, 20);

        const variante = await crearVariante(
          producto.id,
          varianteSku,
          `${talla.valor} - ${color.valor}`,
          precioVariante,
          precioVariante * 0.6,
          randomStock(5, 50),
        );

        // Asignar valores de atributo a la variante
        await prisma.varianteValor.upsert({
          where: {
            varianteId_valorAtributoId: { varianteId: variante.id, valorAtributoId: talla.id },
          },
          update: {},
          create: { varianteId: variante.id, valorAtributoId: talla.id },
        });
        await prisma.varianteValor.upsert({
          where: {
            varianteId_valorAtributoId: { varianteId: variante.id, valorAtributoId: color.id },
          },
          update: {},
          create: { varianteId: variante.id, valorAtributoId: color.id },
        });

        totalVariantes++;
      }
    }
  }
  console.log(`  ${productosRopa.length} productos de ropa con variantes`);

  // =====================================================
  // PRODUCTOS ELECTRÓNICOS (20 productos, ~100 variantes)
  // Atributos: Capacidad + Color
  // =====================================================
  console.log('Creando productos de ELECTRÓNICOS...');

  const productosElectronicos = [
    { nombre: 'Smartphone Pro Max', categoria: 'smartphones', marcas: ['samsung', 'apple', 'xiaomi'], precioBase: 2499.90 },
    { nombre: 'Smartphone Lite', categoria: 'smartphones', marcas: ['samsung', 'xiaomi'], precioBase: 899.90 },
    { nombre: 'Smartphone Gaming', categoria: 'smartphones', marcas: ['samsung', 'xiaomi'], precioBase: 1899.90 },
    { nombre: 'Tablet Pro', categoria: 'tablets', marcas: ['samsung', 'apple', 'lenovo'], precioBase: 1799.90 },
    { nombre: 'Tablet Educativa', categoria: 'tablets', marcas: ['samsung', 'lenovo', 'xiaomi'], precioBase: 699.90 },
    { nombre: 'Laptop Ultrabook', categoria: 'laptops', marcas: ['hp', 'dell', 'lenovo'], precioBase: 3499.90 },
    { nombre: 'Laptop Gamer', categoria: 'laptops', marcas: ['hp', 'dell', 'lenovo'], precioBase: 4999.90 },
    { nombre: 'Laptop Oficina', categoria: 'laptops', marcas: ['hp', 'dell', 'lenovo'], precioBase: 2199.90 },
    { nombre: 'Audífonos Bluetooth Premium', categoria: 'audio', marcas: ['sony', 'bose', 'jbl'], precioBase: 599.90 },
    { nombre: 'Audífonos Gaming', categoria: 'audio', marcas: ['sony', 'jbl'], precioBase: 349.90 },
    { nombre: 'Parlante Portátil', categoria: 'audio', marcas: ['jbl', 'bose', 'sony'], precioBase: 299.90 },
    { nombre: 'Soundbar Home Theater', categoria: 'audio', marcas: ['sony', 'lg', 'samsung'], precioBase: 899.90 },
    { nombre: 'Cargador Rápido USB-C', categoria: 'accesorios-tech', marcas: ['samsung', 'apple', 'xiaomi'], precioBase: 79.90 },
    { nombre: 'Cable USB-C Premium', categoria: 'accesorios-tech', marcas: ['samsung', 'apple', 'generico'], precioBase: 39.90 },
    { nombre: 'Power Bank 20000mAh', categoria: 'accesorios-tech', marcas: ['samsung', 'xiaomi', 'generico'], precioBase: 129.90 },
    { nombre: 'Funda Protectora', categoria: 'accesorios-tech', marcas: ['generico', 'samsung', 'apple'], precioBase: 49.90 },
    { nombre: 'Smartwatch Deportivo', categoria: 'accesorios-tech', marcas: ['samsung', 'apple', 'xiaomi'], precioBase: 799.90 },
    { nombre: 'Mouse Inalámbrico', categoria: 'accesorios-tech', marcas: ['hp', 'dell', 'lenovo'], precioBase: 89.90 },
    { nombre: 'Teclado Mecánico', categoria: 'accesorios-tech', marcas: ['hp', 'dell', 'generico'], precioBase: 249.90 },
    { nombre: 'Monitor 27 pulgadas', categoria: 'accesorios-tech', marcas: ['samsung', 'lg', 'dell'], precioBase: 899.90 },
  ];

  const capacidades = getValoresAtributo('capacidad').slice(0, 4); // 64GB, 128GB, 256GB, 512GB
  const coloresElec = getValoresAtributo('color').slice(0, 3); // Negro, Blanco, Azul

  for (let i = 0; i < productosElectronicos.length; i++) {
    const prodData = productosElectronicos[i];
    const categoria = getCategoriaBySlug(prodData.categoria);
    const marcaSlug = prodData.marcas[Math.floor(Math.random() * prodData.marcas.length)];
    const marca = getMarcaBySlug(marcaSlug);

    if (!categoria || !marca) continue;

    const codigoInterno = `ELEC-${String(i + 1).padStart(3, '0')}`;
    const slug = `${prodData.nombre.toLowerCase().replace(/\s+/g, '-')}-elec-${i + 1}`;

    const producto = await prisma.producto.upsert({
      where: {
        empresaId_codigoInterno: { empresaId: empresaDemo.id, codigoInterno },
      },
      update: {},
      create: {
        empresaId: empresaDemo.id,
        categoriaId: categoria.id,
        marcaId: marca.id,
        sku: codigoInterno,
        codigoInterno,
        nombre: prodData.nombre,
        slug,
        descripcionCorta: `${prodData.nombre} de ${marca.nombre}`,
        tipo: 'variable',
        precioVenta: prodData.precioBase,
        precioCompra: prodData.precioBase * 0.7,
        activo: true,
        visiblePos: true,
      },
    });
    totalProductos++;

    // Productos con capacidad (smartphones, tablets, laptops)
    if (['smartphones', 'tablets', 'laptops'].includes(prodData.categoria)) {
      for (const capacidad of capacidades.slice(0, 3)) {
        for (const color of coloresElec.slice(0, 2)) {
          const varianteSku = `${codigoInterno}-${capacidad.slug.toUpperCase()}-${color.slug.toUpperCase()}`;
          const precioVariante = prodData.precioBase + (capacidades.indexOf(capacidad) * 200);

          const variante = await crearVariante(
            producto.id,
            varianteSku,
            `${capacidad.valor} - ${color.valor}`,
            precioVariante,
            precioVariante * 0.7,
            randomStock(3, 20),
          );

          await prisma.varianteValor.upsert({
            where: {
              varianteId_valorAtributoId: { varianteId: variante.id, valorAtributoId: capacidad.id },
            },
            update: {},
            create: { varianteId: variante.id, valorAtributoId: capacidad.id },
          });
          await prisma.varianteValor.upsert({
            where: {
              varianteId_valorAtributoId: { varianteId: variante.id, valorAtributoId: color.id },
            },
            update: {},
            create: { varianteId: variante.id, valorAtributoId: color.id },
          });

          totalVariantes++;
        }
      }
    } else {
      // Productos solo con color
      for (const color of coloresElec) {
        const varianteSku = `${codigoInterno}-${color.slug.toUpperCase()}`;

        const variante = await crearVariante(
          producto.id,
          varianteSku,
          color.valor,
          prodData.precioBase,
          prodData.precioBase * 0.7,
          randomStock(5, 30),
        );

        await prisma.varianteValor.upsert({
          where: {
            varianteId_valorAtributoId: { varianteId: variante.id, valorAtributoId: color.id },
          },
          update: {},
          create: { varianteId: variante.id, valorAtributoId: color.id },
        });

        totalVariantes++;
      }
    }
  }
  console.log(`  ${productosElectronicos.length} productos electrónicos con variantes`);

  // =====================================================
  // PRODUCTOS DEPORTIVOS (20 productos, ~80 variantes)
  // Atributos: Talla + Color
  // =====================================================
  console.log('Creando productos de DEPORTES...');

  const productosDeportes = [
    { nombre: 'Zapatilla Running Pro', categoria: 'zapatillas-deportivas', marcas: ['nike', 'adidas', 'puma'], precioBase: 399.90 },
    { nombre: 'Zapatilla Training', categoria: 'zapatillas-deportivas', marcas: ['nike', 'adidas', 'under-armour'], precioBase: 349.90 },
    { nombre: 'Zapatilla Casual Sport', categoria: 'zapatillas-deportivas', marcas: ['nike', 'adidas', 'puma'], precioBase: 299.90 },
    { nombre: 'Zapatilla Basketball', categoria: 'zapatillas-deportivas', marcas: ['nike', 'adidas'], precioBase: 499.90 },
    { nombre: 'Zapatilla Fútbol', categoria: 'zapatillas-deportivas', marcas: ['nike', 'adidas', 'puma'], precioBase: 379.90 },
    { nombre: 'Camiseta Dry-Fit', categoria: 'ropa-deportiva', marcas: ['nike', 'adidas', 'under-armour'], precioBase: 89.90 },
    { nombre: 'Short Running', categoria: 'ropa-deportiva', marcas: ['nike', 'adidas', 'puma'], precioBase: 69.90 },
    { nombre: 'Leggins Deportivo', categoria: 'ropa-deportiva', marcas: ['nike', 'adidas', 'under-armour'], precioBase: 99.90 },
    { nombre: 'Chaqueta Deportiva', categoria: 'ropa-deportiva', marcas: ['nike', 'adidas', 'puma'], precioBase: 199.90 },
    { nombre: 'Top Deportivo', categoria: 'ropa-deportiva', marcas: ['nike', 'adidas', 'under-armour'], precioBase: 79.90 },
    { nombre: 'Balón de Fútbol Oficial', categoria: 'equipos', marcas: ['nike', 'adidas', 'puma'], precioBase: 129.90 },
    { nombre: 'Balón de Basketball', categoria: 'equipos', marcas: ['nike', 'adidas'], precioBase: 99.90 },
    { nombre: 'Raqueta de Tenis', categoria: 'equipos', marcas: ['nike', 'adidas', 'generico'], precioBase: 249.90 },
    { nombre: 'Guantes de Box', categoria: 'equipos', marcas: ['nike', 'adidas', 'generico'], precioBase: 149.90 },
    { nombre: 'Mancuernas Set', categoria: 'equipos', marcas: ['generico'], precioBase: 199.90 },
    { nombre: 'Mochila Deportiva', categoria: 'accesorios-deportivos', marcas: ['nike', 'adidas', 'puma'], precioBase: 149.90 },
    { nombre: 'Botella Térmica', categoria: 'accesorios-deportivos', marcas: ['nike', 'adidas', 'generico'], precioBase: 59.90 },
    { nombre: 'Toalla Deportiva', categoria: 'accesorios-deportivos', marcas: ['nike', 'adidas', 'generico'], precioBase: 39.90 },
    { nombre: 'Banda Elástica Set', categoria: 'accesorios-deportivos', marcas: ['nike', 'adidas', 'generico'], precioBase: 49.90 },
    { nombre: 'Rodillera Protectora', categoria: 'accesorios-deportivos', marcas: ['nike', 'adidas', 'generico'], precioBase: 69.90 },
  ];

  const tallasDeporte = getValoresAtributo('talla').slice(0, 4);
  const coloresDeporte = getValoresAtributo('color').slice(0, 3);

  for (let i = 0; i < productosDeportes.length; i++) {
    const prodData = productosDeportes[i];
    const categoria = getCategoriaBySlug(prodData.categoria);
    const marcaSlug = prodData.marcas[Math.floor(Math.random() * prodData.marcas.length)];
    const marca = getMarcaBySlug(marcaSlug);

    if (!categoria || !marca) continue;

    const codigoInterno = `DEP-${String(i + 1).padStart(3, '0')}`;
    const slug = `${prodData.nombre.toLowerCase().replace(/\s+/g, '-')}-dep-${i + 1}`;

    const producto = await prisma.producto.upsert({
      where: {
        empresaId_codigoInterno: { empresaId: empresaDemo.id, codigoInterno },
      },
      update: {},
      create: {
        empresaId: empresaDemo.id,
        categoriaId: categoria.id,
        marcaId: marca.id,
        sku: codigoInterno,
        codigoInterno,
        nombre: prodData.nombre,
        slug,
        descripcionCorta: `${prodData.nombre} de ${marca.nombre}`,
        tipo: 'variable',
        precioVenta: prodData.precioBase,
        precioCompra: prodData.precioBase * 0.6,
        activo: true,
        visiblePos: true,
      },
    });
    totalProductos++;

    // Productos con talla (ropa y zapatillas)
    if (['zapatillas-deportivas', 'ropa-deportiva'].includes(prodData.categoria)) {
      for (const talla of tallasDeporte.slice(0, 3)) {
        for (const color of coloresDeporte.slice(0, 2)) {
          const varianteSku = `${codigoInterno}-${talla.slug.toUpperCase()}-${color.slug.toUpperCase()}`;

          const variante = await crearVariante(
            producto.id,
            varianteSku,
            `${talla.valor} - ${color.valor}`,
            prodData.precioBase,
            prodData.precioBase * 0.6,
            randomStock(5, 30),
          );

          await prisma.varianteValor.upsert({
            where: {
              varianteId_valorAtributoId: { varianteId: variante.id, valorAtributoId: talla.id },
            },
            update: {},
            create: { varianteId: variante.id, valorAtributoId: talla.id },
          });
          await prisma.varianteValor.upsert({
            where: {
              varianteId_valorAtributoId: { varianteId: variante.id, valorAtributoId: color.id },
            },
            update: {},
            create: { varianteId: variante.id, valorAtributoId: color.id },
          });

          totalVariantes++;
        }
      }
    } else {
      // Productos solo con color
      for (const color of coloresDeporte) {
        const varianteSku = `${codigoInterno}-${color.slug.toUpperCase()}`;

        const variante = await crearVariante(
          producto.id,
          varianteSku,
          color.valor,
          prodData.precioBase,
          prodData.precioBase * 0.6,
          randomStock(10, 50),
        );

        await prisma.varianteValor.upsert({
          where: {
            varianteId_valorAtributoId: { varianteId: variante.id, valorAtributoId: color.id },
          },
          update: {},
          create: { varianteId: variante.id, valorAtributoId: color.id },
        });

        totalVariantes++;
      }
    }
  }
  console.log(`  ${productosDeportes.length} productos deportivos con variantes`);

  // =====================================================
  // PRODUCTOS HOGAR (20 productos, ~40 variantes)
  // Atributos: Color
  // =====================================================
  console.log('Creando productos de HOGAR...');

  const productosHogar = [
    { nombre: 'Lámpara de Mesa Moderna', categoria: 'decoracion', marcas: ['generico', 'lg'], precioBase: 89.90 },
    { nombre: 'Cuadro Decorativo Grande', categoria: 'decoracion', marcas: ['generico'], precioBase: 129.90 },
    { nombre: 'Espejo de Pared', categoria: 'decoracion', marcas: ['generico'], precioBase: 149.90 },
    { nombre: 'Florero Cerámico', categoria: 'decoracion', marcas: ['generico'], precioBase: 49.90 },
    { nombre: 'Reloj de Pared', categoria: 'decoracion', marcas: ['generico', 'sony'], precioBase: 79.90 },
    { nombre: 'Sartén Antiadherente', categoria: 'cocina', marcas: ['generico'], precioBase: 69.90 },
    { nombre: 'Set de Ollas 5 piezas', categoria: 'cocina', marcas: ['generico'], precioBase: 199.90 },
    { nombre: 'Licuadora Potente', categoria: 'cocina', marcas: ['lg', 'samsung', 'generico'], precioBase: 149.90 },
    { nombre: 'Tostadora 4 Rebanadas', categoria: 'cocina', marcas: ['lg', 'samsung', 'generico'], precioBase: 89.90 },
    { nombre: 'Cafetera Programable', categoria: 'cocina', marcas: ['lg', 'samsung', 'generico'], precioBase: 179.90 },
    { nombre: 'Toalla de Baño Premium', categoria: 'bano', marcas: ['generico'], precioBase: 49.90 },
    { nombre: 'Set de Toallas 6 piezas', categoria: 'bano', marcas: ['generico'], precioBase: 129.90 },
    { nombre: 'Cortina de Baño', categoria: 'bano', marcas: ['generico'], precioBase: 39.90 },
    { nombre: 'Organizador de Baño', categoria: 'bano', marcas: ['generico'], precioBase: 59.90 },
    { nombre: 'Báscula Digital', categoria: 'bano', marcas: ['generico', 'xiaomi'], precioBase: 79.90 },
    { nombre: 'Silla de Escritorio', categoria: 'muebles', marcas: ['generico'], precioBase: 299.90 },
    { nombre: 'Mesa Auxiliar', categoria: 'muebles', marcas: ['generico'], precioBase: 149.90 },
    { nombre: 'Estante Flotante', categoria: 'muebles', marcas: ['generico'], precioBase: 69.90 },
    { nombre: 'Organizador Multiuso', categoria: 'muebles', marcas: ['generico'], precioBase: 99.90 },
    { nombre: 'Cojín Decorativo', categoria: 'decoracion', marcas: ['generico'], precioBase: 29.90 },
  ];

  const coloresHogar = getValoresAtributo('color').slice(0, 3);

  for (let i = 0; i < productosHogar.length; i++) {
    const prodData = productosHogar[i];
    const categoria = getCategoriaBySlug(prodData.categoria);
    const marcaSlug = prodData.marcas[Math.floor(Math.random() * prodData.marcas.length)];
    const marca = getMarcaBySlug(marcaSlug);

    if (!categoria || !marca) continue;

    const codigoInterno = `HOG-${String(i + 1).padStart(3, '0')}`;
    const slug = `${prodData.nombre.toLowerCase().replace(/\s+/g, '-')}-hog-${i + 1}`;

    const producto = await prisma.producto.upsert({
      where: {
        empresaId_codigoInterno: { empresaId: empresaDemo.id, codigoInterno },
      },
      update: {},
      create: {
        empresaId: empresaDemo.id,
        categoriaId: categoria.id,
        marcaId: marca.id,
        sku: codigoInterno,
        codigoInterno,
        nombre: prodData.nombre,
        slug,
        descripcionCorta: `${prodData.nombre} de alta calidad`,
        tipo: 'variable',
        precioVenta: prodData.precioBase,
        precioCompra: prodData.precioBase * 0.5,
        activo: true,
        visiblePos: true,
      },
    });
    totalProductos++;

    // Variantes por color
    for (const color of coloresHogar.slice(0, 2)) {
      const varianteSku = `${codigoInterno}-${color.slug.toUpperCase()}`;

      const variante = await crearVariante(
        producto.id,
        varianteSku,
        color.valor,
        prodData.precioBase,
        prodData.precioBase * 0.5,
        randomStock(10, 40),
      );

      await prisma.varianteValor.upsert({
        where: {
          varianteId_valorAtributoId: { varianteId: variante.id, valorAtributoId: color.id },
        },
        update: {},
        create: { varianteId: variante.id, valorAtributoId: color.id },
      });

      totalVariantes++;
    }
  }
  console.log(`  ${productosHogar.length} productos de hogar con variantes`);

  // =====================================================
  // PRODUCTOS ALIMENTOS (15 productos, ~30 variantes)
  // Atributos: Tamaño (algunos)
  // =====================================================
  console.log('Creando productos de ALIMENTOS...');

  const productosAlimentos = [
    { nombre: 'Gaseosa Cola', categoria: 'bebidas', marcas: ['coca-cola', 'pepsi'], precioBase: 5.90, conTamano: true },
    { nombre: 'Agua Mineral', categoria: 'bebidas', marcas: ['generico', 'nestle'], precioBase: 2.50, conTamano: true },
    { nombre: 'Jugo Natural', categoria: 'bebidas', marcas: ['gloria', 'generico'], precioBase: 4.90, conTamano: true },
    { nombre: 'Energizante', categoria: 'bebidas', marcas: ['generico'], precioBase: 7.90, conTamano: false },
    { nombre: 'Papas Fritas', categoria: 'snacks', marcas: ['generico'], precioBase: 6.90, conTamano: true },
    { nombre: 'Galletas Surtidas', categoria: 'snacks', marcas: ['nestle', 'generico'], precioBase: 8.90, conTamano: false },
    { nombre: 'Chocolates Mix', categoria: 'snacks', marcas: ['nestle', 'generico'], precioBase: 12.90, conTamano: false },
    { nombre: 'Frutos Secos', categoria: 'snacks', marcas: ['generico'], precioBase: 15.90, conTamano: true },
    { nombre: 'Leche Fresca', categoria: 'lacteos', marcas: ['gloria', 'nestle'], precioBase: 4.90, conTamano: true },
    { nombre: 'Yogurt Natural', categoria: 'lacteos', marcas: ['gloria', 'nestle'], precioBase: 6.90, conTamano: true },
    { nombre: 'Queso Fresco', categoria: 'lacteos', marcas: ['gloria', 'generico'], precioBase: 12.90, conTamano: false },
    { nombre: 'Mantequilla', categoria: 'lacteos', marcas: ['gloria', 'generico'], precioBase: 8.90, conTamano: false },
    { nombre: 'Atún en Conserva', categoria: 'conservas', marcas: ['generico'], precioBase: 7.90, conTamano: false },
    { nombre: 'Duraznos en Almíbar', categoria: 'conservas', marcas: ['generico'], precioBase: 9.90, conTamano: false },
    { nombre: 'Frijoles en Lata', categoria: 'conservas', marcas: ['generico'], precioBase: 5.90, conTamano: false },
  ];

  const tamanos = getValoresAtributo('tamano');

  for (let i = 0; i < productosAlimentos.length; i++) {
    const prodData = productosAlimentos[i];
    const categoria = getCategoriaBySlug(prodData.categoria);
    const marcaSlug = prodData.marcas[Math.floor(Math.random() * prodData.marcas.length)];
    const marca = getMarcaBySlug(marcaSlug);

    if (!categoria || !marca) continue;

    const codigoInterno = `ALI-${String(i + 1).padStart(3, '0')}`;
    const slug = `${prodData.nombre.toLowerCase().replace(/\s+/g, '-')}-ali-${i + 1}`;

    const producto = await prisma.producto.upsert({
      where: {
        empresaId_codigoInterno: { empresaId: empresaDemo.id, codigoInterno },
      },
      update: {},
      create: {
        empresaId: empresaDemo.id,
        categoriaId: categoria.id,
        marcaId: marca.id,
        sku: codigoInterno,
        codigoInterno,
        nombre: prodData.nombre,
        slug,
        descripcionCorta: `${prodData.nombre} de ${marca.nombre}`,
        tipo: prodData.conTamano ? 'variable' : 'simple',
        precioVenta: prodData.precioBase,
        precioCompra: prodData.precioBase * 0.6,
        activo: true,
        visiblePos: true,
      },
    });
    totalProductos++;

    if (prodData.conTamano && tamanos.length > 0) {
      for (const tamano of tamanos.slice(0, 3)) {
        const varianteSku = `${codigoInterno}-${tamano.slug.toUpperCase()}`;
        const precioVariante =
          tamano.slug === 'pequeno'
            ? prodData.precioBase
            : tamano.slug === 'mediano'
              ? prodData.precioBase * 1.5
              : prodData.precioBase * 2;

        const variante = await crearVariante(
          producto.id,
          varianteSku,
          tamano.valor,
          precioVariante,
          precioVariante * 0.6,
          randomStock(20, 100),
        );

        await prisma.varianteValor.upsert({
          where: {
            varianteId_valorAtributoId: { varianteId: variante.id, valorAtributoId: tamano.id },
          },
          update: {},
          create: { varianteId: variante.id, valorAtributoId: tamano.id },
        });

        totalVariantes++;
      }
    } else {
      // Producto simple - una variante default
      const varianteSku = `${codigoInterno}-DEFAULT`;

      await crearVariante(
        producto.id,
        varianteSku,
        'Default',
        prodData.precioBase,
        prodData.precioBase * 0.6,
        randomStock(30, 150),
      );

      totalVariantes++;
    }
  }
  console.log(`  ${productosAlimentos.length} productos de alimentos con variantes`);

  console.log('\n========================================');
  console.log(`TOTAL: ${totalProductos} PRODUCTOS, ${totalVariantes} VARIANTES`);
  console.log('========================================');

  // =====================================================
  // 13. CREAR STOCK EN SUCURSAL PARA VARIANTES
  // =====================================================
  console.log('\nCreando stock en sucursal principal...');

  const todasVariantes = await prisma.variante.findMany({
    where: {
      producto: { empresaId: empresaDemo.id },
    },
    select: { id: true, stock: true },
  });

  for (const variante of todasVariantes) {
    await prisma.stockSucursal.upsert({
      where: {
        varianteId_sucursalId: { varianteId: variante.id, sucursalId: sucursalDemo.id },
      },
      update: { stock: variante.stock || 0 },
      create: {
        varianteId: variante.id,
        sucursalId: sucursalDemo.id,
        stock: variante.stock || 0,
        stockMinimo: 5,
        stockMaximo: 100,
      },
    });
  }
  console.log(`  Stock creado para ${todasVariantes.length} variantes`);

  // =====================================================
  // RESUMEN FINAL
  // =====================================================
  console.log('\n========================================');
  console.log('SEED COMPLETADO EXITOSAMENTE!');
  console.log('========================================');
  console.log('\nDatos creados:');
  console.log('  - 38 permisos del sistema');
  console.log('  - 6 roles (super_admin, admin, supervisor, cajero, almacenero, vendedor)');
  console.log('  - 1 empresa demo: "Tienda Demo"');
  console.log('  - 1 sucursal: "Sucursal Principal"');
  console.log('  - 5 usuarios demo');
  console.log('  - 26 categorías (5 principales + 21 subcategorías)');
  console.log('  - 24 marcas');
  console.log('  - 5 atributos con valores (Talla, Color, Material, Capacidad, Tamaño)');
  console.log(`  - ${totalProductos} productos`);
  console.log(`  - ${totalVariantes} variantes`);
  console.log('  - Stock asignado a todas las variantes');
  console.log('  - 6 métodos de pago');
  console.log('\n┌───────────────────────────────────────────────────────┐');
  console.log('│       CREDENCIALES DE ACCESO (Password: admin123)     │');
  console.log('├───────────────────────────────────────────────────────┤');
  console.log('│                                                       │');
  console.log('│  🔑 SUPER ADMIN (Dueño del SaaS):                     │');
  console.log('│     superadmin@pos-saas.com → Control total del SaaS  │');
  console.log('│                                                       │');
  console.log('│  🏪 ADMIN NEGOCIO (Dueño de Tienda Demo):             │');
  console.log('│     admin@demo.com → Administrador del negocio        │');
  console.log('│                                                       │');
  console.log('│  👥 OTROS USUARIOS (Tienda Demo):                     │');
  console.log('│     supervisor@demo.com → Supervisor de tienda        │');
  console.log('│     cajero@demo.com     → Cajero                      │');
  console.log('│     almacen@demo.com    → Encargado de almacén        │');
  console.log('│     vendedor@demo.com   → Vendedor                    │');
  console.log('│                                                       │');
  console.log('└───────────────────────────────────────────────────────┘');
  console.log('\n┌─────────────────────────────────────────────────┐');
  console.log('│              PRODUCTOS POR CATEGORÍA            │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log('│  Ropa          → 25 productos (~200 variantes)  │');
  console.log('│  Electrónicos  → 20 productos (~100 variantes)  │');
  console.log('│  Deportes      → 20 productos (~80 variantes)   │');
  console.log('│  Hogar         → 20 productos (~40 variantes)   │');
  console.log('│  Alimentos     → 15 productos (~30 variantes)   │');
  console.log('└─────────────────────────────────────────────────┘');
  console.log('\nURL: http://localhost:3000/login');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
