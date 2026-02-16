import React from 'react';

const Card = ({ children, className = '', title, hover = true }) => {
  return (
    <div 
      className={`
        bg-white dark:bg-slate-800 
        rounded-xl shadow-md 
        border border-gray-100 dark:border-slate-700 
        p-6 
        transition-all duration-300
        ${hover ? 'card-hover' : ''}
        ${className}
      `}
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;
