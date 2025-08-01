import type { Meta, StoryObj } from '@storybook/react'
import { 
  FlexibleButton, 
  Card, 
  ThemeProvider, 
  useTheme,
  FlexibleInput,
  List,
  DataProvider,
  withLoadingState,
  withErrorBoundary
} from './CompositionPatterns'
import { useState } from 'react'

// Flexible Button Stories
const meta: Meta<typeof FlexibleButton> = {
  title: 'Components/Patterns/Polymorphic',
  component: FlexibleButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A polymorphic button component that can render as different HTML elements while maintaining consistent styling and behavior.'
      }
    }
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof FlexibleButton>

export const AsButton: Story = {
  args: {
    variant: 'primary',
    size: 'medium',
    children: 'Click me',
  },
  render: (args) => (
    <FlexibleButton 
      {...args} 
      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
    />
  )
}

export const AsLink: Story = {
  render: () => (
    <FlexibleButton 
      as="a" 
      href="#" 
      variant="secondary"
      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 no-underline"
    >
      Link Button
    </FlexibleButton>
  )
}

export const AsDiv: Story = {
  render: () => (
    <FlexibleButton 
      as="div" 
      variant="danger"
      className="px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer hover:bg-red-600"
    >
      Div Button
    </FlexibleButton>
  )
}

// Card Stories
export const BasicCard: StoryObj<typeof Card> = {
  render: () => (
    <div className="w-96">
      <Card variant="default">
        <Card.Header className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Card Title</h3>
        </Card.Header>
        <Card.Body className="px-6 py-4">
          <p className="text-gray-600">
            This is the card content. Cards are polymorphic and can render as different elements.
          </p>
        </Card.Body>
        <Card.Footer className="px-6 py-4 border-t">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Action
          </button>
        </Card.Footer>
      </Card>
    </div>
  )
}

export const ElevatedCard: StoryObj<typeof Card> = {
  render: () => (
    <div className="w-96">
      <Card variant="elevated">
        <Card.Header className="px-6 py-4">
          <h3 className="text-lg font-semibold">Elevated Card</h3>
        </Card.Header>
        <Card.Body className="px-6 py-4">
          <p className="text-gray-600">
            This card has elevation (shadow) styling.
          </p>
        </Card.Body>
      </Card>
    </div>
  )
}

export const CardAsArticle: StoryObj<typeof Card> = {
  render: () => (
    <div className="w-96">
      <Card as="article" variant="outlined">
        <Card.Header as="header" className="px-6 py-4">
          <h3 className="text-lg font-semibold">Article Card</h3>
        </Card.Header>
        <Card.Body as="main" className="px-6 py-4">
          <p className="text-gray-600">
            This card renders as an article element with semantic HTML.
          </p>
        </Card.Body>
        <Card.Footer as="footer" className="px-6 py-4">
          <time className="text-sm text-gray-500">Published today</time>
        </Card.Footer>
      </Card>
    </div>
  )
}

// Theme Provider Stories
const ThemeExample = () => {
  const { theme, toggleTheme, colors } = useTheme()
  
  return (
    <div 
      className="p-6 rounded-lg transition-colors duration-200"
      style={{ 
        backgroundColor: colors.background, 
        color: colors.foreground,
        border: `1px solid ${colors.secondary}`
      }}
    >
      <h3 className="text-lg font-semibold mb-4">Current Theme: {theme}</h3>
      <p className="mb-4">
        This component uses the theme context to adapt its colors.
      </p>
      <button 
        onClick={toggleTheme}
        className="px-4 py-2 rounded-md transition-colors"
        style={{ 
          backgroundColor: colors.primary, 
          color: colors.background 
        }}
      >
        Toggle Theme
      </button>
    </div>
  )
}

export const ThemeProviderExample: StoryObj = {
  render: () => (
    <ThemeProvider defaultTheme="light">
      <ThemeExample />
    </ThemeProvider>
  )
}

// Flexible Input Stories
export const ControlledInput: StoryObj<typeof FlexibleInput> = {
  render: () => {
    const [value, setValue] = useState('')
    
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Controlled Input
          </label>
          <FlexibleInput 
            value={value}
            onChange={setValue}
            placeholder="Type something..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-sm text-gray-600">
          Current value: "{value}"
        </p>
      </div>
    )
  }
}

export const UncontrolledInput: StoryObj<typeof FlexibleInput> = {
  render: () => {
    const [lastValue, setLastValue] = useState('')
    
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Uncontrolled Input
          </label>
          <FlexibleInput 
            defaultValue="Initial value"
            onChange={setLastValue}
            placeholder="Type something..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-sm text-gray-600">
          Last change: "{lastValue}"
        </p>
      </div>
    )
  }
}

// List with render props
export const ListWithStates: StoryObj<typeof List> = {
  render: () => {
    const [items, setItems] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    
    const addItem = () => {
      setItems(prev => [...prev, `Item ${prev.length + 1}`])
    }
    
    const clearItems = () => {
      setItems([])
    }
    
    const simulateLoading = () => {
      setIsLoading(true)
      setTimeout(() => {
        setItems(['Loaded Item 1', 'Loaded Item 2', 'Loaded Item 3'])
        setIsLoading(false)
      }, 2000)
    }
    
    return (
      <div className="space-y-4">
        <div className="flex space-x-2">
          <button 
            onClick={addItem}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Add Item
          </button>
          <button 
            onClick={clearItems}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Clear
          </button>
          <button 
            onClick={simulateLoading}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            disabled={isLoading}
          >
            Load Items
          </button>
        </div>
        
        <List
          isLoading={isLoading}
          isEmpty={items.length === 0}
          renderLoading={() => (
            <div className="flex items-center space-x-2 p-4 text-gray-500">
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
              <span>Loading items...</span>
            </div>
          )}
          renderEmpty={() => (
            <div className="p-4 text-gray-500 text-center">
              No items to display. Add some items to see them here.
            </div>
          )}
        >
          {items.map((item, index) => (
            <div key={index} className="p-2 hover:bg-gray-50">
              {item}
            </div>
          ))}
        </List>
      </div>
    )
  }
}

// Data Provider with render props
export const DataProviderExample: StoryObj = {
  render: () => (
    <DataProvider data={{ count: 0, message: 'Hello World' }}>
      {(data, { refresh }) => (
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Data Provider Example</h3>
          <p className="mb-2">Count: {data.count}</p>
          <p className="mb-4">Message: {data.message}</p>
          <button 
            onClick={refresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Refresh Data
          </button>
        </div>
      )}
    </DataProvider>
  )
}

// HOC Examples
const SimpleComponent = ({ message }: { message: string }) => (
  <div className="p-4 bg-blue-50 rounded-lg">
    <p>{message}</p>
  </div>
)

const LoadingComponent = withLoadingState(SimpleComponent)
const ErrorBoundaryComponent = withErrorBoundary(SimpleComponent)

export const WithLoadingState: StoryObj = {
  render: () => {
    const [isLoading, setIsLoading] = useState(false)
    
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setIsLoading(!isLoading)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Toggle Loading: {isLoading ? 'ON' : 'OFF'}
        </button>
        
        <LoadingComponent 
          message="This component can show loading state"
          isLoading={isLoading}
          loadingComponent={
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="animate-pulse">Loading component...</div>
            </div>
          }
        />
      </div>
    )
  }
}