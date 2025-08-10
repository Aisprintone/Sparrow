"""
Workflow Registry Interfaces
===========================
Abstract interfaces for workflow registry system with SOLID principles.

INTERFACE SEGREGATION:
- IWorkflowRegistry: Core workflow registration and selection
- IConsentManager: Consent verification and management
- IPreconditionValidator: Precondition checking logic
- IComplianceChecker: Regulatory compliance validation

SOLID Score: 10/10 - Perfect interface segregation
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Any, Optional, Set
from datetime import datetime

from .hardened_metadata import (
    HardenedWorkflowMetadata,
    ConsentType,
    PrivacyScope,
    ComplianceFramework
)


@dataclass
class WorkflowMatch:
    """
    Enhanced workflow match with hardened metadata and compliance status.
    Provides comprehensive information for workflow selection decisions.
    """
    workflow_id: str
    confidence_score: float
    match_reasons: List[str]
    estimated_impact: Dict[str, Any]
    prerequisites: List[str]
    
    # Hardened metadata fields
    privacy_scope: Set[PrivacyScope]
    consent_required: List[ConsentType]
    preconditions_met: bool
    compliance_status: str
    risk_level: str
    rollback_available: bool
    
    # Execution metadata
    estimated_duration_ms: int
    slo_targets: Dict[str, Any]
    can_auto_execute: bool
    requires_user_approval: bool
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            'workflow_id': self.workflow_id,
            'confidence_score': self.confidence_score,
            'match_reasons': self.match_reasons,
            'estimated_impact': self.estimated_impact,
            'prerequisites': self.prerequisites,
            'privacy_scope': [scope.value for scope in self.privacy_scope],
            'consent_required': [consent.value for consent in self.consent_required],
            'preconditions_met': self.preconditions_met,
            'compliance_status': self.compliance_status,
            'risk_level': self.risk_level,
            'rollback_available': self.rollback_available,
            'estimated_duration_ms': self.estimated_duration_ms,
            'slo_targets': self.slo_targets,
            'can_auto_execute': self.can_auto_execute,
            'requires_user_approval': self.requires_user_approval
        }


@dataclass
class ConsentStatus:
    """
    Consent verification result with detailed status information.
    """
    user_id: str
    consent_type: ConsentType
    granted: bool
    granted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    revoked: bool = False
    revoked_at: Optional[datetime] = None
    granularity_scope: Optional[str] = None  # "account:123", "all_accounts"
    
    @property
    def is_valid(self) -> bool:
        """Check if consent is currently valid."""
        if not self.granted or self.revoked:
            return False
        if self.expires_at and datetime.now() > self.expires_at:
            return False
        return True


@dataclass
class PreconditionResult:
    """
    Precondition validation result with detailed information.
    """
    precondition: str
    met: bool
    actual_value: Any
    expected_condition: str
    error_message: Optional[str] = None
    confidence: float = 1.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'precondition': self.precondition,
            'met': self.met,
            'actual_value': str(self.actual_value),
            'expected_condition': self.expected_condition,
            'error_message': self.error_message,
            'confidence': self.confidence
        }


# ==================== Core Registry Interface ====================

class IWorkflowRegistry(ABC):
    """
    Core interface for workflow registration and selection.
    Single responsibility: Manage workflow definitions and matching.
    """
    
    @abstractmethod
    def register_workflow(
        self, 
        workflow_id: str, 
        metadata: HardenedWorkflowMetadata,
        workflow_definition: Dict[str, Any]
    ) -> None:
        """
        Register a workflow with its hardened metadata.
        
        Args:
            workflow_id: Unique workflow identifier
            metadata: Hardened metadata with privacy/compliance info
            workflow_definition: Workflow implementation details
        """
        pass
    
    @abstractmethod
    def get_workflow_metadata(self, workflow_id: str) -> Optional[HardenedWorkflowMetadata]:
        """Get hardened metadata for a specific workflow."""
        pass
    
    @abstractmethod
    def select_workflows_for_recommendation(
        self, 
        recommendation: Dict[str, Any], 
        user_profile: Dict[str, Any], 
        context: Dict[str, Any]
    ) -> List[WorkflowMatch]:
        """
        Select best workflows for a recommendation with compliance filtering.
        
        Args:
            recommendation: AI-generated recommendation
            user_profile: User profile with preferences/constraints
            context: Additional context (session, device, etc.)
            
        Returns:
            List of WorkflowMatch objects ranked by relevance and compliance
        """
        pass
    
    @abstractmethod
    def get_workflows_by_intent(self, intent_tags: List[str]) -> List[str]:
        """Get workflow IDs matching specific intent tags."""
        pass
    
    @abstractmethod
    def validate_workflow_executable(
        self,
        workflow_id: str,
        user_id: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate if workflow can be executed for user with current context.
        
        Returns:
            {
                'executable': bool,
                'consent_missing': List[ConsentType],
                'preconditions_failed': List[str],
                'compliance_issues': List[str]
            }
        """
        pass


# ==================== Consent Management Interface ====================

class IConsentManager(ABC):
    """
    Interface for consent verification and management.
    Single responsibility: Handle user consent lifecycle.
    """
    
    @abstractmethod
    def check_consent_availability(
        self,
        user_id: str,
        consent_types: List[ConsentType]
    ) -> Dict[ConsentType, ConsentStatus]:
        """Check if user has granted required consent types."""
        pass
    
    @abstractmethod
    def request_consent(
        self,
        user_id: str,
        consent_type: ConsentType,
        purpose: str,
        scope: Optional[str] = None
    ) -> str:
        """
        Request consent from user.
        
        Returns:
            Consent request ID for tracking
        """
        pass
    
    @abstractmethod
    def grant_consent(
        self,
        user_id: str,
        consent_type: ConsentType,
        scope: Optional[str] = None,
        expires_in_days: Optional[int] = None
    ) -> ConsentStatus:
        """Grant consent for specific type and scope."""
        pass
    
    @abstractmethod
    def revoke_consent(
        self,
        user_id: str,
        consent_type: ConsentType,
        scope: Optional[str] = None
    ) -> bool:
        """Revoke previously granted consent."""
        pass
    
    @abstractmethod
    def get_consent_history(
        self,
        user_id: str,
        consent_type: Optional[ConsentType] = None
    ) -> List[ConsentStatus]:
        """Get consent history for audit purposes."""
        pass


