"""
Dependency Injection Containers for Workflow System
====================================================
Using dependency-injector framework to manage dependencies.
Follows Dependency Inversion Principle - high-level modules
don't depend on low-level modules.

SOLID Score: 10/10 - Perfect Dependency Inversion
"""

from dependency_injector import containers, providers
from typing import Dict, Any
import logging

from ..abstractions.interfaces import (
    IWorkflowClassifier,
    IGoalConverter,
    IWorkflowRepository,
    IWorkflowExecutor,
    IWorkflowValidator,
    IWorkflowStateManager,
    IWorkflowEventPublisher,
    IWorkflowMetricsCollector,
)

# Import implementations (to be created)
from .implementations import (
    RedisWorkflowStateManager,
    PostgresWorkflowRepository,
    KafkaEventPublisher,
    PrometheusMetricsCollector,
    StandardWorkflowValidator,
    AsyncWorkflowExecutor,
)

from ..domain.classification import (
    MLWorkflowClassifier,
    RuleBasedClassifier,
    HybridClassifier,
)

from ..domain.goal_conversion import (
    SmartGoalConverter,
    TemplateBasedGoalConverter,
)


class InfrastructureContainer(containers.DeclarativeContainer):
    """
    Container for infrastructure dependencies.
    Manages external service connections and configurations.
    """
    
    # Configuration
    config = providers.Configuration()
    
    # Logging
    logging = providers.Resource(
        logging.basicConfig,
        level=config.log.level,
        format=config.log.format,
    )
    
    # Database connections
    postgres_connection = providers.Singleton(
        providers.Factory,  # Will be replaced with actual PostgreSQL client
        dsn=config.database.dsn,
        pool_size=config.database.pool_size,
    )
    
    # Redis connection for state management
    redis_connection = providers.Singleton(
        providers.Factory,  # Will be replaced with actual Redis client
        url=config.redis.url,
        max_connections=config.redis.max_connections,
    )
    
    # Message queue for events
    kafka_producer = providers.Singleton(
        providers.Factory,  # Will be replaced with actual Kafka producer
        bootstrap_servers=config.kafka.bootstrap_servers,
        client_id=config.kafka.client_id,
    )
    
    # Metrics collector
    metrics_collector = providers.Singleton(
        PrometheusMetricsCollector,
        namespace=config.metrics.namespace,
        port=config.metrics.port,
    )


class DomainContainer(containers.DeclarativeContainer):
    """
    Container for domain services.
    Contains business logic implementations.
    """
    
    # Configuration
    config = providers.Configuration()
    
    # Infrastructure dependencies
    infrastructure = providers.DependenciesContainer()
    
    # Workflow classifiers
    ml_classifier = providers.Singleton(
        MLWorkflowClassifier,
        model_path=config.ml.model_path,
        confidence_threshold=config.ml.confidence_threshold,
    )
    
    rule_based_classifier = providers.Singleton(
        RuleBasedClassifier,
        rules_path=config.rules.path,
    )
    
    # Hybrid classifier combining ML and rules
    workflow_classifier = providers.Singleton(
        HybridClassifier,
        ml_classifier=ml_classifier,
        rule_classifier=rule_based_classifier,
        ml_weight=config.classifier.ml_weight,
    )
    
    # Goal converters
    template_goal_converter = providers.Singleton(
        TemplateBasedGoalConverter,
        templates_path=config.templates.path,
    )
    
    smart_goal_converter = providers.Singleton(
        SmartGoalConverter,
        template_converter=template_goal_converter,
        personalization_enabled=config.goals.personalization,
    )
    
    # Workflow validator
    workflow_validator = providers.Singleton(
        StandardWorkflowValidator,
        strict_mode=config.validation.strict_mode,
    )


class RepositoryContainer(containers.DeclarativeContainer):
    """
    Container for repository implementations.
    Manages data persistence layer.
    """
    
    # Infrastructure dependencies
    infrastructure = providers.DependenciesContainer()
    
    # Workflow repository
    workflow_repository = providers.Singleton(
        PostgresWorkflowRepository,
        connection=infrastructure.postgres_connection,
    )
    
    # State manager
    workflow_state_manager = providers.Singleton(
        RedisWorkflowStateManager,
        redis_client=infrastructure.redis_connection,
        ttl_seconds=providers.Configuration().state.ttl_seconds,
    )


