#!/bin/bash

# Service Unit Tests Runner
echo "Running comprehensive unit tests for all services..."
echo "=================================================="

# Run tests with coverage
go test ./internal/service/... -v -cover -coverprofile=coverage.out

# Generate coverage report
echo ""
echo "Coverage Summary:"
echo "=================="
go tool cover -func=coverage.out

# Generate HTML coverage report
go tool cover -html=coverage.out -o coverage.html
echo ""
echo "HTML coverage report generated: coverage.html"

# Clean up
rm -f coverage.out

echo ""
echo "All service tests completed!"