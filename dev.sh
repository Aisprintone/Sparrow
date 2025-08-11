#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 FinanceAI Local Demo Startup${NC}"
echo "=============================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to find available port
find_available_port() {
    local ports=(3000 3001 3002 3003)
    for port in "${ports[@]}"; do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
            echo $port
            return
        fi
    done
    echo "3000"  # fallback
}

# Function to kill background processes on exit
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up background processes...${NC}"
    if [[ -n $BACKEND_PID ]]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "  ✅ Backend stopped"
    fi
    if [[ -n $FRONTEND_PID ]]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "  ✅ Frontend stopped"
    fi
    exit 0
}
trap cleanup INT TERM EXIT

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is required but not installed${NC}"
    echo "   Install from: https://python.org/downloads/"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is required but not installed${NC}"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d" " -f2)
NODE_VERSION=$(node --version)
echo "  ✅ Python $PYTHON_VERSION"
echo "  ✅ Node.js $NODE_VERSION"

# Setup backend
echo -e "\n${BLUE}🔧 Setting up backend...${NC}"

cd backend/python_engine

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "  📦 Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate
echo "  ✅ Virtual environment activated"

# Install dependencies
echo "  📦 Installing backend dependencies..."
pip install -r requirements.txt > /dev/null 2>&1
echo "  ✅ Backend dependencies installed"

# Start backend
echo -e "\n${GREEN}🚀 Starting backend on http://localhost:8000...${NC}"
uvicorn app:app --host 0.0.0.0 --port 8000 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "  ⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "  ✅ Backend ready!"
        break
    fi
    if [[ $i -eq 30 ]]; then
        echo -e "${RED}❌ Backend failed to start after 30 seconds${NC}"
        echo "   Check backend.log for errors"
        exit 1
    fi
    sleep 1
done

# Setup frontend
cd ../../frontend
echo -e "\n${BLUE}🔧 Setting up frontend...${NC}"

# Install dependencies
echo "  📦 Installing frontend dependencies..."
npm install > /dev/null 2>&1
echo "  ✅ Frontend dependencies installed"

# Find available port
FRONTEND_PORT=$(find_available_port)
echo "  🎯 Using port $FRONTEND_PORT for frontend"

# Start frontend
echo -e "\n${GREEN}🎯 Starting frontend on http://localhost:$FRONTEND_PORT...${NC}"
PORT=$FRONTEND_PORT npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "  ⏳ Waiting for frontend to start..."
for i in {1..60}; do
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        echo "  ✅ Frontend ready!"
        break
    fi
    if [[ $i -eq 60 ]]; then
        echo -e "${RED}❌ Frontend failed to start after 60 seconds${NC}"
        echo "   Check frontend.log for errors"
        exit 1
    fi
    sleep 1
done

# Run smoke test
echo -e "\n${BLUE}🧪 Running smoke test...${NC}"
cd ..

# Create and run smoke test
cat > smoke_test.js << 'EOF'
const http = require('http');

function testEndpoint(host, port, path, expectedContent = null) {
    return new Promise((resolve, reject) => {
        const options = { hostname: host, port: port, path: path, method: 'GET' };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    if (expectedContent && !data.includes(expectedContent)) {
                        reject(new Error(`Content check failed - expected "${expectedContent}" not found`));
                    } else {
                        resolve({ status: res.statusCode, data });
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });
        
        req.on('error', (err) => reject(err));
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

async function runTests() {
    const frontendPort = process.env.FRONTEND_PORT || '3000';
    const tests = [
        { name: 'Backend Health', host: 'localhost', port: 8000, path: '/health' },
        { name: 'Frontend App', host: 'localhost', port: frontendPort, path: '/', content: 'FinanceAI' }
    ];
    
    console.log('Running smoke tests...');
    let passed = 0;
    
    for (const test of tests) {
        try {
            await testEndpoint(test.host, test.port, test.path, test.content);
            console.log(`  ✅ ${test.name}: http://${test.host}:${test.port}${test.path}`);
            passed++;
        } catch (error) {
            console.log(`  ❌ ${test.name}: ${error.message}`);
        }
    }
    
    console.log(`\nResults: ${passed}/${tests.length} tests passed`);
    process.exit(passed === tests.length ? 0 : 1);
}

runTests();
EOF

FRONTEND_PORT=$FRONTEND_PORT node smoke_test.js

SMOKE_EXIT_CODE=$?
rm -f smoke_test.js

if [[ $SMOKE_EXIT_CODE -eq 0 ]]; then
    echo -e "\n${GREEN}✅ All systems ready!${NC}"
    echo "=============================================="
    echo -e "🚀 Backend:  ${BLUE}http://localhost:8000${NC}"
    echo -e "🎯 Frontend: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
    echo "=============================================="
    echo -e "📱 ${GREEN}Open your browser: http://localhost:$FRONTEND_PORT${NC}"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Keep script running
    wait
else
    echo -e "\n${RED}❌ Smoke test failed - check the logs${NC}"
    echo "   Backend log: backend/backend.log"
    echo "   Frontend log: frontend/frontend.log"
    exit 1
fi