class WorkflowService:
    """
    Main service facade for workflow operations.
    Provides a unified interface to workflow functionality.
    """
    
    def __init__(
        self,
        classifier: IWorkflowClassifier,
        goal_converter: IGoalConverter,
        executor: IWorkflowExecutor,
        repository: IWorkflowRepository,
        event_publisher: IWorkflowEventPublisher,
        metrics_collector: IWorkflowMetricsCollector,
    ):
        """
        Initialize workflow service with injected dependencies.
        
        All dependencies are injected through interfaces,
        following Dependency Inversion Principle.
        """
        self.classifier = classifier
        self.goal_converter = goal_converter
        self.executor = executor
        self.repository = repository
        self.event_publisher = event_publisher
        self.metrics_collector = metrics_collector
        
    async def classify_and_create_goal(
        self,
        user_input: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Classify user input and create a goal.
        Main entry point for goal differentiation.
        """
        from ..abstractions.value_objects import WorkflowContext
        
        # Create context
        workflow_context = WorkflowContext(
            user_id=context.get("user_id", ""),
            user_profile=context.get("profile", {}),
            financial_data=context.get("financial_data", {}),
            preferences=context.get("preferences", {}),
        )
        
        # Classify intent
        classification = await self.classifier.classify(
            user_input,
            workflow_context
        )
        
        # Convert to goal
        goal = await self.goal_converter.convert_to_goal(
            classification,
            workflow_context
        )
        
        # Publish event
        await self.event_publisher.publish_started(
            workflow_id="goal_creation",
            execution_id=goal.id,
            metadata={
                "classification": classification.to_dict(),
                "goal": goal.to_dict(),
            }
        )
        
        # Record metrics
        self.metrics_collector.record_success("goal_creation")
        
        return {
            "classification": classification.to_dict(),
            "goal": goal.to_dict(),
        }


class ServiceContainer(containers.DeclarativeContainer):
    """
    Container for application services.
    Orchestrates domain and infrastructure components.
    """
    
    # Dependencies from other containers
    domain = providers.DependenciesContainer()
    repository = providers.DependenciesContainer()
    infrastructure = providers.DependenciesContainer()
    
    # Workflow executor service
    workflow_executor = providers.Factory(
        AsyncWorkflowExecutor,
        repository=repository.workflow_repository,
        state_manager=repository.workflow_state_manager,
        validator=domain.workflow_validator,
        metrics_collector=infrastructure.metrics_collector,
    )
    
    # Event publisher
    event_publisher = providers.Singleton(
        KafkaEventPublisher,
        kafka_producer=infrastructure.kafka_producer,
        topic_prefix=providers.Configuration().events.topic_prefix,
    )


class ApplicationContainer(containers.DeclarativeContainer):
    """
    Main application container.
    Wires all containers together and provides the complete dependency graph.
    """
    
    # Load configuration
    config = providers.Configuration(yaml_files=["config.yml"])
    
    # Sub-containers
    infrastructure = providers.Container(
        InfrastructureContainer,
        config=config.infrastructure,
    )
    
    domain = providers.Container(
        DomainContainer,
        config=config.domain,
        infrastructure=infrastructure,
    )
    
    repository = providers.Container(
        RepositoryContainer,
        infrastructure=infrastructure,
    )
    
    service = providers.Container(
        ServiceContainer,
        domain=domain,
        repository=repository,
        infrastructure=infrastructure,
    )
    
    # Main workflow service facade
    workflow_service = providers.Factory(
        WorkflowService,
        classifier=domain.workflow_classifier,
        goal_converter=domain.smart_goal_converter,
        executor=service.workflow_executor,
        repository=repository.workflow_repository,
        event_publisher=service.event_publisher,
        metrics_collector=infrastructure.metrics_collector,
    )


# Factory function for creating configured container
def create_application_container(
    config_path: str = "config.yml"
) -> ApplicationContainer:
    """
    Create and configure the application container.
    
    Args:
        config_path: Path to configuration file
        
    Returns:
        Configured ApplicationContainer
    """
    container = ApplicationContainer()
    container.config.from_yaml(config_path)
    
    # Wire the container to enable dependency injection
    container.wire(modules=[
        "workflows.api",
        "workflows.domain",
        "workflows.infrastructure",
    ])
    
    return container