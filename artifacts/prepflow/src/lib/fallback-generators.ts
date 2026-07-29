/**
 * Deterministic Client-Side Fallback Generator Module
 * Guarantees 100% payload delivery on frontend even if backend API server is not deployed (404)
 * or network / rate limits fail completely.
 */

export function getFallbackOverview(topic: string): any {
  const t = topic.trim();
  return {
    title: t,
    description: `A comprehensive study breakdown and interactive workspace for ${t}. Covering core principles, practical usage, architectural patterns, and interview preparation.`,
    difficulty: "Intermediate",
    estimatedTime: "25-35 minutes",
    prerequisites: ["Basic Computer Science Principles", "Fundamental Programming Concepts"],
    keyTakeaways: [
      `Understand the core mechanics and structure of ${t}.`,
      `Learn how to apply ${t} to solve real-world system design and algorithm problems.`,
      `Identify trade-offs, edge cases, and performance considerations.`,
      `Prepare for technical interview questions and practical coding challenges.`
    ],
    sections: [
      {
        title: "1. Introduction & Foundational Concepts",
        content: `${t} forms an essential building block in modern software engineering. It provides standardized abstractions and patterns for managing state, processing data, and structuring applications efficiently.`
      },
      {
        title: "2. Key Benefits & Use Cases",
        content: `Primary applications of ${t} include optimizing performance, improving code maintainability, enabling high throughput, and building scalable systems.`
      },
      {
        title: "3. Trade-offs & Operational Considerations",
        content: `When leveraging ${t}, engineers must balance complexity against memory footprint, initial setup overhead, and operational maintenance.`
      }
    ]
  };
}

export function getFallbackFlashcards(topic: string): any[] {
  const t = topic.trim();
  return [
    {
      front: `What is the core definition of ${t}?`,
      back: `${t} is a fundamental concept in software engineering providing structured mechanisms for solving specific problem sets efficiently.`,
      difficulty: "easy",
      category: "Core Concepts",
    },
    {
      front: `What is the primary usage scenario for ${t}?`,
      back: `It is primarily used in software development, architectural design, and optimization to streamline operations and ensure system stability.`,
      difficulty: "easy",
      category: "Core Concepts",
    },
    {
      front: `What are the key advantages of using ${t}?`,
      back: `Key advantages include improved performance, scalability, maintainability, clean separation of concerns, and optimized resource utilization.`,
      difficulty: "medium",
      category: "Key Benefits",
    },
    {
      front: `What are common trade-offs associated with ${t}?`,
      back: `Potential trade-offs include initial setup complexity, memory footprint overhead, and the requirement for domain-specific expertise.`,
      difficulty: "medium",
      category: "Trade-offs",
    },
    {
      front: `How does ${t} ensure system reliability?`,
      back: `Through state validation, invariant checks, strict typing, and defensive programming patterns that prevent unexpected runtime states.`,
      difficulty: "hard",
      category: "Architecture & Safety",
    },
    {
      front: `What are standard best practices when implementing ${t}?`,
      back: `Follow modular composition, enforce immutable data patterns where applicable, maintain comprehensive test coverage, and document public APIs.`,
      difficulty: "medium",
      category: "Best Practices",
    },
    {
      front: `What is a critical edge case to consider in ${t}?`,
      back: `Boundary conditions such as null/empty inputs, concurrent access race conditions, and heavy load thresholds.`,
      difficulty: "hard",
      category: "Edge Cases",
    }
  ];
}

export function getFallbackQuiz(topic: string): any[] {
  const t = topic.trim();
  return [
    {
      question: `What is the primary objective when utilizing ${t} in software design?`,
      options: [
        `To structure systems for optimal performance and maintainability`,
        `To bypass data validation completely`,
        `To eliminate all server requests`,
        `To increase memory footprint unnecessarily`
      ],
      correctIndex: 0,
      explanation: `The main purpose of ${t} is to structure system components for efficiency, clean separation of concerns, and long-term maintainability.`
    },
    {
      question: `Which trade-off is commonly evaluated when adopting ${t}?`,
      options: [
        `Increased initial setup complexity vs long-term scalability`,
        `Absolute loss of type safety`,
        `Incompatibility with modern browsers`,
        `Forced single-threaded execution`
      ],
      correctIndex: 0,
      explanation: `Implementing ${t} often requires upfront design architectural effort, which pays off in scalability and system resilience.`
    },
    {
      question: `How should edge cases be handled when implementing ${t}?`,
      options: [
        `With input validation, boundary checks, and error boundaries`,
        `By swallowing exceptions silently`,
        `By removing error logging`,
        `By disabling all tests`
      ],
      correctIndex: 0,
      explanation: `Defensive programming, validation, and structured error handling protect against edge cases.`
    }
  ];
}

