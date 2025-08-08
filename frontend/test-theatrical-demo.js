/**
 * Test script for theatrical workflow demo
 * Run this in the browser console to test the automation features
 */

console.log('🎭 Testing Theatrical Workflow Demo...')

// Test the AI Actions Service
async function testTheatricalWorkflow() {
  try {
    // Import the service (this would work in a real environment)
    const { aiActionsService } = await import('./lib/api/ai-actions-service.ts')
    
    console.log('✅ AI Actions Service loaded')
    
    // Test starting a workflow
    const result = await aiActionsService.startAIAction(
      'optimize.cancel_subscriptions.v1',
      'test-user',
      { demographic: 'millennial' }
    )
    
    console.log('🚀 Workflow started:', result)
    
    // Test getting status
    const status = await aiActionsService.getAIActionStatus(result.execution_id)
    console.log('📊 Initial status:', status)
    
    // Poll for updates
    const pollInterval = setInterval(async () => {
      try {
        const currentStatus = await aiActionsService.getAIActionStatus(result.execution_id)
        console.log('📈 Status update:', {
          progress: currentStatus.progress,
          current_step: currentStatus.current_step,
          status: currentStatus.status
        })
        
        if (currentStatus.status === 'completed') {
          console.log('✅ Workflow completed!')
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('❌ Error polling status:', error)
        clearInterval(pollInterval)
      }
    }, 1000)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Test the UI interactions
function testUIInteractions() {
  console.log('🎨 Testing UI Interactions...')
  
  // Simulate clicking the "Automate" button
  const automateButtons = document.querySelectorAll('button')
  const automateButton = Array.from(automateButtons).find(btn => 
    btn.textContent?.includes('Automate')
  )
  
  if (automateButton) {
    console.log('✅ Found Automate button')
    console.log('🖱️ Clicking button...')
    automateButton.click()
  } else {
    console.log('❌ No Automate button found')
  }
}

// Run tests
console.log('🧪 Running theatrical workflow tests...')
testTheatricalWorkflow()
testUIInteractions()

console.log(`
🎭 Theatrical Demo Test Complete!

To test manually:
1. Open http://localhost:3001
2. Navigate to "AI Actions" 
3. Click "Automate" on any suggested action
4. Watch the theatrical workflow execute
5. Check the "In Process" tab for real-time updates

Expected behavior:
- Workflow starts with "Initializing..."
- Progress bar updates every 2-5 seconds
- Step names change realistically
- Workflow completes after ~10-15 seconds
- Moves to "Completed" status
`)
