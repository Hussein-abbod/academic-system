import React from 'react';

export const Input = ({ 
  label, 
  error, 
  className = '', 
  required = false,
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2.5 rounded-lg
          border ${error ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
          bg-white dark:bg-slate-700
          text-gray-900 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-colors duration-200
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export const Select = ({ 
  label, 
  error, 
  options = [], 
  className = '', 
  required = false,
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-2.5 rounded-lg
          border ${error ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
          bg-white dark:bg-slate-700
          text-gray-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-colors duration-200
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export const TextArea = ({ 
  label, 
  error, 
  className = '', 
  required = false,
  rows = 4,
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`
          w-full px-4 py-2.5 rounded-lg
          border ${error ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
          bg-white dark:bg-slate-700
          text-gray-900 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-colors duration-200
          resize-vertical
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export const Checkbox = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        className={`
          w-4 h-4 rounded
          border-gray-300 dark:border-slate-600
          text-blue-600
          focus:ring-2 focus:ring-blue-500
          ${className}
        `}
        {...props}
      />
      {label && (
        <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};
