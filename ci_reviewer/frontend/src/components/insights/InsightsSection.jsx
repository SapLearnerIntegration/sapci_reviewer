// Enhanced InsightsSection.jsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Tabs, Tab, Button } from '@mui/material';
import SecurityAnalysis from './SecurityAnalysis';
import AdapterAnalysis from './AdapterAnalysis';
import PerformanceAnalysis from './PerformanceAnalysis';
import ErrorHandlingAnalysis from './ErrorHandlingAnalysis';
import ComplianceAnalysis from './ComplianceAnalysis';
import RecommendationsPanel from './RecommendationsPanel';
import ChatInterface from './ChatInterface';
import AutomationDashboard from './AutomationDashboard';
import { fetchAnalysisData } from '../../services/sapIntegrationService';
console.log("InsightsSection loaded");
const InsightsSection = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchAnalysisData(tenantId);
        setAnalysisData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (tenantId) {
      loadData();
    }
  }, [tenantId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return <Typography>Loading analysis data...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  if (!analysisData) {
    return <Typography>No analysis data available.</Typography>;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              SAP Integration Suite Insights
            </Typography>
            <Typography variant="body1">
              Comprehensive analysis of your SAP Integration Suite landscape.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="analysis tabs">
              <Tab label="Security" />
              <Tab label="Error Handling" />
              <Tab label="Adapters" />
              <Tab label="Performance" />
              <Tab label="Compliance" />
              <Tab label="Recommendations" />
              <Tab label="Automation" />
              <Tab label="Chat" />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {activeTab === 0 && <SecurityAnalysis data={analysisData.security_analysis} />}
              {activeTab === 1 && <ErrorHandlingAnalysis data={analysisData.error_handling_analysis} />}
              {activeTab === 2 && <AdapterAnalysis data={analysisData.adapter_analysis} />}
              {activeTab === 3 && <PerformanceAnalysis data={analysisData.performance_analysis} />}
              {activeTab === 4 && <ComplianceAnalysis data={analysisData.compliance_analysis} />}
              {activeTab === 5 && <RecommendationsPanel data={analysisData.recommendations} />}
              {activeTab === 6 && <AutomationDashboard tenantId={tenantId} analysisData={analysisData} />}
              {activeTab === 7 && <ChatInterface tenantId={tenantId} analysisData={analysisData} />}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InsightsSection;