// apiUtils.js
export const getApiUrl = (endpoint) => {
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    return `${baseUrl}${endpoint}`;
  };
  
  export const formatUrlWithParams = (urlTemplate, params) => {
    let formattedUrl = urlTemplate;
    
    // Replace all parameters in the URL template
    for (const [key, value] of Object.entries(params)) {
      formattedUrl = formattedUrl.replace(`{${key}}`, value);
    }
    
    return formattedUrl;
  };
  
  // Example usage for review status endpoint:
  // const url = formatUrlWithParams(
  //   getApiUrl(process.env.REACT_APP_SAP_REVIEW_STATUS), 
  //   { jobId: '12345' }
  // );