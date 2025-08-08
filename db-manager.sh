#!/bin/bash

# Sparrow Database Manager
# Usage: ./db-manager.sh [start|stop|reset|status|logs|connect]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== Sparrow Database Manager ===${NC}"
}

# Function to check if Docker is installed
check_docker_installed() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed."
        echo ""
        echo "For local development, you can:"
        echo "1. Install Docker Desktop from https://www.docker.com/products/docker-desktop"
        echo "2. Or use a cloud database service"
        echo ""
        echo "For Cloudflare deployment, you'll need to:"
        echo "1. Set up a cloud database (e.g., PlanetScale, Neon, Supabase)"
        echo "2. Update the connection details in your application"
        echo ""
        return 1
    fi
    return 0
}

# Function to check if Docker is running
check_docker() {
    if ! check_docker_installed; then
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        echo ""
        echo "On macOS:"
        echo "1. Open Docker Desktop application"
        echo "2. Wait for Docker to start"
        echo "3. Try again: ./db-manager.sh start"
        exit 1
    fi
}

# Function to start the database
start_database() {
    print_header
    print_status "Starting Sparrow MySQL Database..."
    
    check_docker
    
    docker-compose up -d mysql
    
    print_status "Waiting for MySQL to be ready..."
    sleep 10
    
    # Check if container is running
    if docker-compose ps mysql | grep -q "Up"; then
        print_status "Database is ready!"
        echo ""
        echo "Connection details:"
        echo "  Host: localhost"
        echo "  Port: 3306"
        echo "  Database: sparrow_db"
        echo "  Username: sparrow_user"
        echo "  Password: sparrow_password"
        echo ""
        echo "To connect using mysql client:"
        echo "  mysql -h localhost -P 3306 -u sparrow_user -p sparrow_db"
        echo ""
        echo "To view logs:"
        echo "  ./db-manager.sh logs"
    else
        print_error "Failed to start database. Check logs with: ./db-manager.sh logs"
        exit 1
    fi
}

# Function to stop the database
stop_database() {
    print_header
    print_status "Stopping Sparrow MySQL Database..."
    
    check_docker
    
    docker-compose down
    print_status "Database stopped!"
}

# Function to reset the database
reset_database() {
    print_header
    print_warning "This will stop the database, remove all data, and restart fresh."
    
    read -p "Are you sure? This will delete all data! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping database..."
        docker-compose down
        
        print_status "Removing data volumes..."
        docker volume rm sparrow_mysql_data 2>/dev/null || true
        
        print_status "Starting fresh database..."
        docker-compose up -d mysql
        
        print_status "Waiting for MySQL to be ready..."
        sleep 10
        
        print_status "Database reset complete!"
        print_status "All tables have been recreated with fresh schema."
    else
        print_status "Reset cancelled."
    fi
}

# Function to show database status
show_status() {
    print_header
    print_status "Database Status:"
    echo ""
    
    if ! check_docker_installed; then
        return
    fi
    
    if docker-compose ps mysql > /dev/null 2>&1; then
        docker-compose ps mysql
        echo ""
        print_status "Connection details:"
        echo "  Host: localhost"
        echo "  Port: 3306"
        echo "  Database: sparrow_db"
        echo "  Username: sparrow_user"
        echo "  Password: sparrow_password"
    else
        print_warning "Database is not running."
        echo "Use './db-manager.sh start' to start the database."
    fi
}

# Function to show logs
show_logs() {
    print_header
    print_status "Database Logs:"
    echo ""
    
    if ! check_docker_installed; then
        return
    fi
    
    docker-compose logs mysql
}

# Function to connect to database
connect_database() {
    print_header
    print_status "Connecting to database..."
    
    if ! check_docker_installed; then
        return
    fi
    
    # Check if database is running
    if ! docker-compose ps mysql | grep -q "Up"; then
        print_error "Database is not running. Start it first with: ./db-manager.sh start"
        exit 1
    fi
    
    print_status "Connecting to MySQL..."
    echo "Use 'exit' to quit the MySQL client"
    echo ""
    docker-compose exec mysql mysql -u sparrow_user -psparrow_password sparrow_db
}

# Function to show help
show_help() {
    print_header
    echo "Usage: ./db-manager.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start the MySQL database"
    echo "  stop      Stop the MySQL database"
    echo "  reset     Reset the database (removes all data)"
    echo "  status    Show database status and connection info"
    echo "  logs      Show database logs"
    echo "  connect   Connect to the database via MySQL client"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./db-manager.sh start"
    echo "  ./db-manager.sh status"
    echo "  ./db-manager.sh connect"
    echo ""
    echo "Note: Docker is required for local development."
    echo "For Cloudflare deployment, use a cloud database service."
}

# Main script logic
case "${1:-help}" in
    start)
        start_database
        ;;
    stop)
        stop_database
        ;;
    reset)
        reset_database
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    connect)
        connect_database
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 