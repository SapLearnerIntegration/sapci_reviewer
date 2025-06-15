// src/components/Sidebar.jsx - Updated
import React from 'react';
import theme from '../theme';

const Sidebar = ({ collapsed, onToggle, selectedApp, onSectionChange, activeSection }) => {
  // Define navigation items based on the selected application
  const getNavItems = () => {
    if (selectedApp === 'sap-integration') {
      // Updated navigation items for SAP Integration Manager
      return [
        { id: 'designer', name: 'Designer', icon: 'code' },
        { id: 'runtime', name: 'Runtime Manager', icon: 'activity' },
        { id: 'kpi', name: 'KPI', icon: 'bar-chart' },
        { id: 'insights', name: 'Insights', icon: 'trending-up' }
      ];
    } else if (selectedApp === 'administration') {
      // Updated navigation items for Administration - added Tenant Manager and Guidelines
      return [
        { id: 'overview', name: 'Overview', icon: 'grid' },
        { id: 'tenant-manager', name: 'Tenant Manager', icon: 'shield' },
        { id: 'guidelines', name: 'Guidelines', icon: 'book' },
        { id: 'settings', name: 'Settings', icon: 'settings' }
      ];
    }
    
    // Default items for other applications
    return [
      { id: 'overview', name: 'Overview', icon: 'grid' },
      { id: 'settings', name: 'Settings', icon: 'settings' }
    ];
  };

  const navItems = getNavItems();

  // Function to render an icon
  const renderIcon = (iconName) => {
    switch(iconName) {
      case 'code':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        );
      case 'activity':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        );
      case 'bar-chart':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        );
      case 'shield':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        );
      case 'trending-up':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        );
      case 'book':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        );
      case 'grid':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        );
      case 'settings':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  // Handle item click
  const handleItemClick = (itemId) => {
    if (onSectionChange && typeof onSectionChange === 'function') {
      onSectionChange(itemId);
    }
  };

  // Get the app title
  const getAppTitle = () => {
    switch(selectedApp) {
      case 'sap-integration':
        return 'SAP Integration';
      case 'administration':
        return 'Administration';
      default:
        return 'Application';
    }
  };

  return (
    <div style={{
      width: collapsed ? '64px' : '256px',
      backgroundColor: theme.colors.background.paper,
      color: theme.colors.text.primary,
      transition: `width ${theme.transitions.normal}`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRight: `1px solid ${theme.colors.divider}`,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: theme.spacing(4),
        borderBottom: `1px solid ${theme.colors.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {!collapsed && (
          <span style={{
            fontWeight: 'bold',
            fontSize: '1.125rem',
          }}>{getAppTitle()}</span>
        )}
        <button 
          onClick={onToggle}
          style={{
            padding: theme.spacing(1),
            borderRadius: theme.roundness.small,
            backgroundColor: 'transparent',
            border: 'none',
            color: theme.colors.text.primary,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {collapsed ? (
            // Right arrow
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          ) : (
            // Left arrow
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          )}
        </button>
      </div>
      
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: theme.spacing(2),
      }}>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}>
          {navItems.map(item => (
            <li key={item.id} style={{ marginBottom: theme.spacing(1) }}>
              <button
                onClick={() => handleItemClick(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
                  backgroundColor: activeSection === item.id ? theme.colors.background.accent : 'transparent',
                  border: 'none',
                  borderRadius: theme.roundness.medium,
                  color: theme.colors.text.primary,
                  cursor: 'pointer',
                  transition: `background-color ${theme.transitions.fast}`,
                  textAlign: 'left',
                }}
                onMouseOver={(e) => {
                  if (activeSection !== item.id) {
                    e.currentTarget.style.backgroundColor = theme.colors.action.hover;
                  }
                }}
                onMouseOut={(e) => {
                  if (activeSection !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{
                  color: theme.colors.text.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: collapsed ? 0 : theme.spacing(3),
                }}>
                  {renderIcon(item.icon)}
                </span>
                {!collapsed && (
                  <span style={{ flex: 1 }}>{item.name}</span>
                )}
                {!collapsed && activeSection === item.id && (
                  <span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;