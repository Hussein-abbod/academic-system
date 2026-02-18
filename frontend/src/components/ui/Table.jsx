import React, { useState } from 'react';

const Table = ({ data = [], columns, searchable = false, searchKeys = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Ensure data is always an array to prevent crashes
  const safeData = Array.isArray(data) ? data : [];

  const getValue = (obj, path) => {
    if (!obj || !path) return '';
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : '', obj);
  };

  // Simple search filtering
  const filteredData = safeData.filter(item => {
    if (!searchTerm) return true;
    if (searchKeys.length === 0) return true;
    
    return searchKeys.some(key => {
      const value = getValue(item, key);
      return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  return (
    <div className="w-full">
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    {col.header}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
             {filteredData.length > 0 ? (
              filteredData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                       {col.cell ? col.cell(row) : getValue(row, col.accessorKey)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No results found
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Showing {filteredData.length} entries</span>
      </div>
    </div>
  );
};

export default Table;
