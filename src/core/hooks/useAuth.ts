import { useAuthContext } from '@/features/context/AuthContext';

export const useAuth = () => {
  return useAuthContext();
};

export default useAuth;
