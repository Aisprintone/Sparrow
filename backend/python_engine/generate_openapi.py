#!/usr/bin/env python3
"""
Generate OpenAPI Schema and TypeScript Types
=============================================
Orchestrates the generation of OpenAPI schemas from the backend
and TypeScript types for the frontend.

INTEGRATION MAESTRO:
- Single source of truth for API contracts
- Automatic type synchronization
- Zero manual type maintenance
"""

import sys
import json
from pathlib import Path
from fastapi import FastAPI
from workflows.api.endpoints import get_routers
from workflows.api.openapi_generator import OpenAPIGenerator, generate_all_typescript_assets
from workflows.infrastructure.containers import ApplicationContainer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Create FastAPI app with all routers."""
    app = FastAPI(
        title="Sparrow Workflow API",
        version="1.0.0",
        description="Workflow classification and automation API with goal differentiation",
    )
    
    # Add all routers
    for router in get_routers():
        app.include_router(router)
    
    return app


def main():
    """Generate OpenAPI schema and TypeScript types."""
    try:
        # Create the FastAPI app
        app = create_app()
        
        # Initialize the container (needed for dependency injection)
        container = ApplicationContainer()
        container.wire(modules=["workflows.api.endpoints"])
        
        # Set up output directories
        backend_dir = Path(__file__).parent
        project_root = backend_dir.parent.parent
        frontend_dir = project_root / "frontend"
        
        # Generate OpenAPI schema
        generator = OpenAPIGenerator(app)
        
        # Save OpenAPI schema in multiple locations
        openapi_yaml = backend_dir / "openapi.yaml"
        openapi_json = backend_dir / "openapi.json"
        
        schema = generator.generate_schema()
        
        # Save YAML version
        import yaml
        with open(openapi_yaml, "w") as f:
            yaml.dump(schema, f, default_flow_style=False, sort_keys=False)
        logger.info(f"OpenAPI YAML saved to {openapi_yaml}")
        
        # Save JSON version
        with open(openapi_json, "w") as f:
            json.dump(schema, f, indent=2)
        logger.info(f"OpenAPI JSON saved to {openapi_json}")
        
        # Save to frontend directory
        frontend_api_dir = frontend_dir / "lib" / "api" / "generated"
        frontend_api_dir.mkdir(parents=True, exist_ok=True)
        
        frontend_openapi = frontend_api_dir / "openapi.json"
        with open(frontend_openapi, "w") as f:
            json.dump(schema, f, indent=2)
        logger.info(f"OpenAPI schema copied to frontend: {frontend_openapi}")
        
        # Generate TypeScript assets
        generate_all_typescript_assets(app, frontend_api_dir)
        
        print("\n✅ OpenAPI schema and TypeScript types generated successfully!")
        print(f"\nGenerated files:")
        print(f"  - Backend OpenAPI YAML: {openapi_yaml}")
        print(f"  - Backend OpenAPI JSON: {openapi_json}")
        print(f"  - Frontend OpenAPI: {frontend_openapi}")
        print(f"  - TypeScript types: {frontend_api_dir}/api-types.d.ts")
        print(f"  - API client: {frontend_api_dir}/api-client.ts")
        print(f"  - React hooks: {frontend_api_dir}/hooks.ts")
        
        print("\nNext steps:")
        print("1. Run 'npm install openapi-typescript openapi-fetch @tanstack/react-query' in frontend")
        print("2. Run the TypeScript generation script in frontend/lib/api/generated/")
        print("3. Import and use the generated types and hooks in your components")
        
    except Exception as e:
        logger.error(f"Failed to generate OpenAPI schema: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()