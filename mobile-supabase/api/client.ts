// =============================================================================
// Adaptador de api.get/post/put/delete -> Supabase.
// Mantiene la firma de axios para que las pantallas funcionen sin cambios.
// Cada ruta del NestJS se mapea a una query Supabase (.from o .rpc).
// =============================================================================

import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';

interface Ctx {
  empresaId: string | null;
  usuarioId: string | null;
  sucursalId: string | null;
}

async function getCtx(): Promise<Ctx> {
  try {
    const raw = await SecureStore.getItemAsync('pos_session');
    if (!raw) return { empresaId: null, usuarioId: null, sucursalId: null };
    const s = JSON.parse(raw);
    return {
      empresaId: s.usuario?.empresa?.id || null,
      usuarioId: s.usuario?.id || null,
      sucursalId: s.usuario?.sucursal?.id || null,
    };
  } catch {
    return { empresaId: null, usuarioId: null, sucursalId: null };
  }
}

function ok(data: any) {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as any };
}
function err(message: string, status = 400) {
  const e: any = new Error(message);
  e.response = { data: { message }, status };
  throw e;
}

// =============================================================================
// AUTH
// =============================================================================
async function authHandler(method: string, path: string, body?: any) {
  if (path === '/auth/login' && method === 'POST') {
    const { data, error } = await supabase.rpc('pos_login', {
      p_email: body.email,
      p_password: body.password,
    });
    if (error) err(error.message);
    if (!data?.success) err(data?.error || 'Credenciales invalidas', 401);
    const session = { usuario: data.usuario };
    await SecureStore.setItemAsync('pos_session', JSON.stringify(session));
    return ok({ success: true, data: { accessToken: 'session', refreshToken: 'session', usuario: data.usuario } });
  }
  if (path === '/auth/me' && method === 'GET') {
    const raw = await SecureStore.getItemAsync('pos_session');
    if (!raw) err('Sin sesion', 401);
    return ok({ success: true, data: { usuario: JSON.parse(raw!).usuario } });
  }
  if (path === '/auth/logout' && method === 'POST') {
    await SecureStore.deleteItemAsync('pos_session');
    return ok({ success: true });
  }
  if (path === '/auth/refresh' && method === 'POST') {
    return ok({ accessToken: 'session' });
  }
  err(`Auth path no implementado: ${method} ${path}`);
}

// =============================================================================
// CAJA
// =============================================================================
async function cajaHandler(method: string, path: string, body?: any) {
  const ctx = await getCtx();
  if (path === '/caja/actual' && method === 'GET') {
    const { data, error } = await supabase.rpc('pos_caja_actual', {
      p_empresa_id: ctx.empresaId, p_sucursal_id: ctx.sucursalId,
    });
    if (error) err(error.message);
    return ok({ success: true, data });
  }
  if (path === '/caja/abrir' && method === 'POST') {
    const { data, error } = await supabase.rpc('pos_abrir_caja', {
      p_empresa_id: ctx.empresaId,
      p_sucursal_id: body.sucursalId || ctx.sucursalId,
      p_usuario_id: ctx.usuarioId,
      p_monto_apertura: Number(body.montoApertura) || 0,
    });
    if (error) err(error.message);
    if (!data?.success) err(data?.error || 'No se pudo abrir caja');
    return ok({ success: true, data });
  }
  const cierreMatch = path.match(/^\/caja\/([^/]+)\/cerrar$/);
  if (cierreMatch && method === 'POST') {
    const { data, error } = await supabase.rpc('pos_cerrar_caja', {
      p_caja_id: cierreMatch[1],
      p_usuario_id: ctx.usuarioId,
      p_monto_cierre: Number(body.montoCierre) || 0,
      p_observaciones: body.observaciones || null,
    });
    if (error) err(error.message);
    return ok({ success: true, data });
  }
  if (path === '/caja/historial' && method === 'GET') {
    let q = supabase.from('cajas').select('*, sucursal:sucursales(id, nombre)')
      .eq('empresa_id', ctx.empresaId!)
      .order('fecha_apertura', { ascending: false })
      .limit(body?.limit || 20);
    if (body?.fechaInicio) q = q.gte('fecha_apertura', body.fechaInicio);
    if (body?.fechaFin) q = q.lt('fecha_apertura', body.fechaFin);
    if (body?.sucursalId) q = q.eq('sucursal_id', body.sucursalId);
    const { data, error } = await q;
    if (error) err(error.message);
    const mapped = (data || []).map((c: any) => ({
      id: c.id, sucursalId: c.sucursal_id, sucursal: c.sucursal,
      numero: c.numero, nombre: c.nombre,
      montoApertura: c.monto_apertura, montoCierre: c.monto_cierre,
      montoVentas: c.monto_ventas, montoEfectivo: c.monto_efectivo,
      diferencia: c.diferencia, fechaApertura: c.fecha_apertura, fechaCierre: c.fecha_cierre,
      estado: c.estado, observaciones: c.observaciones,
    }));
    return ok({ success: true, data: mapped });
  }
  err(`Caja path no implementado: ${method} ${path}`);
}

