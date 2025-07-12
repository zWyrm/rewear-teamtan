import { useEffect } from "react";
import { useLocation } from "wouter";
import { isAuthenticated } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: () => void;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      if (fallback) {
        fallback();
      } else {
        setLocation("/login");
      }
    }
  }, [setLocation, fallback]);

  if (!isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}

// Hook for checking authentication with redirect
export function useAuthRedirect() {
  const [, setLocation] = useLocation();

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated()) {
      setLocation("/login");
      return;
    }
    action();
  };

  return requireAuth;
}