import TrieNode from './trieNode.js';

/**
 * A Trie data structure implementation.
 * Used for efficient string searching, prefix matching, and auto-completion features.
 */
export class Trie {
    constructor() {
      this.root = new TrieNode();
      this.worker = null;
      this.workerPromises = new Map();
      this.promiseId = 0;
      this.workerIdleTimeout = null;
      this.WORKER_IDLE_TIME = 30000; // 30 seconds 
    }
  
    /**
     * Insert words into the trie.
     * For large arrays (>500000 items), automatically uses web worker.
     * @param {string|string[]} input - Word(s) to insert
     * @param {Object} options - Configuration options
     * @param {boolean} options.useWorker - Force web worker usage
     * @param {number} options.chunkSize - Items per batch (default: 100000)
     * @param {Function} options.onProgress - Progress callback
     * @returns {Promise} - Resolves when insertion is complete
     */
    async insert(input, options = {}) {
      const {
        useWorker = false,
        chunkSize = 100000,
        onProgress = null
      } = options;

      if (Array.isArray(input)) {
        // Use worker for large datasets or when explicitly requested
        if (useWorker || input.length > 500000) {
          console.log(`Using web worker for ${input.length} words`);
          return this._insertWithWorker(input, { chunkSize, onProgress });
        } else {
          console.log(`Using main thread for ${input.length} words`);
          return this._insertBatch(input, onProgress);
        }
      } else {
        this._insert(input);
        return Promise.resolve();
      }
    }

