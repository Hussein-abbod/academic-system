import React from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({ value, onChange, options, placeholder = "Select option", className = "" }) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-cosmic-500 focus:border-transparent outline-none transition-all cursor-pointer ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown 
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
        size={18} 
      />
    </div>
  );
};

export default Select;
