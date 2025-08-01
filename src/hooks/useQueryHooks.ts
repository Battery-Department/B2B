import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions
} from '@tanstack/react-query'
import { useState, useCallback, useEffect } from 'react'
import { AxiosError } from 'axios'
import { 
  queryKeys, 
  createOptimisticUpdate,
  PaginationParams,
  PaginatedResponse 
} from '../api/reactQuerySetup'

interface ApiError {
  message: string
  code?: string
  details?: Record<string, any>
}

export function useApiQuery<TData>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: UseQueryOptions<TData, ApiError>
) {
  return useQuery<TData, ApiError>({
    queryKey,
    queryFn,
    ...options
  })
}

export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, ApiError, TVariables>
) {
  return useMutation<TData, ApiError, TVariables>({
    mutationFn,
    ...options
  })
}

export function usePaginatedQuery<TData>(
  baseKey: readonly string[],
  fetchFn: (params: PaginationParams) => Promise<PaginatedResponse<TData>>,
  initialPage = 1,
  limit = 20
) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(limit)

  const queryKey = [...baseKey, 'paginated', { page, limit: pageSize }] as const

  const query = useQuery<PaginatedResponse<TData>, ApiError>({
    queryKey,
    queryFn: () => fetchFn({ page, limit: pageSize }),
    keepPreviousData: true
  })

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage))
  }, [])

  const nextPage = useCallback(() => {
    if (query.data && page < query.data.totalPages) {
      setPage(p => p + 1)
    }
  }, [query.data, page])

  const previousPage = useCallback(() => {
    setPage(p => Math.max(1, p - 1))
  }, [])

  const changePageSize = useCallback((newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }, [])

  return {
    ...query,
    page,
    pageSize,
    goToPage,
    nextPage,
    previousPage,
    changePageSize,
    hasNextPage: query.data ? page < query.data.totalPages : false,
    hasPreviousPage: page > 1
  }
}

export function useInfiniteApiQuery<TData>(
  queryKey: readonly unknown[],
  fetchFn: ({ pageParam }: { pageParam: number }) => Promise<PaginatedResponse<TData>>,
  options?: Omit<UseInfiniteQueryOptions<PaginatedResponse<TData>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useInfiniteQuery<PaginatedResponse<TData>, ApiError>({
    queryKey,
    queryFn: fetchFn,
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    ...options
  })
}

export function useOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    queryKey: readonly unknown[]
    updateFn: (old: TData | undefined, variables: TVariables) => TData
    onSuccess?: (data: TData, variables: TVariables) => void
    onError?: (error: ApiError, variables: TVariables) => void
  }
) {
  const queryClient = useQueryClient()
  
  return useMutation<TData, ApiError, TVariables>({
    mutationFn,
    ...createOptimisticUpdate(options.queryKey, options.updateFn),
    onSuccess: (data, variables) => {
      options.onSuccess?.(data, variables)
    },
    onError: (error, variables) => {
      options.onError?.(error, variables)
    }
  })
}

export function useDebounceQuery<TData>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  debounceMs = 500,
  options?: UseQueryOptions<TData, ApiError>
) {
  const [debouncedEnabled, setDebouncedEnabled] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEnabled(true)
    }, debounceMs)

    return () => {
      clearTimeout(timer)
      setDebouncedEnabled(false)
    }
  }, [queryKey, debounceMs])

  return useQuery<TData, ApiError>({
    queryKey,
    queryFn,
    enabled: debouncedEnabled && (options?.enabled ?? true),
    ...options
  })
}

export function usePollingQuery<TData>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  pollingInterval: number,
  options?: UseQueryOptions<TData, ApiError>
) {
  const [isPolling, setIsPolling] = useState(true)

  const query = useQuery<TData, ApiError>({
    queryKey,
    queryFn,
    refetchInterval: isPolling ? pollingInterval : false,
    ...options
  })

  const startPolling = useCallback(() => setIsPolling(true), [])
  const stopPolling = useCallback(() => setIsPolling(false), [])

  return {
    ...query,
    isPolling,
    startPolling,
    stopPolling
  }
}

