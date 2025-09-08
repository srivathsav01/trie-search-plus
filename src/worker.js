// TrieNode implementation directly in worker
class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
    }
}

class WorkerTrie {
    constructor() {
        this.root = new TrieNode();
    }

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

    insertBatch(words) {
        // Add console logging for debugging
        console.log(`Worker: Processing ${words.length} words`);
        
        words.forEach(word => {
            if (typeof word === 'string' && word.length > 0) {
                this.insert(word);
            }
        });
        
        const result = this.serializeForMerge();
        console.log(`Worker: Serialized ${result.length} words`);
        return result;
    }

    serializeForMerge() {
        const result = [];
        const serialize = (node, path = '') => {
            if (node.isEndOfWord) {
                result.push(path);
            }
            for (const [char, child] of Object.entries(node.children)) {
                serialize(child, path + char);
            }
        };
        serialize(this.root);
        return result;
    }
}

const trie = new WorkerTrie();

// Enhanced message handler with better error handling
self.onmessage = async function(e) {
    // const { Trie } = await import('./trie.js');
    // const trie = new Trie();
    console.log('Worker: Received message', e.data);
    
    const { words, id } = e.data;

    try {
        if (!Array.isArray(words)) {
            throw new Error('Expected words to be an array');
        }

        if (words.length === 0) {
            throw new Error('Words array is empty');
        }
        const result = trie.insertBatch(words);
        console.log(`Worker: Sending success response for ${result.length} words`);
        
        self.postMessage({
            id,
            success: true,
            result
        });
    } catch (error) {
        console.error('Worker error:', error);
        self.postMessage({
            id,
            success: false,
            error: error.message
        });
    }
};

// Add error handler
self.onerror = function(error) {
    console.error('Worker global error:', error);
};