# Image to PDF Converter

这是一个基于 FastAPI 的简单 Web 应用程序，允许用户将多张图片上传并合并为一个 PDF 文件。

## 功能特点

- **多图上传**：支持同时上传多张图片（JPG, PNG, BMP, GIF, TIFF）。
- **合并 PDF**：将上传的所有图片按顺序合并为一个 PDF 文档。
- **自动清理**：服务器具备心跳检测机制，当浏览器关闭后会自动停止运行。
- **界面友好**：响应式 Web 界面，操作简单。

## 快速开始

### 环境依赖

确保已安装 Python 3.7+。

### 安装步骤

### 快速启动 (Windows)

只需双击运行 `run_server.bat` 即可。该脚本会自动：
1. 检测并创建 Python 虚拟环境 (`venv`)。
2. 安装所有必要的依赖项。
3. 启动 Web 服务并自动在浏览器中打开主页。

### 手动安装 (其他平台/进阶)

1. **安装依赖**：
   ```powershell
   pip install -r requirements.txt
   ```

2. **运行程序**：
   ```powershell
   python app.py
   ```

3. **访问应用**：
   在浏览器中打开 [http://localhost:8000](http://localhost:8000)。

## 项目结构

- `app.py`: FastAPI 后端服务逻辑。
- `static/`: 前端静态文件（HTML, CSS, JS）。
- `requirements.txt`: 项目依赖列表。
- `run_server.bat`: Windows 环境下的快速启动脚本。

## 技术栈

- **后端**: FastAPI, img2pdf, natsort
- **前端**: 原生 HTML/CSS/JS
- **服务器**: Uvicorn

## 开源协议

本项目采用 [GNU General Public License v3.0](LICENSE) 协议。
