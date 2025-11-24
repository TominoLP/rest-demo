#!/bin/sh

cd /app/backend
npm start &

cd /app/frontend
export BACKEND_URL=${BACKEND_URL:-http://localhost:3000}
npm start
.