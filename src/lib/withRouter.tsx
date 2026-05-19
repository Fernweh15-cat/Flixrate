import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export interface RouterProps {
  location: ReturnType<typeof useLocation>;
  navigate: ReturnType<typeof useNavigate>;
  params: Record<string, string | undefined>;
}

export function withRouter<T extends { router: RouterProps }>(
  Component: React.ComponentType<T>
) {
  function ComponentWithRouterProp(props: Omit<T, 'router'>) {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    
    return (
      <Component
        {...(props as T)}
        router={{ location, navigate, params }}
      />
    );
  }

  return ComponentWithRouterProp;
}
