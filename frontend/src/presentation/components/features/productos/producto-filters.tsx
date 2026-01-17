'use client';

/**
 * @file producto-filters.tsx
 * @description Filtros para la lista de productos
 */

import { Search, Filter, X } from 'lucide-react';
import { useCategorias } from '@/application/hooks/queries/use-categorias';
import { useMarcas } from '@/application/hooks/queries/use-marcas';
import { ProductoFilters } from '@/application/services/productos.service';

interface Props {
  filters: ProductoFilters;
  onFilterChange: (filters: ProductoFilters) => void;
}

export function ProductoFiltersComponent({ filters, onFilterChange }: Props) {
  const { data: categorias } = useCategorias();
  const { data: marcas } = useMarcas();

  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value, page: 1 });
  };

  const handleCategoriaChange = (value: string) => {
    onFilterChange({
      ...filters,
      categoriaId: value || undefined,
      page: 1,
    });
  };

  const handleMarcaChange = (value: string) => {
    onFilterChange({
      ...filters,
      marcaId: value || undefined,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = filters.search || filters.categoriaId || filters.marcaId || filters.stockBajo;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Busqueda */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por nombre, SKU o codigo..."
              className="w-full h-11 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Categoria */}
        <select
          value={filters.categoriaId || ''}
          onChange={(e) => handleCategoriaChange(e.target.value)}
          className="h-11 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors min-w-[150px]"
        >
          <option value="">Todas las categorias</option>
          {categorias?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>

        {/* Marca */}
        <select
          value={filters.marcaId || ''}
          onChange={(e) => handleMarcaChange(e.target.value)}
          className="h-11 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors min-w-[150px]"
        >
          <option value="">Todas las marcas</option>
          {marcas?.map((marca) => (
            <option key={marca.id} value={marca.id}>
              {marca.nombre}
            </option>
          ))}
        </select>

        {/* Stock bajo */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.stockBajo || false}
            onChange={(e) => onFilterChange({ ...filters, stockBajo: e.target.checked || undefined, page: 1 })}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Stock bajo</span>
        </label>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
