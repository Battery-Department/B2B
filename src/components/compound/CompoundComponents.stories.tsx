import type { Meta, StoryObj } from '@storybook/react'
import { Modal, Dropdown, Accordion, Tabs, Form } from './CompoundComponents'
import { useState } from 'react'

// Modal Stories
const meta: Meta<typeof Modal> = {
  title: 'Components/Compound/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A compound modal component with trigger, content, header, body, footer, and close sub-components.'
      }
    }
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Modal>

export const BasicModal: Story = {
  render: () => (
    <Modal>
      <Modal.Trigger>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
          Open Modal
        </button>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Modal Title</h2>
            <Modal.Close>
              <span className="text-gray-500 hover:text-gray-700 text-xl">&times;</span>
            </Modal.Close>
          </div>
        </Modal.Header>
        <Modal.Body>
          <p className="text-gray-600">
            This is the modal content. You can put any content here.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>
            <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
              Cancel
            </button>
          </Modal.Close>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Confirm
          </button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  )
}

// Dropdown Stories
export const BasicDropdown: StoryObj<typeof Dropdown> = {
  render: () => (
    <Dropdown>
      <Dropdown.Trigger>
        <button className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2">
          <span>Select Option</span>
          <span>▼</span>
        </button>
      </Dropdown.Trigger>
      <Dropdown.Content>
        <Dropdown.Item value="option1">Option 1</Dropdown.Item>
        <Dropdown.Item value="option2">Option 2</Dropdown.Item>
        <Dropdown.Item value="option3">Option 3</Dropdown.Item>
      </Dropdown.Content>
    </Dropdown>
  )
}

// Accordion Stories
export const BasicAccordion: StoryObj<typeof Accordion> = {
  render: () => (
    <div className="w-96">
      <Accordion allowMultiple>
        <Accordion.Item itemId="item1">
          <Accordion.Trigger itemId="item1">
            <span>Accordion Item 1</span>
          </Accordion.Trigger>
          <Accordion.Content itemId="item1">
            <p>This is the content for accordion item 1. It can contain any React content.</p>
          </Accordion.Content>
        </Accordion.Item>
        
        <Accordion.Item itemId="item2">
          <Accordion.Trigger itemId="item2">
            <span>Accordion Item 2</span>
          </Accordion.Trigger>
          <Accordion.Content itemId="item2">
            <p>This is the content for accordion item 2 with more detailed information.</p>
          </Accordion.Content>
        </Accordion.Item>
        
        <Accordion.Item itemId="item3">
          <Accordion.Trigger itemId="item3">
            <span>Accordion Item 3</span>
          </Accordion.Trigger>
          <Accordion.Content itemId="item3">
            <p>This is the content for accordion item 3.</p>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
  )
}

// Tabs Stories
export const BasicTabs: StoryObj<typeof Tabs> = {
  render: () => (
    <div className="w-96">
      <Tabs defaultTab="tab1">
        <Tabs.List>
          <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          <Tabs.Trigger value="tab3">Tab 3</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="tab1">
          <p>Content for Tab 1. This is where you would put the main content for this tab.</p>
        </Tabs.Content>
        
        <Tabs.Content value="tab2">
          <p>Content for Tab 2. Different content can be shown based on the selected tab.</p>
        </Tabs.Content>
        
        <Tabs.Content value="tab3">
          <p>Content for Tab 3. Each tab can have completely different content and components.</p>
        </Tabs.Content>
      </Tabs>
    </div>
  )
}

// Form Stories
export const BasicForm: StoryObj<typeof Form> = {
  render: () => {
    const validationSchema = {
      email: (value: string) => {
        if (!value) return 'Email is required'
        if (!/\S+@\S+\.\S+/.test(value)) return 'Email is invalid'
        return null
      },
      password: (value: string) => {
        if (!value) return 'Password is required'
        if (value.length < 6) return 'Password must be at least 6 characters'
        return null
      }
    }

    return (
      <div className="w-96">
        <Form
          initialValues={{ email: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            console.log('Form submitted:', values)
            alert('Form submitted! Check console for values.')
          }}
        >
          <div className="space-y-4">
            <Form.Field name="email">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Form.Input name="email" type="email" placeholder="Enter your email" />
            </Form.Field>
            
            <Form.Field name="password">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Form.Input name="password" type="password" placeholder="Enter your password" />
            </Form.Field>
            
            <Form.Submit>Submit</Form.Submit>
          </div>
        </Form>
      </div>
    )
  }
}

// Interactive Examples
export const InteractiveModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    
    return (
      <Modal defaultOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Trigger>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Open Controlled Modal
          </button>
        </Modal.Trigger>
        <Modal.Content>
          <Modal.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Controlled Modal</h2>
              <Modal.Close>
                <span className="text-gray-500 hover:text-gray-700 text-xl">&times;</span>
              </Modal.Close>
            </div>
          </Modal.Header>
          <Modal.Body>
            <p className="text-gray-600">
              This modal's state is controlled by the parent component.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Modal is currently: {isOpen ? 'Open' : 'Closed'}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close>
              <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                Close
              </button>
            </Modal.Close>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    )
  }
}