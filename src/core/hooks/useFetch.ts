'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiResponse } from '@/core/interfaces/api.interfaces';

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  message: string | null;
}

export function useFetch<T = any>(
  fetchFn: () => Promise<ApiResponse<T>>,
  immediate: boolean = true
) {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: immediate,
    error: null,
    message: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetchFn();
      setState({
        data: response.data ?? null,
        loading: false,
        error: null,
        message: response.message,
      });
      return response;
    } catch (err: any) {
      const errorMsg = err?.message || 'Error al obtener datos';
      setState({
        data: null,
        loading: false,
        error: errorMsg,
        message: null,
      });
      throw err;
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    refetch: execute,
  };
}

export default useFetch;
