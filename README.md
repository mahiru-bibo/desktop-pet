# 🎀 Desktop Pet — 椎名真昼

一个基于 Electron 的桌面宠物，角色为「椎名真昼」（Shiina Mahiru），支持 AI 对话、TTS 语音、屏幕观察、多情绪表情。

## 功能

- 🖼️ **7 种情绪**：默认、害羞、生气、惊讶、晚安、不理你了、疑惑、被捉弄
- 💬 **AI 对话**：Ollama + qwen2.5:7b，带有椎名真昼人格
- 🎙️ **TTS 语音**：GPT-SoVITS v2 + 夜乃桜 (Sakura) 语音模型
- 👀 **屏幕观察**：minicpm-v 视觉模型，每 20s 观察屏幕并吐槽
- 🖱️ **拖拽与点击**：拖拽移动位置，点击弹出对话框

## 前置要求

- [Node.js](https://nodejs.org/) (v18+)
- [Ollama](https://ollama.com/) + `qwen2.5:7b` + `minicpm-v`
- Python 3.11 + CUDA GPU (用于 TTS)

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/mahiru-bibo/desktop-pet.git
cd desktop-pet
npm install
```

### 2. 安装 TTS（可选，需要语音功能时）

```bash
# 运行一键安装脚本
setup-tts.bat
```

脚本会自动：
- 克隆 GPT-SoVITS
- 安装 Python 依赖
- 复制 TTS 配置和参考音频

> ⚠️ **Sakura 语音模型需要手动下载**（共 ~314MB）放到 `%USERPROFILE%\gpt-sovits\GPT-SoVITS\sakura_models\`：
> - `Sakura-e15.ckpt` (149MB)
> - `Sakura_e8_s7176.pth` (165MB)
>
> 用 Claude Code 打开项目时会自动提醒下载。

### 3. 启动

```bash
npm run build && npx electron .
```

或双击桌面快捷方式 `椎名真昼.lnk`（会自动启动 TTS + 桌宠）。

## 项目结构

```
desktop-pet/
├── src/main/          # Electron 主进程 (TypeScript)
│   ├── ipc.ts         # IPC 通信
│   ├── windows/       # 窗口管理
│   ├── screenObserver.ts # 屏幕观察
│   └── store.ts       # 持久化存储
├── src/preload/       # contextBridge 预加载
├── src/renderer/pet/  # 渲染进程 (手写 JS)
│   ├── pet.js         # 主入口：拖拽、点击、对话
│   ├── renderer.js    # Canvas 渲染器
│   ├── animations.js  # 动画控制
│   ├── tts.js         # TTS 语音模块
│   └── speechBubble.js # 气泡组件
├── assets/characters/ # 角色图片 (8张)
├── tts/               # TTS 配置和参考音频
├── setup-tts.bat      # TTS 一键安装
└── launch.bat         # 完整启动脚本
```

## 启动命令（手动）

```bash
# 1. 启动 TTS API
cd %USERPROFILE%\gpt-sovits\GPT-SoVITS
python api_v2.py -a 127.0.0.1 -p 9880 -c GPT_SoVITS/configs/tts_infer.yaml

# 2. 启动桌宠
cd desktop-pet
npm run build && npx electron .
```