    async _insertWithWorker(words, { chunkSize, onProgress }) {
      try {
        if (!this.worker) {
          console.log('Creating web worker...');
          this.worker = await this._createWorker();
        }

        const chunks = this._chunkArray(words, chunkSize);
        let processedCount = 0;
        console.log(`Processing ${words.length} words in ${chunks.length} chunks`);

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          console.log(`Processing chunk ${i + 1}/${chunks.length} with ${chunk.length} words`);
          const processedNodes = await this._sendToWorker({
            words: chunk
          });

          // Merge the processed nodes back into main trie
          this._mergeNodes(processedNodes);
          this._scheduleWorkerCleanup();
          processedCount += chunk.length;
          
          if (onProgress) {
            onProgress({
              processed: processedCount,
              total: words.length,
              percentage: Math.round((processedCount / words.length) * 100)
            });
          }
        }
        console.log(`Worker processing complete: ${processedCount} words processed`);

        return {
          success: true,
          processed: processedCount
        };
      } catch (error) {
        console.error('Worker insertion failed:', error);
        // Fallback to main thread for smaller datasets
        this._scheduleWorkerCleanup();
        if (words.length <= 500000) {
          console.log('Falling back to main thread...');
          return this._insertBatch(words, onProgress);
        } else {
          return {
            success: false,
            error: error.message
          };
        }
      }
    }

    async _insertBatch(words, onProgress) {
      console.log(`Inserting ${words.length} words on main thread`);
      words.forEach(word => {
        if (typeof word === 'string' && word.length > 0) {
          this._insert(word);
        }
      });

      if (onProgress) {
        onProgress({
          processed: words.length,
          total: words.length,
          percentage: 100
        });
      }

      return Promise.resolve({
        success: true,
        processed: words.length
      });
    }

    async _createWorker() {
      // Try to create worker with correct path
      let worker;
      try {
        // First try the direct path
        worker = new Worker('./worker.js');
      } catch (error) {
        console.warn('Failed to load ./worker.js, trying alternative paths...');
        try {
          // Try relative to the HTML file
          worker = new Worker('worker.js');
        } catch (error2) {
          throw new Error('Could not load worker.js. Make sure the file is in the correct location.');
        }
      }

      console.log('Worker created successfully');

      worker.onmessage = (e) => {
        console.log('Main: Received message from worker', e.data);
        const { id, success, result, error } = e.data;
        const promise = this.workerPromises.get(id);
        
        if (promise) {
          this.workerPromises.delete(id);
          if (success) {
            promise.resolve(result);
          } else {
            promise.reject(new Error(error));
          }
        }
      };

      worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Reject all pending promises
        this.workerPromises.forEach(promise => {
          promise.reject(new Error('Worker error: ' + error.message));
        });
        this.workerPromises.clear();
      };

      return worker;
    }

    _sendToWorker(message) {
      return new Promise((resolve, reject) => {
        const id = ++this.promiseId;
        this.workerPromises.set(id, { resolve, reject });
        console.log(`Main: Sending message to worker with id ${id}`, {
          wordsCount: message.words?.length
        });
        
        this.worker.postMessage({
          ...message,
          id
        });

        // Timeout after 30 seconds (reduced from 30000 seconds!)
        setTimeout(() => {
          if (this.workerPromises.has(id)) {
            this.workerPromises.delete(id);
            reject(new Error('Worker timeout'));
          }
        }, 30000);
      });
    }

    _mergeNodes(words) {
      console.log(`Merging ${words.length} words from worker into main trie`);
      words.forEach(word => this._insert(word));
    }


    _chunkArray(array, chunkSize) {
      const chunks = [];
      for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
      }
      return chunks;
    }

    _scheduleWorkerCleanup() {
      // Clear existing timeout
      if (this.workerIdleTimeout) {
        clearTimeout(this.workerIdleTimeout);
      }
      
      // Schedule cleanup after idle period
      this.workerIdleTimeout = setTimeout(() => {
        this._cleanup();
      }, this.WORKER_IDLE_TIME);
    }


    _cleanup() {
      // console.log('Cleaning up web worker');
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
      
      if (this.workerIdleTimeout) {
        clearTimeout(this.workerIdleTimeout);
        this.workerIdleTimeout = null;
      }
      
      this.workerPromises.clear();
    }

    // Insert a single word
    _insert(word) {
      let node = this.root;
      for (const char of word) {
        if (!node.children[char]) {
          node.children[char] = new TrieNode();
        }
        node = node.children[char];
      }
      node.isEndOfWord = true;
    }
  
    // Search for an exact word
    search(word) {
        let node = this.root;
        for (const char of word) {
          if (!node.children[char]) {
            return false;
          }
          node = node.children[char];
        }
        return node.isEndOfWord;
      }
  
    // Delete a word
    delete(word) {
      const _deleteRecursively = (node, word, depth = 0) => {
        if (!node) return false;
  
        if (depth === word.length) {
          if (!node.isEndOfWord) return false;
          node.isEndOfWord = false;
  
          return Object.keys(node.children).length === 0;
        }
  
        const char = word[depth];
        if (_deleteRecursively(node.children[char], word, depth + 1)) {
          delete node.children[char];
          return !node.isEndOfWord && Object.keys(node.children).length === 0;
        }
        return false;
      };
  
      _deleteRecursively(this.root, word);
    }
  
    // Prefix search
    startsWith(prefix) {
      let node = this.root;
      for (const char of prefix) {
        if (!node.children[char]) return false;
        node = node.children[char];
      }
      return true;
    }
  
    // Autocomplete suggestions
    autocomplete(prefix) {
      let node = this.root;
      for (const char of prefix) {
        if (!node.children[char]) return [];
        node = node.children[char];
      }
  
      const results = [];
  
      const dfs = (currNode, path) => {
        if (currNode.isEndOfWord) {
          results.push(path);
        }
        for (const [ch, nextNode] of Object.entries(currNode.children)) {
          dfs(nextNode, path + ch);
        }
      };
  
      dfs(node, prefix);
      return results;
    }
  
    // Fuzzy search (Levenshtein distance, max distance = 1 by default)
    fuzzySearch(word, maxDistance = 1) {
      const results = [];
  
      const dfs = (node, prefix, prevRow) => {
        const columns = word.length + 1;
        const currRow = [prevRow[0] + 1];
  
        for (let i = 1; i < columns; i++) {
          const insertCost = currRow[i - 1] + 1;
          const deleteCost = prevRow[i] + 1;
          const replaceCost = prevRow[i - 1] + (word[i - 1] === prefix[prefix.length - 1] ? 0 : 1);
          currRow.push(Math.min(insertCost, deleteCost, replaceCost));
        }
  
        if (currRow[word.length] <= maxDistance && node.isEndOfWord) {
          results.push(prefix);
        }
  
        if (Math.min(...currRow) <= maxDistance) {
          for (const [ch, childNode] of Object.entries(node.children)) {
            dfs(childNode, prefix + ch, currRow);
          }
        }
      };
  
      for (const [ch, childNode] of Object.entries(this.root.children)) {
        dfs(childNode, ch, [...Array(word.length + 1).keys()]);
      }
  
      return results;
    }
  
    // Wildcard search ('.' can match any character)
    wildcardSearch(word) {
      const results = [];
  
      const dfs = (node, i, path) => {
        if (i === word.length) {
          if (node.isEndOfWord) results.push(path);
          return;
        }
  
        const ch = word[i];
        if (ch === ".") {
          for (const [nextCh, childNode] of Object.entries(node.children)) {
            dfs(childNode, i + 1, path + nextCh);
          }
        } else {
          if (node.children[ch]) {
            dfs(node.children[ch], i + 1, path + ch);
          }
        }
      };
  
      dfs(this.root, 0, "");
      return results;
    }
  
    // Count words in trie
    countWords() {
      let count = 0;
  
      const dfs = (node) => {
        if (node.isEndOfWord) count++;
        for (const child of Object.values(node.children)) {
          dfs(child);
        }
      };
  
      dfs(this.root);
      return count;
    }
  
    // List all words
    listWords() {
      const results = [];
  
      const dfs = (node, path) => {
        if (node.isEndOfWord) results.push(path);
        for (const [ch, child] of Object.entries(node.children)) {
          dfs(child, path + ch);
        }
      };
  
      dfs(this.root, "");
      return results;
    }
  }
  
  
  export default Trie;