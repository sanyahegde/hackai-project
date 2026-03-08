"""
Predefined DSA skill map: skill name -> keyword string for TF-IDF.
Used to compare user concept-click history against each skill document.
"""

# Skill name -> space-separated keywords (concept terms that belong to this skill)
SKILL_MAP = {
    "Arrays": "array index slice subarray prefix sum two pointers sliding window",
    "Strings": "string substring palindrome pattern matching anagram character",
    "Hash Tables": "hash table hash map hash set dictionary key value lookup",
    "Sorting": "sort quicksort mergesort heapsort bubble sort insertion sort",
    "Binary Search": "binary search bisect sorted array log n lower bound upper bound",
    "Trees": "tree binary tree bst traversal inorder preorder postorder node leaf",
    "Graphs": "graph bfs dfs traversal node edge adjacency shortest path dijkstra",
    "Heaps": "heap min heap max heap priority queue scheduling k largest",
    "Backtracking": "backtracking recursion permutation combination subset explore",
    "Dynamic Programming": "dynamic programming dp memoization recurrence tabulation",
}


def get_skill_documents():
    """Return list of (skill_name, keyword_text) for TF-IDF corpus."""
    return [(name, text) for name, text in SKILL_MAP.items()]
