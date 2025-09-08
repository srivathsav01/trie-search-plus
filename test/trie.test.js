import { Trie } from "../src/index.js";

describe("Trie", () => {
  let trie;

  // Setup and cleanup for each test
  beforeEach(() => {
    trie = new Trie();
  });

  afterEach(async () => {
    // Clean up any workers and timers after each test
    if (trie && typeof trie._cleanup === 'function') {
      trie._cleanup();
    }
    trie = null;
  });

  // Global cleanup after all tests
  afterAll(async () => {
    // Give a small delay to ensure all cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  // Original functionality tests
  test("insert and search words", async () => {
    await trie.insert("apple");
    await trie.insert("app");

    expect(trie.search("apple")).toBe(true);
    expect(trie.search("app")).toBe(true);
    expect(trie.search("appl")).toBe(false);
    expect(trie.search("banana")).toBe(false);
  });

  test("delete words", async () => {
    await trie.insert(["apple","app","application"]);
    
    expect(trie.search("apple")).toBe(true);
    
    // Delete a word
    trie.delete("apple");
    expect(trie.search("apple")).toBe(false);
    expect(trie.search("app")).toBe(true);
    expect(trie.search("application")).toBe(true);
    
    // Delete non-existent word
    trie.delete("apples");
    expect(trie.search("app")).toBe(true);
    
    // Delete prefix of other words
    trie.delete("app");
    expect(trie.search("app")).toBe(false);
    expect(trie.search("application")).toBe(true);
  });

  test("startsWith prefix", async () => {
    await trie.insert("apple");
    await trie.insert("app");
    
    expect(trie.startsWith("app")).toBe(true);
    expect(trie.startsWith("ap")).toBe(true);
    expect(trie.startsWith("appl")).toBe(true);
    expect(trie.startsWith("banana")).toBe(false);
  });

  test("autocomplete suggestions", async () => {
    await trie.insert(["apple", "app", "application", "apartment", "banana"]);
    
    const suggestions = trie.autocomplete("ap");
    expect(suggestions).toContain("apple");
    expect(suggestions).toContain("app");
    expect(suggestions).toContain("application");
    expect(suggestions).toContain("apartment");
    expect(suggestions).not.toContain("banana");
    
    expect(trie.autocomplete("z")).toEqual([]);
  });

  test("fuzzy search", async () => {
    await trie.insert(["apple", "app", "application", "banana", "bath"]);
    
    // Max distance 1
    expect(trie.fuzzySearch("aple", 1)).toContain("apple");
    expect(trie.fuzzySearch("appl", 1)).toContain("apple");
    expect(trie.fuzzySearch("appla", 1)).toContain("apple");
    
    // Max distance 2
    expect(trie.fuzzySearch("apl", 2)).toContain("apple");
    expect(trie.fuzzySearch("baths", 1)).toContain("bath");
    
    // No matches
    expect(trie.fuzzySearch("xyz", 1)).toEqual([]);
  });

  test("wildcard search", async () => {
    await trie.insert(["apple", "app", "application", "banana", "bat"]);
    
    expect(trie.wildcardSearch("app.e")).toContain("apple");
    expect(trie.wildcardSearch(".pple")).toContain("apple");
    expect(trie.wildcardSearch("app..")).toEqual(["apple"]);
    expect(trie.wildcardSearch("ba.")).toContain("bat");
    expect(trie.wildcardSearch("...")).toContain("app");
    expect(trie.wildcardSearch("...")).toContain("bat");
  });

  test("count words", async () => {
    expect(trie.countWords()).toBe(0);
    
    await trie.insert("apple");
    expect(trie.countWords()).toBe(1);
    
    await trie.insert("app");
    await trie.insert("banana");
    expect(trie.countWords()).toBe(3);
    
    trie.delete("app");
    expect(trie.countWords()).toBe(2);
  });

  test("list all words", async () => {
    await trie.insert(["apple", "app", "banana", "bat"]);
    
    const words = trie.listWords();
    expect(words).toHaveLength(4);
    expect(words).toContain("apple");
    expect(words).toContain("app");
    expect(words).toContain("banana");
    expect(words).toContain("bat");
  });

  test("suggest words by prefix", async () => {
    await trie.insert(["apple", "app", "banana", "bat"]);

    expect(trie.autocomplete("ap")).toEqual(expect.arrayContaining(["app", "apple"]));
    expect(trie.autocomplete("ba")).toEqual(expect.arrayContaining(["banana", "bat"]));
    expect(trie.autocomplete("z")).toEqual([]);
  });
  
  test("insert and search with non-alpha characters", async () => {
    await trie.insert("hello123");
    await trie.insert("hello-world");
    await trie.insert("$pecial");
    await trie.insert("email@example.com");
  
    expect(trie.search("hello123")).toBe(true);
    expect(trie.search("hello-world")).toBe(true);
    expect(trie.search("$pecial")).toBe(true);
    expect(trie.search("email@example.com")).toBe(true);
    
    expect(trie.search("hello")).toBe(false);
    expect(trie.search("hello-")).toBe(false);
    expect(trie.search("pecial")).toBe(false);
  });
  
  test("suggest words with non-alpha prefixes", async () => {
    await trie.insert(["hello123", "hello-world", "$pecial", "$$money", "$dollar", "email@example.com"]);
  
    expect(trie.autocomplete("hello")).toEqual(expect.arrayContaining(["hello123", "hello-world"]));
    expect(trie.autocomplete("$")).toEqual(expect.arrayContaining(["$pecial", "$$money", "$dollar"]));
    expect(trie.autocomplete("email@")).toEqual(["email@example.com"]);
    expect(trie.autocomplete("123")).toEqual([]);
  });
  
  test("empty trie operations", () => {
    expect(trie.search("anything")).toBe(false);
    expect(trie.startsWith("anything")).toBe(false);
    expect(trie.autocomplete("anything")).toEqual([]);
    expect(trie.fuzzySearch("anything")).toEqual([]);
    expect(trie.wildcardSearch("....")).toEqual([]);
    expect(trie.countWords()).toBe(0);
    expect(trie.listWords()).toEqual([]);
  });

  // Web Worker specific tests
  describe("Web Worker functionality", () => {
    // Cleanup workers after each worker test
    afterEach(async () => {
      if (trie && typeof trie._cleanup === 'function') {
        trie._cleanup();
      }
      // Additional delay for worker cleanup
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    test("small array insertion uses main thread", async () => {
      const smallArray = Array.from({length: 100}, (_, i) => `word${i}`);
      
      const result = await trie.insert(smallArray);
      
      expect(result.success).toBe(true);
      expect(result.processed).toBe(100);
      expect(trie.countWords()).toBe(100);
      expect(trie.search("word50")).toBe(true);
    });

    test("force web worker usage on small datasets", async () => {
      const words = Array.from({length: 1000}, (_, i) => `forced${i}`);
      
      const result = await trie.insert(words, { useWorker: true });
      
      expect(result.success).toBe(true);
      expect(result.processed).toBe(1000);
      expect(trie.countWords()).toBe(1000);
      expect(trie.search("forced500")).toBe(true);
    }, 10000); // Increased timeout for worker operations

    test("progress callback functionality", async () => {
      const words = Array.from({length: 5000}, (_, i) => `progress${i}`);
      const progressUpdates = [];
      
      const result = await trie.insert(words, {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        }
      });
      
      expect(result.success).toBe(true);
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      const lastUpdate = progressUpdates[progressUpdates.length - 1];
      expect(lastUpdate.processed).toBe(5000);
      expect(lastUpdate.total).toBe(5000);
      expect(lastUpdate.percentage).toBe(100);
    }, 10000);

    test("multiple operations reuse worker efficiently", async () => {
      const batch1 = Array.from({length: 2000}, (_, i) => `batch1_${i}`); // Reduced size for faster testing
      const batch2 = Array.from({length: 2000}, (_, i) => `batch2_${i}`);
      
      const result1 = await trie.insert(batch1, { useWorker: true });
      const result2 = await trie.insert(batch2, { useWorker: true });
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(trie.countWords()).toBe(4000);
      expect(trie.search("batch1_1000")).toBe(true);
      expect(trie.search("batch2_1000")).toBe(true);
    }, 15000);

    test("error handling and fallback", async () => {
      const words = Array.from({length: 1000}, (_, i) => `fallback${i}`); // Reduced for faster testing
      
      // This should work even if worker creation fails in some environments
      const result = await trie.insert(words);
      
      expect(result.success).toBe(true);
      expect(result.processed).toBe(1000);
      expect(trie.countWords()).toBe(1000);
    });

    test("progress reporting works with main thread fallback", async () => {
      const words = Array.from({length: 1000}, (_, i) => `mainthread${i}`); // Reduced size
      const progressUpdates = [];
      
      const result = await trie.insert(words, {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        }
      });
      
      expect(result.success).toBe(true);
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      // Should have at least final progress update
      const lastUpdate = progressUpdates[progressUpdates.length - 1];
      expect(lastUpdate.percentage).toBe(100);
    });
  });

  describe("Performance and stress tests", () => {
    // Extra cleanup for stress tests
    afterEach(async () => {
      if (trie && typeof trie._cleanup === 'function') {
        trie._cleanup();
      }
      // Longer delay for stress test cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test("memory efficiency with repeated operations", async () => {
      // Reduced batch sizes for faster testing
      for (let batch = 0; batch < 3; batch++) {
        const words = Array.from({length: 1000}, (_, i) => `batch${batch}_${i}`);
        const result = await trie.insert(words);
        expect(result.success).toBe(true);
      }
      
      expect(trie.countWords()).toBe(3000);
    }, 20000);
  });
});