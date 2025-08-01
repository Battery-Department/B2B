import {
  QueryClient,
  QueryClientConfig,
  DefaultOptions,
  UseMutationOptions,
  UseQueryOptions,
  QueryKey,
  MutationKey
} from '@tanstack/react-query'
import { AxiosError } from 'axios'

interface QueryError {
  message: string
  code?: string
  details?: Record<string, any>
}

const defaultQueryOptions: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) return false
        if (error.response?.status === 401) return false
        if (error.response?.status === 403) return false
      }
      return failureCount < 3
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always'
  },
  mutations: {
    retry: 1,
    retryDelay: 1000
  }
}

export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions
})

export const queryKeys = {
  all: ['queries'] as const,
  
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const
  },
  
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    inventory: (id: string) => [...queryKeys.products.detail(id), 'inventory'] as const
  },
  
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    tracking: (id: string) => [...queryKeys.orders.detail(id), 'tracking'] as const
  },
  
  analytics: {
    all: ['analytics'] as const,
    dashboard: (period: string) => [...queryKeys.analytics.all, 'dashboard', period] as const,
    metrics: (type: string, period: string) => 
      [...queryKeys.analytics.all, 'metrics', type, period] as const
  }
}

export function createOptimisticUpdate<TData, TVariables>(
  queryKey: QueryKey,
  updateFn: (old: TData | undefined, variables: TVariables) => TData
): Pick<UseMutationOptions<TData, QueryError, TVariables>, 'onMutate' | 'onError' | 'onSettled'> {
  return {
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData<TData>(queryKey)
      
      queryClient.setQueryData<TData>(queryKey, (old) => 
        updateFn(old, variables)
      )
      
      return { previousData }
    },
    onError: (err, variables, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    }
  }
}

export function createInfiniteQueryOptions<TData, TPageParam = number>(
  queryKey: QueryKey,
  fetchFn: (pageParam: TPageParam) => Promise<TData>,
  options?: {
    getNextPageParam?: (lastPage: TData, allPages: TData[]) => TPageParam | undefined
    getPreviousPageParam?: (firstPage: TData, allPages: TData[]) => TPageParam | undefined
    initialPageParam?: TPageParam
  }
) {
  return {
    queryKey,
    queryFn: ({ pageParam }: { pageParam: TPageParam }) => fetchFn(pageParam),
    initialPageParam: options?.initialPageParam ?? 0 as TPageParam,
    getNextPageParam: options?.getNextPageParam,
    getPreviousPageParam: options?.getPreviousPageParam
  }
}

export const prefetchQuery = async <TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseQueryOptions<TData, QueryError>
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    ...options
  })
}

export const invalidateQueries = (queryKey: QueryKey, exact = false) => {
  return queryClient.invalidateQueries({
    queryKey,
    exact
  })
}

export const resetQueries = (queryKey: QueryKey, exact = false) => {
  return queryClient.resetQueries({
    queryKey,
    exact
  })
}

export const cancelQueries = (queryKey: QueryKey, exact = false) => {
  return queryClient.cancelQueries({
    queryKey,
    exact
  })
}

export function createMutationOptions<TData, TVariables, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables, context: TContext) => void
    onError?: (error: QueryError, variables: TVariables, context: TContext | undefined) => void
    invalidateQueries?: QueryKey[]
    optimisticUpdate?: {
      queryKey: QueryKey
      updateFn: (old: any, variables: TVariables) => any
    }
  }
): UseMutationOptions<TData, QueryError, TVariables, TContext> {
  const mutationOptions: UseMutationOptions<TData, QueryError, TVariables, TContext> = {
    mutationFn
  }

  if (options?.optimisticUpdate) {
    const optimistic = createOptimisticUpdate(
      options.optimisticUpdate.queryKey,
      options.optimisticUpdate.updateFn
    )
    Object.assign(mutationOptions, optimistic)
  }

  if (options?.onSuccess) {
    mutationOptions.onSuccess = async (data, variables, context) => {
      options.onSuccess!(data, variables, context)
      
      if (options.invalidateQueries) {
        await Promise.all(
          options.invalidateQueries.map(queryKey => 
            invalidateQueries(queryKey)
          )
        )
      }
    }
  }

  if (options?.onError) {
    mutationOptions.onError = options.onError
  }

  return mutationOptions
}

export const queryUtils = {
  setQueryData: <TData>(queryKey: QueryKey, data: TData) => {
    queryClient.setQueryData(queryKey, data)
  },
  
  getQueryData: <TData>(queryKey: QueryKey): TData | undefined => {
    return queryClient.getQueryData<TData>(queryKey)
  },
  
  ensureQueryData: async <TData>(
    queryKey: QueryKey,
    queryFn: () => Promise<TData>
  ): Promise<TData> => {
    return queryClient.ensureQueryData({
      queryKey,
      queryFn
    })
  },
  
  fetchQuery: async <TData>(
    queryKey: QueryKey,
    queryFn: () => Promise<TData>
  ): Promise<TData> => {
    return queryClient.fetchQuery({
      queryKey,
      queryFn
    })
  }
}

export const createQuerySubscription = <TData>(
  queryKey: QueryKey,
  callback: (data: TData | undefined) => void
) => {
  return queryClient.getQueryCache().subscribe((event) => {
    if (event.query.queryKey === queryKey && event.type === 'updated') {
      callback(event.query.state.data as TData | undefined)
    }
  })
}

export const batchInvalidate = async (queryKeys: QueryKey[]) => {
  await Promise.all(
    queryKeys.map(queryKey => invalidateQueries(queryKey))
  )
}

export const suspenseOptions = <TData>(
  enabled = true
): Partial<UseQueryOptions<TData, QueryError>> => ({
  suspense: enabled,
  useErrorBoundary: enabled,
  staleTime: Infinity
})

export interface PaginationParams {
  page: number
  limit: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}

export const createPaginatedQuery = <TData>(
  baseKey: readonly string[],
  fetchFn: (params: PaginationParams) => Promise<PaginatedResponse<TData>>
) => {
  return (params: PaginationParams) => ({
    queryKey: [...baseKey, 'paginated', params] as const,
    queryFn: () => fetchFn(params),
    keepPreviousData: true
  })
}