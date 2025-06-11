import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Check, ChevronDown, User } from 'lucide-react';

interface Vendedor {
  id: string;
  nome: string;
}

interface VendedorFilterProps {
  vendedores: Vendedor[];
  selectedVendedor: string;
  onVendedorChange: (value: string) => void;
  loading?: boolean;
}

const VendedorFilter: React.FC<VendedorFilterProps> = ({
  vendedores,
  selectedVendedor,
  onVendedorChange,
  loading = false
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedVendedores, setSelectedVendedores] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Inicializa com todos os vendedores selecionados se não há seleção específica
    if (!selectedVendedor && vendedores.length > 0) {
      const allIds = new Set(vendedores.map(v => v.id));
      setSelectedVendedores(allIds);
      onVendedorChange(Array.from(allIds).join(','));
    } else if (selectedVendedor) {
      setSelectedVendedores(new Set(selectedVendedor.split(',')));
    }
  }, [vendedores, selectedVendedor, onVendedorChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.vendedor-dropdown')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleVendedor = (id: string) => {
    const newSelected = new Set(selectedVendedores);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedVendedores(newSelected);
    onVendedorChange(Array.from(newSelected).join(','));
  };

  const toggleAllVendedores = () => {
    if (selectedVendedores.size === vendedores.length) {
      setSelectedVendedores(new Set());
      onVendedorChange('');
    } else {
      const allIds = new Set(vendedores.map(v => v.id));
      setSelectedVendedores(allIds);
      onVendedorChange(Array.from(allIds).join(','));
    }
  };

  const buttonClasses = `relative min-w-[160px] h-[36px] rounded-lg transition-all duration-200 flex items-center px-3
    ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`;

  const contentClasses = `flex items-center justify-between w-full
    ${isDark ? 'text-gray-200' : 'text-gray-700'}`;

  if (loading) {
    return (
      <div className={buttonClasses}>
        <div className={contentClasses}>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (vendedores.length === 0) {
    return (
      <div className={buttonClasses}>
        <div className={contentClasses}>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm">Nenhum vendedor</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative vendedor-dropdown">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
        className={buttonClasses}
      >
        <div className={contentClasses}>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium truncate">
              {selectedVendedores.size === 0
                ? 'Vendedores'
                : selectedVendedores.size === vendedores.length
                  ? 'Todos vendedores'
                  : `${selectedVendedores.size} vendedor${selectedVendedores.size !== 1 ? 'es' : ''}`}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
        </div>
      </button>

      {menuOpen && (
        <div className={`absolute z-50 mt-1 w-full min-w-[220px] rounded-lg shadow-lg border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleAllVendedores();
              }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                selectedVendedores.size === vendedores.length
                  ? 'bg-indigo-600 border-indigo-600'
                  : selectedVendedores.size > 0
                    ? 'bg-indigo-600/50 border-indigo-600'
                    : isDark
                      ? 'border-gray-600'
                      : 'border-gray-300'
              }`}>
                {selectedVendedores.size === vendedores.length && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                Selecionar todos
              </span>
            </button>
          </div>

          <div className={`max-h-60 overflow-y-auto border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {vendedores.map((vendedor) => (
              <button
                key={vendedor.id}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVendedor(vendedor.id);
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  selectedVendedores.has(vendedor.id)
                    ? 'bg-indigo-600 border-indigo-600'
                    : isDark
                      ? 'border-gray-600'
                      : 'border-gray-300'
                }`}>
                  {selectedVendedores.has(vendedor.id) && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className={`truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {vendedor.nome}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendedorFilter;