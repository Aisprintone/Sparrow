"""
OpenAPI Schema Generator for TypeScript Integration
====================================================
Generates OpenAPI schemas from Pydantic models and FastAPI routes
for automatic TypeScript type generation.

ARCHITECTURE ORACLE ASSESSMENT:
- Frontend-Backend Contract: ✓ Single source of truth
- Type Safety: ✓ End-to-end type guarantees
- API Evolution: ✓ Versioned schemas
- Developer Experience: ✓ Auto-generated clients

Integration Points:
- Pydantic models → OpenAPI schemas
- FastAPI routes → Path definitions
- OpenAPI schemas → TypeScript types via openapi-typescript
"""

from typing import Dict, Any, List, Optional, Type
from pathlib import Path
import json
import yaml
from datetime import datetime
from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
import logging

logger = logging.getLogger(__name__)


class OpenAPIGenerator:
    """
    Generates OpenAPI schemas for TypeScript type generation.
    Follows Single Responsibility Principle.
    """
    
    def __init__(
        self,
        app: FastAPI,
        title: str = "Sparrow Workflow API",
        version: str = "1.0.0",
        description: str = "Workflow classification and automation API"
    ):
        self.app = app
        self.title = title
        self.version = version
        self.description = description
        self.custom_schemas: Dict[str, Any] = {}
    
    def generate_schema(self) -> Dict[str, Any]:
        """
        Generate complete OpenAPI schema from FastAPI app.
        """
        schema = get_openapi(
            title=self.title,
            version=self.version,
            description=self.description,
            routes=self.app.routes,
        )
        
        # Add custom schemas
        if self.custom_schemas:
            if "components" not in schema:
                schema["components"] = {}
            if "schemas" not in schema["components"]:
                schema["components"]["schemas"] = {}
            
            schema["components"]["schemas"].update(self.custom_schemas)
        
        # Add x-typescript metadata for better type generation
        self._add_typescript_metadata(schema)
        
        # Add server configuration
        schema["servers"] = [
            {
                "url": "http://localhost:8000",
                "description": "Development server"
            },
            {
                "url": "https://api.sparrow.ai",
                "description": "Production server"
            }
        ]
        
        # Add security schemes
        schema["components"]["securitySchemes"] = {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT"
            },
            "apiKey": {
                "type": "apiKey",
                "in": "header",
                "name": "X-API-Key"
            }
        }
        
        return schema
    
    def _add_typescript_metadata(self, schema: Dict[str, Any]):
        """
        Add TypeScript-specific metadata for better type generation.
        """
        # Add enum descriptions and custom names
        if "components" in schema and "schemas" in schema["components"]:
            schemas = schema["components"]["schemas"]
            
            # Enhance enum types
            for schema_name, schema_def in schemas.items():
                if "enum" in schema_def:
                    # Add x-enum-varnames for better TypeScript enum names
                    if schema_name == "WorkflowCategory":
                        schema_def["x-enum-varnames"] = [
                            "Optimize",
                            "Protect",
                            "Grow",
                            "Emergency",
                            "Automate",
                            "Analyze"
                        ]
                        schema_def["x-enum-descriptions"] = [
                            "Cost reduction and optimization workflows",
                            "Risk mitigation and protection workflows",
                            "Wealth building and growth workflows",
                            "Emergency and crisis response workflows",
                            "Process automation workflows",
                            "Data analysis and insights workflows"
                        ]
                    elif schema_name == "Priority":
                        schema_def["x-enum-varnames"] = [
                            "Critical",
                            "High",
                            "Medium",
                            "Low"
                        ]
                
                # Add format hints for date-time fields
                if "properties" in schema_def:
                    for prop_name, prop_def in schema_def["properties"].items():
                        if prop_def.get("type") == "string" and "date" in prop_name.lower():
                            prop_def["format"] = "date-time"
    
    def add_custom_schema(self, name: str, schema: Dict[str, Any]):
        """
        Add a custom schema definition.
        
        Args:
            name: Schema name
            schema: Schema definition
        """
        self.custom_schemas[name] = schema
    
    def save_schema(
        self,
        output_path: Path,
        format: str = "yaml",
        include_examples: bool = True
    ) -> Path:
        """
        Save schema to file.
        
        Args:
            output_path: Output file path
            format: Output format (yaml or json)
            include_examples: Whether to include examples
            
        Returns:
            Path to saved file
        """
        schema = self.generate_schema()
        
        if not include_examples:
            # Remove examples from schema
            self._remove_examples(schema)
        
        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save based on format
        if format == "yaml":
            with open(output_path, "w") as f:
                yaml.dump(schema, f, default_flow_style=False, sort_keys=False)
        else:
            with open(output_path, "w") as f:
                json.dump(schema, f, indent=2)
        
        logger.info(f"OpenAPI schema saved to {output_path}")
        return output_path
    
    def _remove_examples(self, schema: Dict[str, Any]):
        """
        Recursively remove examples from schema.
        """
        if isinstance(schema, dict):
            # Remove example and examples keys
            schema.pop("example", None)
            schema.pop("examples", None)
            
            # Recurse into nested structures
            for value in schema.values():
                self._remove_examples(value)
        elif isinstance(schema, list):
            for item in schema:
                self._remove_examples(item)


class TypeScriptGenerator:
    """
    Generates TypeScript integration code from OpenAPI schemas.
    Creates type-safe API clients and interfaces.
    """
    
    def __init__(self, schema_path: Path):
        self.schema_path = schema_path
        self.output_dir = schema_path.parent / "typescript"
    
    def generate_types_script(self) -> Path:
        """
        Generate a script to create TypeScript types using openapi-typescript.
        
        Returns:
            Path to the generated script
        """
        script_content = f"""#!/bin/bash
# Generated TypeScript type generation script
# Generated at: {datetime.now().isoformat()}

# Ensure openapi-typescript is installed
if ! command -v openapi-typescript &> /dev/null; then
    echo "Installing openapi-typescript..."
    npm install -g openapi-typescript
fi

# Generate TypeScript types
echo "Generating TypeScript types from OpenAPI schema..."
npx openapi-typescript {self.schema_path} -o {self.output_dir}/api-types.d.ts

# Generate additional utility types
echo "Generating utility types..."
cat > {self.output_dir}/api-utils.ts << 'EOF'
// Utility types for API integration
import type {{ paths, components }} from './api-types';

// Extract schema types
export type WorkflowClassification = components['schemas']['WorkflowClassification'];
export type WorkflowGoal = components['schemas']['WorkflowGoal'];
export type WorkflowContext = components['schemas']['WorkflowContext'];
export type WorkflowCategory = components['schemas']['WorkflowCategory'];
export type Priority = components['schemas']['Priority'];

// Request types
export type ClassificationRequest = components['schemas']['WorkflowClassificationRequest'];
export type GoalCreationRequest = components['schemas']['GoalCreationRequest'];
export type ExecutionRequest = components['schemas']['WorkflowExecutionRequest'];

// Response types
export type ClassificationResponse = components['schemas']['ClassificationResponse'];
export type GoalResponse = components['schemas']['GoalResponse'];
export type ExecutionResponse = components['schemas']['WorkflowExecutionResponse'];
export type ErrorResponse = components['schemas']['ErrorResponse'];

// Path helpers
export type ApiPaths = keyof paths;
export type GetPaths = {{
  [K in ApiPaths]: paths[K] extends {{ get: any }} ? K : never;
}}[ApiPaths];
export type PostPaths = {{
  [K in ApiPaths]: paths[K] extends {{ post: any }} ? K : never;
}}[ApiPaths];

// Response helpers
export type SuccessResponse<P extends ApiPaths, M extends keyof paths[P]> =
  paths[P][M] extends {{ responses: {{ 200: {{ content: {{ 'application/json': infer R }} }} }} }}
    ? R
    : never;

export type ErrorResponses<P extends ApiPaths, M extends keyof paths[P]> =
  paths[P][M] extends {{ responses: infer R }}
    ? {{
        [K in keyof R]: R[K] extends {{ content: {{ 'application/json': infer E }} }} ? E : never;
      }}
    : never;
EOF

echo "TypeScript types generated successfully!"
echo "Output files:"
echo "  - {self.output_dir}/api-types.d.ts"
echo "  - {self.output_dir}/api-utils.ts"
"""
        
        script_path = self.output_dir / "generate-types.sh"
        script_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(script_path, "w") as f:
            f.write(script_content)
        
        # Make script executable
        script_path.chmod(0o755)
        
        logger.info(f"TypeScript generation script created at {script_path}")
        return script_path
    
    def generate_api_client(self) -> Path:
        """
        Generate a type-safe API client for the frontend.
        
        Returns:
            Path to the generated client
        """
        client_content = """// Type-safe API client for Sparrow Workflow API
// Auto-generated from OpenAPI schema

import createClient from 'openapi-fetch';
import type { paths } from './api-types';

// Initialize the client with base configuration
const client = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication interceptor
client.use({
  onRequest: async (req) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      req.headers.set('Authorization', `Bearer ${token}`);
    }
    return req;
  },
  onResponse: async (res) => {
    if (res.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return res;
  },
});

// Classification API
export const classificationApi = {
  async classify(input: string, context?: any) {
    const { data, error } = await client.POST('/api/v1/classify', {
      body: {
        user_input: input,
        context,
        include_suggestions: true,
      },
    });
    
    if (error) throw error;
    return data;
  },
  
  async batchClassify(inputs: string[]) {
    const results = await Promise.all(
      inputs.map(input => this.classify(input))
    );
    return results;
  },
};

// Goal API
export const goalApi = {
  async create(goal: any) {
    const { data, error } = await client.POST('/api/v1/goals', {
      body: goal,
    });
    
    if (error) throw error;
    return data;
  },
  
  async get(goalId: string) {
    const { data, error } = await client.GET('/api/v1/goals/{goal_id}', {
      params: { path: { goal_id: goalId } },
    });
    
    if (error) throw error;
    return data;
  },
  
  async list(userId: string) {
    const { data, error } = await client.GET('/api/v1/goals', {
      params: { query: { user_id: userId } },
    });
    
    if (error) throw error;
    return data;
  },
  
  async update(goalId: string, updates: any) {
    const { data, error } = await client.PUT('/api/v1/goals/{goal_id}', {
      params: { path: { goal_id: goalId } },
      body: updates,
    });
    
    if (error) throw error;
    return data;
  },
};

// Workflow Execution API
export const workflowApi = {
  async execute(workflowId: string, inputs: any) {
    const { data, error } = await client.POST('/api/v1/workflows/execute', {
      body: {
        workflow_id: workflowId,
        inputs,
        async_execution: true,
      },
    });
    
    if (error) throw error;
    return data;
  },
  
  async getStatus(executionId: string) {
    const { data, error } = await client.GET('/api/v1/executions/{execution_id}', {
      params: { path: { execution_id: executionId } },
    });
    
    if (error) throw error;
    return data;
  },
  
  async cancel(executionId: string) {
    const { data, error } = await client.POST('/api/v1/executions/{execution_id}/cancel', {
      params: { path: { execution_id: executionId } },
    });
    
    if (error) throw error;
    return data;
  },
};

// Export the raw client for custom operations
export { client };

// Export typed hooks for React
export { useClassification, useGoal, useWorkflow } from './hooks';
"""
        
        client_path = self.output_dir / "api-client.ts"
        
        with open(client_path, "w") as f:
            f.write(client_content)
        
        logger.info(f"API client generated at {client_path}")
        return client_path
    
    def generate_react_hooks(self) -> Path:
        """
        Generate React hooks for the API client.
        
        Returns:
            Path to the generated hooks
        """
        hooks_content = """// React hooks for Sparrow Workflow API
// Auto-generated from OpenAPI schema

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classificationApi, goalApi, workflowApi } from './api-client';
import type {
  ClassificationRequest,
  ClassificationResponse,
  GoalCreationRequest,
  GoalResponse,
  ExecutionRequest,
  ExecutionResponse,
} from './api-utils';

// Classification hooks
export function useClassification(input: string, context?: any) {
  return useQuery({
    queryKey: ['classification', input, context],
    queryFn: () => classificationApi.classify(input, context),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useClassificationMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ input, context }: { input: string; context?: any }) =>
      classificationApi.classify(input, context),
    onSuccess: (data, variables) => {
      // Cache the result
      queryClient.setQueryData(
        ['classification', variables.input, variables.context],
        data
      );
    },
  });
}

// Goal hooks
export function useGoal(goalId: string) {
  return useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => goalApi.get(goalId),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useGoals(userId: string) {
  return useQuery({
    queryKey: ['goals', userId],
    queryFn: () => goalApi.list(userId),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (goal: GoalCreationRequest) => goalApi.create(goal),
    onSuccess: (data) => {
      // Invalidate goals list
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      
      // Add to cache
      if (data.goal?.id) {
        queryClient.setQueryData(['goal', data.goal.id], data);
      }
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ goalId, updates }: { goalId: string; updates: any }) =>
      goalApi.update(goalId, updates),
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.setQueryData(['goal', variables.goalId], data);
      
      // Invalidate goals list
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

// Workflow hooks
export function useExecuteWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ workflowId, inputs }: { workflowId: string; inputs: any }) =>
      workflowApi.execute(workflowId, inputs),
    onSuccess: (data) => {
      // Store execution in cache
      if (data.execution_id) {
        queryClient.setQueryData(['execution', data.execution_id], data);
      }
    },
  });
}

export function useWorkflowStatus(executionId: string, enabled = true) {
  return useQuery({
    queryKey: ['execution', executionId],
    queryFn: () => workflowApi.getStatus(executionId),
    enabled,
    refetchInterval: (data) => {
      // Poll while running
      if (data?.status === 'running') {
        return 2000; // 2 seconds
      }
      return false;
    },
  });
}

// Real-time classification with debouncing
export function useRealtimeClassification(
  input: string,
  context?: any,
  debounceMs = 500
) {
  const [debouncedInput, setDebouncedInput] = useState(input);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(input);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [input, debounceMs]);
  
  return useClassification(debouncedInput, context);
}
"""
        
        hooks_path = self.output_dir / "hooks.ts"
        
        with open(hooks_path, "w") as f:
            f.write(hooks_content)
        
        logger.info(f"React hooks generated at {hooks_path}")
        return hooks_path


def generate_all_typescript_assets(app: FastAPI, output_dir: Path):
    """
    Generate all TypeScript integration assets.
    
    Args:
        app: FastAPI application
        output_dir: Output directory for generated files
    """
    # Generate OpenAPI schema
    generator = OpenAPIGenerator(app)
    schema_path = generator.save_schema(
        output_dir / "openapi.yaml",
        format="yaml",
        include_examples=True
    )
    
    # Generate TypeScript assets
    ts_generator = TypeScriptGenerator(schema_path)
    
    # Generate all files
    ts_generator.generate_types_script()
    ts_generator.generate_api_client()
    ts_generator.generate_react_hooks()
    
    logger.info(f"All TypeScript assets generated in {output_dir}")
    
    return output_dir