export function useCachedQuery<TData>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  cacheTime = 5 * 60 * 1000,
  options?: UseQueryOptions<TData, ApiError>
) {
  const queryClient = useQueryClient()
  
  const cachedData = queryClient.getQueryData<TData>(queryKey)
  const hasCachedData = cachedData !== undefined

  return useQuery<TData, ApiError>({
    queryKey,
    queryFn,
    staleTime: cacheTime,
    gcTime: cacheTime * 2,
    initialData: cachedData,
    ...options
  })
}

export function useParallelQueries<T extends Record<string, () => Promise<any>>>(
  queries: T
): {
  [K in keyof T]: ReturnType<typeof useQuery>
} & {
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
} {
  const queryResults = {} as any
  
  Object.entries(queries).forEach(([key, queryFn]) => {
    queryResults[key] = useQuery({
      queryKey: [key],
      queryFn: queryFn as any
    })
  })

  const isLoading = Object.values(queryResults).some((query: any) => query.isLoading)
  const isError = Object.values(queryResults).some((query: any) => query.isError)
  const isSuccess = Object.values(queryResults).every((query: any) => query.isSuccess)

  return {
    ...queryResults,
    isLoading,
    isError,
    isSuccess
  }
}

export function useDependentQuery<TData, TDependency>(
  queryKey: readonly unknown[],
  queryFn: (dependency: TDependency) => Promise<TData>,
  dependency: TDependency | undefined,
  options?: UseQueryOptions<TData, ApiError>
) {
  return useQuery<TData, ApiError>({
    queryKey: [...queryKey, dependency],
    queryFn: () => queryFn(dependency!),
    enabled: dependency !== undefined && (options?.enabled ?? true),
    ...options
  })
}

export function useQuerySubscription<TData>(
  queryKey: readonly unknown[],
  callback: (data: TData | undefined) => void
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        JSON.stringify(event.query.queryKey) === JSON.stringify(queryKey) &&
        event.type === 'updated'
      ) {
        callback(event.query.state.data as TData | undefined)
      }
    })

    return unsubscribe
  }, [queryClient, queryKey, callback])
}

export function useQueryInvalidation() {
  const queryClient = useQueryClient()

  const invalidateQuery = useCallback(
    (queryKey: readonly unknown[]) => {
      return queryClient.invalidateQueries({ queryKey })
    },
    [queryClient]
  )

  const invalidateMultiple = useCallback(
    (queryKeys: readonly unknown[][]) => {
      return Promise.all(
        queryKeys.map(queryKey => 
          queryClient.invalidateQueries({ queryKey })
        )
      )
    },
    [queryClient]
  )

  const invalidateAll = useCallback(
    () => queryClient.invalidateQueries(),
    [queryClient]
  )

  return {
    invalidateQuery,
    invalidateMultiple,
    invalidateAll
  }
}

export function useOfflineSync<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSync?: (pending: TVariables[]) => void
    maxRetries?: number
  }
) {
  const [pendingMutations, setPendingMutations] = useState<TVariables[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  const mutation = useMutation<TData, ApiError, TVariables>({
    mutationFn,
    onError: (error, variables) => {
      if (!navigator.onLine) {
        setPendingMutations(prev => [...prev, variables])
      }
    }
  })

  const syncPendingMutations = useCallback(async () => {
    if (pendingMutations.length === 0 || !navigator.onLine) return

    setIsSyncing(true)
    options?.onSync?.(pendingMutations)

    const results = await Promise.allSettled(
      pendingMutations.map(variables => mutationFn(variables))
    )

    const failedMutations = pendingMutations.filter(
      (_, index) => results[index].status === 'rejected'
    )

    setPendingMutations(failedMutations)
    setIsSyncing(false)
  }, [pendingMutations, mutationFn, options])

  useEffect(() => {
    const handleOnline = () => {
      syncPendingMutations()
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [syncPendingMutations])

  return {
    ...mutation,
    pendingMutations,
    isSyncing,
    syncPendingMutations
  }
}