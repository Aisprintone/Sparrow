# State Machine Patterns for Durable Objects

**CONTEXT KEEPER Documentation**: Architectural patterns and best practices for state management in Cloudflare Workers with Durable Objects.

## Executive Summary

This document provides reusable state machine patterns for building robust, event-sourced Durable Objects with validation, rollback capabilities, and automatic persistence. These patterns ensure zero mutable operations without validation and provide architectural purity following SOLID principles.

## Core Architecture Principles

### 1. Event Sourcing First
- All state changes must be represented as immutable events
- State is derived from event replay
- Events are the single source of truth
- Commands generate events, never mutate state directly

### 2. Validation Before Mutation
- Zero operations proceed without validation
- Business rule validation at command level
- Schema validation for state integrity
- Invariant checking after state changes

### 3. Rollback by Design
- Every operation must support rollback
- Snapshot-based rollback for complex scenarios
- Event-based rollback for granular control
- Compensation patterns for distributed rollbacks

### 4. Immutable State
- All state objects are deeply frozen
- State transitions create new immutable state
- No in-place mutations allowed
- Copy-on-write semantics

## Pattern Catalog

### Pattern 1: Base State Machine

```typescript
interface BaseStateMachine<TState, TEvent> {
  readonly currentState: TState
  readonly allowedTransitions: ReadonlyMap<string, readonly string[]>
  
  canTransition(from: string, to: string): boolean
  transition(event: TEvent): TState
  getNextStates(currentState: string): readonly string[]
}
```

**When to Use**: Foundation for all state machines requiring controlled state transitions.

**Benefits**:
- Prevents invalid state transitions
- Explicit state flow documentation
- Deterministic state behavior
- Easy testing and verification

### Pattern 2: Command Handler Pattern

```typescript
interface CommandHandler<TState, TCommand, TResult> {
  canHandle(command: TCommand): boolean
  validate(state: TState, command: TCommand): ValidationResult
  execute(state: TState, command: TCommand): Promise<CommandResult<TResult>>
  rollback(state: TState, rollbackData: unknown): Promise<TState>
}
```

**When to Use**: Complex business operations requiring validation, execution, and rollback.

**Implementation Example**:
```typescript
class CreateSessionCommandHandler implements CommandHandler<UserSessionState, CreateSessionCommand, SessionResult> {
  canHandle(command: CreateSessionCommand): boolean {
    return command.type === 'CREATE_SESSION'
  }

  validate(state: UserSessionState, command: CreateSessionCommand): ValidationResult {
    return this.validator.validate(state, command)
  }

  async execute(state: UserSessionState, command: CreateSessionCommand): Promise<CommandResult<SessionResult>> {
    // Business logic here
    return {
      success: true,
      result: { sessionId: 'new-session' },
      events: [sessionCreatedEvent],
      rollbackData: { previousState: 'none' }
    }
  }

  async rollback(state: UserSessionState, rollbackData: unknown): Promise<UserSessionState> {
    // Rollback logic here
    return state
  }
}
```

### Pattern 3: Event Sourced Aggregate

```typescript
abstract class EventSourcedAggregate<TState, TEvent> {
  protected state: TState
  private uncommittedEvents: TEvent[] = []

  protected addEvent(event: TEvent): void {
    this.uncommittedEvents.push(event)
    this.applyEvent(event)
  }

  protected abstract applyEvent(event: TEvent): void
  
  getUncommittedEvents(): readonly TEvent[] {
    return Object.freeze([...this.uncommittedEvents])
  }
  
  markEventsAsCommitted(): void {
    this.uncommittedEvents = []
  }
}
```

**When to Use**: Domain objects that need to track and apply events while maintaining consistency.

**UserSession Example**:
```typescript
class UserSessionAggregate extends EventSourcedAggregate<UserSessionState, UserSessionEvent> {
  protected applyEvent(event: UserSessionEvent): void {
    switch (event.type) {
      case 'SESSION_CREATED':
        this.state = Object.freeze({
          ...this.state,
          userId: event.userId,
          isActive: true,
          expiresAt: event.expiresAt
        })
        break
      case 'SESSION_RENEWED':
        this.state = Object.freeze({
          ...this.state,
          expiresAt: event.newExpiresAt
        })
        break
    }
  }
}
```

