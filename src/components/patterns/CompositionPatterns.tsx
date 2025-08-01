import React, { ReactNode, ComponentType, createElement, cloneElement, isValidElement } from 'react'

// Render Props Pattern
interface RenderPropsConfig<T> {
  children: (props: T) => ReactNode
}

export function createRenderPropsComponent<T>(
  useHook: () => T,
  displayName: string
) {
  const Component = ({ children }: RenderPropsConfig<T>) => {
    const hookResult = useHook()
    return <>{children(hookResult)}</>
  }
  
  Component.displayName = displayName
  return Component
}

// HOC Pattern
export function withLoadingState<P extends object>(
  Component: ComponentType<P>
) {
  return (props: P & { isLoading?: boolean; loadingComponent?: ReactNode }) => {
    const { isLoading, loadingComponent, ...componentProps } = props
    
    if (isLoading) {
      return <>{loadingComponent || <div>Loading...</div>}</>
    }
    
    return <Component {...(componentProps as P)} />
  }
}

export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  ErrorComponent?: ComponentType<{ error: Error }>
) {
  class ErrorBoundaryWrapper extends React.Component<
    P,
    { hasError: boolean; error?: Error }
  > {
    constructor(props: P) {
      super(props)
      this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error }
    }

    render() {
      if (this.state.hasError) {
        return ErrorComponent ? (
          <ErrorComponent error={this.state.error!} />
        ) : (
          <div>Something went wrong</div>
        )
      }

      return <Component {...this.props} />
    }
  }

  return ErrorBoundaryWrapper
}

// Slot Pattern
interface SlotProps {
  name: string
  children?: ReactNode
}

export const Slot: React.FC<SlotProps> = ({ children }) => <>{children}</>

interface SlotFillProps {
  children: ReactNode
  slots?: Record<string, ReactNode>
}

export const SlotFill: React.FC<SlotFillProps> = ({ children, slots = {} }) => {
  const fillSlots = (element: ReactNode): ReactNode => {
    if (!isValidElement(element)) return element

    if (element.type === Slot) {
      const slotName = element.props.name
      return slots[slotName] || element.props.children || null
    }

    if (element.props.children) {
      return cloneElement(element, {
        ...element.props,
        children: React.Children.map(element.props.children, fillSlots)
      })
    }

    return element
  }

  return <>{fillSlots(children)}</>
}

// Polymorphic Component Pattern
interface PolymorphicProps<C extends React.ElementType> {
  as?: C
  children?: ReactNode
}

type PolymorphicComponentProps<C extends React.ElementType, Props = {}> = 
  PolymorphicProps<C> & 
  Props & 
  Omit<React.ComponentPropsWithoutRef<C>, keyof (PolymorphicProps<C> & Props)>

export function createPolymorphicComponent<DefaultElement extends React.ElementType, Props = {}>(
  defaultElement: DefaultElement
) {
  return function PolymorphicComponent<C extends React.ElementType = DefaultElement>(
    props: PolymorphicComponentProps<C, Props>
  ) {
    const { as, children, ...restProps } = props
    const Element = as || defaultElement

    return createElement(Element, restProps, children)
  }
}

// Flexible Button using polymorphic pattern
export const FlexibleButton = createPolymorphicComponent<'button', {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
}>('button')

// Compound + Polymorphic Pattern
interface CardContextType {
  variant: 'default' | 'outlined' | 'elevated'
}

const CardContext = React.createContext<CardContextType | null>(null)

interface CardProps<C extends React.ElementType = 'div'> {
  as?: C
  variant?: 'default' | 'outlined' | 'elevated'
  children: ReactNode
}

