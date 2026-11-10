export type DemoGuide = { preview: string; steps: readonly [string, string, string] };

/** Describes only the public, sample-based flow available to visitors. */
export const DEMO_GUIDES: Record<string, DemoGuide> = {
  datagovai: {
    preview: "Start with retention basics. Read the explanation, then check its official source.",
    steps: ["Keep the recommended fictional retention question selected and choose Start guided demo.", "Read the live AI explanation of what a retention schedule tells an agency.", "Use the reading tip to identify retention and disposition, then open the Utah Archives guidance to check it."],
  },
  "ai-classsims": {
    preview: "Try a fractions lesson. See fictional students respond to a sample teaching action.",
    steps: ["Start the recommended ‘Invite thinking about fractions’ example and inspect the fictional classroom context.", "Run the supplied teacher action to get simulated student responses.", "Compare Alex and Jordan’s responses with the separate teacher feedback, then try another example."],
  },
  carewise: {
    preview: "Try ‘What does autism mean?’ Read the general explanation and compare its public source.",
    steps: ["Start with the recommended ‘What does autism mean?’ sample question.", "Generate a general educational explanation from the curated public notes.", "Read the takeaway and compare the explanation with the linked WHO source."],
  },
  willow: {
    preview: "Explore a fictional presentation worry. Notice the balanced thought and small next step.",
    steps: ["Start the recommended fictional presentation-worry example and read Alex’s situation.", "Run the sample to see an AI response about a general reflection exercise.", "Look for a balanced thought and one manageable preparation step. Try another situation to compare."],
  },
  "ai-cpa": {
    preview: "Compare fictional books before and after a sample change. See what moves the surplus.",
    steps: ["Choose Start guided demo and inspect the invented business’s starting income and expenses.", "Apply the fixed sample change to the books.", "Compare the calculated surplus before and after the change, then optionally request an AI explanation of those sample figures."],
  },
  finhub: {
    preview: "Compare minimum payments with an extra $250. See the payoff and interest tradeoff.",
    steps: ["Choose Start guided demo and inspect the fictional debt and minimum-payment baseline.", "Apply the sample extra payment of $250 per month.", "Compare the calculated payoff time and interest with the baseline, then optionally request an AI explanation."],
  },
  "ai-ster": {
    preview: "Read a fictional lesson, choose three rubric ratings, and compare the written rationale.",
    steps: ["Start the guided demo and read the fictional small-group lesson observation.", "Continue to ratings and choose a rating for each of the three rubric areas.", "Compare your choices with the authored sample ratings and rationale. Revise a rating or try another lesson."],
  },
  "course-chatbot": {
    preview: "Start with tokenization. Read a live explanation and try a short understanding check.",
    steps: ["Keep ‘Tokens and text’ selected and choose Start guided demo.", "Read the live explanation and its example of turning text into tokens.", "Answer the short practice question, read the written feedback, and try another concept."],
  },
  "nvidia-workshop-ta": {
    preview: "Try the RAG question. See how retrieved context helps answer a fictional shop FAQ.",
    steps: ["Start the guided demo and choose the recommended question about retrieval-augmented generation (RAG).", "Inspect the fictional bicycle-shop FAQ context, then request the AI explanation.", "Read the takeaway, try the self-check, and follow the primary learning source to explore further."],
  },
};
