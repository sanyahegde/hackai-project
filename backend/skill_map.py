"""
Domain-specific skill maps for TF-IDF scoring.
Each persona has a domain; the scorer uses the matching map.
Keywords are intentionally broad so AI-detected concept names from video
frames (e.g. "Input Layer", "Connection Weights") match reliably.
"""

SKILL_MAPS = {
    "dsa": {
        "Arrays": "array index slice subarray prefix sum two pointers sliding window element",
        "Strings": "string substring palindrome pattern matching anagram character concatenation",
        "Hash Tables": "hash table hash map hash set dictionary key value lookup collision",
        "Stacks": "stack push pop lifo call stack parentheses balanced depth",
        "Queues": "queue enqueue dequeue fifo bfs level order circular queue priority",
        "Linked Lists": "linked list singly doubly node pointer head tail next prev",
        "Sorting": "sort quicksort mergesort heapsort bubble sort insertion sort comparison",
        "Binary Search": "binary search bisect sorted array log n lower bound upper bound",
        "Trees": "tree binary tree bst traversal inorder preorder postorder node leaf trie root",
        "Graphs": "graph bfs dfs traversal node edge adjacency shortest path dijkstra topological",
        "Heaps": "heap min heap max heap priority queue scheduling k largest heapify",
        "Backtracking": "backtracking recursion permutation combination subset explore prune",
        "Dynamic Programming": "dynamic programming dp memoization recurrence tabulation fibonacci subproblem optimal",
    },
    "ml": {
        "Supervised Learning": "supervised learning classification regression labeled data training prediction target",
        "Linear Models": "linear regression logistic regression loss function gradient descent cost function slope",
        "Neural Networks": "neural network layer input layer output layer hidden layer neuron node weight weights bias connection activation function perceptron forward pass backpropagation sigmoid relu softmax weighted sum",
        "Deep Learning": "deep learning cnn convolutional recurrent rnn lstm transformer encoder decoder attention convolution pooling kernel filter feature map",
        "Data Preprocessing": "data preprocessing normalization feature scaling cleaning missing values encoding categorical standardization",
        "Model Evaluation": "accuracy precision recall f1 score cross validation overfitting underfitting confusion matrix roc auc",
        "Unsupervised Learning": "unsupervised clustering k means pca dimensionality reduction autoencoder anomaly detection",
        "Reinforcement Learning": "reinforcement learning reward agent policy q learning exploration exploitation environment state action",
        "NumPy & Pandas": "numpy array pandas dataframe series index vectorization matrix tensor reshape",
        "Training Pipeline": "training data validation test split batch epoch learning rate optimizer sgd adam",
    },
    "ai_strategy": {
        "ML Fundamentals": "machine learning supervised unsupervised training data model accuracy prediction algorithm",
        "LLMs": "large language model llm gpt token prompt completion transformer generation text",
        "Prompt Engineering": "prompt engineering few shot zero shot chain of thought system prompt template instruction",
        "Fine-tuning": "fine tuning transfer learning domain adaptation lora qlora training custom model",
        "RAG": "retrieval augmented generation rag vector database embedding search context knowledge base",
        "AI Ethics": "ai ethics bias fairness transparency accountability responsible ai safety alignment",
        "AI Deployment": "deployment inference api serving latency scaling production model serving endpoint",
        "AI Use Cases": "use case automation recommendation personalization classification generation summarization",
        "AI Product Strategy": "product strategy roadmap prioritization roi metrics adoption stakeholder requirements",
        "Transformer Architecture": "transformer attention mechanism self attention encoder decoder positional encoding multi head layer",
    },
    "cloud": {
        "AWS Basics": "aws amazon ec2 s3 iam region availability zone cloud console",
        "Virtual Machines": "virtual machine vm instance compute server ssh linux operating system",
        "Storage": "storage s3 bucket blob object storage file system volume persistent",
        "Docker": "docker container image dockerfile build run port volume registry hub compose workflow",
        "Kubernetes": "kubernetes k8s pod deployment service cluster orchestration scaling replica",
        "CI/CD": "ci cd pipeline continuous integration delivery deployment automation github actions workflow trigger",
        "Serverless": "serverless lambda function event driven api gateway invocation",
        "Infrastructure as Code": "infrastructure code terraform cloudformation ansible provisioning template",
        "Networking": "networking vpc subnet security group load balancer dns route firewall",
        "Data Pipelines": "data pipeline etl airflow spark streaming batch processing ingestion transformation",
    },
}

SKILL_MAP = SKILL_MAPS["dsa"]


def get_skill_map(domain: str = "dsa") -> dict:
    """Return the skill map for a given domain. Falls back to DSA."""
    return SKILL_MAPS.get(domain, SKILL_MAPS["dsa"])
