#!/bin/bash

echo "=================================================="
echo "  Frontend WebSocket Setup - Verification"
echo "=================================================="
echo ""

# Check if websocketService.js exists
if [ -f "src/services/websocketService.js" ]; then
    echo "✅ websocketService.js exists"
else
    echo "❌ websocketService.js NOT found"
fi

# Check if NotificationContext.jsx exists
if [ -f "src/context/NotificationContext.jsx" ]; then
    echo "✅ NotificationContext.jsx exists"
else
    echo "❌ NotificationContext.jsx NOT found"
fi

# Check WebSocket URL in websocketService
if grep -q "ws://localhost:8000/ws/notifications/" src/services/websocketService.js 2>/dev/null; then
    echo "✅ WebSocket URL configured correctly"
else
    echo "⚠️  Check WebSocket URL in websocketService.js"
fi

# Check if NotificationContext uses websocketService
if grep -q "websocketService" src/context/NotificationContext.jsx 2>/dev/null; then
    echo "✅ NotificationContext imports websocketService"
else
    echo "❌ NotificationContext doesn't import websocketService"
fi

echo ""
echo "=================================================="
echo "  Frontend Files to Check"
echo "=================================================="
echo ""
echo "📁 Services:"
echo "   - src/services/websocketService.js"
echo "   - src/services/notificationService.js"
echo ""
echo "📁 Context:"
echo "   - src/context/NotificationContext.jsx"
echo ""
echo "📁 Components:"
echo "   - src/components/NotificationBell.jsx (or similar)"
echo ""
echo "=================================================="
echo "  Quick Test Commands"
echo "=================================================="
echo ""
echo "1. Start Frontend:"
echo "   npm run dev"
echo ""
echo "2. Open Browser Console and check for:"
echo "   ✅ WebSocket Connected"
echo "   📨 WebSocket Message: ..."
echo ""
echo "3. Test notification flow:"
echo "   - Login as Client"
echo "   - Create a new issue"
echo "   - Login as Admin/Manager (different browser/incognito)"
echo "   - Check if notification appears"
echo ""
