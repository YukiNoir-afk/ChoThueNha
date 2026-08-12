@echo off
echo ==============================================
echo [Deploy] Bat dau qua trinh trien khai ThueNha
echo ==============================================

echo.
echo [1/3] Cai dat dependencies cho Frontend va Backend...
cd client
call npm install
cd ../server
call npm install
cd ..

echo.
echo [2/3] Build Frontend (React)...
cd client
call npm run build
cd ..

echo.
echo [3/3] Khoi dong Backend (Monolith)...
cd server
:: O moi truong production, thuc te thuong dung pm2 hoac docker.
:: O day chung ta set env truc tiep de chay.
set NODE_ENV=production
call npm start
