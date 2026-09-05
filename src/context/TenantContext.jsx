import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TenantContext = createContext();

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTenantConfig = async () => {
      try {
        // Get the current hostname (e.g., tenanta.ordernow.com or tenanta.localhost)
        const hostname = window.location.hostname;
        
        // Extract subdomain
        const subdomain = hostname.split('.')[0];
        
        // Optional: Default to a specific subdomain for local dev if needed
        // const actualSubdomain = hostname === 'localhost' ? 'default' : subdomain;
        
        const response = await axios.get(`https://menu-card-api-yvzycdnaqq-el.a.run.app/api/tenant/info?subdomain=${subdomain}`);
        
        if (response.data.success) {
          setTenant(response.data.data);
          
          // Apply dynamic branding to CSS variables
          if (response.data.data.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', response.data.data.primaryColor);
            // We could also dynamically set title and favicon
            document.title = response.data.data.businessName || 'Order Now';
          }
        } else {
          setError(response.data.message || 'Tenant not found');
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError('Tenant not found. Please check the URL.');
        } else {
          setError('An error occurred while loading the application.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTenantConfig();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading application...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <h2>Oops!</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ tenant }}>
      {children}
    </TenantContext.Provider>
  );
};
