# AeroCode

Air-Gapped AI Pair Programmer & Security Auditor.

AeroCode is a local-first, on-device AI pair programmer that runs entirely within your browser. By utilizing client-side WebGPU acceleration, it performs security audits, compliance analysis, and autonomous debugging completely offline—guaranteeing that not a single byte of your source code ever leaves your machine.

---

## Problem

What problem are you solving?

Developers working in highly secure, compliant, or air-gapped industries (such as defense, government, healthcare, and finance) are strictly prohibited from using cloud-based AI tools like GitHub Copilot or ChatGPT. Sending proprietary source code or confidential data to third-party APIs risks violating SOC2, exposing Personally Identifiable Information (PII), or leaking intellectual property. 

Consequently, these developers are locked out of the productivity gains of modern AI coding assistants.

---

## Solution

How does your project solve it?

AeroCode brings AI pair programming directly inside the browser sandbox:
1. **100% Air-Gapped**: All code analysis and refactoring are processed locally on your client machine. You can physically disconnect from the internet and the AI continues to generate code.
2. **Zero Outbound Leakage**: A real-time **Paranoid Mode** telemetry status bar intercepts and blocks all outbound `fetch` and `XMLHttpRequest` traffic, proving 0.00 KB of data leaves your system during reviews.
3. **Enterprise Compliance Lenses**: Run specialized audits at the click of a button:
   - **OWASP Top 10**: Scans for vulnerabilities like SQL Injection and Cross-Site Scripting (XSS).
   - **SOC2 / PII Guard**: Flags hardcoded credentials, exposed API secrets, and plain-text logging of sensitive variables.
   - **Complexity Profiler**: Identifies Big-O scaling issues and suggests optimized logic.
4. **Autonomous TDD Debugger**: Runs a local, sandboxed test evaluator. If assertions fail, it captures the stack trace, prompts the local model to write a patch, re-evaluates the tests, and opens a split-pane **Diff Editor** showing the automatic repair.

---

## On Device AI Usage

What runs locally? What model/runtime/device is used?

* **What Runs Locally**: The entire LLM inference runtime, token stream generation, prompt construction, and test assertions run locally on the client's device.
* **Model**: `Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC` (compiled specifically for local browser execution).
* **Runtime / Interface**: WebGPU API and the `@mlc-ai/web-llm` engine.
* **Storage**: The model weights are downloaded once from Hugging Face, cached locally in the browser's IndexedDB, and compiled into shaders on the client GPU.
* **Concurrency**: Runs inside a background Web Worker (`llm.worker.ts`) off the main thread, keeping the Monaco Editor layout butter-smooth during inference.

---

## Tech Stack

Languages, frameworks, models, runtimes, and tools.

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
* **Editor Engine**: Monaco Editor (`@monaco-editor/react`)
* **AI Runtime**: WebGPU, Web-LLM (`@mlc-ai/web-llm`)
* **Test Sandbox**: In-browser Custom `expect` Assertion Engine (`new Function` scope)
* **Local Proxy Tooling (Optional)**: Python 3, FastAPI, Hugging Face Hub (for asset caching in fully offline offline-only local proxy networks)

---

## Setup and Usage

How can someone run or test it?

### Prerequisites
* A modern browser supporting WebGPU (Google Chrome or Microsoft Edge v113+).
* Node.js (v18+) installed.

### 1. Installation
Navigate to the `web` folder and install dependencies:
```bash
cd web
npm install
```

### 2. Running the Development Server
Launch the local dev server:
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your WebGPU-supported browser.

### 3. Usage & Testing
1. **Load the Model**: On the first launch, click **"Load Model"** in the top navbar. The progress bar will track the download of the model weights. Once cached, subsequent visits will load instantly.
2. **Run Demo Presets**:
   * Select **OWASP SQL Injection** from the dropdown, turn on **Paranoid Mode**, and click **OWASP Top 10**. Watch the AI identify the SQL injection fully offline.
   * Select **SOC2 API Key Leak** and click **SOC2 / PII Guard** to see hardcoded secrets and email logging flagged.
   * Select **TDD Buggy Function**, view the failing assertions in the sidebar, and click **Run Autonomous Debugger**. Watch it self-heal and display the diff.
3. **Test the Air-Gap**: Unplug your internet cable or turn off your Wi-Fi and continue using the assistant.

---

## Demo and Screenshots

Demo video link and screenshots.

* **Demo Video**: [Link to Presentation Video](https://youtube.com) *(Insert video link here)*
* **Main Dashboard**:
  ![Dashboard Screenshot](https://raw.githubusercontent.com/username/project/main/screenshots/dashboard.png) *(Insert dashboard screenshot here)*
* **Autonomous Debugger Diff**:
  ![Diff Screenshot](https://raw.githubusercontent.com/username/project/main/screenshots/diff.png) *(Insert diff screenshot here)*
<img width="2426" height="528" alt="Screenshot 2026-07-15 011758" src="https://github.com/user-attachments/assets/84331080-2319-4edc-8fa3-60e07711aa7c" />



---

## License

Name of the OSI-compliant license used.

This project is licensed under the **MIT License** (an OSI-compliant license).
