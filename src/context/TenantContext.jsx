import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TenantContext = createContext();

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }) => {
  const defaultTenant = {
    id: 4,
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
        const parts = hostname.split('.');
        const subdomain = parts[0]?.toLowerCase();
        
        // If main domain or standard vercel/localhost host, directly use default Chai Sutta Bar
        const isMainOrGeneric = 
          !subdomain || 
          ['localhost', '127', 'menu-card-ui', 'chaisuttabarchennai', 'www'].includes(subdomain) ||
          parts.length <= 2;

        if (isMainOrGeneric) {
          const fallbackRes = await axios.get(`https://menu-card-api-yvzycdnaqq-el.a.run.app/api/tenant/info?id=4`);
          if (fallbackRes.data && fallbackRes.data.success && fallbackRes.data.data) {
            setTenant(fallbackRes.data.data);
            if (fallbackRes.data.data.primaryColor) {
              document.documentElement.style.setProperty('--primary-color', fallbackRes.data.data.primaryColor);
              document.title = fallbackRes.data.data.businessName || 'Chai Sutta Bar';
            }
          } else {
            setTenant(defaultTenant);
          }
          setLoading(false);
          return;
        }

        const response = await axios.get(`https://menu-card-api-yvzycdnaqq-el.a.run.app/api/tenant/info?subdomain=${subdomain}`);
        
        if (response.data && response.data.success && response.data.data) {
          setTenant(response.data.data);
          
          if (response.data.data.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', response.data.data.primaryColor);
            document.title = response.data.data.businessName || 'Chai Sutta Bar';
          }
        } else {
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
