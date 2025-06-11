import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Check, ChevronDown } from 'lucide-react';

interface VendasFilterProps {
  vendedores: any[];
  sdrs: any[];
  selectedVendedor: string;
  selectedSDR: string;
  onVendedorChange: (value: string) => void;
  onSDRChange: (value: string) => void;
}

const VendasFilter: React.FC<VendasFilterProps> = ({
  vendedores,
  sdrs,
  selectedVendedor,
  selectedSDR,
  onVendedorChange,
  onSDRChange
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [vendedoresMenuOpen, setVendedoresMenuOpen] = useState(false);
  const [sdrsMenuOpen, setSDRsMenuOpen] = useState(false);
  const [selectedVendedores, setSelectedVendedores] = useState<Set<string>>(new Set());
  const [selectedSDRs, setSelectedSDRs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.vendedores-dropdown')) {
        setVendedoresMenuOpen(false);
      }
      if (!target.closest('.sdrs-dropdown')) {
        setSDRsMenuOpen(false);
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

  const toggleSDR = (id: string) => {
    const newSelected = new Set(selectedSDRs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSDRs(newSelected);
    onSDRChange(Array.from(newSelected).join(','));
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

  const toggleAllSDRs = () => {
    if (selectedSDRs.size === sdrs.length) {
      setSelectedSDRs(new Set());
      onSDRChange('');
    } else {
      const allIds = new Set(sdrs.map(s => s.id));
      setSelectedSDRs(allIds);
      onSDRChange(Array.from(allIds).join(','));
    }
  };

  const buttonClasses = `relative min-w-[140px] h-[36px] rounded-lg transition-all duration-200 flex items-center px-3
    ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`;

  const contentClasses = `flex items-center justify-between w-full
    ${isDark ? 'text-gray-200' : 'text-gray-700'}`;

  return (
    <div className="flex items-center gap-3">
      {/* Vendedores Dropdown */}
      <div className="relative vendedores-dropdown">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setVendedoresMenuOpen(!vendedoresMenuOpen);
          }}
          className={buttonClasses}
        >
          <div className={contentClasses}>
            <span className="text-sm font-medium truncate">
              {selectedVendedores.size === 0
                ? 'Vendedores'
                : selectedVendedores.size === vendedores.length
                  ? 'Todos vendedores'
                  : `${selectedVendedores.size} vendedor${selectedVendedores.size !== 1 ? 'es' : ''}`}
            </span>
            <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
          </div>
        </button>

        {vendedoresMenuOpen && (
          <div className={`absolute z-50 mt-1 w-full min-w-[200px] rounded-lg shadow-lg border ${
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

      {/* SDRs Dropdown */}
      <div className="relative sdrs-dropdown">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSDRsMenuOpen(!sdrsMenuOpen);
          }}
          className={buttonClasses}
        >
          <div className={contentClasses}>
            <span className="text-sm font-medium truncate">
              {selectedSDRs.size === 0
                ? 'SDRs'
                : selectedSDRs.size === sdrs.length
                  ? 'Todos SDRs'
                  : `${selectedSDRs.size} SDR${selectedSDRs.size !== 1 ? 's' : ''}`}
            </span>
            <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
          </div>
        </button>

        {sdrsMenuOpen && (
          <div className={`absolute z-50 mt-1 w-full min-w-[200px] rounded-lg shadow-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAllSDRs();
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  selectedSDRs.size === sdrs.length
                    ? 'bg-indigo-600 border-indigo-600'
                    : selectedSDRs.size > 0
                      ? 'bg-indigo-600/50 border-indigo-600'
                      : isDark
                        ? 'border-gray-600'
                        : 'border-gray-300'
                }`}>
                  {selectedSDRs.size === sdrs.length && (
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
              {sdrs.map((sdr) => (
                <button
                  key={sdr.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSDR(sdr.id);
                  }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    selectedSDRs.has(sdr.id)
                      ? 'bg-indigo-600 border-indigo-600'
                      : isDark
                        ? 'border-gray-600'
                        : 'border-gray-300'
                  }`}>
                    {selectedSDRs.has(sdr.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className={`truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {sdr.nome}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendasFilter;