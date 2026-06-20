// =============================================================================
// Cliente Supabase para pos APP (licencia unica).
// Usa la anon key — la seguridad multi-tenant la maneja la logica via empresa_id.
// =============================================================================

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = 'https://bulvjbyboqymnpociwms.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bHZqYnlib3F5bW5wb2Npd21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0Nzc3ODAsImV4cCI6MjA5NzA1Mzc4MH0.mAYDfTN8ozujsrVr_dnLeYOOojmnHilqF742x3qLxiA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

/** Helper: lanza error si la query Supabase fallo */
export function unwrap<T>(res: { data: T | null; error: any }): T {
  if (res.error) throw new Error(res.error.message || 'Error de Supabase');
  return res.data as T;
}
