export const ACCESS_PORTAL_CATEGORIES = [
  {
    id: "communication",
    label: "Communication",
  },
  {
    id: "project-management",
    label: "Project Management",
  },
  {
    id: "design",
    label: "Design",
  },
  {
    id: "analytics",
    label: "Analytics",
  },
  {
    id: "security",
    label: "Security",
  },
];

export const ACCESS_PORTAL_SYSTEMS = [
  // Communication
  {
    id: "slack",
    name: "Slack",
    description: "A chat and messaging app for teams.",
    categoryId: "communication",
    emoji: "💬",
    owner: "John Doe",
  },
  {
    id: "microsoft-teams",
    name: "Microsoft Teams",
    description: "Collaboration and communication platform by Microsoft.",
    categoryId: "communication",
    emoji: "🗨️",
    owner: "Jane Smith",
  },
  // Project Management
  {
    id: "asana",
    name: "Asana",
    description: "Project management tool for tracking work.",
    categoryId: "project-management",
    emoji: "📋",
    owner: "Alex Johnson",
  },
  {
    id: "jira",
    name: "Jira",
    description: "Issue and project tracking for software teams.",
    categoryId: "project-management",
    emoji: "🛠️",
    owner: "Priya Patel",
  },
  {
    id: "trello",
    name: "Trello",
    description: "Visual collaboration tool for planning projects.",
    categoryId: "project-management",
    emoji: "🗂️",
    owner: "Liam Nguyen",
  },
  {
    id: "monday",
    name: "Monday.com",
    description: "Work operating system for project management.",
    categoryId: "project-management",
    emoji: "📅",
    owner: "Olivia Martinez",
  },
  // Design
  {
    id: "figma",
    name: "Figma",
    description: "Collaborative interface design tool.",
    categoryId: "design",
    emoji: "🎨",
    owner: "Sam Kim",
  },
  {
    id: "adobe-creative-cloud",
    name: "Adobe Creative Cloud",
    description: "Suite of design and creative tools.",
    categoryId: "design",
    emoji: "🖌️",
    owner: "Emily Clark",
  },
  // Analytics
  {
    id: "tableau",
    name: "Tableau",
    description: "Data visualization and analytics platform.",
    categoryId: "analytics",
    emoji: "📊",
    owner: "Ella Turner",
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Web analytics service by Google.",
    categoryId: "analytics",
    emoji: "📈",
    owner: "Mason Rivera",
  },
  // Security
  {
    id: "okta",
    name: "Okta",
    description: "Identity and access management platform.",
    categoryId: "security",
    emoji: "🔒",
    owner: "Carter Reed",
  },
  {
    id: "duo",
    name: "Duo Security",
    description: "Multi-factor authentication and security platform.",
    categoryId: "security",
    emoji: "🛡️",
    owner: "Layla Foster",
  },
  {
    id: "datadog",
    name: "Datadog",
    description: "Cloud monitoring and security platform.",
    categoryId: "security",
    emoji: "🐶",
    owner: "Sophia Adams",
  },
  {
    id: "sentry",
    name: "Sentry",
    description: "Application monitoring and error tracking.",
    categoryId: "security",
    emoji: "🚨",
    owner: "Ethan Hall",
  },
];

export const ACCESS_PORTAL_ACTIVE_REQUESTS = [
  {
    systemId: "slack",
    status: "pending",
    priority: "low",
    submittedAt: "2021-01-01",
  },
  {
    systemId: "slack",
    status: "in-review",
    priority: "normal",
    submittedAt: "2021-01-01",
  },
  {
    systemId: "slack",
    status: "approved",
    priority: "high",
    submittedAt: "2021-01-01",
  },
  {
    systemId: "slack",
    status: "rejected",
    priority: "urgent",
    submittedAt: "2021-01-01",
  },
];
