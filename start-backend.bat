@echo off
REM start-backend.bat  —  Windows: start the backend server
cd backend
npm install
node src/server.js
