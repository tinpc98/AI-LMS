import React, { createContext, useContext, useState, useCallback } from "react";

interface BreadcrumbContextType {
  entityTitle: string | null;
  loading: boolean;
  setBreadcrumbEntity: (title: string | null, loading?: boolean) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType>({
  entityTitle: null,
  loading: false,
  setBreadcrumbEntity: () => {},
});

export const BreadcrumbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entityTitle, setEntityTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const setBreadcrumbEntity = useCallback((title: string | null, isLoading = false) => {
    setEntityTitle(title);
    setLoading(isLoading);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ entityTitle, loading, setBreadcrumbEntity }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumb = () => {
  return useContext(BreadcrumbContext);
};