### Pattern 4: Saga Pattern for Workflows

```typescript
interface SagaStep<TContext> {
  readonly id: string
  readonly name: string
  execute(context: TContext): Promise<StepResult>
  compensate(context: TContext): Promise<CompensationResult>
  canExecute(context: TContext): boolean
}

class WorkflowSaga<TContext> {
  private steps: SagaStep<TContext>[] = []
  private executedSteps: string[] = []

  async execute(context: TContext): Promise<SagaResult> {
    try {
      for (const step of this.steps) {
        if (step.canExecute(context)) {
          const result = await step.execute(context)
          if (result.success) {
            this.executedSteps.push(step.id)
          } else {
            await this.compensate()
            return { success: false, error: result.error }
          }
        }
      }
      return { success: true }
    } catch (error) {
      await this.compensate()
      throw error
    }
  }

  private async compensate(): Promise<void> {
    // Execute compensation in reverse order
    for (const stepId of this.executedSteps.reverse()) {
      const step = this.steps.find(s => s.id === stepId)
      if (step) {
        await step.compensate(context)
      }
    }
  }
}
```

**When to Use**: Multi-step workflows requiring rollback and compensation.

### Pattern 5: Snapshot Strategy Pattern

```typescript
interface SnapshotStrategy<TState> {
  shouldCreateSnapshot(state: TState, eventCount: number): boolean
  createSnapshot(state: TState, reason: string): StateSnapshot<TState>
  canRestoreFromSnapshot(snapshot: StateSnapshot<TState>): boolean
}

class EventCountSnapshotStrategy<TState> implements SnapshotStrategy<TState> {
  constructor(private threshold: number = 10) {}

  shouldCreateSnapshot(state: TState, eventCount: number): boolean {
    return eventCount > 0 && eventCount % this.threshold === 0
  }

  createSnapshot(state: TState, reason: string): StateSnapshot<TState> {
    return Object.freeze({
      timestamp: Date.now(),
      state: this.deepClone(state),
      version: state.version,
      reason,
      metadata: { eventCount, strategy: 'event-count' }
    })
  }

  canRestoreFromSnapshot(snapshot: StateSnapshot<TState>): boolean {
    return snapshot.metadata.strategy === 'event-count'
  }
}
```

**When to Use**: Optimizing event replay performance with strategic snapshots.

### Pattern 6: State Validation Pipeline

```typescript
class ValidationPipeline<TState> {
  private validators: Array<(state: TState) => ValidationResult> = []

  addValidator(validator: (state: TState) => ValidationResult): this {
    this.validators.push(validator)
    return this
  }

  validate(state: TState): ValidationResult {
    const allErrors: ValidationError[] = []
    
    for (const validator of this.validators) {
      const result = validator(state)
      if (!result.isValid) {
        allErrors.push(...result.errors)
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: Object.freeze(allErrors)
    }
  }
}

// Usage Example
const userSessionValidator = new ValidationPipeline<UserSessionState>()
  .addValidator(state => ({
    isValid: state.expiresAt > Date.now(),
    errors: state.expiresAt <= Date.now() ? [{ 
      field: 'expiresAt', 
      code: 'EXPIRED', 
      message: 'Session expired' 
    }] : []
  }))
  .addValidator(state => ({
    isValid: state.isActive === true,
    errors: !state.isActive ? [{ 
      field: 'isActive', 
      code: 'INACTIVE', 
      message: 'Session inactive' 
    }] : []
  }))
```

## Implementation Strategies

### Strategy 1: Progressive State Transitions

For complex state machines with multiple intermediate states:

