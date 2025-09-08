# Trie-Search-Plus

A powerful, lightweight Trie-based search and autocomplete library for JavaScript applications.

## Features

- **Exact Word Search**: Fast lookup for complete words
- **Prefix Matching**: Find words that start with a specific prefix
- **Autocomplete**: Get suggestions based on a partial input
- **Fuzzy Search**: Find words with spelling errors (using Levenshtein distance)
- **Wildcard Search**: Use "." as a wildcard character to match any letter
- **Word Deletion**: Remove words from the trie
- **Word Counting**: Count the total number of words in the trie
- **Word Listing**: Get all words stored in the trie

## Installation

```bash
npm install trie-search-plus
```

## Usage

### Basic Usage

```javascript
import { Trie } from 'trie-search-plus';

// Create a new Trie
const trie = new Trie();

// Insert words
await trie.insert('apple');
await trie.insert('application');
await trie.insert('banana');

// Search for words
console.log(trie.search('apple')); // true
console.log(trie.search('app')); // false

// Check if a prefix exists
console.log(trie.startsWith('app')); // true

// Get autocomplete suggestions
console.log(trie.autocomplete('app')); // ['apple', 'application']
```

### Advanced Features

#### Fuzzy Search

Search for words allowing for spelling errors (using Levenshtein distance):

```javascript
// Find words with at most 1 edit distance
console.log(trie.fuzzySearch('aple', 1)); // ['apple']

// Find words with at most 2 edit distances
console.log(trie.fuzzySearch('aplication', 2)); // ['application']
```

#### Wildcard Search

Use "." as a wildcard character to match any letter:

```javascript
console.log(trie.wildcardSearch('app.e')); // ['apple']
console.log(trie.wildcardSearch('.pple')); // ['apple']
```

#### Word Management

```javascript
// Delete a word
trie.delete('apple');
console.log(trie.search('apple')); // false

// Count total words
console.log(trie.countWords());

// List all words
console.log(trie.listWords());
```

## API Reference

### `Trie`

#### `constructor()`

Creates a new Trie instance.

#### `insert(word)`

Inserts a word into the trie.

#### `search(word)`

Searches for an exact word match. Returns `true` if the word exists, `false` otherwise.

#### `delete(word)`

Removes a word from the trie.

#### `startsWith(prefix)`

Checks if any word in the trie starts with the given prefix. Returns `true` if a prefix match is found, `false` otherwise.

#### `autocomplete(prefix)`

Returns an array of words that start with the given prefix.

#### `fuzzySearch(word, maxDistance = 1)`

Returns an array of words that match with at most `maxDistance` edit operations (Levenshtein distance).

#### `wildcardSearch(pattern)`

Returns an array of words that match the given pattern, where "." represents any single character.

#### `countWords()`

Returns the total number of words in the trie.

#### `listWords()`

Returns an array of all words in the trie.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Author

Bharath Kumar