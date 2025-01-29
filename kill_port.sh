#!/bin/bash
if [ -z "$1" ]; then
  echo "❌ Usage: $0 <port>"
  exit 1
fi

PORT=$1
echo "🔍 Finding process running on port $PORT..."

PID=$(lsof -t -i:$PORT) # Find the process ID (PID) using the port
if [ -z "$PID" ]; then
  echo "✅ No process is running on port $PORT."
  exit 0
fi

echo "-->>  Killing process with PID: $PID  <<--"
kill -9 $PID && echo "✅ Process on port $PORT has been killed."
