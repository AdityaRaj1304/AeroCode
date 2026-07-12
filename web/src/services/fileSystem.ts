import type { FileSystemNode } from '../types';

/**
 * Service to interact with the local File System Access API.
 */
class FileSystemService {
  /**
   * Prompts the user to select a directory and recursively builds a file tree.
   */
  async openDirectory(): Promise<FileSystemNode | null> {
    try {
      // @ts-ignore - showDirectoryPicker is not in standard DOM types yet
      const directoryHandle = await window.showDirectoryPicker();
      return await this.buildFileTree(directoryHandle);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to open directory:', err);
      }
      return null;
    }
  }

  /**
   * Recursively traverses a directory handle to build a tree of FileSystemNodes.
   */
  private async buildFileTree(handle: any): Promise<FileSystemNode> {
    const node: FileSystemNode = {
      name: handle.name,
      kind: handle.kind,
      handle,
      children: [],
      isOpen: false, // Default closed
    };

    if (handle.kind === 'directory') {
      const children = [];
      // @ts-ignore
      for await (const entry of handle.values()) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue; // Skip hidden/heavy folders
        children.push(await this.buildFileTree(entry));
      }
      
      // Sort directories first, then alphabetically
      node.children = children.sort((a, b) => {
        if (a.kind === b.kind) return a.name.localeCompare(b.name);
        return a.kind === 'directory' ? -1 : 1;
      });
    }

    return node;
  }

  /**
   * Reads the contents of a file handle.
   */
  async readFile(fileHandle: any): Promise<string> {
    const file = await fileHandle.getFile();
    return await file.text();
  }

  /**
   * Writes content back to a file handle.
   */
  async writeFile(fileHandle: any, content: string): Promise<boolean> {
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (err) {
      console.error('Failed to save file:', err);
      return false;
    }
  }

  /**
   * Attempts to determine the language from a filename for syntax highlighting.
   */
  getLanguageFromFileName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx': return 'typescript';
      case 'js':
      case 'jsx': return 'javascript';
      case 'py': return 'python';
      case 'rs': return 'rust';
      case 'go': return 'go';
      case 'cpp':
      case 'cc':
      case 'h':
      case 'hpp': return 'cpp';
      case 'c': return 'c';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'sh': return 'shell';
      default: return 'plaintext';
    }
  }
}

export const fileSystem = new FileSystemService();
