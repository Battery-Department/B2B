/**
 * Meta Simulator Example Usage
 * This demonstrates how to use the Meta Simulator service
 */

import { MetaSimulator } from './index'

// Initialize the simulator
const simulator = new MetaSimulator({
  userCount: 50,
  eventFrequency: 'normal',
  simulationSpeed: 2, // 2x speed
  testEventCode: 'TEST_EVENT_CODE_123'
})

async function runSimulation() {
  // Initialize users
  await simulator.initialize()
  
  // Get simulation statistics
  const stats = simulator.getSimulationStats()
  console.log('Simulation Stats:', stats)
  
  // Generate a batch of events
  const events = simulator.generateEventBatch(20)
  console.log('Generated Events:', events.length)
  
  // Simulate a specific user's quiz interaction
  const userId = 'user_123456789_abc'
  const quizInteractions = simulator.simulateQuizInteraction(userId)
  console.log('Quiz Interactions:', quizInteractions)
  
  // Create a custom audience
  const highValueAudience = simulator.generateCustomAudience({
    name: 'High Value Construction Customers',
    description: 'Customers in construction with high purchase value',
    minPurchaseValue: 500,
    interests: ['power_tools', 'construction'],
    businessType: 'construction'
  })
  console.log('Custom Audience:', highValueAudience)
  
  // Simulate a conversion
  const conversion = simulator.simulateConversion(userId, 'purchase', 299.99)
  console.log('Conversion:', conversion)
  
  // Export Meta-compatible data
  const metaData = simulator.exportMetaCompatibleData()
  console.log('Meta Compatible Data:', JSON.stringify(metaData, null, 2))
  
  // Start real-time simulation
  const cleanup = simulator.startRealTimeSimulation((event) => {
    console.log('Real-time Event:', {
      type: event.eventName,
      user: event.userId,
      value: event.customData?.value,
      timestamp: event.timestamp
    })
  })
  
  // Run for 10 seconds then cleanup
  setTimeout(() => {
    cleanup()
    console.log('Simulation stopped')
  }, 10000)
}

// Example: Generate specific event types
function generateSpecificEvents() {
  const simulator = new MetaSimulator({ userCount: 10 })
  simulator.initialize()
  
  // Generate specific event types
  const userId = 'user_test_123'
  
  // Page view
  const pageView = simulator.generateEvent(userId, 'PageView')
  console.log('PageView:', pageView)
  
  // Product view
  const viewContent = simulator.generateEvent(userId, 'ViewContent')
  console.log('ViewContent:', viewContent)
  
  // Add to cart
  const addToCart = simulator.generateEvent(userId, 'AddToCart')
  console.log('AddToCart:', addToCart)
  
  // Purchase
  const purchase = simulator.generateEvent(userId, 'Purchase')
  console.log('Purchase:', purchase)
}

// Example: Analyze user behavior patterns
function analyzeUserBehavior() {
  const simulator = new MetaSimulator({ userCount: 100 })
  simulator.initialize()
  
  const stats = simulator.getSimulationStats()
  
  console.log('User Analysis:')
  console.log(`- Total Users: ${stats.totalUsers}`)
  console.log(`- Active Users: ${stats.activeUsers} (${(stats.activeUsers / stats.totalUsers * 100).toFixed(1)}%)`)
  console.log(`- Average Engagement: ${(stats.averageEngagement * 100).toFixed(1)}%`)
  console.log(`- Conversion Rate: ${(stats.conversionRate * 100).toFixed(1)}%`)
  console.log(`- Average Order Value: $${stats.averageOrderValue.toFixed(2)}`)
  
  console.log('\nDevice Breakdown:')
  Object.entries(stats.deviceBreakdown).forEach(([device, count]) => {
    console.log(`- ${device}: ${count} users`)
  })
  
  console.log('\nTop Interests:')
  stats.interestCategories.forEach(({ interest, count }) => {
    console.log(`- ${interest}: ${count} users`)
  })
}

// Run examples
if (require.main === module) {
  console.log('=== Meta Simulator Examples ===\n')
  
  console.log('1. Running main simulation...')
  runSimulation()
  
  setTimeout(() => {
    console.log('\n2. Generating specific events...')
    generateSpecificEvents()
  }, 2000)
  
  setTimeout(() => {
    console.log('\n3. Analyzing user behavior...')
    analyzeUserBehavior()
  }, 4000)
}

export { runSimulation, generateSpecificEvents, analyzeUserBehavior }