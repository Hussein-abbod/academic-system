
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const SearchableSelect = ({ 
  label, 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select option", 
  required = false, 
  disabled = false,
  error,
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="w-full" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-2.5 rounded-lg
            border ${error ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
            bg-white dark:bg-slate-700
            text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors duration-200
            cursor-pointer flex items-center justify-between
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
        >
          <span className={`block truncate ${!selectedOption ? 'text-gray-500 dark:text-gray-400' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown 
            size={18} 
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          />
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-60 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-2 border-b border-gray-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-800">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-md focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:text-white placeholder-gray-400"
                  placeholder="Search..."
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 max-h-48">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <div 
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`
                      px-4 py-2 text-sm cursor-pointer transition-colors
                      ${value === option.value 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600'}
                    `}
                  >
                    {option.label}
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400 text-center flex flex-col items-center gap-2">
                  <Search size={20} className="text-gray-300 dark:text-gray-600" />
                  <span>No options found</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default SearchableSelect;
