import React from "react";

const Tooltip = ({ label, children }) => {
  return (
    <div className="relative inline-block group focus-within:group">
      {children}

      {/* Tooltip below the element; hidden by default, appears on hover or focus */}
      <div
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap opacity-0 scale-95 transform transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100"
      >
        <div className="rounded-md bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white px-2 py-1 text-xs shadow-md">
          {label}
        </div>
      </div>
    </div>
  );
};

export default Tooltip;