export function getFallbackInterviewQuestions(topic: string): any[] {
  const t = topic.trim();
  return [
    {
      question: `Can you explain how ${t} works under the hood and why you would choose it?`,
      answer: `${t} operates by providing structured abstractions for state management and data processing. I would choose it when the application requires clean modularity, high performance, and scalable maintenance.`,
      difficulty: "Medium",
      category: "Core Concepts",
    },
    {
      question: `What are the primary performance bottlenecks to watch for in ${t}?`,
      answer: `Bottlenecks typically occur due to unthrottled state updates, excessive memory allocation, or unoptimized data fetching. Mitigations include caching, single-concurrency queues, and lazy loading.`,
      difficulty: "Hard",
      category: "Performance & Scaling",
    },
    {
      question: `How would you test and debug issues related to ${t} in production?`,
      answer: `I would use structured logging, end-to-end integration tests, static type checking, and boundary error boundaries to trace failures back to their root cause.`,
      difficulty: "Medium",
      category: "Testing & Reliability",
    }
  ];
}

export function getFallbackCheatSheet(topic: string): any[] {
  const t = topic.trim();
  return [
    {
      title: "Core Syntax & Quick Reference",
      bullets: [
        `Initialize ${t} with clean, explicit configuration.`,
        `Ensure all inputs are validated before execution.`,
        `Use immutable state patterns where applicable.`
      ]
    },
    {
      title: "Best Practices",
      bullets: [
        `Keep component responsibility single and focused.`,
        `Implement graceful fallback handling for external network calls.`,
        `Monitor memory usage and clean up event listeners/subscribers.`
      ]
    },
    {
      title: "Common Pitfalls to Avoid",
      bullets: [
        `Avoid mutating state directly.`,
        `Do not ignore HTTP status codes or Content-Type response headers.`,
        `Prevent unhandled promise rejections by wrapping async operations.`
      ]
    }
  ];
}

export function getFallbackCodeExample(topic: string, approach: string = "optimalApproach"): any {
  const t = topic.trim();
  return {
    isProgramming: true,
    problemStatement: `Implement an efficient solution demonstrating ${t}.`,
    description: `A clean implementation of ${t} showcasing practical algorithms and language-specific best practices.`,
    [approach]: {
      language: "JavaScript",
      title: `${approach.replace(/([A-Z])/g, ' $1')} Solution for ${t}`,
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      explanation: `This implementation achieves O(N) time complexity by processing elements in a single linear pass with minimal extra space.`,
      code: `/**\n * ${t} Implementation (${approach})\n */\nfunction solve${t.replace(/\s+/g, '')}(inputData) {\n  if (!Array.isArray(inputData)) return [];\n  return inputData.filter(Boolean);\n}\n\n// Example execution\nconst result = solve${t.replace(/\s+/g, '')}([1, 2, 3, 4, 5]);\nconsole.log("Processed result:", result);`
    }
  };
}

export function getFallbackRelatedTopics(topic: string): string[] {
  const t = topic.trim();
  return [
    `${t} Advanced Patterns`,
    `${t} Performance Optimization`,
    `${t} System Architecture`,
    `${t} Testing & Debugging`,
    `${t} Production Best Practices`
  ];
}

export function getFallbackForModule(module: string, topic: string): any {
  switch (module) {
    case "overview":
      return getFallbackOverview(topic);
    case "flashcards":
      return { flashcards: getFallbackFlashcards(topic) };
    case "quiz":
      return { quiz: getFallbackQuiz(topic) };
    case "interview":
      return { interviewQuestions: getFallbackInterviewQuestions(topic) };
    case "cheatsheet":
      return { cheatSheet: getFallbackCheatSheet(topic) };
    case "code":
      return { codeExample: getFallbackCodeExample(topic) };
    case "related":
      return { relatedTopics: getFallbackRelatedTopics(topic) };
    default:
      return getFallbackOverview(topic);
  }
}
