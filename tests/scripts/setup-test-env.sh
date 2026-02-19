#!/bin/bash
echo "🛠️  Setting up test environment..."
mkdir -p tests/fixtures/{products,orders,users}
mkdir -p tests/reports/{coverage,performance,e2e}
mkdir -p tests/logs
echo "✅ Test environment setup complete!"
