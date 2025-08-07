#!/bin/bash

# Railway RAG System Monitor
# This script helps monitor RAG execution in Railway deployment

echo "🚂 RAILWAY RAG SYSTEM MONITOR"
echo "======================================"
echo ""

# Function to display menu
show_menu() {
    echo "Select monitoring option:"
    echo "1) Get Railway deployment URL"
    echo "2) View all RAG-related logs"
    echo "3) Monitor RAG queries in real-time"
    echo "4) Check RAG initialization logs"
    echo "5) View AI explanation generation logs"
    echo "6) Check profile data loading"
    echo "7) Monitor performance metrics"
    echo "8) View error logs only"
    echo "9) Test RAG endpoints (requires URL)"
    echo "0) Exit"
    echo ""
    read -p "Enter choice: " choice
}

# Function to get Railway URL
get_railway_url() {
    echo "Getting Railway deployment URL..."
    railway status
    echo ""
    echo "Your deployment URL should be shown above."
    echo "It typically looks like: https://your-app.up.railway.app"
    echo ""
    read -p "Press Enter to continue..."
}

# Function to view RAG logs
view_rag_logs() {
    echo "Fetching RAG-related logs from Railway..."
    echo "----------------------------------------"
    railway logs --tail 100 | grep -E "(RAG|rag|Retriever|retriever|Vector|vector|Profile|profile_system|query_accounts|query_transactions|embeddings)"
    echo ""
    read -p "Press Enter to continue..."
}

# Function to monitor RAG in real-time
monitor_rag_realtime() {
    echo "Monitoring RAG queries in real-time..."
    echo "Press Ctrl+C to stop"
    echo "----------------------------------------"
    railway logs --tail | grep -E "(RAG QUERY|query_profile|query_accounts|query_transactions|Retrieving|Retrieved|Vector search|Similarity)"
}

# Function to check RAG initialization
check_rag_init() {
    echo "Checking RAG initialization logs..."
    echo "----------------------------------------"
    railway logs | grep -E "(RAG manager initialized|ProfileRAGSystem initialized|Loading profile|CSV data loader|embeddings generated|FAISS index)"
    echo ""
    read -p "Press Enter to continue..."
}

# Function to view AI generation logs
view_ai_logs() {
    echo "Viewing AI explanation generation logs..."
    echo "----------------------------------------"
    railway logs --tail 200 | grep -E "(AI EXPLANATIONS|generate_explanation_cards|LangGraph|DSPy|personalized|explanation cards|AI agent)"
    echo ""
    read -p "Press Enter to continue..."
}

# Function to check profile loading
check_profile_loading() {
    echo "Checking profile data loading logs..."
    echo "----------------------------------------"
    railway logs | grep -E "(load_profile|Profile [0-9]+ loaded|CSV.*profile|customer_id|accounts loaded|transactions loaded)"
    echo ""
    read -p "Press Enter to continue..."
}

# Function to monitor performance
monitor_performance() {
    echo "Monitoring performance metrics..."
    echo "----------------------------------------"
    railway logs --tail 100 | grep -E "(PERFORMANCE|execution_time|latency|Processing time|Cache hit|batch.*queries|parallel)"
    echo ""
    read -p "Press Enter to continue..."
}

# Function to view errors
view_errors() {
    echo "Viewing error logs..."
    echo "----------------------------------------"
    railway logs --tail 200 | grep -E "(ERROR|FAILED|Exception|Traceback|failed|error)"
    echo ""
    read -p "Press Enter to continue..."
}

# Function to test RAG endpoints
test_endpoints() {
    echo "Enter your Railway deployment URL:"
    read -p "URL: " RAILWAY_URL
    
    if [ -z "$RAILWAY_URL" ]; then
        echo "No URL provided. Skipping tests."
        return
    fi
    
    echo ""
    echo "Testing RAG endpoints..."
    echo "----------------------------------------"
    
    # Test health
    echo "1. Testing health endpoint..."
    curl -s "${RAILWAY_URL}/health" | python3 -m json.tool | head -20
    
    echo ""
    echo "2. Testing RAG profiles summary..."
    curl -s "${RAILWAY_URL}/rag/profiles/summary" | python3 -m json.tool | head -20
    
    echo ""
    echo "3. Testing profile 1 summary..."
    curl -s "${RAILWAY_URL}/rag/profiles/1/summary" | python3 -m json.tool | head -20
    
    echo ""
    echo "4. Testing RAG query..."
    curl -s -X POST "${RAILWAY_URL}/rag/query/1" \
        -H "Content-Type: application/json" \
        -d '{"query": "What are my accounts?", "tool_name": "query_accounts"}' \
        | python3 -m json.tool | head -30
    
    echo ""
    echo "5. Testing optimization metrics..."
    curl -s "${RAILWAY_URL}/api/optimization/metrics" | python3 -m json.tool | head -30
    
    echo ""
    read -p "Press Enter to continue..."
}

# Main loop
while true; do
    clear
    show_menu
    
    case $choice in
        1) get_railway_url ;;
        2) view_rag_logs ;;
        3) monitor_rag_realtime ;;
        4) check_rag_init ;;
        5) view_ai_logs ;;
        6) check_profile_loading ;;
        7) monitor_performance ;;
        8) view_errors ;;
        9) test_endpoints ;;
        0) echo "Exiting..."; exit 0 ;;
        *) echo "Invalid option. Press Enter to continue..."; read ;;
    esac
done