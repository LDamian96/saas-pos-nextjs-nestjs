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
      variantes!productos_id_fkey(*)
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
    return ok({ success: true, data });
  }
  const empPutMatch = path.match(/^\/empresas\/([^/]+)$/);
  if (empPutMatch && (method === 'PUT' || method === 'PATCH')) {
    const patch: any = {};
    if ('nombre' in body) patch.nombre_comercial = body.nombre;
    if ('ruc' in body) patch.ruc = body.ruc;
    if ('email' in body) patch.email = body.email;
    if ('telefono' in body) patch.telefono = body.telefono;
    if ('aplicaImpuesto' in body) patch.aplica_impuesto = body.aplicaImpuesto;
    if ('porcentajeImpuesto' in body) patch.porcentaje_impuesto = body.porcentajeImpuesto;
    if ('nombreImpuesto' in body) patch.nombre_impuesto = body.nombreImpuesto;
    if ('logo' in body) patch.logo = body.logo;
    patch.updated_at = new Date().toISOString();
    const { error } = await supabase.from('empresas').update(patch).eq('id', empPutMatch[1]);
    if (error) err(error.message);
    return ok({ success: true });
  }

  err(`Endpoint no implementado: ${method} ${path}`);
}

// =============================================================================
// Dispatcher
// =============================================================================
async function dispatch(method: string, path: string, body?: any, params?: any) {
  try {
    if (path.startsWith('/auth/')) return authHandler(method, path, body);
    if (path.startsWith('/caja/')) return cajaHandler(method, path, body);
    if (path.startsWith('/ventas')) return ventasHandler(method, path, body, params);
    return genericHandler(method, path, body, params);
  } catch (e: any) {
    if (e?.response) throw e;
    err(e?.message || 'Error desconocido');
  }
}

export const api = {
  get: (path: string, config?: { params?: any }) => dispatch('GET', path, undefined, config?.params),
  post: (path: string, body?: any) => dispatch('POST', path, body),
  put: (path: string, body?: any) => dispatch('PUT', path, body),
  patch: (path: string, body?: any) => dispatch('PATCH', path, body),
  delete: (path: string) => dispatch('DELETE', path),
};

export default api;
