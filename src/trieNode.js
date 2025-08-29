/**
 * Represents a node in a Trie data structure.
 * Each node contains a map of child nodes and a flag indicating if it represents the end of a word.
 */
class TrieNode {
    /**
     * Creates a new TrieNode instance.
     */
    constructor() {
      /**
       * Object containing child nodes, where keys are characters and values are TrieNode instances.
       * @type {Object.<string, TrieNode>}
       */
      this.children = {};
      
      /**
       * Flag indicating if this node represents the end of a word.
       * @type {boolean}
       */
      this.isEndOfWord = false;
    }
  }

export default TrieNode;