export function Card<C extends React.ElementType = 'div'>({
  as,
  variant = 'default',
  children,
  className = '',
  ...props
}: CardProps<C> & Omit<React.ComponentPropsWithoutRef<C>, keyof CardProps<C>>) {
  const Element = as || 'div'
  
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    outlined: 'bg-white border-2 border-gray-300',
    elevated: 'bg-white shadow-lg border-0'
  }

  return (
    <CardContext.Provider value={{ variant }}>
      <Element 
        className={`rounded-lg ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </Element>
    </CardContext.Provider>
  )
}

const CardHeader = createPolymorphicComponent<'div', { 
  divider?: boolean 
}>('div')

const CardBody = createPolymorphicComponent<'div'>('div')

const CardFooter = createPolymorphicComponent<'div', { 
  divider?: boolean 
}>('div')

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

// Provider Pattern
interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  colors: Record<string, string>
}

const ThemeContext = React.createContext<ThemeContextType | null>(null)

export const useTheme = () => {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: 'light' | 'dark'
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(defaultTheme)

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const colors = {
    light: {
      background: '#ffffff',
      foreground: '#000000',
      primary: '#3b82f6',
      secondary: '#6b7280'
    },
    dark: {
      background: '#000000',
      foreground: '#ffffff',
      primary: '#60a5fa',
      secondary: '#9ca3af'
    }
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      colors: colors[theme]
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Function as Children Pattern
interface FunctionAsChildrenProps<T> {
  data: T
  children: (data: T, actions: { refresh: () => void }) => ReactNode
}

export function DataProvider<T>({ data, children }: FunctionAsChildrenProps<T>) {
  const [currentData, setCurrentData] = React.useState(data)

  const refresh = () => {
    // Simulate refresh
    setCurrentData({ ...currentData })
  }

  return <>{children(currentData, { refresh })}</>
}

// Controlled vs Uncontrolled Pattern
interface ControlledProps {
  value: string
  onChange: (value: string) => void
}

interface UncontrolledProps {
  defaultValue?: string
  onChange?: (value: string) => void
}

type FlexibleInputProps = (ControlledProps | UncontrolledProps) & {
  placeholder?: string
  className?: string
}

export const FlexibleInput: React.FC<FlexibleInputProps> = (props) => {
  const isControlled = 'value' in props
  const [internalValue, setInternalValue] = React.useState(
    isControlled ? '' : (props as UncontrolledProps).defaultValue || ''
  )

  const value = isControlled ? (props as ControlledProps).value : internalValue
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    if (!isControlled) {
      setInternalValue(newValue)
    }
    
    props.onChange?.(newValue)
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={props.placeholder}
      className={props.className || 'px-3 py-2 border border-gray-300 rounded-md'}
    />
  )
}

// Composition via children manipulation
interface ListProps {
  children: ReactNode
  renderEmpty?: () => ReactNode
  renderLoading?: () => ReactNode
  isLoading?: boolean
  isEmpty?: boolean
}

export const List: React.FC<ListProps> = ({ 
  children, 
  renderEmpty, 
  renderLoading, 
  isLoading, 
  isEmpty 
}) => {
  if (isLoading && renderLoading) {
    return <>{renderLoading()}</>
  }

  const childrenArray = React.Children.toArray(children)
  
  if ((isEmpty || childrenArray.length === 0) && renderEmpty) {
    return <>{renderEmpty()}</>
  }

  return (
    <ul className="list">
      {React.Children.map(children, (child, index) => (
        <li key={index} className="list-item">
          {child}
        </li>
      ))}
    </ul>
  )
}

// Advanced composition with context injection
interface InjectContextProps<T> {
  context: React.Context<T>
  children: (contextValue: T) => ReactNode
}

export function InjectContext<T>({ context, children }: InjectContextProps<T>) {
  const contextValue = React.useContext(context)
  return <>{children(contextValue)}</>
}

// Component composition utilities
export function composeComponents(...components: Array<React.ComponentType<any>>) {
  return components.reduce(
    (AccumulatedComponents, CurrentComponent) => {
      return function ComposedComponent(props: any) {
        return (
          <AccumulatedComponents>
            <CurrentComponent {...props} />
          </AccumulatedComponents>
        )
      }
    },
    ({ children }: { children: ReactNode }) => <>{children}</>
  )
}

// Mixin pattern for component enhancement
interface ComponentMixin<T> {
  (component: ComponentType<T>): ComponentType<T>
}

export function createMixin<T>(
  enhancement: (props: T) => Partial<T>
): ComponentMixin<T> {
  return (Component: ComponentType<T>) => {
    return (props: T) => {
      const enhancedProps = { ...props, ...enhancement(props) }
      return <Component {...enhancedProps} />
    }
  }
}

// Example usage of mixin
export const withDefaultProps = <T extends object>(defaultProps: Partial<T>): ComponentMixin<T> =>
  createMixin((props: T) => ({ ...defaultProps, ...props }))

export const withClassName = <T extends { className?: string }>(className: string): ComponentMixin<T> =>
  createMixin((props: T) => ({
    className: `${className} ${props.className || ''}`.trim()
  }))