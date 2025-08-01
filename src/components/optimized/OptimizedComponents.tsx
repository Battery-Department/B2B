import React, { memo, PropsWithChildren, ComponentType } from 'react'
import { isEqual, pick } from 'lodash'

interface OptimizationConfig {
  propsToCompare?: string[]
  customComparison?: (prevProps: any, nextProps: any) => boolean
  debugName?: string
  logRenders?: boolean
}

export function createOptimizedComponent<P extends object>(
  Component: ComponentType<P>,
  config: OptimizationConfig = {}
): ComponentType<P> {
  const {
    propsToCompare,
    customComparison,
    debugName = Component.displayName || Component.name,
    logRenders = process.env.NODE_ENV === 'development'
  } = config

  const arePropsEqual = (prevProps: P, nextProps: P): boolean => {
    if (customComparison) {
      return customComparison(prevProps, nextProps)
    }

    if (propsToCompare) {
      const prevPicked = pick(prevProps, propsToCompare)
      const nextPicked = pick(nextProps, propsToCompare)
      return isEqual(prevPicked, nextPicked)
    }

    return isEqual(prevProps, nextProps)
  }

  const MemoizedComponent = memo(Component, arePropsEqual)
  MemoizedComponent.displayName = `Optimized(${debugName})`

  if (logRenders) {
    return (props: P) => {
      console.debug(`Rendering ${debugName}`)
      return <MemoizedComponent {...props} />
    }
  }

  return MemoizedComponent
}

interface ListItemProps<T> {
  item: T
  index: number
  renderItem: (item: T, index: number) => React.ReactNode
  getKey: (item: T, index: number) => string | number
  onItemClick?: (item: T, index: number) => void
}

const OptimizedListItem = memo(
  <T,>({ item, index, renderItem, onItemClick }: ListItemProps<T>) => {
    const handleClick = () => onItemClick?.(item, index)

    return (
      <div onClick={handleClick} role="listitem">
        {renderItem(item, index)}
      </div>
    )
  },
  (prev, next) => {
    return (
      prev.index === next.index &&
      isEqual(prev.item, next.item) &&
      prev.renderItem === next.renderItem &&
      prev.onItemClick === next.onItemClick
    )
  }
)

interface OptimizedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  getKey: (item: T, index: number) => string | number
  onItemClick?: (item: T, index: number) => void
  className?: string
}

export const OptimizedList = memo(
  <T,>({
    items,
    renderItem,
    getKey,
    onItemClick,
    className
  }: OptimizedListProps<T>) => {
    return (
      <div className={className} role="list">
        {items.map((item, index) => (
          <OptimizedListItem
            key={getKey(item, index)}
            item={item}
            index={index}
            renderItem={renderItem}
            getKey={getKey}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    )
  }
)

interface FormFieldProps {
  name: string
  value: string | number
  onChange: (name: string, value: string | number) => void
  type?: 'text' | 'number' | 'email' | 'password'
  label?: string
  error?: string
  disabled?: boolean
}

export const OptimizedFormField = memo(
  ({
    name,
    value,
    onChange,
    type = 'text',
    label,
    error,
    disabled
  }: FormFieldProps) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(name, e.target.value)
    }

    return (
      <div className="form-field">
        {label && <label htmlFor={name}>{label}</label>}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {error && (
          <span id={`${name}-error`} className="error">
            {error}
          </span>
        )}
      </div>
    )
  },
  (prev, next) => {
    return (
      prev.name === next.name &&
      prev.value === next.value &&
      prev.type === next.type &&
      prev.label === next.label &&
      prev.error === next.error &&
      prev.disabled === next.disabled &&
      prev.onChange === next.onChange
    )
  }
)

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: () => void
  className?: string
}

export const OptimizedImage = memo(
  ({
    src,
    alt,
    width,
    height,
    loading = 'lazy',
    onLoad,
    onError,
    className
  }: OptimizedImageProps) => {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={onLoad}
        onError={onError}
        className={className}
        decoding="async"
      />
    )
  },
  (prev, next) => prev.src === next.src && prev.alt === next.alt
)

interface SuspenseWrapperProps {
  fallback?: React.ReactNode
  errorFallback?: (error: Error) => React.ReactNode
  children: React.ReactNode
}

class ErrorBoundary extends React.Component<
  PropsWithChildren<{ fallback?: (error: Error) => React.ReactNode }>,
  { hasError: boolean; error?: Error }
> {
  constructor(props: PropsWithChildren<{ fallback?: (error: Error) => React.ReactNode }>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback?.(this.state.error) || <div>Something went wrong</div>
    }

    return this.props.children
  }
}

export const OptimizedSuspenseWrapper = memo(
  ({ fallback, errorFallback, children }: SuspenseWrapperProps) => {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <React.Suspense fallback={fallback || <div>Loading...</div>}>
          {children}
        </React.Suspense>
      </ErrorBoundary>
    )
  }
)

interface OptimizedButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  children: React.ReactNode
  className?: string
}

export const OptimizedButton = memo(
  ({
    onClick,
    disabled,
    loading,
    variant = 'primary',
    size = 'medium',
    children,
    className
  }: OptimizedButtonProps) => {
    const handleClick = (e: React.MouseEvent) => {
      if (!disabled && !loading) {
        onClick()
      }
    }

    const buttonClass = [
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      loading && 'btn-loading',
      disabled && 'btn-disabled',
      className
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        className={buttonClass}
        onClick={handleClick}
        disabled={disabled || loading}
        aria-busy={loading}
      >
        {loading ? 'Loading...' : children}
      </button>
    )
  },
  (prev, next) => {
    return (
      prev.disabled === next.disabled &&
      prev.loading === next.loading &&
      prev.variant === next.variant &&
      prev.size === next.size &&
      prev.className === next.className &&
      prev.onClick === next.onClick &&
      isEqual(prev.children, next.children)
    )
  }
)

export const createOptimizedContext = <T,>(
  defaultValue: T,
  displayName = 'OptimizedContext'
) => {
  const Context = React.createContext<T>(defaultValue)
  Context.displayName = displayName

  const Provider = memo(
    ({ value, children }: PropsWithChildren<{ value: T }>) => (
      <Context.Provider value={value}>{children}</Context.Provider>
    ),
    (prev, next) => isEqual(prev.value, next.value)
  )

  Provider.displayName = `${displayName}.Provider`

  return { Context, Provider }
}