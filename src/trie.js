import TrieNode from './trieNode.js';

/**
 * A Trie data structure implementation.
 * Used for efficient string searching, prefix matching, and auto-completion features.
 */
export class Trie {
    constructor() {
      this.root = new TrieNode();
    }
  
    // Insert a word
    insert(word) {
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
            return false; // ❌ if path breaks
          }
          node = node.children[char];
        }
        return node.isEndOfWord; // ✅ ensure true/false
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
// module.exports = Trie;