```typescript
class ProgressiveStateMachine {
  private transitionHistory: Array<{ from: string; to: string; timestamp: number }> = []
  
  async transitionWithSteps(
    fromState: string, 
    toState: string, 
    intermediateSteps: string[]
  ): Promise<boolean> {
    let currentState = fromState
    
    for (const step of intermediateSteps) {
      if (!this.canTransition(currentState, step)) {
        // Rollback to original state
        await this.rollbackToState(fromState)
        return false
      }
      
      this.recordTransition(currentState, step)
      currentState = step
    }
    
    // Final transition to target state
    if (this.canTransition(currentState, toState)) {
      this.recordTransition(currentState, toState)
      return true
    }
    
    // Rollback if final transition fails
    await this.rollbackToState(fromState)
    return false
  }
}
```

### Strategy 2: Optimistic Concurrency with Retry

```typescript
class OptimisticConcurrencyHandler<TState> {
  async executeWithRetry<TResult>(
    operation: (state: TState) => Promise<CommandResult<TResult>>,
    maxRetries: number = 3
  ): Promise<CommandResult<TResult>> {
    let attempt = 0
    
    while (attempt < maxRetries) {
      try {
        const currentVersion = await this.getVersion()
        const result = await operation(this.state)
        
        if (result.success) {
          await this.commitWithVersionCheck(currentVersion, result.events)
          return result
        }
        
        return result
      } catch (error) {
        if (error instanceof ConcurrencyError && attempt < maxRetries - 1) {
          // Reload state and retry
          await this.reloadState()
          attempt++
          
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 100)
          continue
        }
        
        throw error
      }
    }
    
    throw new Error(`Operation failed after ${maxRetries} attempts`)
  }
}
```

### Strategy 3: Hierarchical State Machines

For complex workflows with nested states:

```typescript
interface HierarchicalState {
  parent: string
  children: HierarchicalState[]
  data: Record<string, unknown>
}

class HierarchicalStateMachine {
  private stateHierarchy: Map<string, HierarchicalState> = new Map()
  
  canTransition(from: HierarchicalState, to: HierarchicalState): boolean {
    // Check if transition is valid within hierarchy
    return this.isValidHierarchicalTransition(from, to)
  }
  
  private isValidHierarchicalTransition(
    from: HierarchicalState, 
    to: HierarchicalState
  ): boolean {
    // Allow transitions within same parent
    if (from.parent === to.parent) return true
    
    // Allow transitions up the hierarchy
    if (this.isAncestor(to, from)) return true
    
    // Allow transitions to sibling hierarchies through common parent
    const commonParent = this.findCommonParent(from, to)
    return commonParent !== null
  }
}
```

## Anti-Patterns to Avoid

### ❌ Direct State Mutation
```typescript
// BAD
this.state.isActive = false
this.state.expiresAt = newDate

// GOOD
this.state = Object.freeze({
  ...this.state,
  isActive: false,
  expiresAt: newDate
})
```

### ❌ Unvalidated Commands
```typescript
// BAD
async handleCommand(command: Command): Promise<void> {
  // Direct execution without validation
  this.executeBusinessLogic(command)
}

// GOOD
async handleCommand(command: Command): Promise<CommandResult> {
  const validationResult = this.validator.validate(this.state, command)
  if (!validationResult.isValid) {
    return { success: false, error: { code: 'VALIDATION_FAILED', message: 'Invalid command' }, events: [] }
  }
  
  return this.executeBusinessLogic(command)
}
```

### ❌ Missing Rollback Support
```typescript
// BAD
async transferFunds(amount: number): Promise<void> {
  this.debitAccount(amount)
  this.creditAccount(amount)  // What if this fails?
}

// GOOD
async transferFunds(amount: number): Promise<CommandResult> {
  const snapshot = await this.createSnapshot('transfer_start')
  
  try {
    await this.debitAccount(amount)
    await this.creditAccount(amount)
    return { success: true, events: [...], rollbackData: { snapshot } }
  } catch (error) {
    await this.rollbackToSnapshot(snapshot)
    return { success: false, error: { code: 'TRANSFER_FAILED', message: error.message }, events: [] }
  }
}
```

