@echo off
echo 正在启动公众号内容管理系统...
echo.

echo 检查Node.js版本...
node --version
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js 18.0+
    pause
    exit /b 1
)

echo.
echo 安装依赖...
npm install

echo.
echo 启动开发服务器...
npm run dev

pause 