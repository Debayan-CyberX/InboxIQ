export type DemoTone = "professional" | "warm" | "concise";
export const scenarios = [
  {
    id: "inquiry",
    label: "A new project",
    name: "Maya Patel",
    company: "Northline",
    email: "maya@example.com",
    initials: "MP",
    time: "10:24 AM",
    subject: "A new product, a bigger launch",
    message:
      "We're launching a new product next quarter and looking for a design partner. I liked what you did with the last project. Could we find a time to talk through scope and timelines?",
    signal: "Project inquiry",
    context: "A specific project. A clear timeline. An invitation to talk.",
    intent: "Design partner",
    timeline: "Next quarter",
    next: "Review the reply to Maya",
    nextDetail: "Confirm a time to discuss scope and the launch timeline.",
    replies: {
      professional:
        "Hi Maya,\n\nThanks for reaching out. I'd be happy to discuss the product launch and learn more about the scope and timeline. Would Tuesday at 10 work for a short call?\n\nBest,\nJordan",
      warm: "Hi Maya,\n\nLovely to hear from you, and thank you for the kind words! The launch sounds exciting. I'd love to hear what you have in mind. How does Tuesday at 10 look for a quick chat?\n\nJordan",
      concise:
        "Hi Maya,\n\nI'd love to discuss the launch. Are you free Tuesday at 10 to talk scope and timing?\n\nJordan",
    },
  },
  {
    id: "followup",
    label: "A quiet conversation",
    name: "Oliver Chen",
    company: "Aperture",
    email: "oliver@example.com",
    initials: "OC",
    time: "Yesterday",
    subject: "Picking up our conversation",
    message:
      "Thanks for sending the proposal. I'll share it with the team this week and get back to you once we've had a chance to review. Appreciate your patience.",
    signal: "Follow-up opportunity",
    context:
      "The proposal is with the team. A considerate check-in keeps the conversation open.",
    intent: "Proposal review",
    timeline: "After their review",
    next: "Check in with Oliver",
    nextDetail: "Ask whether the team has questions about the proposal.",
    replies: {
      professional:
        "Hi Oliver,\n\nI wanted to check whether your team has had a chance to review the proposal. Happy to answer any questions or walk through the details together.\n\nBest,\nJordan",
      warm: "Hi Oliver,\n\nHope your week is going well! Just checking in on the proposal. If anything would help your team's review, I'm happy to talk it through.\n\nJordan",
      concise:
        "Hi Oliver,\n\nAny questions on the proposal? Happy to help with the team's review.\n\nJordan",
    },
  },
  {
    id: "reply",
    label: "A thoughtful reply",
    name: "Elena Ruiz",
    company: "Oak Studio",
    email: "elena@example.com",
    initials: "ER",
    time: "Mon, 3:42 PM",
    subject: "A few thoughts before our call",
    message:
      "Ahead of our call, could you share how you approach the first two weeks of a project? We're particularly interested in discovery, collaboration, and what you'd need from our team.",
    signal: "A question worth answering",
    context:
      "Elena needs a clear process and a practical next step before your call.",
    intent: "Process questions",
    timeline: "Before the call",
    next: "Share your approach with Elena",
    nextDetail: "Explain discovery and what you need from her team.",
    replies: {
      professional:
        "Hi Elena,\n\nThe first two weeks focus on discovery: understanding your goals, reviewing the current experience, and agreeing on priorities together. It would help to have your team's key contacts, existing research, and any constraints ahead of our call.\n\nBest,\nJordan",
      warm: "Hi Elena,\n\nGreat questions! We'd start by getting to know your team and goals, looking at what exists today, and choosing the priorities together. Any research or background you can share would be a lovely head start. Let's talk through the details on our call.\n\nJordan",
      concise:
        "Hi Elena,\n\nWe start with discovery, review the current experience, then agree on priorities. Please share existing research, team contacts, and key constraints before our call.\n\nJordan",
    },
  },
] as const;
export type SampleConversation = (typeof scenarios)[number];
