import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorkshopRateLimiter, isWorkshopCodeAccepted } from "./access";
import { listWorkshopChunks } from "./chunks";
import { buildWorkshopSystemPrompt } from "./prompt";
import { retrieveChunks } from "./retrieve";

const FORBIDDEN = [
  "ASSESSMENT-SOLUTION",
  "1a_basic_chat",
  "2a_structured",
  "3a_langgraph",
  "3e_custom",
  "4a_retriever",
  "4e_researcher",
  "0a_table",
  "def run_research",
  "class Plan",
];

function topId(query: string): string {
  return retrieveChunks(query)[0]?.id ?? "";
}

test("alias routing returns the expected notebook first", () => {
  assert.equal(topId("How do StateGraph, Command, and interrupt work?"), "3_langgraph");
  assert.equal(topId("strawberry, Pydantic, and structured output"), "2_structuring");
  assert.equal(topId("long context summarize dataset"), "1e_dataset_chat");
  assert.equal(topId("What is CrewAI?"), "1t_crewai");
  assert.equal(topId("tools and DuckDuckGo"), "2t_tools");
  assert.equal(topId("persona routing"), "3t_custom_persona");
  assert.equal(topId("embeddings, rerank, and FAISS"), "4_retriever");
  assert.equal(topId("assessment grader trace"), "4t_assessment");
  assert.equal(topId("red service, llm_client, and Jaeger"), "environment");
});

test("retrieveChunks returns 2 to 4 chunks", () => {
  for (const query of ["", "hello", "StateGraph", "strawberry and StateGraph and DuckDuckGo and assessment"]) {
    const chunks = retrieveChunks(query);
    assert.ok(chunks.length >= 2 && chunks.length <= 4, `${query} -> ${chunks.length}`);
    assert.equal(new Set(chunks.map((chunk) => chunk.id)).size, chunks.length);
  }
});

test("knowledge base omits assessment solution code and old filenames", () => {
  const blob = listWorkshopChunks()
    .map((chunk) => `${chunk.id}\n${chunk.title}\n${chunk.body}`)
    .join("\n");
  for (const phrase of FORBIDDEN) {
    assert.equal(blob.includes(phrase), false, phrase);
  }
  assert.match(blob, /0_table_of_contents/);
  assert.match(blob, /4t_assessment/);
  assert.match(blob, /\{question, trace, answer\}|question, trace, and answer/);
});

test("system prompt always includes the schedule and retrieved notes", () => {
  const chunks = retrieveChunks("interrupt");
  const prompt = buildWorkshopSystemPrompt(chunks);
  assert.match(prompt, /08:00/);
  assert.match(prompt, /4t_assessment/);
  assert.match(prompt, /Dr\. Majid Memari/);
  assert.match(prompt, /ASSESSMENT-SOLUTION\.py/);
  assert.match(prompt, /Retrieved notes/);
  assert.ok(chunks[0] && prompt.includes(chunks[0].title));
});

test("workshop code is optional locally and exact when set", () => {
  assert.equal(isWorkshopCodeAccepted(undefined, null), true);
  assert.equal(isWorkshopCodeAccepted("", "anything"), true);
  assert.equal(isWorkshopCodeAccepted("room-42", "room-42"), true);
  assert.equal(isWorkshopCodeAccepted("room-42", "room-42 "), false);
  assert.equal(isWorkshopCodeAccepted("room-42", null), false);
});

test("rate limiter allows 20 messages per 10 minutes per ip", () => {
  const limiter = createWorkshopRateLimiter();
  const start = 1_000_000;
  for (let i = 0; i < 20; i += 1) {
    assert.equal(limiter.allow("10.0.0.8", start + i), true);
  }
  assert.equal(limiter.allow("10.0.0.8", start + 20), false);
  assert.equal(limiter.allow("10.0.0.9", start + 20), true);
  assert.equal(limiter.allow("10.0.0.8", start + 10 * 60 * 1000), true);
});
