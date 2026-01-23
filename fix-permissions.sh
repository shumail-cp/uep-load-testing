#!/bin/bash
# Script to ensure all shell scripts are executable
# Run this if you ever encounter permission issues

echo "🔧 Making all shell scripts executable..."

# Make all .sh files executable
chmod +x *.sh

# Also fix common permission issues
chmod +x scripts/*.sh 2>/dev/null || true

echo "✅ All shell scripts are now executable!"
echo ""
echo "📋 Available commands:"
echo "  ./run.sh                  - Basic K6 test execution"
echo "  ./run-with-archive.sh     - Test with automatic archiving (recommended)"
echo "  ./update-reports-index.sh - Update dashboard manually"
echo "  ./fix-permissions.sh      - Fix script permissions (this script)"