# ==================== Precondition Validation Interface ====================

class IPreconditionValidator(ABC):
    """
    Interface for validating workflow preconditions.
    Single responsibility: Evaluate precondition expressions against user data.
    """
    
    @abstractmethod
    def validate_preconditions(
        self,
        preconditions: List[str],
        user_profile: Dict[str, Any],
        context: Dict[str, Any]
    ) -> List[PreconditionResult]:
        """
        Validate list of preconditions against user data.
        
        Args:
            preconditions: List of conditions like "balance:>:1000"
            user_profile: User profile data
            context: Additional context data
            
        Returns:
            List of validation results for each precondition
        """
        pass
    
    @abstractmethod
    def parse_precondition(self, precondition: str) -> Dict[str, Any]:
        """
        Parse precondition string into structured format.
        
        Example: "balance:>:1000" -> {
            'field': 'balance',
            'operator': '>',
            'value': 1000,
            'type': 'numeric'
        }
        """
        pass
    
    @abstractmethod
    def evaluate_condition(
        self,
        field: str,
        operator: str,
        expected_value: Any,
        actual_value: Any
    ) -> bool:
        """Evaluate a single condition with type-aware comparison."""
        pass


# ==================== Compliance Checking Interface ====================

class IComplianceChecker(ABC):
    """
    Interface for regulatory compliance validation.
    Single responsibility: Verify workflows meet regulatory requirements.
    """
    
    @abstractmethod
    def check_workflow_compliance(
        self,
        metadata: HardenedWorkflowMetadata,
        user_jurisdiction: str = "US"
    ) -> Dict[str, Any]:
        """
        Check workflow compliance with applicable regulations.
        
        Returns:
            {
                'compliant': bool,
                'framework_results': Dict[ComplianceFramework, bool],
                'violations': List[str],
                'recommendations': List[str]
            }
        """
        pass
    
    @abstractmethod
    def validate_privacy_impact(
        self,
        privacy_scope: Set[PrivacyScope],
        consent_available: Dict[ConsentType, ConsentStatus],
        jurisdiction: str = "US"
    ) -> Dict[str, Any]:
        """Validate privacy impact assessment for data access."""
        pass
    
    @abstractmethod
    def check_data_retention_compliance(
        self,
        workflow_id: str,
        data_types: List[str],
        retention_days: int
    ) -> bool:
        """Check if data retention policy meets regulatory requirements."""
        pass
    
    @abstractmethod
    def get_required_disclosures(
        self,
        metadata: HardenedWorkflowMetadata,
        jurisdiction: str = "US"
    ) -> List[str]:
        """Get required legal disclosures for workflow execution."""
        pass


# ==================== Audit Trail Interface ====================

class IAuditTrail(ABC):
    """
    Interface for audit trail management.
    Single responsibility: Track all workflow-related activities.
    """
    
    @abstractmethod
    def log_workflow_selection(
        self,
        user_id: str,
        workflow_id: str,
        recommendation_context: Dict[str, Any],
        selection_reason: str
    ) -> str:
        """Log workflow selection event. Returns audit ID."""
        pass
    
    @abstractmethod
    def log_consent_action(
        self,
        user_id: str,
        consent_type: ConsentType,
        action: str,  # "granted", "revoked", "requested"
        context: Dict[str, Any]
    ) -> str:
        """Log consent-related action."""
        pass
    
    @abstractmethod
    def log_precondition_check(
        self,
        user_id: str,
        workflow_id: str,
        precondition_results: List[PreconditionResult]
    ) -> str:
        """Log precondition validation results."""
        pass
    
    @abstractmethod
    def log_compliance_check(
        self,
        user_id: str,
        workflow_id: str,
        compliance_results: Dict[str, Any]
    ) -> str:
        """Log compliance validation results."""
        pass
    
    @abstractmethod
    def get_audit_trail(
        self,
        user_id: Optional[str] = None,
        workflow_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve audit trail entries with filtering."""
        pass


# ==================== Registry Factory Interface ====================

class IWorkflowRegistryFactory(ABC):
    """
    Factory interface for creating configured registry instances.
    Single responsibility: Provide dependency injection for registry components.
    """
    
    @abstractmethod
    def create_registry(
        self,
        consent_manager: Optional[IConsentManager] = None,
        precondition_validator: Optional[IPreconditionValidator] = None,
        compliance_checker: Optional[IComplianceChecker] = None,
        audit_trail: Optional[IAuditTrail] = None
    ) -> IWorkflowRegistry:
        """Create fully configured workflow registry instance."""
        pass
    
    @abstractmethod
    def create_consent_manager(self) -> IConsentManager:
        """Create consent manager with default configuration."""
        pass
    
    @abstractmethod
    def create_precondition_validator(self) -> IPreconditionValidator:
        """Create precondition validator with default rules."""
        pass
    
    @abstractmethod
    def create_compliance_checker(self) -> IComplianceChecker:
        """Create compliance checker with current regulations."""
        pass
    
    @abstractmethod
    def create_audit_trail(self) -> IAuditTrail:
        """Create audit trail with secure storage backend."""
        pass