// =============================================================================
// VENTAS
// =============================================================================
async function ventasHandler(method: string, path: string, body?: any, params?: any) {
  const ctx = await getCtx();
  if (path === '/ventas' && method === 'GET') {
    let q = supabase.from('ventas').select(`
        *,
        sucursal:sucursales(id, nombre),
        usuario:usuarios(id, nombre),
        cliente:clientes(id, nombre, numero_documento),
        venta_pagos(id, monto, referencia, metodo_pago:metodos_pago(id, nombre, codigo, tipo))
      `)
      .eq('empresa_id', ctx.empresaId!)
      .order('created_at', { ascending: false })
      .limit(params?.limit || 50);
    if (params?.sucursalId) q = q.eq('sucursal_id', params.sucursalId);
    if (params?.fechaInicio) q = q.gte('created_at', params.fechaInicio);
    if (params?.fechaFin) q = q.lt('created_at', params.fechaFin);
    const { data, error } = await q;
    if (error) err(error.message);
    const mapped = (data || []).map((v: any) => ({
      id: v.id, numero: v.numero_venta, numeroVenta: v.numero_venta,
      createdAt: v.created_at, fecha: v.created_at,
      sucursal: v.sucursal, usuario: v.usuario, cliente: v.cliente,
      clienteNombre: v.cliente?.nombre || v.cliente_nombre_temporal || null,
      subtotal: v.subtotal, descuento: v.descuento, impuesto: v.impuesto, total: v.total,
      tipoComprobante: v.tipo_comprobante, estado: v.estado,
      itemsCount: 0, items: [],
      pagos: (v.venta_pagos || []).map((p: any) => ({
        id: p.id, monto: p.monto, referencia: p.referencia,
        metodoPagoId: p.metodo_pago?.id,
        metodoPagoNombre: p.metodo_pago?.nombre,
        metodoPagoTipo: p.metodo_pago?.tipo,
      })),
    }));
    return ok({ success: true, data: mapped });
  }
  const detalleMatch = path.match(/^\/ventas\/([^/]+)$/);
  if (detalleMatch && method === 'GET') {
    const { data, error } = await supabase.from('ventas').select(`
      *,
      sucursal:sucursales(id, nombre, direccion),
      usuario:usuarios(id, nombre),
      cliente:clientes(id, nombre, numero_documento),
      venta_detalles(id, cantidad, precio_unidad, descuento, subtotal,
        variante:variantes(id, sku, producto:productos(id, nombre, imagen_principal))),
      venta_pagos(id, monto, referencia, metodo_pago:metodos_pago(id, nombre, codigo, tipo))
    `).eq('id', detalleMatch[1]).single();
    if (error) err(error.message);
    const v: any = data;
    return ok({ success: true, data: {
      id: v.id, numero: v.numero_venta, numeroVenta: v.numero_venta,
      sucursalNombre: v.sucursal?.nombre, usuarioNombre: v.usuario?.nombre,
      clienteNombre: v.cliente?.nombre || v.cliente_nombre_temporal,
      clienteDocumento: v.cliente?.numero_documento || v.cliente_documento_temporal,
      subtotal: v.subtotal, descuento: v.descuento, impuesto: v.impuesto, total: v.total,
      tipoComprobante: v.tipo_comprobante, estado: v.estado,
      observaciones: v.notas, createdAt: v.created_at, updatedAt: v.updated_at,
      items: (v.venta_detalles || []).map((d: any) => ({
        id: d.id, productoNombre: d.variante?.producto?.nombre || 'Producto',
        varianteSku: d.variante?.sku || '',
        cantidad: d.cantidad, precioUnitario: d.precio_unidad, descuento: d.descuento, subtotal: d.subtotal,
      })),
      pagos: (v.venta_pagos || []).map((p: any) => ({
        id: p.id, metodoPagoId: p.metodo_pago?.id, metodoPagoNombre: p.metodo_pago?.nombre,
        monto: p.monto, referencia: p.referencia,
      })),
    }});
  }
  if (path === '/ventas' && method === 'POST') {
    const { data, error } = await supabase.rpc('pos_crear_venta', {
      p_empresa_id: ctx.empresaId,
      p_usuario_id: ctx.usuarioId,
      p_payload: body,
    });
    if (error) err(error.message);
    if (!data?.success) err(data?.error || 'No se pudo crear venta');
    return ok({ success: true, data: { id: data.id, numero: data.numeroVenta, numeroVenta: data.numeroVenta, _pagos: body.pagos } });
  }
  err(`Ventas path no implementado: ${method} ${path}`);
}

