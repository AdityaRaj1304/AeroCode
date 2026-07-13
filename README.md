# AeroCode

Air-Gapped AI Pair Programmer & Security Auditor.

## Short Description

AeroCode is a fully air-gapped AI pair programmer that runs locally entirely within your browser. All AI inference runs on-device via WebGPU—no proprietary source code or data ever leaves your machine.

## Problem Statement

Developers working in highly secure, compliant, or air-gapped environments (such as defense, healthcare, and finance) often cannot use cloud-based AI tools like GitHub Copilot or ChatGPT due to strict data privacy and SOC2 constraints. This leaves them isolated from the productivity benefits and assistance of modern AI pair programming.

## Solution Overview

AeroCode provides a complete, locally-hosted, in-browser AI pair programmer. By running the LLM directly on the user's hardware, it guarantees 100% data privacy while providing real-time code analysis, security auditing, and auto-completion.

## Key Features Built for Mid-Eval

- **100% Offline Inference**: Runs entirely in the browser using WebGPU. You can physically disconnect your Wi-Fi and the AI continues to generate code.
- **Live Privacy Telemetry**: A real-time status bar proving 0.00 KB Outbound network traffic during code analysis, guaranteeing zero data leakage.
- **Enterprise Compliance Lenses**: One-click audit profiles specialized for enterprise security:
  - **OWASP Top 10**: Scans for SQLi, XSS, and authentication vulnerabilities.
  - **SOC2 / PII Guard**: Flags hardcoded secrets, exposed JWTs, and plain-text data logging.
  - **Complexity Analysis**: Profiles Big-O bottlenecks and suggests optimized logic.

## On-Device AI Explanation

By leveraging the WebGPU API and the `@mlc-ai/web-llm` library, the application compiles and executes Large Language Models (like Qwen2.5-Coder) directly on the client's GPU within the browser sandbox. The model weights are downloaded once, cached locally in the browser's IndexedDB, and then used for completely offline inference. This enables zero-latency network trips and absolute data privacy.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Editor Engine**: Monaco Editor (`@monaco-editor/react`)
- **AI Runtime**: WebGPU, Web-LLM (`@mlc-ai/web-llm`)
- **Local Server/Tools**: Python, FastAPI, Hugging Face Hub (for optional offline asset proxying and model preparation)

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- Python 3.8+ (for optional backend tools)
- A modern, WebGPU-enabled web browser (e.g., Google Chrome or Microsoft Edge v113+)

### 1. Frontend Setup
```bash
cd web
npm install
npm run dev
```

### 2. Backend / Offline Asset Proxy (Optional)
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

## Usage Instructions

1. Run the frontend development server and open `http://localhost:5173` in a WebGPU-enabled browser.
2. On the first launch, the AI model (default: `Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC`) will download and cache locally. Watch the loading progress bar.
3. Once cached, create or open a file in the workspace.
4. Highlight vulnerable or complex code in the editor and click one of the Compliance Lenses (e.g., "OWASP Top 10") to run a specialized, air-gapped security audit.
5. **Test the privacy guarantee**: Disconnect from the internet and continue using the AI pair programmer entirely offline.

## License

MIT License

## Known Limitations and Future Scope

### Limitations

- **Hardware Dependent**: Model size and inference speed (t/s) are constrained by the client device's GPU performance and available VRAM.
- **Initial Download**: The very first run requires an internet connection to securely cache the model weights locally before it can operate fully offline.

### Future Scope

- **Autonomous Test-Driven Debugging**: Implementing an agentic loop that runs unit tests, captures stack traces, generates patches, and re-evaluates until tests pass.
- **LSP Integration**: Integration with Local Language Servers (LSP) for deeper, project-wide context awareness.
- **Advanced Diff Editor Integration**: Expanding the side-by-side Diff view for multi-file refactoring.