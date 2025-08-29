import { Trie } from "../src/index.js";

describe("Trie", () => {
  test("insert and search words", () => {
    const trie = new Trie();
    trie.insert("apple");
    trie.insert("app");

    expect(trie.search("apple")).toBe(true);
    expect(trie.search("app")).toBe(true);
    expect(trie.search("appl")).toBe(false);
    expect(trie.search("banana")).toBe(false);
  });

  test("delete words", () => {
    const trie = new Trie();
    trie.insert("apple");
    trie.insert("app");
    trie.insert("application");
    
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

  test("startsWith prefix", () => {
    const trie = new Trie();
    trie.insert("apple");
    trie.insert("app");
    
    expect(trie.startsWith("app")).toBe(true);
    expect(trie.startsWith("ap")).toBe(true);
    expect(trie.startsWith("appl")).toBe(true);
    expect(trie.startsWith("banana")).toBe(false);
  });

  test("autocomplete suggestions", () => {
    const trie = new Trie();
    ["apple", "app", "application", "apartment", "banana"].forEach(w => trie.insert(w));
    
    const suggestions = trie.autocomplete("ap");
    expect(suggestions).toContain("apple");
    expect(suggestions).toContain("app");
    expect(suggestions).toContain("application");
    expect(suggestions).toContain("apartment");
    expect(suggestions).not.toContain("banana");
    
    expect(trie.autocomplete("z")).toEqual([]);
  });

  test("fuzzy search", () => {
    const trie = new Trie();
    ["apple", "app", "application", "banana", "bath"].forEach(w => trie.insert(w));
    
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

  test("wildcard search", () => {
    const trie = new Trie();
    ["apple", "app", "application", "banana", "bat"].forEach(w => trie.insert(w));
    
    expect(trie.wildcardSearch("app.e")).toContain("apple");
    expect(trie.wildcardSearch(".pple")).toContain("apple");
    expect(trie.wildcardSearch("app..")).toEqual(["apple"]);
    expect(trie.wildcardSearch("ba.")).toContain("bat");
    expect(trie.wildcardSearch("...")).toContain("app");
    expect(trie.wildcardSearch("...")).toContain("bat");
  });

  test("count words", () => {
    const trie = new Trie();
    expect(trie.countWords()).toBe(0);
    
    trie.insert("apple");
    expect(trie.countWords()).toBe(1);
    
    trie.insert("app");
    trie.insert("banana");
    expect(trie.countWords()).toBe(3);
    
    trie.delete("app");
    expect(trie.countWords()).toBe(2);
  });

  test("list all words", () => {
    const trie = new Trie();
    ["apple", "app", "banana", "bat"].forEach(w => trie.insert(w));
    
    const words = trie.listWords();
    expect(words).toHaveLength(4);
    expect(words).toContain("apple");
    expect(words).toContain("app");
    expect(words).toContain("banana");
    expect(words).toContain("bat");
  });

  test("suggest words by prefix", () => {
    const trie = new Trie();
    ["apple", "app", "banana", "bat"].forEach(w => trie.insert(w));

    expect(trie.autocomplete("ap")).toEqual(expect.arrayContaining(["app", "apple"]));
    expect(trie.autocomplete("ba")).toEqual(expect.arrayContaining(["banana", "bat"]));
    expect(trie.autocomplete("z")).toEqual([]);
  });
  
  test("insert and search with non-alpha characters", () => {
    const trie = new Trie();
    trie.insert("hello123");
    trie.insert("hello-world");
    trie.insert("$pecial");
    trie.insert("email@example.com");
  
    expect(trie.search("hello123")).toBe(true);
    expect(trie.search("hello-world")).toBe(true);
    expect(trie.search("$pecial")).toBe(true);
    expect(trie.search("email@example.com")).toBe(true);
    
    expect(trie.search("hello")).toBe(false);
    expect(trie.search("hello-")).toBe(false);
    expect(trie.search("pecial")).toBe(false);
  });
  
  test("suggest words with non-alpha prefixes", () => {
    const trie = new Trie();
    ["hello123", "hello-world", "$pecial", "$$money", "$dollar", "email@example.com"].forEach(w => trie.insert(w));
  
    expect(trie.autocomplete("hello")).toEqual(expect.arrayContaining(["hello123", "hello-world"]));
    expect(trie.autocomplete("$")).toEqual(expect.arrayContaining(["$pecial", "$$money", "$dollar"]));
    expect(trie.autocomplete("email@")).toEqual(["email@example.com"]);
    expect(trie.autocomplete("123")).toEqual([]);
  });
  
  test("empty trie operations", () => {
    const trie = new Trie();
    
    expect(trie.search("anything")).toBe(false);
    expect(trie.startsWith("anything")).toBe(false);
    expect(trie.autocomplete("anything")).toEqual([]);
    expect(trie.fuzzySearch("anything")).toEqual([]);
    expect(trie.wildcardSearch("....")).toEqual([]);
    expect(trie.countWords()).toBe(0);
    expect(trie.listWords()).toEqual([]);
  });
});