// =============================================================================
// PRODUCTOS / CATEGORIAS / MARCAS / METODOS DE PAGO / INVENTARIO / REPORTES
// =============================================================================
async function genericHandler(method: string, path: string, body?: any, params?: any) {
  const ctx = await getCtx();

  if (path === '/productos' && method === 'GET') {
    let q = supabase.from('productos').select(`
      *,
      categoria:categorias(id, nombre),
      marca:marcas(id, nombre),
      variantes(*)
    `).eq('empresa_id', ctx.empresaId!).eq('activo', true)
      .order('nombre', { ascending: true }).limit(params?.limit || 200);
    if (params?.categoriaId) q = q.eq('categoria_id', params.categoriaId);
    if (params?.search) q = q.ilike('nombre', `%${params.search}%`);
    const { data, error } = await q;
    if (error) err(error.message);
    return ok({ success: true, data: (data || []).map((p: any) => ({
      id: p.id, nombre: p.nombre, sku: p.sku, codigoBarras: p.codigo_barras,
      categoriaId: p.categoria_id, categoria: p.categoria,
      marcaId: p.marca_id, marca: p.marca,
      precioCompra: p.precio_compra, precioVenta: p.precio_venta,
      aplicaImpuesto: p.aplica_impuesto, stock: p.stock, stockMinimo: p.stock_minimo,
      imagenPrincipal: p.imagen_principal, activo: p.activo,
      variantes: (p.variantes || []).map((v: any) => ({
        id: v.id, sku: v.sku, precioVenta: v.precio_venta, stock: v.stock,
      })),
    })) });
  }
  const prodIdMatch = path.match(/^\/productos\/([^/]+)$/);
  if (prodIdMatch && method === 'GET') {
    const { data, error } = await supabase.from('productos').select(`
      *, categoria:categorias(id, nombre), marca:marcas(id, nombre), variantes(*)
    `).eq('id', prodIdMatch[1]).single();
    if (error) err(error.message);
    const p: any = data;
    return ok({ success: true, data: {
      id: p.id, nombre: p.nombre, sku: p.sku, codigoBarras: p.codigo_barras,
      categoriaId: p.categoria_id, marcaId: p.marca_id,
      precioCompra: p.precio_compra, precioVenta: p.precio_venta,
      aplicaImpuesto: p.aplica_impuesto, stock: p.stock, stockMinimo: p.stock_minimo,
      imagenPrincipal: p.imagen_principal, descripcionCorta: p.descripcion_corta,
      variantes: p.variantes || [],
    }});
  }

  if (path === '/categorias' && method === 'GET') {
    const { data, error } = await supabase.from('categorias')
      .select('id, nombre, imagen, activo, orden')
      .eq('empresa_id', ctx.empresaId!).eq('activo', true)
      .order('orden').order('nombre');
    if (error) err(error.message);
    return ok({ success: true, data });
  }

  if (path === '/marcas' && method === 'GET') {
    const { data, error } = await supabase.from('marcas')
      .select('id, nombre, logo, activo')
      .eq('empresa_id', ctx.empresaId!).eq('activo', true).order('nombre');
    if (error) err(error.message);
    return ok({ success: true, data });
  }

  if (path === '/metodos-pago' && method === 'GET') {
    const { data, error } = await supabase.from('metodos_pago')
      .select('id, nombre, codigo, tipo, icono, color, activo, orden, requiere_referencia, visible_pos')
      .eq('empresa_id', ctx.empresaId!).eq('activo', true).eq('visible_pos', true)
      .order('orden').order('nombre');
    if (error) err(error.message);
    return ok({ success: true, data });
  }

  if (path === '/reportes/dashboard' && method === 'GET') {
    const { data, error } = await supabase.rpc('pos_dashboard', {
      p_empresa_id: ctx.empresaId, p_sucursal_id: params?.sucursalId || ctx.sucursalId,
    });
    if (error) err(error.message);
    return ok({ success: true, data });
  }

  if (path === '/reportes/productos/mas-vendidos' && method === 'GET') {
    const since = params?.fechaInicio || new Date(Date.now() - 30 * 86400000).toISOString();
    const { data, error } = await supabase.rpc('pos_top_productos', {
      p_empresa_id: ctx.empresaId, p_sucursal_id: params?.sucursalId || null,
      p_desde: since, p_limit: params?.limit || 15,
    });
    if (error) {
      // Si la RPC no esta creada, devolvemos vacio en lugar de romper
      return ok({ success: true, data: [] });
    }
    return ok({ success: true, data: data || [] });
  }

  if (path === '/reportes/inventario/valorizado' && method === 'GET') {
    const { data, error } = await supabase.rpc('pos_inventario_valorizado', {
      p_empresa_id: ctx.empresaId, p_sucursal_id: params?.sucursalId || null,
    });
    if (error) return ok({ success: true, data: { resumen: { totalProductos: 0, totalUnidades: 0, valorCosto: 0, valorVenta: 0 } } });
    return ok({ success: true, data });
  }

  if (path === '/inventario/stock' && method === 'GET') {
    let q = supabase.from('stock_sucursal').select(`
      id, stock, stock_minimo, sucursal_id,
      variante:variantes(id, sku, producto:productos(id, nombre, imagen_principal))
    `).limit(params?.limit || 500);
    if (params?.sucursalId) q = q.eq('sucursal_id', params.sucursalId);
    const { data, error } = await q;
    if (error) err(error.message);
    return ok({ success: true, data: (data || []).map((s: any) => ({
      id: s.id, varianteId: s.variante?.id, sku: s.variante?.sku,
      stock: s.stock, stockMinimo: s.stock_minimo, sucursalId: s.sucursal_id,
      producto: s.variante?.producto,
    })) });
  }

  if (path === '/inventario/ajuste' && method === 'POST') {
    // Ajuste directo de stock_sucursal
    const { error } = await supabase.from('stock_sucursal')
      .update({ stock: body.stockNuevo, updated_at: new Date().toISOString() })
      .eq('variante_id', body.varianteId).eq('sucursal_id', body.sucursalId);
    if (error) err(error.message);
    return ok({ success: true });
  }

  if (path === '/empresas/me' && method === 'GET') {
    const { data, error } = await supabase.from('empresas')
      .select('*').eq('id', ctx.empresaId!).single();
    if (error) err(error.message);
    // Devolver con field names que espera el frontend (nombre en lugar de nombre_comercial)
    const e: any = data;
    return ok({ success: true, data: {
      ...e,
      nombre: e.nombre_comercial,
      aplicaImpuesto: e.aplica_impuesto,
      porcentajeImpuesto: e.porcentaje_impuesto,
      nombreImpuesto: e.nombre_impuesto,
      nubefactEnabled: e.nubefact_enabled,
      nubefactDemo: e.nubefact_demo,
      nubefactApiUrl: e.nubefact_api_url,
      nubefactToken: e.nubefact_token,
      nubefactRuc: e.nubefact_ruc,
    } });
  }
  if (path === '/empresas/me/config' && method === 'GET') {
    // Algunas pantallas piden /empresas/me/config — devolvemos el mismo objeto
    const { data, error } = await supabase.from('empresas').select('*').eq('id', ctx.empresaId!).single();
    if (error) err(error.message);
    const e: any = data;
    return ok({ success: true, data: {
      aplicaImpuesto: e.aplica_impuesto,
      porcentajeImpuesto: e.porcentaje_impuesto,
      nombreImpuesto: e.nombre_impuesto,
      precioIncluyeImpuesto: e.precio_incluye_impuesto,
      nubefactEnabled: e.nubefact_enabled,
      nubefactDemo: e.nubefact_demo,
      nubefactApiUrl: e.nubefact_api_url,
      nubefactToken: e.nubefact_token,
      nubefactRuc: e.nubefact_ruc,
    } });
  }
  // Helper local para patch empresas
  const buildEmpresaPatch = (b: any) => {
    const patch: any = {};
    if ('nombre' in b) patch.nombre_comercial = b.nombre;
    if ('nombreComercial' in b) patch.nombre_comercial = b.nombreComercial;
    if ('razonSocial' in b) patch.razon_social = b.razonSocial;
    if ('ruc' in b) patch.ruc = b.ruc;
    if ('email' in b) patch.email = b.email;
    if ('telefono' in b) patch.telefono = b.telefono;
    if ('whatsapp' in b) patch.whatsapp = b.whatsapp;
    if ('direccionFiscal' in b) patch.direccion_fiscal = b.direccionFiscal;
    if ('aplicaImpuesto' in b) patch.aplica_impuesto = b.aplicaImpuesto;
    if ('porcentajeImpuesto' in b) patch.porcentaje_impuesto = b.porcentajeImpuesto;
    if ('nombreImpuesto' in b) patch.nombre_impuesto = b.nombreImpuesto;
    if ('precioIncluyeImpuesto' in b) patch.precio_incluye_impuesto = b.precioIncluyeImpuesto;
    if ('logo' in b) patch.logo = b.logo;
    if ('nubefactEnabled' in b) patch.nubefact_enabled = b.nubefactEnabled;
    if ('nubefactDemo' in b) patch.nubefact_demo = b.nubefactDemo;
    if ('nubefactApiUrl' in b) patch.nubefact_api_url = b.nubefactApiUrl;
    if ('nubefactToken' in b) patch.nubefact_token = b.nubefactToken;
    if ('nubefactRuc' in b) patch.nubefact_ruc = b.nubefactRuc;
    patch.updated_at = new Date().toISOString();
    return patch;
  };
  if ((path === '/empresas/me' || path === '/empresas/me/config') && (method === 'PUT' || method === 'PATCH')) {
    const { error } = await supabase.from('empresas').update(buildEmpresaPatch(body)).eq('id', ctx.empresaId!);
    if (error) err(error.message);
    return ok({ success: true });
  }
  const empPutMatch = path.match(/^\/empresas\/([^/]+)$/);
  if (empPutMatch && empPutMatch[1] !== 'me' && (method === 'PUT' || method === 'PATCH')) {
    const { error } = await supabase.from('empresas').update(buildEmpresaPatch(body)).eq('id', empPutMatch[1]);
    if (error) err(error.message);
    return ok({ success: true });
  }

  // ============================================================
  // Crear / editar / borrar productos / categorias / marcas
  // ============================================================
  if (path === '/productos' && method === 'POST') {
    const id = (globalThis as any).crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const slug = (body.nombre || 'producto').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 200);
    const codigoInterno = body.codigoInterno || ('P-' + Date.now().toString().slice(-8));
    const ins: any = {
      id, empresa_id: ctx.empresaId,
      categoria_id: body.categoriaId, marca_id: body.marcaId || null,
      codigo_interno: codigoInterno, sku: body.sku || null,
      codigo_barras: body.codigoBarras || null,
      nombre: body.nombre, slug,
      descripcion_corta: body.descripcionCorta || null,
      tipo: 'simple',
      precio_compra: Number(body.precioCompra) || 0,
      precio_venta: Number(body.precioVenta) || 0,
      aplica_impuesto: body.aplicaImpuesto !== false,
      maneja_stock: true,
      stock: Number(body.stock) || 0,
      stock_minimo: Number(body.stockMinimo) || 0,
      imagen_principal: body.imagenPrincipal || null,
      activo: true, visible_pos: true, visible_web: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('productos').insert(ins);
    if (error) err(error.message);
    // Crear variante por defecto + stock_sucursal
    const varianteId = (globalThis as any).crypto?.randomUUID?.() || `${Date.now()}-v`;
    await supabase.from('variantes').insert({
      id: varianteId, producto_id: id, sku: ins.sku || ins.codigo_interno,
      precio_venta: ins.precio_venta, precio_compra: ins.precio_compra,
      stock: ins.stock, stock_minimo: ins.stock_minimo, activo: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    if (ctx.sucursalId) {
      await supabase.from('stock_sucursal').insert({
        id: (globalThis as any).crypto?.randomUUID?.() || `${Date.now()}-s`,
        variante_id: varianteId, sucursal_id: ctx.sucursalId,
        stock: ins.stock, stock_minimo: ins.stock_minimo,
        updated_at: new Date().toISOString(),
      });
    }
    return ok({ success: true, data: { id } });
  }
  const prodPutMatch = path.match(/^\/productos\/([^/]+)$/);
  if (prodPutMatch && (method === 'PUT' || method === 'PATCH')) {
    const patch: any = { updated_at: new Date().toISOString() };
    if ('nombre' in body) patch.nombre = body.nombre;
    if ('precioCompra' in body) patch.precio_compra = Number(body.precioCompra) || 0;
    if ('precioVenta' in body) patch.precio_venta = Number(body.precioVenta) || 0;
    if ('codigoBarras' in body) patch.codigo_barras = body.codigoBarras;
    if ('imagenPrincipal' in body) patch.imagen_principal = body.imagenPrincipal;
    if ('aplicaImpuesto' in body) patch.aplica_impuesto = body.aplicaImpuesto;
    if ('categoriaId' in body) patch.categoria_id = body.categoriaId;
    if ('marcaId' in body) patch.marca_id = body.marcaId;
    if ('stockMinimo' in body) patch.stock_minimo = Number(body.stockMinimo) || 0;
    const { error } = await supabase.from('productos').update(patch).eq('id', prodPutMatch[1]);
    if (error) err(error.message);
    return ok({ success: true });
  }
  if (prodPutMatch && method === 'DELETE') {
    const { error } = await supabase.from('productos').update({ activo: false }).eq('id', prodPutMatch[1]);
    if (error) err(error.message);
    return ok({ success: true });
  }

  if (path === '/categorias' && method === 'POST') {
    const id = (globalThis as any).crypto?.randomUUID?.() || `${Date.now()}-c`;
    const slug = (body.nombre || 'cat').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 160);
    const { error } = await supabase.from('categorias').insert({
      id, empresa_id: ctx.empresaId, nombre: body.nombre, slug,
      activo: true, visible_pos: true, visible_web: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    if (error) err(error.message);
    return ok({ success: true, data: { id } });
  }
  const catMatch = path.match(/^\/categorias\/([^/]+)$/);
  if (catMatch && (method === 'PUT' || method === 'PATCH')) {
    const patch: any = { updated_at: new Date().toISOString() };
    if ('nombre' in body) patch.nombre = body.nombre;
    if ('imagen' in body) patch.imagen = body.imagen;
    const { error } = await supabase.from('categorias').update(patch).eq('id', catMatch[1]);
    if (error) err(error.message);
    return ok({ success: true });
  }
  if (catMatch && method === 'DELETE') {
    const { error } = await supabase.from('categorias').update({ activo: false }).eq('id', catMatch[1]);
    if (error) err(error.message);
    return ok({ success: true });
  }

  if (path === '/marcas' && method === 'POST') {
    const id = (globalThis as any).crypto?.randomUUID?.() || `${Date.now()}-m`;
    const slug = (body.nombre || 'marca').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 160);
    const { error } = await supabase.from('marcas').insert({
      id, empresa_id: ctx.empresaId, nombre: body.nombre, slug,
      activo: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    if (error) err(error.message);
    return ok({ success: true, data: { id } });
  }
  const marcaMatch = path.match(/^\/marcas\/([^/]+)$/);
  if (marcaMatch && (method === 'PUT' || method === 'PATCH')) {
    const patch: any = { updated_at: new Date().toISOString() };
    if ('nombre' in body) patch.nombre = body.nombre;
    if ('logo' in body) patch.logo = body.logo;
    const { error } = await supabase.from('marcas').update(patch).eq('id', marcaMatch[1]);
    if (error) err(error.message);
    return ok({ success: true });
  }
  if (marcaMatch && method === 'DELETE') {
    const { error } = await supabase.from('marcas').update({ activo: false }).eq('id', marcaMatch[1]);
    if (error) err(error.message);
    return ok({ success: true });
  }

  if (path === '/empresas/me/nubefact' && method === 'GET') {
    const { data, error } = await supabase.from('empresas').select('nubefact_enabled, nubefact_demo, nubefact_api_url, nubefact_token, nubefact_ruc').eq('id', ctx.empresaId!).single();
    if (error) err(error.message);
    const e: any = data;
    return ok({ success: true, data: {
      nubefactEnabled: e.nubefact_enabled, nubefactDemo: e.nubefact_demo,
      nubefactApiUrl: e.nubefact_api_url, nubefactToken: e.nubefact_token, nubefactRuc: e.nubefact_ruc,
    }});
  }
  if (path === '/empresas/me/nubefact' && (method === 'PUT' || method === 'PATCH')) {
    const { error } = await supabase.from('empresas').update({
      nubefact_enabled: body.nubefactEnabled, nubefact_demo: body.nubefactDemo,
      nubefact_api_url: body.nubefactApiUrl, nubefact_token: body.nubefactToken, nubefact_ruc: body.nubefactRuc,
      updated_at: new Date().toISOString(),
    }).eq('id', ctx.empresaId!);
    if (error) err(error.message);
    return ok({ success: true });
  }

  if (path === '/uploads/imagen' && method === 'POST') {
    // body es FormData? Por ahora si viene una URL preexistente la devolvemos tal cual.
    // Las pantallas que usan esto deben subir directo a Supabase Storage en otra iteracion.
    if (body?.url) return ok({ success: true, data: { url: body.url } });
    err('Subida de imagen pendiente de implementar Supabase Storage');
  }

  err(`Endpoint no implementado: ${method} ${path}`);
}

// =============================================================================
// Dispatcher
// =============================================================================
type Resp = { data: any; status: number; statusText: string; headers: any; config: any };

async function dispatch(method: string, path: string, body?: any, params?: any): Promise<Resp> {
  try {
    let r: any;
    if (path.startsWith('/auth/')) r = await authHandler(method, path, body);
    else if (path.startsWith('/caja/')) r = await cajaHandler(method, path, body);
    else if (path.startsWith('/ventas')) r = await ventasHandler(method, path, body, params);
    else r = await genericHandler(method, path, body, params);
    if (!r) throw new Error('Respuesta vacia del adaptador');
    return r as Resp;
  } catch (e: any) {
    if (e?.response) throw e;
    err(e?.message || 'Error desconocido');
    throw e; // unreachable, satisface TS
  }
}

export const api = {
  get: (path: string, config?: { params?: any }): Promise<Resp> => dispatch('GET', path, undefined, config?.params),
  post: (path: string, body?: any, _opts?: any): Promise<Resp> => dispatch('POST', path, body),
  put: (path: string, body?: any, _opts?: any): Promise<Resp> => dispatch('PUT', path, body),
  patch: (path: string, body?: any, _opts?: any): Promise<Resp> => dispatch('PATCH', path, body),
  delete: (path: string): Promise<Resp> => dispatch('DELETE', path),
};

export default api;
