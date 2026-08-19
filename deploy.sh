#!/bin/bash
echo "Stopping any running SuRaksha MAPS containers..."
docker-compose down

echo "Building and starting SuRaksha MAPS services..."
docker-compose up --build -d

echo ""
echo "✅ Deployment Successful!"
echo "SuRaksha MAPS Frontend running at: http://localhost"
echo "Backend API Docs available at: http://localhost:8000/docs"
