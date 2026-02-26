import { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import * as api from '../api/client';

const OrgContext = createContext();

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within OrgProvider');
  }
  return context;
}

export function OrgProvider({ children }) {
  const { orgHandle } = useParams();
  const { user } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orgHandle) {
      setLoading(false);
      return;
    }

    async function loadOrg() {
      try {
        const res = await api.api(`/organizations/by-slug/${orgHandle}`);
        setOrganization(res.organization);
        
        // Validate user has access to this org
        if (user && user.organizationId?._id !== res.organization._id) {
          setError('Access denied to this organization');
        }
      } catch (e) {
        setError('Organization not found');
      } finally {
        setLoading(false);
      }
    }

    loadOrg();
  }, [orgHandle, user]);

  return (
    <OrgContext.Provider value={{ organization, loading, error, orgHandle }}>
      {children}
    </OrgContext.Provider>
  );
}