import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TenantContext = createContext();

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }) => {
  const defaultTenant = {
    id: 1,
    businessName: 'Chai Sutta Bar',
    primaryColor: '#C07A2E',
  };

  const [tenant, setTenant] = useState(defaultTenant);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTenantConfig = async () => {
      try {
        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0];
        
        const response = await axios.get(`https://menu-card-api-yvzycdnaqq-el.a.run.app/api/tenant/info?subdomain=${subdomain}`);
        
        if (response.data && response.data.success && response.data.data) {
          setTenant(response.data.data);
          
          if (response.data.data.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', response.data.data.primaryColor);
            document.title = response.data.data.businessName || 'Chai Sutta Bar';
          }
        } else {
          // Fallback to default Chai Sutta Bar tenant
          console.warn('Tenant API response unsuccessful, using default Chai Sutta Bar config:', response.data?.message);
          setTenant(defaultTenant);
        }
      } catch (err) {
        console.warn('Tenant lookup error, defaulting to Chai Sutta Bar:', err);
        setTenant(defaultTenant);
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