### ❌ Synchronous Event Processing
```typescript
// BAD
addEvent(event: DomainEvent): void {
  this.events.push(event)
  this.publishEvent(event)  // Synchronous side effect
  this.updateMetrics(event) // More side effects
}

// GOOD
addEvent(event: DomainEvent): void {
  this.uncommittedEvents.push(event)
  // Side effects handled separately after successful persistence
}

async commitEvents(): Promise<void> {
  await this.persistEvents(this.uncommittedEvents)
  
  // Now safe to publish side effects
  for (const event of this.uncommittedEvents) {
    await this.publishEvent(event)
    this.updateMetrics(event)
  }
  
  this.uncommittedEvents = []
}
```

## Performance Optimization Patterns

### Pattern 1: Event Compaction
```typescript
class EventCompactor<TEvent> {
  compact(events: TEvent[]): TEvent[] {
    const compactedEvents: TEvent[] = []
    const eventMap = new Map<string, TEvent>()
    
    for (const event of events) {
      const key = this.getCompactionKey(event)
      if (this.isCompactable(event)) {
        eventMap.set(key, event) // Keep only latest
      } else {
        compactedEvents.push(event) // Preserve all non-compactable events
      }
    }
    
    compactedEvents.push(...eventMap.values())
    return compactedEvents.sort((a, b) => a.timestamp - b.timestamp)
  }
}
```

### Pattern 2: Lazy State Reconstruction
```typescript
class LazyStateManager<TState> {
  private cachedState: TState | null = null
  private lastEventVersion: number = 0
  
  async getState(): Promise<TState> {
    const currentVersion = await this.getEventVersion()
    
    if (this.cachedState && this.lastEventVersion === currentVersion) {
      return this.cachedState
    }
    
    // Reconstruct state from events
    const events = await this.getEventsSince(this.lastEventVersion)
    this.cachedState = this.applyEvents(this.cachedState || this.getInitialState(), events)
    this.lastEventVersion = currentVersion
    
    return this.cachedState
  }
}
```

## Testing Patterns

### Pattern 1: State Machine Testing
```typescript
describe('UserSession State Machine', () => {
  test('should handle valid state transitions', async () => {
    const session = new UserSessionDurableObject(mockContext, mockEnv)
    
    // Test transition: created -> active
    await session.createSession('user1', 'token', Date.now() + 3600000, 'millennial')
    const state1 = await session.getState()
    expect(state1.status).toBe('active')
    
    // Test transition: active -> expired
    await session.expireSession()
    const state2 = await session.getState()
    expect(state2.status).toBe('expired')
    
    // Test invalid transition: expired -> active (should fail)
    await expect(session.renewSession(Date.now() + 3600000))
      .rejects.toThrow('Invalid state transition')
  })
})
```

### Pattern 2: Event Sourcing Testing
```typescript
describe('Event Sourcing', () => {
  test('should reconstruct state from events', async () => {
    const events = [
      { type: 'SESSION_CREATED', userId: 'user1', timestamp: 1000 },
      { type: 'ACTIVITY_TRACKED', screen: 'dashboard', timestamp: 2000 },
      { type: 'SESSION_RENEWED', newExpiresAt: 5000, timestamp: 3000 }
    ]
    
    const reconstructedState = await replayEvents(events, getInitialState())
    
    expect(reconstructedState.userId).toBe('user1')
    expect(reconstructedState.currentScreen).toBe('dashboard')
    expect(reconstructedState.expiresAt).toBe(5000)
  })
})
```

## Conclusion

These state machine patterns provide a robust foundation for building event-sourced Durable Objects with architectural purity. By following these patterns, you ensure:

- **Zero technical debt** through validated mutations
- **Complete rollback capability** for all operations  
- **Event sourcing** for audit trails and debugging
- **Immutable state** for predictable behavior
- **SOLID principles** for maintainable code

Remember: **Every state change is an event. Every command is validated. Every operation supports rollback.**

---

*This document is maintained by CONTEXT KEEPER for architectural consistency across all Sparrow FinanceAI Durable Objects.*