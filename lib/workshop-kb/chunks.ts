/**
 * Distilled instructor notes for the C-FX-25 workshop TA.
 * Committed with the site so production never reads the NVIDIA-LLM repo.
 * Assessment notes are grader shape and hints only.
 */

export type WorkshopAlias = {
  term: string;
  weight: number;
};

export type WorkshopChunk = {
  id: string;
  title: string;
  body: string;
  aliases: readonly WorkshopAlias[];
};

export const WORKSHOP_NOTEBOOK_IDS = [
  "0_table_of_contents",
  "1_basic_chat",
  "1e_dataset_chat",
  "1t_crewai",
  "2_structuring",
  "2e_metadata_gen",
  "2t_tools",
  "3_langgraph",
  "3t_custom_persona",
  "4_retriever",
  "4t_assessment",
] as const;

export const WORKSHOP_CHUNKS: readonly WorkshopChunk[] = [
  {
    id: "overview",
    title: "Course overview and shared helpers",
    aliases: [
      { term: "schema_hint", weight: 12 },
      { term: "course_utils", weight: 14 },
      { term: "c-fx-25", weight: 16 },
      { term: "dli", weight: 8 },
      { term: "what is an agent", weight: 10 },
      { term: "schedule", weight: 6 },
      { term: "nemotron", weight: 8 },
    ],
    body: `Course: Building Agentic AI Applications with LLMs, NVIDIA DLI C-FX-25.
https://learn.nvidia.com/courses/course-detail?course_id=course-v1:DLI+C-FX-25+V1

One-day, 8-hour lab on NVIDIA VMs. Frameworks: LangChain, LangGraph, and CrewAI. The deployed chat model is intentionally small, usually nvidia/llama-3.1-nemotron-nano-8b-v1, with meta/llama-3.1-8b-instruct as the fallback. Weakness is the point: students engineer prompts, schemas, and control flow instead of hoping a larger model will cope.

Notebooks, in teaching order (not numeric order): 0_table_of_contents, 1_basic_chat, 1t_crewai, 1e_dataset_chat, 2_structuring, 2e_metadata_gen, 2t_tools, 3_langgraph, 3t_custom_persona, 4_retriever, 4t_assessment.

Section map:
- Section 1, simple agents: 1_basic_chat, 1e_dataset_chat, 1t_crewai. An agent perceives and acts; the LLM adds semantic behavior. Canonical chain is ChatPromptTemplate piped to the LLM piped to StrOutputParser. State is a dict, often {"messages": [...], "context": "..."}. The pipeline itself is stateless; the caller front-loads state.
- Section 2, structured output: 2_structuring, 2e_metadata_gen, 2t_tools. LLMs pattern-match. Constrain them with Pydantic and llm.with_structured_output. Tools are the same idea pointed at a function.
- Section 3, LangGraph: 3_langgraph, 3t_custom_persona. Use LangGraph when you need cycles, checkpoints, interrupts, and explicit routing. CrewAI is the opinionated persona shortcut. Plain LangChain runnables are enough for a straight pipeline.
- Section 4: 4_retriever (embeddings vs rerank) and 4t_assessment (plan, search, filter/rerank, answer with citations).

Central loop, repeated in every notebook: global state, convert to a local view, LLM, convert back to a global action, write state.

Shared helpers in Workshop/course_utils.py:
- chat_with_chain(state, chain): interactive streaming loop. Empty input breaks.
- batch_process(fn, inputs, max_concurrency=20): RunnableLambda.batch with a progress bar.
- SCHEMA_HINT: instructions plus a {schema_hint} slot so JSON matches a Pydantic schema. Braces in the boilerplate are doubled so LangChain does not treat them as variables. get_schema_hint(schema) builds format instructions with PydanticOutputParser.
- stream_from_app: LangGraph stream over values, messages, updates, and debug. On __interrupt__, it resumes with Command(resume=...). It also POSTs snapshots to http://lg_viz:3002/api/update and clears via /api/clear.
- serialize_for_js: JSON for the viz UI (sets become lists).

FAQ:
- Default client base URL is http://llm_client:9000/v1.
- Prefer with_structured_output over hand-parsing JSON when the NIM supports guided decoding. Fewer broken objects.
- Client-side tools: the model emits arguments, your code runs the function and sends the result back. Server-side tools: bind_tools lets the server select the tool. This course's default pattern is client-side.
- Rerank after search because a bi-encoder is fast and approximate; a cross-encoder scores the query against each passage.

The 8-hour clock is always in the system prompt. Cite only the notebook filenames listed above.`,
  },
  {
    id: "environment",
    title: "NVIDIA VM environment and service URLs",
    aliases: [
      { term: "red service", weight: 20 },
      { term: "llm_client", weight: 18 },
      { term: "jaeger", weight: 18 },
      { term: "docker_router", weight: 14 },
      { term: "ddg-cache", weight: 16 },
      { term: "ddg cache", weight: 16 },
      { term: "lg_viz", weight: 14 },
      { term: "langgraph viz", weight: 12 },
      { term: "dozzle", weight: 12 },
      { term: "dbgate", weight: 12 },
      { term: "not accessible", weight: 14 },
      { term: "services green", weight: 12 },
      { term: "base_url", weight: 10 },
      { term: "chatnvidia", weight: 8 },
    ],
    body: `From notebook code, call Docker DNS names, not localhost.

Health checks in 0_table_of_contents (GET, timeout 5s). 200 means running; anything else, or an exception, is not accessible:
- LLM Client: http://llm_client:9000/v1/models
- Docker Router: http://docker_router:8070/health
- Jaeger: http://jaeger:16686
- DDG Cache: http://ddg-cache:7860
- LangGraph Viz: http://lg_viz:3002

APIs used later:
- Chat, embeddings, and rerank: http://llm_client:9000/v1
- Assessment POST: http://docker_router:8070/run_assessment
- OpenTelemetry traces from 2t_tools: OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317
- Viz updates: http://lg_viz:3002/api/update and http://lg_viz:3002/api/clear

The services dashboard (services.html inside 0_table_of_contents) opens ports on the VM host. Those browser URLs are host:port, not the Docker names above.
- JupyterLab: port 80, path /lab
- LLM Client docs: port 9000, path /docs
- Jaeger UI: port 16686, path /search
- Dozzle logs: port 9999
- DBGate (Postgres and SQLite): port 3000
- DDG Cache: port 7860
- LangGraph Viz: port 3002
- Course chatbot beta: port 8990
- Docker Router docs: port 8070, path /docs

A red or "Not accessible" service: from the notebook directory's composer stack, restart with \`cd Workshop/composer && docker compose restart\` (some images still expose the \`docker-compose\` command). Then re-run the checklist. Confirm the LLM with requests.get("http://llm_client:9000/v1/models").

Default chat client in the labs:

\`\`\`python
from langchain_nvidia import ChatNVIDIA

llm = ChatNVIDIA(
    model="nvidia/llama-3.1-nemotron-nano-8b-v1",
    base_url="http://llm_client:9000/v1",
)
\`\`\`

The table-of-contents smoke test uses meta/llama-3.1-8b-instruct on the same base URL. Embeddings and NVIDIARerank use that same base URL. Do not invent other hosts.`,
  },
  {
    id: "troubleshooting",
    title: "Cross-notebook troubleshooting",
    aliases: [
      { term: "context too long", weight: 10 },
      { term: "context length", weight: 8 },
      { term: "rate limit", weight: 10 },
      { term: "malformed", weight: 8 },
      { term: "garbage json", weight: 10 },
      { term: "docker compose", weight: 12 },
      { term: "keyboardinterrupt", weight: 8 },
    ],
    body: `Map the symptom to a notebook, then apply the smallest fix.

- Service down or red in 0_table_of_contents: restart the composer stack (see the environment notes) and recheck /v1/models, docker_router:8070/health, Jaeger, the DDG cache, and LangGraph Viz.
- Context too long in 1e_dataset_chat: measure with token_len (tokenizer.json). The lab model is often 8192 tokens. Summarize blurbs before chatting. Do not skip the measurement.
- Structured output garbage in 2_structuring or the assessment planner: add SCHEMA_HINT, fewer fields, and try strict=True knowing it can reject edge cases (newlines inside strings, empty lists). If the NIM rejects guided decoding, keep the schema in the prompt and parse JSON. Do not invent a different response format.
- planning_chain still empty in 4t_assessment: it has to be built. Hint shape is in the assessment notes. Do not paste a full solution.
- Empty search or DuckDuckGo rate limits in 2t_tools or 4t_assessment: cache repeated queries and insert a short sleep between calls. In 2t_tools, await init_database() once, then quick_search.
- Reranker errors: model id plus base_url http://llm_client:9000/v1. Warm-up model is nvidia/llama-3.2-nv-rerankqa-1b-v2. Alternate if that id is missing: nvidia/nv-rerankqa-mistral-4b-v3.
- Assessment does not pass: exactly 8 items; trace is a list of plan steps; answers cite retrieved text; model_specs is present. Details are in the 4t_assessment notes.
- "Where is generate_thoughts?": it is defined in 4t_assessment and yields planner steps. The trace is that list.
- LangGraph interrupt looks stuck: interrupt pauses the graph. Continue with Command(resume=user_text). MemorySaver plus a thread_id is required. A new uuid thread_id starts a clean checkpoint.
- CrewAI versus LangChain clients: 1t_crewai uses crewai.LLM and llm.call. Other notebooks use ChatNVIDIA and invoke or stream.
- System messages ignored in 1_basic_chat: the model was trained mostly on user/assistant turns. "System" is an API channel. Spell out the format ("You..." sentences, no preamble) or a small model treats it as a vague instruction.

If these notes do not name the API the student asked about, say that the workshop notes do not cover it.`,
  },
  {
    id: "0_table_of_contents",
    title: "0_table_of_contents: environment check",
    aliases: [
      { term: "table of contents", weight: 14 },
      { term: "service health", weight: 12 },
      { term: "quick start", weight: 8 },
    ],
    body: `Notebook 0_table_of_contents. First 15 minutes. Goal: Jupyter imports and service health, not a coding exercise. There is no graded TODO.

Sections on the page: simple agents, structuring thoughts and outputs, LangGraph, then assessment. Open the filenames from the schedule if the on-page list does not match those files.

The checklist cell GETs LLM /v1/models, docker router /health, Jaeger, DDG cache, and LangGraph Viz. The next cell constructs ChatNVIDIA(model="meta/llama-3.1-8b-instruct", base_url="http://llm_client:9000/v1"), invoke("Say hello in one sentence!"), then streams a short follow-up.

A red row or "Not accessible" is an environment problem. Restart Workshop/composer and use the environment notes for URLs. Jaeger is for traces, Dozzle for container logs, DBGate for cached databases, LangGraph Viz for later graph runs.

After this notebook, start 1_basic_chat.`,
  },
  {
    id: "1_basic_chat",
    title: "1_basic_chat: agents, LCEL, and system messages",
    aliases: [
      { term: "system message", weight: 14 },
      { term: "sys_msg", weight: 12 },
      { term: "sys_prompt", weight: 10 },
      { term: "lcel", weight: 12 },
      { term: "stroutputparser", weight: 10 },
      { term: "basic chat", weight: 12 },
      { term: "multi-persona", weight: 8 },
      { term: "witness", weight: 12 },
      { term: "rock paper scissors", weight: 10 },
    ],
    body: `Notebook 1_basic_chat. Lecture, about 08:15-09:15. First real chatbot and a multi-persona state demo.

Parts:
- Part 1, boiling agents down: greet / play / judge style state functions (rock-paper-scissors). An agent is an entity that perceives and acts. The LLM version perceives text and acts by writing text.
- Part 2, semantic reasoning: connect ChatNVIDIA. In this notebook the working client is nvidia/llama-3.1-nemotron-nano-8b-v1 at http://llm_client:9000/v1.
- Part 3, a minimal stateful LLM: meta-prompt a system message, then chat with it. This is the TODO.
- Part 4, multi-turn loop: chat_with_human / chat_with_agent. Empty user text breaks the loop. State is {"messages": [(role, text), ...]}.
- Part 5, local perception: several speakers. Central transcript versus per-agent inboxes with witnesses. get_messages, update_states, clean_message, interact_fn.
- Part 6, wrap-up.

LCEL shape used everywhere after this: prompt | llm | StrOutputParser().

TODO (Part 3, own system message). An earlier cell asks the model to write a system message from an agent spec. A tighter instruction demands sentences that start with "You", no "I", and no preamble. Paste that result into sys_msg and attach it as the system turn:

\`\`\`python
sys_prompt = ChatPromptTemplate.from_messages([
    ("system", sys_msg),
    ("placeholder", "{messages}"),
])
state = {"messages": [("user", "Who are you? What can you tell me?")]}
chat_chain = sys_prompt | llm | StrOutputParser()
\`\`\`

If the drafted system message is weak, tighten the generator ("output only the system message, no preamble") and run it again. Do not leave the raw spec-generation prompt in place of sys_msg.

Why a system message seems ignored: training data is mostly user/assistant. The system role is a channel the API adds. A small model may treat the words "system message" as "a message from the IT system" unless the text itself says who the assistant is.

Part 5: with no witnesses, speakers do not hear each other and the dialog drifts. A central list of (speaker, text) is easier to update; each agent then rewrites that list into user/ai turns from its own point of view. clean_message strips a leading [Name] or wrapping quotes the model echoes.`,
  },
  {
    id: "1e_dataset_chat",
    title: "1e_dataset_chat: long context and summarization",
    aliases: [
      { term: "long context", weight: 18 },
      { term: "summarize", weight: 16 },
      { term: "summarization", weight: 16 },
      { term: "dataset", weight: 14 },
      { term: "gtc", weight: 12 },
      { term: "token_len", weight: 14 },
      { term: "8192", weight: 12 },
      { term: "raw_context", weight: 12 },
      { term: "context window", weight: 12 },
    ],
    body: `Notebook 1e_dataset_chat. Lab, about 10:15-11:00. Chat over the GTC 2025 catalog (gtc-data-2025.csv) and compress it under the context limit.

Parts: (1) workshop-assistant chatbot, (2) pull in context, (3) summarize, (4) reflect.

The chat chain expects keys context and messages. stringify(entry) turns one catalog row into text. raw_context is the joined catalog and is far past a useful window. In this notebook, chat is partial(chat_with_chain, chain=chat_chain).

TODO 1 and 2, initialize state and run it. Expect failure or a bad answer. That failure is the lesson.

\`\`\`python
state = {"messages": [], "context": raw_context}
chat(state)
\`\`\`

TODO 3, summarizer. summary_msg should tell the model to keep a few sentences and start with "(Summary) ". Reuse the same chain; do not return the stub "(Summary) No summary".

\`\`\`python
def summarize(context_str, summary_msg=summary_msg):
    return chat_chain.invoke({
        "messages": [("user", summary_msg)],
        "context": context_str,
    })
\`\`\`

Then batch summarize the entries (batch_process or RunnableLambda.batch, max_concurrency around 20) and chat against the short blurbs.

Token count: PreTrainedTokenizerFast(tokenizer_file="tokenizer.json"). token_len encodes the string and returns the id count. Compare that to the model context, often 8192 in this course. Character length is not token length. Plot helpers in the notebook compare raw versus summarized lengths.

Common miss: skipping token_len and not seeing why the first chat crashed.`,
  },
  {
    id: "1t_crewai",
    title: "1t_crewai: CrewAI Agent, Task, and Crew",
    aliases: [
      { term: "crewai", weight: 20 },
      { term: "crew ai", weight: 18 },
      { term: "process.sequential", weight: 10 },
      { term: "backstory", weight: 8 },
    ],
    body: `Notebook 1t_crewai. Demo, about 09:30-10:15, before the dataset lab. Tangent, not the main stack. No critical blank TODOs. If the room is behind, keep this to about 5 minutes.

CrewAI pieces:
- Agent: role, goal, backstory. The notebook builds a teacher and a student in office hours.
- Task: description, expected_output, agent. async_execution=False keeps order stable. human_input is the optional human-in-the-loop flag; it is commented out in the demo.
- Crew: agents and tasks, process=Process.sequential. The demo repeats the teacher/student pair so the dialog lasts several turns. Process.hierarchical needs a manager LLM; this demo does not use it.

Client is CrewAI's LLM, not ChatNVIDIA:

\`\`\`python
from crewai import LLM

llm = LLM(
    model="meta/llama-3.1-8b-instruct",
    provider="openai",
    base_url="http://llm_client:9000/v1",
    temperature=0.7,
    api_key="PLACEHOLDER",
)
llm.call(messages=[{"role": "user", "content": "What is the capital of France?"}])
\`\`\`

.call, not .invoke. The placeholder API key satisfies the client; the workshop NIM is reached via base_url.

Inspect the hidden prompt with Prompts from crewai.utilities: Prompts(agent=...).task_execution(). The default scaffold is large. That is the teaching point: the framework injects a lot of prompt for you, and it is less flexible than LangGraph for custom state.

Kick off with Crew(...).kickoff(...). Compare: CrewAI is fast for persona casts; LangChain runnables are the flexible primitives; LangGraph is what the rest of the day builds toward.`,
  },
  {
    id: "2_structuring",
    title: "2_structuring: strawberry problem, Pydantic, structured output",
    aliases: [
      { term: "strawberry", weight: 20 },
      { term: "pydantic", weight: 16 },
      { term: "structured output", weight: 18 },
      { term: "with_structured_output", weight: 16 },
      { term: "agentthought", weight: 14 },
      { term: "canonical", weight: 10 },
      { term: "chain of thought", weight: 10 },
      { term: "chain-of-thought", weight: 10 },
      { term: "schema_hint", weight: 14 },
    ],
    body: `Notebook 2_structuring. Lecture, about 11:15-12:15. Intellectual core of the day.

Parts: limits of a turn-based chatbot; the strawberry edge case; three workarounds; canonical forms; invoking structured output.

Strawberry problem: "How many R's are in the word Strawberry?" The small model usually fails because it pattern-matches tokens; it does not count characters. Chain-of-thought still fails often at 8B. Forcing the model to emit code and running that code can work and is fragile.

Three responses to a weak model:
- Do not bother: narrow the system message and accept the limit.
- Think harder: chain-of-thought or a reasoning-style call. Mixed results here.
- Force computation: emit a program and execute it (the notebook shows a CrewAI coding agent for this). Each trick is a leaky expert system. They can be combined.

Canonical form: if one component's output matches the next component's input grammar, they can be wired together. Structured output is how you enforce that. Guided decoding drops illegal tokens. The server may also inject the schema into the prompt. Failure modes: prompt fighting the schema, newlines inside a string field, empty lists when the model is unsure, strict=True rejecting near-misses.

Part 4 schema is AgentThought (Pydantic): user_intent, reasons_for_rejecting, reasons_for_responding, should_you_respond as Literal["yes", "no"], and final_response. Field(description=...) is part of the JSON schema the model sees.

\`\`\`python
structured_llm = llm.with_structured_output(
    schema=AgentThought.model_json_schema(),
    strict=True,
)
\`\`\`

TODO: extend the test query. Uncomment the extra constraints and append the schema hint so students see adherence change.

\`\`\`python
query = (
    "Tell me a cool story about a cool white cat."
    " Don't use any newlines or fancy punctuations."
    " Respond with natural language."
    f" {schema_hint}"
)
\`\`\`

schema_hint comes from the Pydantic format instructions (braces escaped). Streaming yields partial dicts; keys appear as the model fills them. An empty list usually means the model defaulted, not that the field was dropped. Discuss str versus List[str] when a newline shows up, and client-side versus server-side schema injection.

The chat model in this notebook is often meta/llama-3.1-8b-instruct at temperature 0 on http://llm_client:9000/v1.`,
  },
  {
    id: "2e_metadata_gen",
    title: "2e_metadata_gen: metadata schemas and canvas refinement",
    aliases: [
      { term: "metadata", weight: 16 },
      { term: "metacreator", weight: 16 },
      { term: "meta creator", weight: 14 },
      { term: "canvas", weight: 16 },
      { term: "starting_notebook", weight: 16 },
      { term: "chunk_refinement", weight: 16 },
      { term: "delimiter", weight: 12 },
      { term: "autoregression", weight: 12 },
    ],
    body: `Notebook 2e_metadata_gen. Demo, about 13:00-13:15. If time is short, do Part 1 only and explain the canvas idea without coding Parts 2-3.

Long context for the exercise is simple_long_context.txt. Same ChatNVIDIA base URL as the other labs. Short structured extraction works on the 8B model. Asking it to write a whole notebook does not: output quality length is much worse than input quality length.

Part 1 schema MetaCreator: short_abstract (1-2 sentences), topics_covered (List[str], at least 4, start with "This workshop"), abstract_body, long_abstract, objectives (List[str]), outline (List[str]), on_completion, prerequisites (List[str]). Chain is with_structured_output on that schema.

TODO, improve autoregression. The second pass is already scaffolded. Keep the first structured answer as the assistant turn and add a user follow-up ("correct any mistakes and flesh out some vagueness"). context may be "" so the revision does not drag the full corpus back in. Point: iteration versus context growth. You are refining answer, not re-reading the world.

Part 3 canvas TODOs:
- STARTING_NOTEBOOK: paste a small multi-section markdown string. A few ### sections from another notebook are enough.
- delimiter: a marker that does not appear inside the body. "###" is fine when headings are consistent.
- chunk_refinement_state must supply context and section. context is an overview of the whole document; section is only the chunk being rewritten.

\`\`\`python
delimiter = "###"
WORKING_NOTEBOOK = STARTING_NOTEBOOK.split(delimiter)
chunk_refinement_state = {
    "context": "####".join(WORKING_NOTEBOOK),
    "section": chunk,
}
\`\`\`

The section prompt allows edits only inside that section. sub_chain is prompt | llm | StrOutputParser() (plain text, not the metadata schema). This is the same idea as a document canvas: local edits stay inside the model's output budget.`,
  },
  {
    id: "2t_tools",
    title: "2t_tools: tools, DuckDuckGo, and ReAct",
    aliases: [
      { term: "duckduckgo", weight: 18 },
      { term: "ddgs", weight: 14 },
      { term: "quick_search", weight: 16 },
      { term: "bind_tools", weight: 16 },
      { term: "@tool", weight: 14 },
      { term: "tools", weight: 12 },
      { term: "tool", weight: 8 },
      { term: "react", weight: 10 },
      { term: "init_database", weight: 14 },
      { term: "search_and_summarize", weight: 12 },
      { term: "tool calling", weight: 14 },
    ],
    body: `Notebook 2t_tools. Demo, about 13:15-13:30. Bridge from schemas to actions. Routing, tool choice, and retrieval are the same mechanism: structured output that selects a path.

Decorator is \`@tool\` from langchain.tools. The signature and docstring become input_schema. Client-side example: llm.with_structured_output(calculate.input_schema), optionally piped to dict and then the tool. Server-side: llm.bind_tools(toolbank). bind_tools is easier and gives up control of which tool is eligible. SCHEMA_HINT still helps the 8B model.

Tools defined in the notebook:
- calculate: arithmetic, client-side schema demo.
- search_internet: DuckDuckGo. Async. Arguments include user_question, context, and final_query (falls back to user_question).
- search_knowledge: stub. Returns that nothing was ingested so the model does not pretend it searched.
- execute_python: demo of exec with a tiny globals dict. Not a real sandbox. The notebook says to add review before using this pattern for anything serious.
- random_choice: NumPy sampling so the model does not invent coin flips.

TODO on search_internet. The naive DDGS loop is commented out (retry up to many times with time.sleep). Prefer the cache:

\`\`\`python
return await quick_search(final_query, max_results=5)
\`\`\`

Imports: sys.path.append("/dli/task/composer/microservices"), then cached_ddg_search, quick_search, search_and_summarize, and init_database from ddg_cache. \`await init_database()\` once per kernel. It opens the local SQLite cache behind the DDG cache service (http://ddg-cache:7860). The optional heavier path, search_and_summarize, already chains search plus compression. That trades latency for a shorter tool result.

If quick_search is unavailable, keep DDGS().text with a retry and time.sleep so rate limits do not look like empty results.

ReAct in this notebook: the classic loop is thought, action, observation. The modern demo uses langchain_classic.agents.create_react_agent with a tool list and stop sequences. Do not swap in a different agent helper unless the notebook imported it. A ReAct loop is still just an agent, tools, and a message buffer.

This notebook also sets OTEL_EXPORTER_OTLP_ENDPOINT to http://jaeger:4317 so tool calls can show up in Jaeger.`,
  },
  {
    id: "3_langgraph",
    title: "3_langgraph: StateGraph, Command, and interrupt",
    aliases: [
      { term: "stategraph", weight: 18 },
      { term: "command", weight: 14 },
      { term: "interrupt", weight: 16 },
      { term: "memorysaver", weight: 12 },
      { term: "add_messages", weight: 12 },
      { term: "get_nth_message", weight: 14 },
      { term: "stop", weight: 8 },
      { term: "n=-2", weight: 16 },
      { term: "route node", weight: 14 },
      { term: "human-in-the-loop", weight: 10 },
      { term: "human in the loop", weight: 10 },
      { term: "streaming modes", weight: 10 },
    ],
    body: `Notebook 3_langgraph. Lecture, about 13:30-14:30. Production control flow: checkpoints, interrupts, and routing that a while-loop does not give you.

Core pieces:
- State is a TypedDict. messages uses Annotated[list, add_messages] so a node return appends. interactions uses Annotated[int, operator.__add__] so {"interactions": 1} increments.
- Nodes are functions from state to a partial update, or to a Command.
- StateGraph plus START. Compile with MemorySaver and a configurable thread_id (uuid). A new thread_id is a fresh conversation.
- interrupt("[User]:") pauses. The stream chunk contains __interrupt__. Resume with Command(resume=user_text). Without a checkpointer, resume has nowhere to continue.
- Command(update={...}, goto="node") writes state and chooses the next node.
- Stream modes: values (full state), messages (LLM tokens), updates (deltas, including interrupts), debug (internal trace). course_utils.stream_from_app wraps this and mirrors it to LangGraph Viz.

Warm-up graph is two nodes: edged_input interrupts, response calls the LLM. Part 5 adds user, agent, and route. Edges: START to user, user to agent, agent to route. route has no static outgoing edge; that is the TODO.

TODO, route, Part 5. After agent runs, the last message is the assistant and the one before it is the user. get_nth_message(state, n=-1) is the latest .content; n=-2 is the user text. Check the user turn for "stop".

\`\`\`python
def route(state: State, config=None):
    if "stop" in get_nth_message(state, n=-2):
        return {"interactions": 1}  # no Command: route has no outgoing edge, so the graph ends
    return Command(update={"interactions": 1}, goto="user")
\`\`\`

If their index looks at the assistant text instead, "stop" may be missing or echoed. Adjust n, do not hard-code a different graph. Returning only the interactions update is the end condition in this scaffold. Looping back to the user is the Command.`,
  },
  {
    id: "3t_custom_persona",
    title: "3t_custom_persona: persona routing",
    aliases: [
      { term: "persona", weight: 16 },
      { term: "personas", weight: 16 },
      { term: "routing", weight: 16 },
      { term: "custom persona", weight: 16 },
      { term: "get_finite_schema", weight: 16 },
      { term: "agentresponse", weight: 12 },
      { term: "convert_to_local", weight: 12 },
      { term: "current_speaker", weight: 12 },
    ],
    body: `Notebook 3t_custom_persona. Lab, about 14:45-15:30. Hardest exercise before retrieval. Multi-persona conversation (teacher, students, parent) with the model picking the next speaker.

If the room is behind, walk a solution sketch instead of leaving everyone stuck. Do not dump an unrelated graph.

Schema AgentResponse: speaker, response, and route. get_finite_schema replaces the placeholder literals at call time. Typical constraint: speaker is the current role only; route is one of the other roles (or End, when that option is in the schema). Invalid enums happen when the role list passed to get_finite_schema does not match agent_dict.

Agent class:
- _convert_to_local: global messages become this speaker's view (others look like user, self looks like ai).
- _convert_to_global: model output becomes a dict with speaker, response, and route.
- _get_llm applies get_finite_schema when the schema has it, then with_structured_output.

Imperative demo TODO, before the graph. After each response, instantiate the persona named by route and keep going. Append the turn to messages.

\`\`\`python
next_agent = Agent(**agent_spec_dict.get(response.get("route"), {}))
\`\`\`

LangGraph TODO. One node, "agent", self-loops. speakers is a list; the active key is the last entry. State also carries agent_dict and messages (add_messages).

\`\`\`python
def agent(state: State):
    agent_dict = state.get("agent_dict")
    current_speaker = state.get("speakers")[-1]
    if current_speaker in agent_dict:
        current_agent = Agent(**agent_dict[current_speaker])
        response = current_agent(**state)[0]
        return Command(
            update={
                "messages": [("ai", str(response))],
                "speakers": [response.get("route")],
            },
            goto="agent",
        )
\`\`\`

Why goto="agent": the node stays the same and the speaker changes in state. That is one node for N personas. Forgetting to write the new message before routing is the usual bug; the next speaker then does not see the line. START connects to agent. MemorySaver is imported so a thread can pause, but this exercise's main path is the self-loop, not interrupt.`,
  },
  {
    id: "4_retriever",
    title: "4_retriever: embeddings, FAISS, and rerank",
    aliases: [
      { term: "embeddings", weight: 16 },
      { term: "embedding", weight: 14 },
      { term: "faiss", weight: 18 },
      { term: "rerank", weight: 18 },
      { term: "reranker", weight: 16 },
      { term: "nvidiarerank", weight: 16 },
      { term: "nvidiaembeddings", weight: 14 },
      { term: "retrieval_router", weight: 16 },
      { term: "retrieval_node", weight: 14 },
      { term: "think deeper", weight: 14 },
      { term: "deep_thought", weight: 12 },
    ],
    body: `Notebook 4_retriever. Guided warm-up, about 15:30-16:00. Skip this if the room must reach 4t_assessment, and point students at the pipeline shape there. This notebook is still the source for the retriever APIs.

Bi-encoder versus cross-encoder:
- NVIDIAEmbeddings embeds each passage once. FAISS holds the vectors. Query time is a similarity search. Model in the notebook: nvidia/llama-3.2-nv-embedqa-1b-v2, base_url http://llm_client:9000/v1, truncate="END". FAISS.from_documents(context_docs, embed_d).
- NVIDIARerank scores the query together with each passage. More accurate, too expensive for a huge corpus. Use it on a small candidate set. Model: nvidia/llama-3.2-nv-rerankqa-1b-v2, same base URL, top_n and max_batch_size=128. compress_documents(docs, query).

retrieval_node(state, out_key="context") reads the latest user text, retrieves, and returns {out_key: set(snippets)} so identical passages do not accumulate twice. The state merge for context is set union.

Part 3 TODO. user already returns Command(..., goto="retrieval_router"). retrieval_router must not leave context empty.

\`\`\`python
def retrieval_router(state: State):
    return Command(update=retrieval_node(state), goto="agent")

builder.add_node("retrieval_router", retrieval_router)
\`\`\`

Edges have to match the Command: user to retrieval_router to agent. add_node alone does nothing if goto names a node you never registered.

Part 4 replaces the stub that does Command(update={"context": ""}, goto="agent") with the same retrieval_node update. "Think deeper": a Queries schema with big_questions, semantic_queries, and web_search_queries (each a List[str]). The query node uses SCHEMA_HINT and with_structured_output. fulfill_queries runs DDGS().text for the web queries and the local retriever for the semantic queries. filter_retrieval reranks and drops snippets already in context. If the agent says it should search deeper, route to deep_thought_node, then back to agent. Do not jump straight back into deep search on every turn or the graph loops.

RAG prompt pattern in the notebook: system instruction to rely on context, a user turn that wraps {context} in tags, a short assistant acknowledgement, then the placeholder for messages.`,
  },
  {
    id: "4t_assessment",
    title: "4t_assessment: grader shape and hints",
    aliases: [
      { term: "assessment", weight: 18 },
      { term: "grader", weight: 16 },
      { term: "trace", weight: 14 },
      { term: "run_assessment", weight: 16 },
      { term: "submission", weight: 10 },
      { term: "planning_chain", weight: 12 },
      { term: "generate_thoughts", weight: 12 },
      { term: "research agent", weight: 10 },
    ],
    body: `Notebook 4t_assessment. Final lab, about 16:00-17:00. Hints and grader shape only. Do not paste a full working pipeline and do not quote a solution file.

What students build: a research agent. Order is plan, then search, then filter/rerank, then an answer that cites the retrieved snippets. The notebook parts are the planner, the retrieval functions, the research pipeline, accumulating traces, and the POST to the grader.

Grader contract:
- Exactly 8 items.
- Each item is an object with the keys question, trace, and answer.
- trace is a list of plan steps (strings). str(steps) fails this check. A placeholder one-liner used only because a call threw is not a real trace; fix the error and rerun.
- answer should address the question and cite sources from the retrieval, not unsupported background knowledge.
- POST JSON to http://docker_router:8070/run_assessment. Body keys are submission and model_specs. model_specs needs model and base_url. The notebook's submission cell sets model to nvidia/nemotron-3-nano-30b-a3b (the judge) and base_url to http://llm_client:9000/v1. Generation still uses the lab chat model, nvidia/llama-3.1-nemotron-nano-8b-v1, unless that cell falls back to meta/llama-3.1-8b-instruct.
- If the router is down, check http://docker_router:8070/health. After a pass, the course page's assess-task button issues the certificate.

Use the notebook's eight questions, with this wording:
1. Can you help me learn more about LangGraph? Specifically, can you tell me about Memory Management?
2. Can you help me learn more about LangGraph? Specifically, can you tell me about Pregel?
3. Can you help me learn more about LangGraph? Specifically, can you tell me about subgraphs?
4. Can you help me learn more about LangGraph? Specifically, can you tell me about full-duplex communication?
5. Can you help me learn more about LangGraph? Specifically, can you tell me about productionalization?
6. Can you help me learn more about LangGraph? Specifically, can you tell me about how the visualization works behind?
7. Can you help me learn more about LangGraph? Specifically, can you give me a simple example of parsing image into text?
8. Can you help me learn more about LangGraph? Specifically, can you predict the future possible features?

Do not invent a different set of eight. Keep the notebook's spelling, including "productionalization".

Hints, not a solution:
- Planner: a Plan schema whose steps field is a list of about 3 to 5 searchable strings. The later generator reads steps, so that field name matters. Put SCHEMA_HINT in the system prompt. When guided decoding works, pipe the planning prompt into llm.with_structured_output(Plan). Some NIM servers in this lab reject guided decoding; the notebook's approach is then prompt-guided JSON (schema text in the prompt, JSON only, then parse). generate_thoughts is already defined in the notebook and yields those steps. An unset planning chain will not grade.
- Search: DuckDuckGo through DDGS().text, one query per plan step. Cache repeated queries. functools.cache only stores hashable return values, so a cached search should return a tuple, not a list. A short sleep between calls avoids empty results from rate limits.
- Filter: same NVIDIARerank setup as 4_retriever (nvidia/llama-3.2-nv-rerankqa-1b-v2 at http://llm_client:9000/v1). Build documents from each hit's title and body. Keep the top k. If that model id is missing, try nvidia/nv-rerankqa-mistral-4b-v3. On reranker failure, keep a few unranked hits rather than crashing the whole question.
- Answer: system prompt must say to use only the retrieved context and to cite sources. Accumulate the filtered snippets into the message list, then ask the original question. Return the step list alongside the answer so trace stays a list.
- Submit all 8. A sleep between questions reduces rate limits. Do not ship an error string as the answer.

Say what is wrong with the student's shape (missing key, trace type, count, citations, URL). Do not replace their notebook with a complete program.`,
  },
];

export function listWorkshopChunks(): { id: string; title: string; body: string }[] {
  return WORKSHOP_CHUNKS.map(({ id, title, body }) => ({ id, title, body }));
}
