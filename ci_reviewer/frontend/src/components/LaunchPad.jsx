// src/components/LaunchPad.jsx
import React from 'react';
import theme from '../theme';
import { Database, Activity, Settings } from 'lucide-react';

// Updated card style for dark navy tiles
const cardStyle = {
  backgroundColor: '#121A2B', // Very dark navy blue
  borderRadius: '8px',
  padding: '32px',
  color: 'white',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  position: 'relative',
  border: 'none',
  boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
  aspectRatio: '1 / 1', // Square shape
  width: '100%',
  height: 'auto',
};

const LaunchPad = ({ onAppSelect }) => {
  // Application tiles data
  const applications = [
    { 
      id: 'sap-integration', 
      name: 'SAP Integration Manager', 
      description: 'Integration packages and flows',
      icon: Database,
    },
    { 
      id: 'automation', 
      name: 'Automation', 
      description: 'Process automation',
      icon: Activity,
    },
    { 
      id: 'tech-hawk', 
      name: 'Tech Hawk', 
      description: 'Trend Tracker',
      icon: Activity,
    },
    { 
      id: 'smart-base', 
      name: 'Smart Base ', 
      description: 'Rapid Base Builder using AI',
      icon: Activity,
    },
    { 
      id: 'administration', 
      name: 'Administration', 
      description: 'System configuration',
      icon: Settings,
    }
  ];

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      backgroundColor: '#0A1020', // Very dark navy background
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px',
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Logo section using the provided Cognit logo image */}
        <div style={{
          marginBottom: '32px',
          marginTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Use the logo from Image 2 */}
          <img 
            src="/cognit-logo.png" 
            alt="Cognit Logo" 
            style={{
              maxWidth: '300px',
              marginBottom: '16px'
            }}
          />
          <p style={{
            color: '#E5E7EB',
            fontSize: '1.25rem',
            marginTop: '8px',
            textAlign: 'center',
          }}>Integration Platform</p>
        </div>
        
        {/* Card grid section - matching the 3-column layout in screenshot */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          width: '100%',
          maxWidth: '1000px',
          marginTop: '24px',
        }}>
          {applications.map((app) => {
            const Icon = app.icon;
            
            return (
              <div 
                key={app.id}
                onClick={() => onAppSelect(app.id)}
                style={{
                  ...cardStyle,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0px 8px 15px rgba(0, 0, 0, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{
                  marginBottom: '16px',
                  color: 'white',
                }}>
                  <Icon size={24} />
                </div>
                
                <h2 style={{
                  fontSize: '1rem',
                  fontWeight: '500',
                  marginBottom: '8px',
                }}>{app.name}</h2>
                
                <p style={{
                  fontSize: '0.75rem',
                  color: '#9CA3AF',
                  marginBottom: '8px',
                }}>{app.description}</p>
                
                <span style={{
                  fontSize: '0.75rem',
                  color: '#00A3FF', // Match logo blue color
                }}>See info</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LaunchPad;