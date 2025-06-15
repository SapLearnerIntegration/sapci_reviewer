import React from 'react';

// Default Section Component for sections that don't have specific implementations
const DefaultSection = ({ sectionName, appName, isMainApp = false }) => {
  const formatSectionName = (name) => {
    // Format section name (e.g., 'runtime-manager' -> 'Runtime Manager')
    return name.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const formattedSectionName = formatSectionName(sectionName);
  
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-white">
        {isMainApp ? `${appName} Overview` : formattedSectionName}
      </h2>
      
      <p className="mb-4 text-gray-300">
        {isMainApp 
          ? `This is the overview page for ${appName}.`
          : `This is the ${formattedSectionName} section of the ${appName}.`
        }
      </p>
      
      <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-700">
        <p className="text-lg text-white">
          {isMainApp 
            ? "Application content will be displayed here."
            : `Content for ${formattedSectionName} will be displayed here.`
          }
        </p>
        <p className="mt-4 text-gray-400 text-sm">
          This section is currently under development. Please check back later for updates.
        </p>
      </div>
    </div>
  );
};

export default DefaultSection;