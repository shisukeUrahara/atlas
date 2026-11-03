# Label review

Fill `fixtures/eval/review.csv`: verdict `ok`, `fix` (put the right chunk ids, space-separated, in fixed_gold) or `drop`.
Then run `pnpm atlas apply-review`. Rules: docs/labeling_guide.md.

## q001 · exact_id · langchain · holdout

**What fields are defined in the CustomerComplaint model and what do they represent?**

- `72836986a57c03e4` Structured output › Tool calling strategy (seed)
  > ```python Union Types from pydantic import BaseModel, Field from typing import Literal, Union from langchain.agents import create_agent from langchain.agents.structured_output import ToolStrategy class ProductReview(BaseModel): """Analysis of a product review.""" rating: int | None = Field(descripti…

## q002 · exact_id · langchain · holdout

**How does the save_preference tool update user preferences in the store?**

- `65a460a461935495` Context engineering in agents › Tool context > Writes (seed)
  > ```python from dataclasses import dataclass from langchain.tools import tool, ToolRuntime from langchain.agents import create_agent from langgraph.store.memory import InMemoryStore @dataclass class Context: user_id: str @tool def save_preference( preference_key: str, preference_value: str, runtime: …

## q003 · exact_id · langchain · tuning

**What does the agent.png image illustrate in the Agents documentation section?**

- `e6dc215f3ce46cf9` Workflows and agents › Agents (seed)
  > Agents are typically implemented as an LLM performing actions using [tools](/oss/langchain/tools). They operate in continuous feedback loops, and are used in situations where problems and solutions are unpredictable. Agents have more autonomy than workflows, and can make decisions about the tools th…

## q004 · exact_id · langchain · holdout

**What does the snapshot_frequency parameter control in a DeltaChannel?**

- `74ae42dff35b64d5` LangGraph runtime › Channels > DeltaChannel > Use snapshot_frequency for bounded read latency (seed)
  > Without snapshots, reading a `DeltaChannel` value requires replaying the full write history—O(N) for a thread with N steps. Setting `snapshot_frequency=K` writes a full snapshot every K pregel steps, bounding read depth to at most K steps: ```python class State(TypedDict): messages: Annotated[ list[…

## q005 · exact_id · langchain · tuning

**How do you use TrackingState with a node-style hook to update agent state after a model call?**

- `4e25f988be773277` Custom middleware › State updates > Node-style hooks (seed)
  > Return a dict from a node-style hook to merge updates into agent state. The dict keys map to state fields. ```python from langchain.agents.middleware import after_model, AgentState from langgraph.runtime import Runtime from typing import Any from typing_extensions import NotRequired class TrackingSt…

## q006 · exact_id · langchain · tuning

**What are the different response_format options that use StructuredResponseT in LangChain?**

- `30e631c6db7e0e7f` Structured output › Response format (seed)
  > Use `response_format` to control how the agent returns structured data: - **`ToolStrategy[StructuredResponseT]`**: Uses tool calling for structured output - **`ProviderStrategy[StructuredResponseT]`**: Uses provider-native structured output - **`type[StructuredResponseT]`**: Schema type - automatica…
- `cab9f7a0b735b637` Structured output › 
  > Structured output allows agents to return data in a specific, predictable format. Instead of parsing natural language responses, you get structured data in the form of JSON objects, [Pydantic models](https://docs.pydantic.dev/latest/concepts/models/#basic-model-usage), or dataclasses that your appli…

## q007 · exact_id · langchain · holdout

**What does the llm_calls state variable track in LangGraph?**

- `a85a674e70774fb2` Quickstart › 2. Define state (seed)
  > The graph's state is used to store the messages and the number of LLM calls. State in LangGraph persists throughout the agent's execution. The `Annotated` type with `operator.add` ensures that new messages are appended to the existing list rather than replacing it. ```python from langchain.messages …
- `2ba33b30486d6cef` Quickstart › 3. Define model node
  > The model node is used to call the LLM and decide whether to call a tool or not. ```python from langchain.messages import SystemMessage def llm_call(state: dict): """LLM decides whether to call a tool or not""" return { "messages": [ model_with_tools.invoke( [ SystemMessage( content="You are a helpf…
- `a6647dce2451c761` Quickstart › 6. Build and compile the agent
  > ```python # Step 1: Define tools and model from langchain.tools import tool from langchain.chat_models import init_chat_model model = init_chat_model( "claude-sonnet-4-6", temperature=0 ) # Define tools @tool def multiply(a: int, b: int) -> int: """Multiply `a` and `b`. Args: a: First int b: Second …

## q008 · exact_id · langchain · tuning

**How does the store_based_model middleware select which model to use for a request?**

- `c0146f57f3505ee5` Context engineering in agents › Model context > Model (seed)
  > ```python from dataclasses import dataclass from langchain.agents import create_agent from langchain.agents.middleware import wrap_model_call, ModelRequest, ModelResponse from langchain.chat_models import init_chat_model from typing import Callable from langgraph.store.memory import InMemoryStore @d…

## q009 · exact_id · langchain · holdout

**What is the role of model_response in the agent function?**

- `55e810d1badc5d8d` Quickstart › 4. Define agent (seed)
  > The agent is built using the @[`@entrypoint`] function. In the Functional API, instead of defining nodes and edges explicitly, you write standard control flow logic (loops, conditionals) within a single function. ```python @entrypoint() def agent(messages: list[BaseMessage]): model_response = call_l…

## q010 · exact_id · langchain · holdout

**How do you use IndexConfig from langgraph.store.base to configure embeddings in PostgresStore?**

- `d20c589837496c22` Long-term memory › Memory storage (seed)
  > ```python from collections.abc import Sequence from langgraph.store.base import IndexConfig from langgraph.store.postgres import PostgresStore # type: ignore[import-not-found] def embed(texts: Sequence[str]) -> list[list[float]]: # Replace with an actual embedding function or LangChain embeddings ob…

## q011 · exact_id · langchain · holdout

**Where can I find the TypeScript quickstart guide for LangGraph?**

- `4f5a25963a510745` Quickstart › Step 1: Read the guide (seed)
  > Detect whether this project uses Python or TypeScript/JavaScript. Fetch and follow the matching page; treat it as the source of truth for package names, model strings, and code: - Python: https://docs.langchain.com/oss/python/langgraph/quickstart.md - TypeScript: https://docs.langchain.com/oss/javas…

## q012 · exact_id · langchain · holdout

**When should I use headless tools with IndexedDB?**

- `20ef8f9f9b98fdc7` Tools › Headless tools > When to use headless tools (seed)
  > Use them when the work depends on the **environment, device, or UI** that only exists on the client. For example: - **Browser APIs:** Geolocation, IndexedDB, Clipboard, Canvas 2D, file pickers, Battery API, etc. - **Privacy and locality:** Data stays on the device (for example, local “memory” in Ind…

## q013 · exact_id · langchain · tuning

**How do I update model profiles using data from models.dev in LangChain?**

- `2bdfe324eabde53c` Models › Advanced topics > Model profiles (seed)
  > 1. (If needed) update the source data at [models.dev](https://models.dev/) through a pull request to its [repository on GitHub](https://github.com/sst/models.dev). 2. (If needed) update additional fields and overrides in `langchain_<package>/data/profile_augmentations.toml` through a pull request to…
- `5a810564fba390a8` Models › Advanced topics > Model profiles
  > The `profile` is also a regular `dict` and can be updated in place. If the model instance is shared, consider using `model_copy` to avoid mutating shared state. ```python new_profile = model.profile | {"key": "value"} model.model_copy(update={"profile": new_profile}) ``` **Option 2 (fix data upstrea…
- `227ea3aa24957d1e` Models › Advanced topics > Model profiles
  > ```bash uv run --with langchain-model-profiles langchain-profiles refresh --provider anthropic --data-dir langchain_anthropic/data ``` Model profiles are a beta feature. The format of a profile is subject to change.…

## q014 · exact_id · langchain · holdout

**How do you create llm_with_tools by binding tools to an LLM?**

- `2c177ec19be6b854` Workflows and agents › Agents (seed)
  > ```python Using tools from langchain.tools import tool # Define tools @tool def multiply(a: int, b: int) -> int: """Multiply `a` and `b`. Args: a: First int b: Second int """ return a * b @tool def add(a: int, b: int) -> int: """Adds `a` and `b`. Args: a: First int b: Second int """ return a + b @to…
- `3401a39e2a8add7c` Workflows and agents › LLMs and augmentations
  > ```python # Schema for structured output from pydantic import BaseModel, Field class SearchQuery(BaseModel): search_query: str | None = Field( default=None, description="Query that is optimized web search." ) justification: str | None = Field( default=None, description="Why this query is relevant to…
- `256caba70bfb779b` Models › Tool calling
  > To make tools that you have defined available for use by a model, you must bind them using @[`bind_tools`][BaseChatModel.bind_tools]. In subsequent invocations, the model can choose to call any of the bound tools as needed. Some model providers offer <Tooltip tip="Tools that are executed server-side…
- `3250fcd45236c4b3` Quickstart › 4. Define agent
  > ```python # Step 1: Define tools and model from langchain.tools import tool from langchain.chat_models import init_chat_model model = init_chat_model( "claude-sonnet-4-6", temperature=0 ) # Define tools @tool def multiply(a: int, b: int) -> int: """Multiply `a` and `b`. Args: a: First int b: Second …

## q015 · exact_id · langchain · tuning

**What does the search_documentation function return after performing a search?**

- `4a7200322ac26860` Thinking in LangGraph › Step 4: Build your nodes > Implementing our email agent nodes (seed)
  > ```python def search_documentation(state: EmailAgentState) -> Command[Literal["draft_response"]]: """Search knowledge base for relevant information""" # Build search query from classification classification = state.get('classification', {}) query = f"{classification.get('intent', '')} {classificatio…

## q016 · exact_id · langchain · holdout

**How do you initialize embeddings using langchain.embeddings in this example?**

- `d0080f01c15995fb` Memory › Add long-term memory > Use in production (seed)
  > **Sync** ```python from langchain.chat_models import init_chat_model from langchain.embeddings import init_embeddings from langchain_core.runnables import RunnableConfig from langgraph.graph import StateGraph, MessagesState, START from langgraph.store.base import BaseStore from langgraph_oracledb.ch…
- `a7f34bfe05eb0eb8` Memory › Add long-term memory > Use semantic search
  > Enable semantic search in your graph's memory store to let graph agents search for items in the store by semantic similarity. ```python from langchain.embeddings import init_embeddings from langgraph.store.memory import InMemoryStore # Create store with semantic search enabled embeddings = init_embe…
- `371bb3ade7771bcb` Stores › Semantic search
  > Beyond simple retrieval, the store also supports semantic search, allowing you to find memories based on meaning rather than exact matches. To enable this, configure the store with an embedding model: ```python from langchain.embeddings import init_embeddings store = InMemoryStore( index={ "embed": …
- `d7fa19491eae5481` Memory › Add long-term memory > Use semantic search
  > ```python from langchain.embeddings import init_embeddings from langchain.chat_models import init_chat_model from langgraph.store.memory import InMemoryStore from langgraph.graph import START, MessagesState, StateGraph from langgraph.runtime import Runtime model = init_chat_model("gpt-5.4-mini") # C…

## q017 · exact_id · cookbook · holdout

**How do I specify the ask_database function to execute SQL queries in a chat model?**

- `a9d081181490b397` How to call functions with chat models › How to call functions with model generated arguments > Specifying a function to execute SQL queries (seed)
  > ```python tools = [ { "type": "function", "function": { "name": "ask_database", "description": "Use this function to answer user questions about music. Input should be a fully formed SQL query.", "parameters": { "type": "object", "properties": { "query": { "type": "string", "description": f""" SQL q…
- `ff9c7097e7b78e41` How to call functions with chat models › How to call functions with model generated arguments > Executing SQL queries
  > Now let's implement the function that will actually execute queries against the database. ```python def ask_database(conn, query): """Function to query SQLite database with a provided SQL query.""" try: results = str(conn.execute(query).fetchall()) except Exception as e: results = f"query failed wit…
- `c48e43afffa869dc` How to call functions with chat models › How to call functions with model generated arguments > Executing SQL queries
  > ```python # Step 2: determine if the response from the model includes a tool call. tool_calls = response_message.tool_calls if tool_calls: # If true the model will return the name of the tool / function to call and the argument(s) tool_call_id = tool_calls[0].id tool_function_name = tool_calls[0].fu…

## q018 · exact_id · cookbook · holdout

**What is the URL of the article about cross-encoders referenced in the passage from weaviate.io?**

- `c9109b1913d05a55` Search reranking with cross-encoders › Example > Walkthrough (seed)
  > To illustrate this approach we'll use ```text-davinci-003``` with ```logprobs``` enabled to build a GPT-powered cross-encoder. Our GPT models have strong general language understanding, which when tuned with some few-shot examples can provide a simple and effective cross-encoding option. This notebo…

## q019 · exact_id · cookbook · holdout

**What does the code do after calling requests.get(URL) if the response status code is 200?**

- `fb05dc719934f737` Function calling for nearby places: Leveraging the Google Places API and customer profiles › Setup (seed)
  >  response = requests.get(URL) if response.status_code == 200: results = json.loads(response.content)["results"] places = [] for place in results[:2]: # limit to top 2 results place_id = place.get("place_id") place_details = get_place_details(place_id, API_KEY) # Get the details of the place place_na…
- `1dab84c69039f1e5` Function calling for nearby places: Leveraging the Google Places API and customer profiles › Setup
  >  return places else: print(f"Google Places API request failed with status code {response.status_code}") print(f"Response content: {response.content}") # print out the response content for debugging return [] except Exception as e: print(f"Error during the Google Places API call: {e}") return [] ``` …

## q020 · exact_id · cookbook · holdout

**What is the purpose of the system_input_prompt variable in the code snippet?**

- `c7a9edb177359911` Function to set up display options for pandas › 1. Building out an eval set (seed)
  > ```python system_input_prompt = """" You are a helpful assistant that can generate fictional interactions between a support assistant and a customer user. You will be given a set of policy instructions that the support agent is instructed to follow. Based on the instructions, you must generate a rel…
- `422797d537c700f3` Function to set up display options for pandas › 1. Building out an eval set
  > ```python system_input_prompt = """ You are a helpful assistant that can generate policies for a support agent at a fictional company to follow. You will be provided with a topic (ie. returns, refunds, feedback) and you are to generate a sample policy for how to handle the it. When constructing the …

## q021 · exact_id · cookbook · holdout

**How does the query_graph function use embeddings to query the graph database?**

- `5a8dd6ebe5c9c969` Retrieval Augmented Generation with a Graph Database › Querying the database > Generating queries (seed)
  > ```python def query_graph(response): embeddingsParams = {} query = create_query(response) query_data = json.loads(response) for key, val in query_data.items(): embeddingsParams[f"{key}Embedding"] = create_embedding(val) result = graph.query(query, params=embeddingsParams) return result ``` ```python…
- `e7436b5784c97303` Retrieval Augmented Generation with a Graph Database › Querying the database > Generating queries
  > Now that we know what to look for, we can generate the corresponding Cypher queries to query our database. However, the entities extracted might not be an exact match with the data we have, so we will use the GDS cosine similarity function to return products that have relationships with entities sim…

## q022 · exact_id · cookbook · tuning

**What does the value function in reasoning_fig7 do to improve reliability?**

- `f091b3594a293966` Techniques to improve reliability › Extensions to chain-of-thought prompting > Faithful reasoning architecture > Method (seed)
  > Second, the authors add a value function, which is used to assess the quality of reasoning steps and search over multiple reasoning trajectories. This echoes a common theme for increasing reliability; instead of generating a single answer from the model, generate a set of answers and then use some t…
- `dd5f56ea2d7a695f` Techniques to improve reliability › Extensions to chain-of-thought prompting > Faithful reasoning architecture
  > A few months after publishing the selection-inference prompting technique, the authors extended the technique in a follow-up paper, with ideas for: - figuring out when the selection-inference cycle should stop or continue - adding a value function to help search over multiple reasoning paths - reduc…

## q023 · exact_id · cookbook · tuning

**What is the purpose of summarization_prompt in the text summarization example?**

- `b054670534b101c1` Introduction to Structured Outputs › Example 2: Text summarization (seed)
  > ```python summarization_prompt = ''' You will be provided with content from an article about an invention. Your goal will be to summarize the article following the schema provided. Here is a description of the parameters: - invented_year: year in which the invention discussed in the article was inve…

## q024 · exact_id · cookbook · holdout

**What blog post on openai.com discusses GPT-3 applications?**

- `1a4d46316ae9b6fe` How to work with large language models › Code Capabilities > More prompt advice (seed)
  > [Fine Tuning Docs]: https://platform.openai.com/docs/guides/fine-tuning [OpenAI Customer Stories]: https://openai.com/customer-stories [Large language models Blog Post]: https://openai.com/research/better-language-models [GitHub Copilot]: https://github.com/features/copilot/ [GPT-4 and GPT-4 Turbo]:…

## q025 · paraphrase · langchain · holdout

**How do I create a function to find and handle sensitive information in text with options like blocking, redacting, masking, or hashing?**

- `d3b62612eee3b803` Prebuilt middleware › Provider-agnostic middleware > PII detection > Custom PII types (seed)
  > **Custom detector function signature:** The detector function must accept a string (content) and return matches: Returns a list of `PIIMatch` objects: ```python from langchain.agents.middleware import PIIMatch def detector(content: str) -> list[PIIMatch]: return [ { "type": "custom_type", "value": "…
- `aade3146da7782bf` Prebuilt middleware › Provider-agnostic middleware > PII detection
  > Detect and handle Personally Identifiable Information (PII) in conversations using configurable strategies. PII detection is useful for the following: - Healthcare and financial applications with compliance requirements. - Customer service agents that need to sanitize logs. - Any application handlin…
- `3f172e447e6696ad` Guardrails › Built-in guardrails > PII detection
  > LangChain provides built-in middleware for detecting and handling Personally Identifiable Information (PII) in conversations. This middleware can detect common PII types like emails, credit cards, IP addresses, and more. PII detection middleware is helpful for cases such as health care and financial…
- `3e0e0a19027307cc` Guardrails › Built-in guardrails > PII detection
  > **Built-in PII types:** - `email` - Email addresses - `credit_card` - Credit card numbers (Luhn validated) - `ip` - IP addresses - `mac_address` - MAC addresses - `url` - URLs **Configuration options:** Parameter | Description | Default -----------|-------------|--------- `pii_type` | Type of PII to…

## q026 · paraphrase · langchain · tuning

**How can I build React UIs for real-time agent interactions using Langchain?**

- `d3eacaaaeaea49cd` Streaming › Related (seed)
  > - [Frontend streaming](/oss/langchain/frontend/overview)—Build React UIs with @[`useStream`] for real-time agent interactions - [Streaming with chat models](/oss/langchain/models#stream)—Stream tokens directly from a chat model without using an agent or graph - [Reasoning with chat models](/oss/lang…

## q027 · paraphrase · langchain · holdout

**How can I delay a node's operation until other tasks finish in a workflow with uneven path lengths?**

- `39d6a05949631397` Use the graph API › Create branches > Defer node execution (seed)
  > Deferring node execution is useful when you want to delay the execution of a node until all other pending tasks are completed. This is particularly relevant when branches have different lengths, which is common in workflows like map-reduce flows. The above example showed how to fan-out and fan-in wh…
- `10c31ecbbdf2dd31` Use the graph API › Create branches > Defer node execution
  > - **A list of start nodes** runs `d` once, after all of the listed nodes have completed. If one of them never runs (for example, a conditional edge does not select its branch), `d` never runs and no error is raised. State updates from branches that did complete remain in the graph state, but `d` doe…
- `7118b570d8cf09f6` Use the graph API › Create branches > Defer node execution
  > ```python from IPython.display import Image, display display(Image(graph.get_graph().draw_mermaid_png())) ``` ![Deferred execution graph](/oss/images/graph_api_image_4.png) ```python graph.invoke({"aggregate": []}) ``` ``` Adding "A" to [] Adding "B" to ['A'] Adding "C" to ['A'] Adding "B_2" to ['A'…
- `5bbffc897e8aeeaf` Use the graph API › Create branches > Defer node execution
  > ```python import operator from typing import Annotated, Any from typing_extensions import TypedDict from langgraph.graph import StateGraph, START, END class State(TypedDict): # The operator.add reducer fn makes this append-only aggregate: Annotated[list, operator.add] def a(state: State): print(f'Ad…

## q028 · paraphrase · langchain · tuning

**How can I trace and debug the steps of a conversational loop using LangSmith?**

- `706ce2c4483e5be0` Agents › Invocation (seed)
  > Trace each step of this loop, debug tool calls, and evaluate agent outputs with [LangSmith](https://smith.langchain.com). Follow the [tracing quickstart](/langsmith/trace-with-langchain) to get set up. We recommend you also set up [LangSmith Engine](/langsmith/engine) which monitors your traces, det…
- `72fcc0963d26d57b` Checkpointers › 
  > A checkpointer saves a snapshot of graph state at each super-step, organized into **threads**. Compile a graph with a checkpointer to enable human-in-the-loop workflows, time travel debugging, fault-tolerant execution, and conversational memory. ![Checkpoints](/oss/images/checkpoints.jpg) **Agent Se…
- `6cec938f3718af2c` LangGraph overview › 
  > Use [LangChain](/oss/langchain/agents) (`create_agent`) for a highly customizable agent framework with abstractions and integrations for models, tools, and agent loops. Use [LangGraph](/oss/langgraph/overview), the low-level orchestration framework, for advanced needs combining deterministic and age…
- `e064c7cf050f2828` Tools › 
  > Tools extend what [agents](/oss/langchain/agents) can do—letting them fetch real-time data, execute code, query external databases, and take actions in the world. Under the hood, tools are callable functions with well-defined inputs and outputs that get passed to a [chat model](/oss/langchain/models…
- `a312aa8cd27a217c` Graph API overview › Observability and Tracing
  > To trace, debug and evaluate your agents, use [LangSmith](/langsmith/observability).…
- `19d0ce552b56837a` Quickstart › Step 5: Optional LangSmith tracing
  > Ask the user if they want tracing. If yes, follow https://docs.langchain.com/langsmith/create-an-agent to register an agent in an agent-based workspace. Have them set `LANGSMITH_AGENT_ID`, `LANGSMITH_AGENT_ENVIRONMENT`, `LANGSMITH_TRACING=true`, and `LANGSMITH_API_KEY`, then re-run. Do not invent a …
- `794d2b15d9765d82` Build a semantic search engine with LangChain › Setup > Configure LangSmith
  > Many of the applications you build with LangChain will contain multiple steps with multiple invocations of LLM calls. As these applications get more and more complex, it becomes crucial to be able to inspect what exactly is going on inside your chain or agent. The best way to do this is with [LangSm…
- `0a2e8c2a43354146` Quickstart › Trace agent calls
  > To learn more about tracing your agent with LangSmith, see the [LangSmith documentation](/langsmith/trace-with-langchain). We recommend you also set up [LangSmith Engine](/langsmith/engine) which monitors your traces, detects issues, and proposes fixes.…
- `3c0e02ad00cdca0e` Thinking in LangGraph › Step 5: Wire it together > Try out your agent
  > **View example trace** Open a public LangSmith run for this example. The graph pauses when it hits `interrupt()`, saves everything to the checkpointer, and waits. It can resume days later, picking up exactly where it left off. The `thread_id` ensures all state for this conversation is preserved toge…
- `0150d05905694ad2` Quickstart › Trace agent calls
  > In an [agent-based workspace](/langsmith/agent-registry), [create an agent](/langsmith/create-an-agent) once before sending traces. Use [agent addressing](/langsmith/log-traces-to-agent) to select its identifier and environment. If an integration requires `project_name`, use the selected environment…

## q029 · paraphrase · langchain · holdout

**How can I maintain and share state information across different stages of an agent's execution?**

- `0582f266c7b7b5a9` Custom middleware › Custom state schema (seed)
  > If your middleware needs to track state across hooks, middleware can extend the agent's state with custom properties. This enables middleware to: - **Track state across execution**: Maintain counters, flags, or other values that persist throughout the agent's execution lifecycle - **Share data betwe…
- `76d2f57ef5eeec07` Agents › Core components > Agent state
  > ```python Baseten from langchain.agents import AgentState, create_agent class MyState(AgentState): user_id: str call_count: int agent = create_agent( model="baseten:zai-org/GLM-5.2", tools=[], state_schema=MyState, ) ``` ```python Ollama from langchain.agents import AgentState, create_agent class My…
- `b28f7272a5c7b9f8` Agents › Core components > Agent state
  > Every agent manages its execution context through @[`AgentState`], a typed dictionary that holds the current conversation history and any custom fields your tools and middleware need. The built-in field is: | Field | Type | Description | |-------|------|-------------| | `messages` | `list[BaseMessag…
- `20f6c64647b378aa` Short-term memory › Access memory > Tools > Write short-term memory from tools
  > To modify the agent's short-term memory (state) during execution, you can return state updates directly from the tools. This is useful for persisting intermediate results or making information accessible to subsequent tools or prompts.…
- `3834d1aa7d1fd2f4` Agents › Core components > Agent state
  > ```python OpenAI from langchain.agents import AgentState, create_agent class MyState(AgentState): user_id: str call_count: int agent = create_agent( model="openai:gpt-5.5", tools=[], state_schema=MyState, ) ``` ```python Anthropic from langchain.agents import AgentState, create_agent class MyState(A…

## q030 · paraphrase · langchain · tuning

**How do chat models handle context when messages accumulate over time?**

- `0a86ae0dbd2af8f7` Short-term memory › Overview (seed)
  > Chat models accept context using [messages](/oss/langchain/messages), which include instructions (a system message) and inputs (human messages). In chat applications, messages alternate between human inputs and model responses, resulting in a list of messages that grows longer over time. Because con…
- `1f80437e7201f99d` Messages › Use with chat models
  > [Chat models](/oss/langchain/models) accept a sequence of message objects as input and return an @[`AIMessage`] as output. Interactions are often stateless, so that a simple conversational loop involves invoking a model with a growing list of messages. Refer to the below guides to learn more: - Buil…
- `f08bb052882e910d` Memory › Manage short-term memory
  > With [short-term memory](#add-short-term-memory) enabled, a checkpointer persists graph state across turns within the same thread. The node that calls the model controls which data from state to include in the model input. Persisting state does not automatically send all of it to the model. Passing …

## q031 · paraphrase · langchain · holdout

**Why do AI systems often fail to perform tasks correctly?**

- `b00ff5ce72de27a9` Context engineering in agents › Overview > Why do agents fail? (seed)
  > When agents fail, it's usually because the LLM call inside the agent took the wrong action / didn't do what we expected. LLMs fail for one of two reasons: 1. The underlying LLM is not capable enough 2. The "right" context was not passed to the LLM More often than not - it's actually the second reaso…
- `e9eee22fe026b713` Context engineering in agents › Overview
  > The hard part of building agents (or any LLM application) is making them reliable enough. While they may work for a prototype, they often fail in real-world use cases.…

## q032 · paraphrase · langchain · tuning

**How does LangChain handle different provider-specific formats for intermediate output during model responses?**

- `cec0cb43b10d2000` Streaming › Common patterns > Streaming thinking / reasoning tokens (seed)
  > This works the same way regardless of the model provider—LangChain normalizes provider-specific formats (Anthropic `thinking` blocks, OpenAI `reasoning` summaries, etc.) into a standard `"reasoning"` content block type via the [`content_blocks`](/oss/langchain/messages#standard-content-blocks) prope…
- `29a667cd463386e2` Messages › Message content > Content block reference
  > Content blocks are represented (either when creating a message or accessing the `content_blocks` property) as a list of typed dictionaries. Each item in the list must adhere to one of the following block types: **Core** **TextContentBlock** **Purpose:** Standard text output Always `"text"` The text …
- `3fd6b5265c04bcb9` Philosophy › 
  > **We want to enable developers to build with the best models.** Different providers expose different APIs, with different model parameters and different message formats. Standardizing these model inputs and outputs is a core focus, making it easy for developer to easily change to the most recent sta…

## q033 · paraphrase · langchain · holdout

**What are the main components used to define agent workflows in LangGraph?**

- `c7e37b9b9404d4c2` Graph API overview › Graphs (seed)
  > At its core, LangGraph models agent workflows as graphs. You define the behavior of your agents using three key components: 1. [`State`](#state): A shared data structure that represents the current snapshot of your application. It can be any data type, but is typically defined using a shared state s…
- `abd7d4411de04181` Thinking in LangGraph › 
  > When you build an agent with LangGraph, you will first break it apart into discrete steps called **nodes**. Then, you will describe the different decisions and transitions from each of your nodes. Finally, you connect nodes together through a shared **state** that each node can read from and write t…

## q034 · paraphrase · langchain · tuning

**How can I customize the settings for a chat model's input size and capabilities?**

- `439aefd3eec1d879` Models › Advanced topics > Model profiles (seed)
  > 1. [Summarization middleware](/oss/langchain/middleware/built-in#summarization) can trigger summarization based on a model's context window size. 2. [Structured output](/oss/langchain/structured-output) strategies in `create_agent` can be inferred automatically (e.g., by checking support for native …
- `6b89708136fa116c` Models › Advanced topics > Model profiles
  > Model profiles require `langchain>=1.1`. LangChain chat models can expose a dictionary of supported features and capabilities through a `profile` attribute: ```python model.profile # { # "max_input_tokens": 400000, # "image_inputs": True, # "reasoning_output": True, # "tool_calling": True, # ... # }…
- `6fbb200b3a0eb60c` Models › Advanced topics > Configurable models
  > You can also create a runtime-configurable model by specifying @[`configurable_fields`][BaseChatModel.configurable_fields]. If you don't specify a model value, then `'model'` and `'model_provider'` will be configurable by default. ```python from langchain.chat_models import init_chat_model configura…
- `7e4c5a61bc01b1a9` Quickstart › Build a real-world agent
  > ```python OpenAI from langchain.chat_models import init_chat_model model = init_chat_model( "openai:gpt-5.5", temperature=0.5, timeout=300, max_tokens=25000, ) ``` ```python Google Gemini from langchain.chat_models import init_chat_model model = init_chat_model( "gemini-3.1-pro-preview", model_provi…
- `9b1fca5c751b68e2` Models › Advanced topics > Configurable models
  > ```python first_model.invoke( "what's your name", config={ "configurable": { "first_model": "claude-sonnet-4-6", "first_temperature": 0.5, "first_max_tokens": 100, } }, ) ``` See the @[`init_chat_model`] reference for more details on `configurable_fields` and `config_prefix`. **Using a configurable …

## q035 · paraphrase · langchain · tuning

**How does defining connections and node routing logic affect control flow in a graph-based system?**

- `d23e3a6cef23c553` Thinking in LangGraph › Summary and next steps > Key Insights (seed)
  > **Graph structure emerges naturally** You define the essential connections, and your nodes handle their own routing logic. This keeps control flow explicit and traceable - you can always understand what your agent will do next by looking at the current node.…
- `1410db1de5108997` Graph API overview › Edges
  > Edges define how the logic is routed and how the graph decides to stop. This is a big part of how your agents work and how different nodes communicate with each other. There are a few key types of edges: - Normal Edges: Go directly from one node to the next. - Conditional Edges: Call a function to d…
- `fa13366661bbb0b7` Use the graph API › Combine control flow and state updates with `Command`
  > It can be useful to combine control flow (edges) and state updates (nodes). For example, you might want to BOTH perform state updates AND decide which node to go to next in the SAME node. LangGraph provides a way to do so by returning a @[Command] object from node functions: ```python def my_node(st…
- `0d4a0660f7ece0d5` Graph API overview › `Command` > Return from nodes > `update` and `goto`
  > Return @[`Command`] from node functions to update state and route to the next node in a single step: ```python def my_node(state: State) -> Command[Literal["my_other_node"]]: return Command( # state update update={"foo": "bar"}, # control flow goto="my_other_node" ) ``` With @[`Command`] you can als…
- `6dcaab2268a26c6e` Use the graph API › Combine control flow and state updates with `Command`
  > ```python import random from typing_extensions import TypedDict, Literal from langgraph.graph import StateGraph, START from langgraph.types import Command # Define graph state class State(TypedDict): foo: str # Define the nodes def node_a(state: State) -> Command[Literal["node_b", "node_c"]]: print(…
- `1fad04189e142ff7` Use the graph API › Combine control flow and state updates with `Command`
  > ```python builder = StateGraph(State) builder.add_edge(START, "node_a") builder.add_node(node_a) builder.add_node(node_b) builder.add_node(node_c) # NOTE: there are no edges between nodes A, B and C! graph = builder.compile() ``` You might have noticed that we used @[`Command`] as a return type anno…
- `558852f68c2d13ad` Thinking in LangGraph › Step 5: Wire it together
  > The graph structure is minimal because routing happens inside nodes through @[`Command`] objects. Each node declares where it can go using type hints like `Command[Literal["node1", "node2"]]`, making the flow explicit and traceable.…
- `80ab145df4d0facc` Graph API overview › Edges > Conditional edges
  > If you want to **optionally** route to one or more edges (or optionally terminate), you can use the @[`add_conditional_edges`] method. This method accepts the name of a node and a "routing function" to call after that node is executed: ```python graph.add_conditional_edges("node_a", routing_function…

## q036 · paraphrase · langchain · holdout

**How do you ensure all necessary data is copied when duplicating a sequence with incremental snapshots?**

- `06471d8845ae750e` Checkpointers › Build a custom checkpointer > Delta channel support > Copy thread with delta channels (seed)
  > When implementing `copy_thread`, copy the complete ancestor chain — not just the head checkpoint. The target thread must have write rows going back to at least one `_DeltaSnapshot` for every delta channel, or those channels will reconstruct as empty after the copy.…

## q037 · paraphrase · langchain · holdout

**How can I pause and resume execution at specific points in a graph during runtime?**

- `deaf3bebb254cc03` Interrupts › Debugging with interrupts (seed)
  > 1. The breakpoints are set during `compile` time. 2. `interrupt_before` specifies the nodes where execution should pause before the node is executed. 3. `interrupt_after` specifies the nodes where execution should pause after the node is executed. 4. A checkpointer is required to enable breakpoints.…
- `ba2f5a7289bc5bdc` Interrupts › 
  > Interrupts allow you to pause graph execution at specific points and wait for external input before continuing. This enables human-in-the-loop patterns where you need external input to proceed. When an interrupt is triggered, LangGraph saves the graph state using its [persistence](/oss/langgraph/per…
- `85a4db1c5aeb3ead` Interrupts › Pause using `interrupt`
  > The @[`interrupt`] function pauses graph execution and returns a value to the caller. When you call @[`interrupt`] within a node, LangGraph saves the current graph state and waits for you to resume execution with input. To use @[`interrupt`], you need: 1. A **checkpointer** to persist the graph stat…
- `157090a0fa822474` Interrupts › Debugging with interrupts
  > To debug and test a graph, you can use static interrupts as breakpoints to step through the graph execution one node at a time. Static interrupts are triggered at defined points either before or after a node executes. You can set these by specifying `interrupt_before` and `interrupt_after` when comp…
- `c926248afc1c1071` Interrupts › Common patterns
  > The key thing that interrupts unlock is the ability to pause execution and wait for external input. This is useful for a variety of use cases, including: - <Icon icon="circle-check" /> [Approval workflows](#approve-or-reject): Pause before executing critical actions (API calls, database changes, fin…
- `2d22b4b61579fe70` Interrupts › Pause using `interrupt`
  > 1. **Graph execution gets suspended** at the exact point where @[`interrupt`] is called 2. **State is saved** using the checkpointer so execution can be resumed later, In production, this should be a persistent checkpointer (e.g. backed by a database) 3. **Value is returned** to the caller on `strea…
- `010be739e33833ae` Interrupts › Resuming interrupts
  > After an interrupt pauses execution, you resume the graph by invoking it again with a `Command` that contains the resume value. The resume value is passed back to the `interrupt` call, allowing the node to continue execution with the external input. The recommended way to drive a graph that may inte…
- `84df359333782248` Graph API overview › `Command` > Input to `invoke` or `stream` > `resume`
  > Use `Command(resume=...)` to provide a value and resume graph execution after an [interrupt](/oss/langgraph/interrupts). The value passed to `resume` becomes the return value of the `interrupt()` call inside the paused node:…
- `0d19630e6a06e533` Graph API overview › `Command` > Input to `invoke` or `stream` > `resume`
  > ```python from typing import TypedDict from langgraph.checkpoint.memory import InMemorySaver from langgraph.graph import END, START, StateGraph from langgraph.types import Command, interrupt class State(TypedDict): messages: list[dict] def human_review(state: State): # Pauses the graph and waits for…

## q038 · paraphrase · langchain · tuning

**How can a system keep track of conversation history without exceeding the model's input size limit?**

- `f08bb052882e910d` Memory › Manage short-term memory (seed)
  > With [short-term memory](#add-short-term-memory) enabled, a checkpointer persists graph state across turns within the same thread. The node that calls the model controls which data from state to include in the model input. Persisting state does not automatically send all of it to the model. Passing …
- `7997ca90d04806f7` Short-term memory › Common patterns
  > With [short-term memory](#usage) enabled, long conversations can exceed the LLM's context window. Common solutions are: **Trim messages** Remove first or last N messages (before calling LLM) **Delete messages** Delete messages from LangGraph state permanently **Summarize messages** Summarize earlier…
- `899d46a0d397910b` Memory › Manage short-term memory > Trim messages
  > Most LLMs have a maximum supported context window (denominated in tokens). One way to decide when to truncate messages is to count the tokens in the message history and truncate whenever it approaches that limit. If you're using LangChain, you can use the trim messages utility and specify the number…
- `76da2209dcad0cfe` Context engineering in agents › Life-cycle context > Example: Summarization
  > One of the most common life-cycle patterns is automatically condensing conversation history when it gets too long. Unlike the transient message trimming shown in [Model Context](#messages), summarization **persistently updates state** - permanently replacing old messages with a summary that's saved …
- `b0dc5d0d73855a92` Add and manage memory › Manage short-term memory > Summarize messages
  > 1. We will keep track of our running summary in the `context` field (expected by the `SummarizationNode`). 1. Define private state that will be used only for filtering the inputs to `call_model` node. 1. We're passing a private input state here to isolate the messages returned by the summarization n…
- `159ccaf361989d8b` Short-term memory › Common patterns > Trim messages
  > Most LLMs have a maximum supported context window (denominated in tokens). One way to decide when to truncate messages is to count the tokens in the message history and truncate whenever it approaches that limit. If you're using LangChain, you can use the trim messages utility and specify the number…
- `e87290c050e8952a` Short-term memory › Overview
  > Memory is a system that remembers information about previous interactions. For AI agents, memory is crucial because it lets them remember previous interactions, learn from feedback, and adapt to user preferences. As agents tackle more complex tasks with numerous user interactions, this capability be…
- `db4a6399787a651e` Memory › Manage short-term memory > Trim messages
  > **Full example: trim messages** ```python from langchain_core.messages.utils import ( trim_messages, count_tokens_approximately ) from langchain.chat_models import init_chat_model from langgraph.graph import StateGraph, START, MessagesState model = init_chat_model("claude-sonnet-4-6") summarization_…

## q039 · paraphrase · langchain · holdout

**What are some common middleware functions that support complex workflows in a customizable system?**

- `523773490d53445a` Agents › Configure the harness (seed)
  > `create_agent` is highly extensible. Middleware is the primitive for customization: each piece handles one concern, hooks into the agent loop at the right moment, and composes freely with any other. Take exactly what your use case needs and skip the rest. Common patterns are prebuilt as first-class …
- `80ae383883778351` Prebuilt middleware › Provider-agnostic middleware > Shell tool
  > Expose a persistent shell session to agents for command execution. Shell tool middleware is useful for the following: - Agents that need to execute system commands - Development and deployment automation tasks - Testing and validation workflows - File system operations and script execution **Securit…
- `948be44bae1fa315` Short-term memory › Common patterns > Summarize messages
  > The problem with trimming or removing messages, as shown above, is that you may lose information from culling of the message queue. Because of this, some applications benefit from a more sophisticated approach of summarizing the message history using a chat model. ![Summary](/oss/images/summary.png)…
- `3e02b2b78c13a78c` Prebuilt middleware › Provider-agnostic middleware > Human-in-the-loop
  > Watch this [video guide](https://www.youtube.com/watch?v=SpfT6-YAVPk) demonstrating Human-in-the-loop middleware behavior.…
- `4f5cab1dc8ecd9fa` Middleware overview › Use middleware inside a LangGraph workflow
  > Middleware is not a separate runtime: hooks run inside the compiled [LangGraph](/oss/langgraph/overview) that @[`create_agent`] returns. You can drop the whole agent (middleware and all) into a larger @[StateGraph] as a node or subgraph, and every middleware hook continues to run. Reach for this pat…

## q040 · paraphrase · langchain · holdout

**How can a tool call be intercepted and handled externally before resuming execution in the app?**

- `d30f031979d8e84a` Tools › Headless tools > How the pattern works (seed)
  > When the model issues a tool call for one of these tools, the run **interrupts** instead of executing the tool locally. Your app can inspect the payload, perform the action in the right environment (for example a browser, another service, or a human review step), then **resume** the graph with the t…
- `838a06d24c1c8842` Tools › Headless tools > How the pattern works
  > In both runtimes, the model sees a normal tool it can call, but the actual execution happens outside the server process. 1. **Define** a headless tool with `tool(name=..., description=..., args_schema=...)` from `langchain.tools`. A headless tool is schema-only, with no in-process implementation. 2.…
- `ca234327f849abe3` Interrupts › Common patterns > Interrupts in tools
  > This approach is useful when you want the approval logic to live with the tool itself, making it reusable across different parts of your graph. The LLM can call the tool naturally, and the interrupt will pause execution whenever the tool is invoked, allowing you to approve, edit, or cancel the actio…
- `74cdfd6eb134d5e6` Custom middleware › Examples > Tool call monitoring
  > **Decorator** ```python from collections.abc import Callable from langchain.agents.middleware import wrap_tool_call from langchain.messages import ToolMessage from langchain.tools.tool_node import ToolCallRequest from langgraph.types import Command @wrap_tool_call def monitor_tool( request: ToolCall…

## q041 · paraphrase · cookbook · holdout

**What are different ways to guide a text generation system using prompts?**

- `5f8de57b7a56ba0e` How to work with large language models › How to control a large language model (seed)
  > Of all the inputs to a large language model, by far the most influential is the text prompt. Large language models can be prompted to produce output in a few ways: - **Instruction**: Tell the model what you want - **Completion**: Induce the model to complete the beginning of what you want - **Scenar…
- `7980d1fd0f3661a4` How to work with large language models › How to control a large language model > Instruction prompts
  > Write your instruction at the top of the prompt (or at the bottom, or both), and the model will do its best to follow the instruction and then stop. Instructions can be detailed, so don't be afraid to write a paragraph explicitly detailing the output you want, just stay aware of how many [tokens](ht…
- `8c4976c046fd183d` How to work with large language models › How to control a large language model > Demonstration prompt example (few-shot learning)
  > Similar to completion-style prompts, demonstrations can show the model what you want it to do. This approach is sometimes called few-shot learning, as the model learns from a few examples provided in the prompt. Example demonstration prompt: ```text Quote: “When the reasoning mind is forced to confr…
- `1e3bf198e3407ccd` How to work with large language models › How to control a large language model > Completion prompt example
  > Completion-style prompts take advantage of how large language models try to write text they think is most likely to come next. To steer the model, try beginning a pattern or sentence that will be completed by the output you want to see. Relative to direct instructions, this mode of steering large la…
- `30149bffe0d22008` How to work with large language models › How to control a large language model > Fine-tuned prompt example
  > With enough training examples, you can [fine-tune][Fine Tuning Docs] a custom model. In this case, instructions become unnecessary, as the model can learn the task from the training data provided. However, it can be helpful to include separator sequences (e.g., `->` or `###` or any string that doesn…

## q042 · paraphrase · cookbook · holdout

**How can we predict a numerical rating from the text of a review?**

- `96c4e33bb0adfd12` Regression_using_embeddings › Regression using the embeddings (seed)
  > Regression means predicting a number, rather than one of the categories. We will predict the score based on the embedding of the review's text. We split the dataset into a training and a testing set for all of the following tasks, so we can realistically evaluate performance on unseen data. The data…
- `2092223ccf8b1533` Regression_using_embeddings › Regression using the embeddings
  > We can see that the embeddings are able to predict the scores with an average error of 0.53 per score prediction. This is roughly equivalent to predicting half of reviews perfectly, and half off by one star. You could also train a classifier to predict the label, or use the embeddings within an exis…
- `46698467d8b8d141` Regression_using_embeddings › Regression using the embeddings
  > ```python import pandas as pd import numpy as np from ast import literal_eval from sklearn.ensemble import RandomForestRegressor from sklearn.model_selection import train_test_split from sklearn.metrics import mean_squared_error, mean_absolute_error datafile_path = "data/fine_food_reviews_with_embed…

## q043 · paraphrase · cookbook · holdout

**How can you improve the relevance of academic paper results using domain-specific details and initial filtering?**

- `14244c80feb3cdba` Search reranking with cross-encoders › Conclusion (seed)
  > We've shown how to create a tailored cross-encoder to rerank academic papers. This approach will work best where there are domain-specific nuances that can be used to pick the most relevant corpus for your users, and where some pre-filtering has taken place to limit the amount of data the cross-enco…
- `5cf8b52b3f82296c` Search reranking with cross-encoders › Cross-encoder
  > We'll create a cross-encoder using the ```Completions``` endpoint - the key factors to consider here are: - Make your examples domain-specific - the strength of cross-encoders comes when you tailor them to your domain. - There is a trade-off between how many potential examples to re-rank vs. process…
- `5434bca6e49013eb` Search reranking with cross-encoders › 
  > This notebook takes you through examples of using a cross-encoder to re-rank search results. This is a common use case with our customers, where you've implemented semantic search using embeddings (produced using a [bi-encoder](https://www.sbert.net/examples/applications/retrieve_rerank/README.html#…
- `549954f614407e7e` Question answering using a search API and re-ranking › 1. Search
  > As we can see, oftentimes, the search queries will return a large number of results, many of which are not relevant to the original question asked by the user. In order to improve the quality of the final answer, we use embeddings to re-rank and filter the results.…

## q044 · paraphrase · cookbook · holdout

**How can I retrieve a list of local venues based on user preferences using an API?**

- `cac62b2a4225ca57` Function calling for nearby places: Leveraging the Google Places API and customer profiles › Setup (seed)
  >  print(response.choices[0].message.tool_calls) if response.choices[0].finish_reason=='tool_calls': function_call = response.choices[0].message.tool_calls[0].function if function_call.name == "call_google_places_api": place_type = json.loads(function_call.arguments)["place_type"] places = call_google…
- `df81b56f886f1ab1` Function calling for nearby places: Leveraging the Google Places API and customer profiles › 
  > This notebook is centered around the integration of the Google Places API and custom user profiles to enhance location-based searches. Our approach involves using the Google Places API in combination with user preferences, aiming to make location discovery more personal and relevant. Please note tha…
- `2f62bffe074379fa` Function calling for nearby places: Leveraging the Google Places API and customer profiles › 
  > - Profile-based recommendations: Learn how to create a user profile and make place recommendations based on individual preferences. - API integration with function calling: Understand how to integrate and call Google Places API effectively to source real-time data of various places using function ca…
- `959a378f8639052f` Function calling for nearby places: Leveraging the Google Places API and customer profiles › Setup
  > client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", "<your OpenAI API key if not set as env var>")) ``` In this code snippet, we are defining a function `fetch_customer_profile` that accepts a `user_id` and returns a mock user profile. This function simulates an API call that fetches user data …
- `e25711dbd729d97c` Function calling for nearby places: Leveraging the Google Places API and customer profiles › Setup
  >  return "I am sorry, but I could not understand your request." ``` ## Executing user-specific recommendations Upon execution, the function fetches the user's profile, interacts with the AI model, processes the model's response, calls the Google Places API if necessary, and ultimately returns a list …
- `1dab84c69039f1e5` Function calling for nearby places: Leveraging the Google Places API and customer profiles › Setup
  >  return places else: print(f"Google Places API request failed with status code {response.status_code}") print(f"Response content: {response.content}") # print out the response content for debugging return [] except Exception as e: print(f"Error during the Google Places API call: {e}") return [] ``` …
- `9e7f1531d19a2f4f` Function calling for nearby places: Leveraging the Google Places API and customer profiles › Setup
  >  response = client.chat.completions.create( model="gpt-3.5-turbo", messages=[ { "role": "system", "content": f"You are a sophisticated AI assistant, a specialist in user intent detection and interpretation. Your task is to perceive and respond to the user's needs, even when they're expressed in an i…
- `fb05dc719934f737` Function calling for nearby places: Leveraging the Google Places API and customer profiles › Setup
  >  response = requests.get(URL) if response.status_code == 200: results = json.loads(response.content)["results"] places = [] for place in results[:2]: # limit to top 2 results place_id = place.get("place_id") place_details = get_place_details(place_id, API_KEY) # Get the details of the place place_na…
- `06de13b019fd5dd7` Function calling for nearby places: Leveraging the Google Places API and customer profiles › Setup
  >  # Get location from customer profile lat = customer_profile["location"]["latitude"] lng = customer_profile["location"]["longitude"] API_KEY = os.getenv('GOOGLE_PLACES_API_KEY') # retrieve API key from environment variable LOCATION = f"{lat},{lng}" RADIUS = 500 # search within a radius of 500 meters…
- `0e562c70369d891d` Function calling for nearby places: Leveraging the Google Places API and customer profiles › Setup
  > Google Places API To use the Google Places API, you'll need two things: - Google Account: If you don't already have one, you will need to create a Google account. - Google Places API Key: The API key is a unique identifier that is used to authenticate requests associated with your project for usage …

## q045 · paraphrase · cookbook · holdout

**How can GPT-4o mini be used to recommend outfit combinations based on image analysis?**

- `ebd871b25b02d8b1` How to Combine GPT-4o Mini with RAG - Create a Clothing Matchmaker App › Environment Setup > Conclusion (seed)
  > In this Jupyter Notebook, we explored the application of GPT-4o mini and other machine learning techniques to the domain of fashion. We demonstrated how to analyze images of clothing items, extract relevant features, and use this information to find matching items that complement an original outfit.…
- `256e8322fd3038bd` How to Combine GPT-4o Mini with RAG - Create a Clothing Matchmaker App › Environment Setup > Guardrails
  > In our case, we are using GPT-4o mini to analyze fashion images and suggest items that would complement an original outfit. To implement guardrails, we can **refine results**: After obtaining initial suggestions from GPT-4o mini, we can send the original image and the suggested items back to the mod…
- `1bbe80832966187e` How to Combine GPT-4o Mini with RAG - Create a Clothing Matchmaker App › 
  > Welcome to the Clothing Matchmaker App Jupyter Notebook! This project demonstrates the power of the GPT-4o mini model in analyzing images of clothing items and extracting key features such as color, style, and type. The core of our app relies on this advanced image analysis model developed by OpenAI…
- `23025fae5589b87c` How to Combine GPT-4o Mini with RAG - Create a Clothing Matchmaker App › 
  > 1. **Contextual Understanding**: GPT-4o mini can analyze input images and understand the context, such as the objects, scenes, and activities depicted. This allows for more accurate and relevant suggestions or information across various domains, whether it's interior design, cooking, or education. 2…
- `00dd5c77e6150467` How to Combine GPT-4o Mini with RAG - Create a Clothing Matchmaker App › Environment Setup > Guardrails
  > Finally, let's determine which of the items identified above truly complement the outfit. ```python # Select the unique paths for the generated images paths = list(set(paths)) for path in paths: # Encode the test image to base64 suggested_image = encode_image_to_base64(path) # Check if the items mat…
- `c7411f3bc8a336ad` How to Combine GPT-4o Mini with RAG - Create a Clothing Matchmaker App › Environment Setup > Analysis Module
  > In this module, we leverage `gpt-4o-mini` to analyze input images and extract important features like detailed descriptions, styles, and types. The analysis is performed through a straightforward API call, where we provide the URL of the image for analysis and request the model to identify relevant …
- `94a1de85a480a35b` How to Combine GPT-4o Mini with RAG - Create a Clothing Matchmaker App › Environment Setup > Analysis Module
  > ```python def analyze_image(image_base64, subcategories): response = client.chat.completions.create( model=GPT_MODEL, messages=[ { "role": "user", "content": [ { "type": "text", "text": f"""Given an image of an item of clothing, analyze the item and generate a JSON output with the following fields: …
- `8328a7b877a8cba5` How to Combine GPT-4o Mini with RAG - Create a Clothing Matchmaker App › Environment Setup > Guardrails
  > ```python def check_match(reference_image_base64, suggested_image_base64): response = client.chat.completions.create( model=GPT_MODEL, messages=[ { "role": "user", "content": [ { "type": "text", "text": """ You will be given two images of two different items of clothing. Your goal is to decide if th…

## q046 · paraphrase · cookbook · holdout

**How can I generate a list of API endpoint details including their identifiers, descriptions, and input parameter schemas from a JSON schema file?**

- `116216b970886266` Function-calling with an OpenAPI specification › How to convert an OpenAPI specification into function definitions (seed)
  > ```python with open('./data/example_events_openapi.json', 'r') as f: openapi_spec = jsonref.loads(f.read()) # it's important to load with jsonref, as explained below display(openapi_spec) ``` Now that we have a good understanding of the OpenAPI spec, we can proceed to parse it into function specific…
- `f021f0849d85b911` Function-calling with an OpenAPI specification › How to convert an OpenAPI specification into function definitions
  > The example OpenAPI spec we use here was created using `gpt-4`. We will transform this sample spec into a set of function definitions that can be supplied to the chat completion API. The model, based on the provided user instructions, generates a JSON object containing the necessary arguments to cal…
- `d196cb58360c10e8` Function-calling with an OpenAPI specification › 
  > Much of the internet is powered by RESTful APIs. Giving GPT the ability to call them opens up a world of possibilities. This notebook demonstrates how GPTs can be used to intelligently call APIs. It leverages OpenAPI specifications and chained function calls. The [OpenAPI Specification (OAS)](https:…
- `5d1ad4e8bf5a9299` Function-calling with an OpenAPI specification › How to convert an OpenAPI specification into function definitions
  > 1. **Resolve JSON references**: In an OpenAPI specification, it's common to use JSON references (also known as $ref) to avoid duplication. These references point to definitions that are used in multiple places. For example, if multiple API endpoints return the same object structure, that structure c…
- `8602704b9e40b958` Function-calling with an OpenAPI specification › How to convert an OpenAPI specification into function definitions
  > ```python def openapi_to_functions(openapi_spec): functions = [] for path, methods in openapi_spec["paths"].items(): for method, spec_with_ref in methods.items(): # 1. Resolve JSON references. spec = jsonref.replace_refs(spec_with_ref) # 2. Extract a name for the functions. function_name = spec.get(…

## q047 · paraphrase · cookbook · holdout

**How can a model decide when to stop or continue a selection-inference cycle and reduce generating incorrect facts?**

- `dd5f56ea2d7a695f` Techniques to improve reliability › Extensions to chain-of-thought prompting > Faithful reasoning architecture (seed)
  > A few months after publishing the selection-inference prompting technique, the authors extended the technique in a follow-up paper, with ideas for: - figuring out when the selection-inference cycle should stop or continue - adding a value function to help search over multiple reasoning paths - reduc…
- `83e0f5c039ccc013` Techniques to improve reliability › Extensions to chain-of-thought prompting > Faithful reasoning architecture > Method
  > In the original selection-inference technique, specialized 'selection' and 'inference' prompts are alternated to select facts and make inferences from those facts, combining to generate a sequence of reasoning steps. The authors extend this technique with two additional components. First, the author…
- `f091b3594a293966` Techniques to improve reliability › Extensions to chain-of-thought prompting > Faithful reasoning architecture > Method
  > Second, the authors add a value function, which is used to assess the quality of reasoning steps and search over multiple reasoning trajectories. This echoes a common theme for increasing reliability; instead of generating a single answer from the model, generate a set of answers and then use some t…

## q048 · paraphrase · cookbook · tuning

**How can GPT enhance finding relevant information from large amounts of data?**

- `6bc22a52a26ceb1a` Question answering using a search API and re-ranking ›  (seed)
  > Searching for relevant information can sometimes feel like looking for a needle in a haystack, but don’t despair, GPTs can actually do a lot of this work for us. In this guide we explore a way to augment existing search systems with various AI techniques, helping us sift through the noise. Two ways …
- `4c5008c711452410` Retrieval Augmented Generation with a Graph Database › Conclusion > User experience
  > When the primary objective is to extract specific information from our database, Large Language Models (LLMs) can significantly enhance our querying capabilities. However, it's crucial to base much of this process on robust code logic to ensure a foolproof user experience. For crafting a genuinely c…
- `a33ca065fd40ddb6` Retrieval Augmented Generation with a Graph Database › Why use RAG?
  > If you want to use LLMs to generate answers based on your own content or knowledge base, instead of providing large context when prompting the model, you can fetch the relevant information in a database and use this information to generate a response. This allows you to: - Reduce hallucinations - Pr…
- `3bc126a0eb56bf48` Question answering using embeddings-based search › 
  > GPT excels at answering questions, but only on topics it remembers from its training data. What should you do if you want GPT to answer questions about unfamiliar topics? E.g., - Recent events after October 2023 for GPT 4 series models - Your non-public documents - Information from past conversation…
- `fbe9e1fcce6781e5` Text comparison examples › Question answering
  > The best way to get reliably honest answers from GPT-3 is to give it source documents in which it can locate correct answers. Using the semantic search procedure above, you can cheaply search through a corpus of documents for relevant information and then give that information to GPT-3 via the promp…
- `a7b8a9f1952629ec` Question answering using embeddings-based search › Why search is better than fine-tuning
  > GPT can learn knowledge in two ways: - Via model weights (i.e., fine-tune the model on a training set) - Via model inputs (i.e., insert the knowledge into an input message) Although fine-tuning can feel like the more natural option—training on data is how GPT learned all of its other knowledge, afte…
- `8b45ae0e3cbd28a8` Question answering using embeddings-based search › Why search is better than fine-tuning
  > | Model | Maximum text length | |-----------------|---------------------------| | `gpt-4o-mini` | 128,000 tokens (~384 pages)| | `gpt-4o` | 128,000 tokens (~384 pages)| Continuing the analogy, you can think of the model like a student who can only look at a few pages of notes at a time, despite pote…

## q049 · version_new · langchain · holdout

**How can I access the same memories across different threads using the same user ID?**

- `a0861380982a38e5` Stores › Using in LangGraph (seed)
  > If you create a new thread, you can still access the same memories so long as the `user_id` is the same. ```python # Invoke the graph on a new thread config = {"configurable": {"thread_id": "2"}} # Let's say hi again for update in graph.stream( {"messages": [{"role": "user", "content": "hi, tell me …
- `010f0f420fb3742e` Stores › Using in LangGraph
  > The store works hand-in-hand with the checkpointer: the checkpointer saves state to threads, as discussed above, and the store allows you to store arbitrary information for access _across_ threads. Compile the graph with both the checkpointer and the store as follows. ```python from dataclasses impo…
- `304769883250c07a` Stores › Using in LangGraph
  > You can also access the store from any node and use the `store.search` method to get memories. Memories are returned as a list of objects that can be converted to a dictionary. ```python memories[-1].dict() {'value': {'food_preference': 'I like pizza'}, 'key': '07e0caf4-1631-47b7-b15f-65515d4c1843',…
- `622935c0422f7bc0` Stores › Basic usage
  > The following code snippet shows the @[InMemoryStore] in isolation without using LangGraph: ```python from langgraph.store.memory import InMemoryStore store = InMemoryStore() ``` Memories are namespaced by a `tuple`, which is `(<user_id>, "memories")` in the following example. The namespace can be a…
- `fb2b5dbd3df5f192` Stores › Using in LangGraph
  > ```python # Invoke the graph config = {"configurable": {"thread_id": "1"}} # First let's just say hi to the AI for update in graph.stream( {"messages": [{"role": "user", "content": "hi"}]}, config, stream_mode="updates", context=Context(user_id="1"), ): print(update) ``` You can access the store and…

## q050 · version_new · langchain · tuning

**How does the email agent classify email intent and decide the next action node?**

- `93321fecbf8d41b2` Thinking in LangGraph › Step 4: Build your nodes > Implementing our email agent nodes (seed)
  > ```python from typing import Literal from langgraph.graph import StateGraph, START, END from langgraph.types import interrupt, Command, RetryPolicy from langchain_openai import ChatOpenAI from langchain.messages import HumanMessage llm = ChatOpenAI(model="gpt-5-nano") def read_email(state: EmailAgen…
- `60491fa09e63a5c1` Thinking in LangGraph › Step 1: Map out your workflow as discrete steps
  > - `Read Email`: Extract and parse the email content - `Classify Intent`: Use an LLM to categorize urgency and topic, then route to appropriate action - `Doc Search`: Query your knowledge base for relevant information - `Bug Track`: Create or update issue in tracking system - `Draft Reply`: Generate …
- `edd56fadbb52f127` Thinking in LangGraph › Step 1: Map out your workflow as discrete steps
  > Start by identifying the distinct steps in your process. Each step will become a **node** (a function that does one specific thing). Then, sketch how these steps connect to each other. ```mermaid flowchart TD A[START] --> B[Read Email] B --> C[Classify Intent] C -.-> D[Doc Search] C -.-> E[Bug Track…

## q051 · version_new · langchain · tuning

**How can I log messages before and after a model call using a class-based approach in LangChain?**

- `e20741d766697d88` Custom middleware › Create middleware > Class-based middleware (seed)
  > ```python from langchain.agents.middleware import ( AgentMiddleware, AgentState, ModelRequest, ModelResponse, ) from langgraph.runtime import Runtime from typing import Any, Callable class LoggingMiddleware(AgentMiddleware): def before_model(self, state: AgentState, runtime: Runtime) -> dict[str, An…
- `d2cada6063326b28` Custom middleware › Create middleware > Class-based middleware
  > **When to use classes:** - Defining both sync and async implementations for the same hook - Multiple hooks needed in a single middleware - Complex configuration required (e.g., configurable thresholds, custom models) - Reuse across projects with init-time configuration…
- `15418b08ea38eb36` Runtime › Access > Inside middleware
  > ```python from dataclasses import dataclass from langchain.messages import AnyMessage from langchain.agents import create_agent, AgentState from langchain.agents.middleware import dynamic_prompt, ModelRequest, before_model, after_model from langgraph.runtime import Runtime @dataclass class Context: …

## q052 · version_new · langchain · holdout

**How should I structure SQL tables to efficiently store and retrieve versioned checkpoint data with ordering by newest first?**

- `0b7a2c4a942f0829` Checkpointers › Build a custom checkpointer > Row key / index design (seed)
  > How you store and index checkpoints directly affects correctness and performance. **Recommended schema (SQL):** ```sql CREATE TABLE checkpoints ( thread_id TEXT NOT NULL, checkpoint_ns TEXT NOT NULL DEFAULT '', checkpoint_id TEXT NOT NULL, -- ULID, lexicographically sortable newest-last parent_check…

## q053 · version_new · langchain · tuning

**How can I handle exceptions during tool execution to prevent the agent from stopping and allow retries with corrected inputs?**

- `b7c384f9cdf6adfe` Prebuilt middleware › Provider-agnostic middleware > Tool error (seed)
  > Catch exceptions raised during tool execution and convert them into error `ToolMessage`s that the model can see and recover from, instead of halting the agent run. Tool error is useful for the following: - Letting the model retry a failed tool call with corrected arguments. - Surfacing controlled, s…
- `68fe9411664f0bb4` Prebuilt middleware › Provider-agnostic middleware > Tool retry
  > Either a tuple of exception types to retry on, or a callable that takes an exception and returns `True` if it should be retried. With `langchain>=1.3.16`, the default retries retryable [model errors](/oss/langchain/models#model-exceptions) and all unclassified exceptions, and no longer retries model…
- `49ccf126caece5bf` Structured output › Tool calling strategy > Error handling > Error handling strategies
  > You can customize how errors are handled using the `handle_errors` parameter: **Custom error message:** ```python ToolStrategy( schema=ProductRating, handle_errors="Please provide a valid rating between 1-5 and include a comment." ) ``` If `handle_errors` is a string, the agent will *always* prompt …
- `fd5a433cc2bf753e` Tools › Tool execution > Error handling
  > Handle tool errors using LangChain agent [middleware](/oss/langchain/middleware) to retry failed tool calls or return custom error messages: ```python Google from collections.abc import Callable from langchain.agents import create_agent from langchain.agents.middleware import wrap_tool_call from lan…
- `9aa386e0fe2ea932` Tools › Tool execution > Error handling
  > ```python OpenAI from collections.abc import Callable from langchain.agents import create_agent from langchain.agents.middleware import wrap_tool_call from langchain.messages import ToolMessage from langchain.tools.tool_node import ToolCallRequest @wrap_tool_call def handle_tool_errors( request: Too…
- `d326c1b0aefbc2d7` Tools › Tool execution > Error handling
  > ```python Anthropic from collections.abc import Callable from langchain.agents import create_agent from langchain.agents.middleware import wrap_tool_call from langchain.messages import ToolMessage from langchain.tools.tool_node import ToolCallRequest @wrap_tool_call def handle_tool_errors( request: …
- `436d7d6cb59d772d` Tools › Tool execution > Error handling
  > ```python Baseten from collections.abc import Callable from langchain.agents import create_agent from langchain.agents.middleware import wrap_tool_call from langchain.messages import ToolMessage from langchain.tools.tool_node import ToolCallRequest @wrap_tool_call def handle_tool_errors( request: To…
- `b0917996e44b4a39` Tools › Tool execution > Error handling
  > ```python Ollama from collections.abc import Callable from langchain.agents import create_agent from langchain.agents.middleware import wrap_tool_call from langchain.messages import ToolMessage from langchain.tools.tool_node import ToolCallRequest @wrap_tool_call def handle_tool_errors( request: Too…
- `e1ca7717a6e3f98f` Tools › Tool execution > Error handling
  > ```python OpenRouter from collections.abc import Callable from langchain.agents import create_agent from langchain.agents.middleware import wrap_tool_call from langchain.messages import ToolMessage from langchain.tools.tool_node import ToolCallRequest @wrap_tool_call def handle_tool_errors( request:…
- `4d1055961fa056eb` Tools › Tool execution > Error handling
  > ```python Fireworks from collections.abc import Callable from langchain.agents import create_agent from langchain.agents.middleware import wrap_tool_call from langchain.messages import ToolMessage from langchain.tools.tool_node import ToolCallRequest @wrap_tool_call def handle_tool_errors( request: …
- `5810f061850e86e6` Prebuilt middleware › Provider-agnostic middleware > Tool error
  > ```python from langchain.agents import create_agent from langchain.agents.middleware import ToolErrorMiddleware, ToolRetryMiddleware def on_error(exc: Exception, request: ToolCallRequest) -> str | None: # Surface ValueError to the model so it can correct the input if isinstance(exc, ValueError): ret…

## q054 · version_new · langchain · tuning

**What is a super-step in LangGraph and how does it relate to resuming execution?**

- `040dc6fb23c8a375` Checkpointers › Core concepts > Checkpoints > Super-steps (seed)
  > LangGraph creates a checkpoint at each **super-step** boundary. A super-step is a single "tick" of the graph where all nodes scheduled for that step execute (potentially in parallel). For a sequential graph like `START -> A -> B -> END`, there are separate super-steps for the input, node A, and node…
- `cb5db927407c4ee9` Graph API overview › Graphs
  > LangGraph's underlying graph algorithm uses [message passing](https://en.wikipedia.org/wiki/Message_passing) to define a general program. When a Node completes its operation, it sends messages along one or more edges to other node(s). These recipient nodes then execute their functions, pass the resu…
- `415b4ebd56197d20` Graph API overview › Nodes > Re-execution and idempotency
  > When you compile with a [checkpointer](/oss/langgraph/persistence), LangGraph saves checkpoints at [super-step](#graphs) boundaries, not mid-function inside a node. If execution stops and later resumes (for example after an [interrupt](/oss/langgraph/interrupts) or a [retry](/oss/langgraph/fault-tol…

## q055 · version_new · langchain · holdout

**How can I log the execution and results of a tool call in an agent's processing pipeline?**

- `3c4d56fef6a13e00` Custom middleware › Examples > Tool call monitoring (seed)
  > ```python from collections.abc import Callable from langchain.agents.middleware import AgentMiddleware from langchain.messages import ToolMessage from langchain.tools.tool_node import ToolCallRequest from langgraph.types import Command class ToolMonitoringMiddleware(AgentMiddleware): def wrap_tool_c…

## q056 · version_new · langchain · holdout

**What information is included in a checkpoint's metadata and configuration details?**

- `6edb707017623e27` Checkpointers › Get and update state > Get state > StateSnapshot fields (seed)
  > | Field | Type | Description | |-------|------|-------------| | `values` | `dict` | State channel values at this checkpoint. | | `next` | `tuple[str, ...]` | Node names to execute next. Empty `()` means the graph is complete. | | `config` | `dict` | Contains `thread_id`, `checkpoint_ns`, and `checkp…
- `a35c853f2aec1135` Add and manage memory › Manage short-term memory > Manage checkpoints > View thread state
  > ``` CheckpointTuple( config={'configurable': {'thread_id': '1', 'checkpoint_ns': '', 'checkpoint_id': '1f029ca3-1f5b-6704-8004-820c16b69a5a'}}, checkpoint={ 'v': 3, 'ts': '2025-05-05T16:01:24.680462+00:00', 'id': '1f029ca3-1f5b-6704-8004-820c16b69a5a', 'channel_versions': {'__start__': '000000000000…
- `dd7f15a8a5a9e353` Memory › Manage short-term memory > Manage checkpoints > View thread state
  > ``` StateSnapshot( values={'messages': [HumanMessage(content="hi! I'm bob"), AIMessage(content='Hi Bob! How are you doing today?), HumanMessage(content="what's my name?"), AIMessage(content='Your name is Bob.')]}, next=(), config={'configurable': {'thread_id': '1', 'checkpoint_ns': '', 'checkpoint_i…

## q057 · version_new · langchain · holdout

**What are the risks of changing the sequence of user prompts or looping over a list that may change during execution?**

- `b4bea8997c1af296` Interrupts › Rules of interrupts > Do not reorder `interrupt` calls within a node (seed)
  > ```python Skipping interrupts def node_a(state: State): # ❌ Bad: conditionally skipping interrupts changes the order name = interrupt("What's your name?") # On first run, this might skip the interrupt # On resume, it might not skip it - causing index mismatch if state.get("needs_age"): age = interru…
- `67f754490dbf96ec` Functional API overview › Common pitfalls > Non-deterministic control flow
  > Operations that might give different results each time (like getting current time or random numbers) should be encapsulated in tasks to ensure that on resume, the same result is returned. * In a task: Get random number (5) → interrupt → resume → (returns 5 again) → ... * Not in a task: Get random nu…
- `0ef776dce06c4ee8` Backward compatibility › Non-determinism
  > - **Adding, removing, or reordering `@task` calls or @[`interrupt`] calls** that come *before* the resume point. LangGraph matches cached results and resume values to calls by their position in the replay, so shifting that position can cause the wrong cached value to be replayed against a different …
- `f6e286d9a286c276` Interrupts › Rules of interrupts > Side effects called before `interrupt` must be idempotent
  > * 🔴 Do not perform non-idempotent operations before @[`interrupt`] * 🔴 Do not create new records without checking if they exist ```python Creating records def node_a(state: State): # ❌ Bad: creating a new record before interrupt # This will create duplicate records on each resume audit_id = db.cre…

## q058 · version_new · langchain · tuning

**How can I handle user input during a continuous event processing loop in LangGraph?**

- `4f389a276c58ac5d` Interrupts › Common patterns > Stream with human-in-the-loop (HITL) interrupts (seed)
  > ```python from langgraph.types import Command stream_input: dict | Command = initial_input while True: stream = graph.stream_events(stream_input, config=config, version="v3") # Stream LLM message chunks (including any in subgraphs) as they arrive. for message in stream.messages: for token in message…
- `3ef663a54c1cfe3c` Interrupts › Common patterns > Stream with human-in-the-loop (HITL) interrupts
  > When building interactive agents with human-in-the-loop workflows, you can use [event streaming](/oss/langgraph/event-streaming) to consume message chunks and state snapshots concurrently while handling interrupts. Use the typed projections returned by `graph.stream_events(..., version="v3")` in a l…

## q059 · version_new · langchain · holdout

**How can I enable an agent to run system commands securely within a persistent shell session?**

- `80ae383883778351` Prebuilt middleware › Provider-agnostic middleware > Shell tool (seed)
  > Expose a persistent shell session to agents for command execution. Shell tool middleware is useful for the following: - Agents that need to execute system commands - Development and deployment automation tasks - Testing and validation workflows - File system operations and script execution **Securit…
- `361ee73a1c2f83ee` Prebuilt middleware › Provider-agnostic middleware > Shell tool
  > Base directory for the shell session. If omitted, a temporary directory is created when the agent starts and removed when it ends. Optional commands executed sequentially after the session starts Optional commands executed before the session shuts down Execution policy controlling timeouts, output l…
- `ab97fcc209c67442` Prebuilt middleware › Provider-agnostic middleware > Shell tool
  > Optional environment variables to supply to the shell session. Values are coerced to strings before command execution. **Full example** The middleware provides a single persistent shell session that agents can use to execute commands sequentially. **Execution policies:** - `HostExecutionPolicy` (def…
- `753a6ff93e749f4c` Prebuilt middleware › Provider-agnostic middleware > Shell tool
  > ```python from langchain.agents import create_agent from langchain.agents.middleware import ( ShellToolMiddleware, HostExecutionPolicy, DockerExecutionPolicy, RedactionRule, ) # Basic shell tool with host execution agent = create_agent( model="gpt-5.5", tools=[search_tool], middleware=[ ShellToolMid…

## q060 · version_new · langchain · holdout

**How can I specify a fallback function for errors in all nodes of a StateGraph, and override it for a specific node?**

- `5f776019ad859eb3` Fault tolerance › Graph defaults > Default error handler (seed)
  > ```python from langgraph.errors import NodeError from langgraph.graph import StateGraph, START from langgraph.types import Command, RetryPolicy from typing_extensions import TypedDict class State(TypedDict): process_id: str status: str def fetch_data(state: State) -> State: return {"status": "fetche…
- `0a55de3829c4bf2b` Thinking in LangGraph › Step 4: Build your nodes > Handle errors appropriately
  > ```python from langgraph.errors import NodeError from langgraph.types import Command, RetryPolicy def payment_error_handler(state: State, error: NodeError) -> Command: return Command( update={"status": f"compensated: {error.error}"}, goto="finalize", ) workflow.add_node( "charge_payment", charge_pay…
- `6e9a2dbe95eb1117` Use the graph API › Handle node errors
  > The `error_handler=` parameter on @[`add_node`] registers a function that runs after a node fails and all retries are exhausted. The handler receives the current state and a typed @[`NodeError`] with failure context, and can route to a recovery branch via @[`Command`]: Node-level error handlers requ…
- `aae59e6054bb5052` Use the graph API › Set graph-wide node defaults
  > Requires `langgraph>=1.2`. Use @[`set_node_defaults`] to set `retry_policy`, `timeout`, `cache_policy`, or `error_handler` once for every node in a graph, instead of repeating them on each @[`add_node`] call. Per-node values always win, and defaults are applied at @[`StateGraph.compile`] time: ```py…
- `9b2891bc502221f1` Fault tolerance › Graph defaults
  > Requires `langgraph>=1.2`. Instead of repeating the same `retry_policy=`, `error_handler=`, `timeout=`, or `cache_policy=` on every `add_node` call, use @[`set_node_defaults`] to configure graph-wide defaults in one place: ```python from langgraph.errors import NodeError from langgraph.types import …
- `c066304267d427ef` Fault tolerance › Graph defaults > Default error handler
  > The `error_handler` default is particularly valuable when every graph run maps to an external process (for example a background job row) and any unhandled node failure should mark that process as failed, without repeating `error_handler=` on every `add_node`. Per-node handlers still take precedence …
- `05fab2f0accaa1fa` Fault tolerance › Error handling
  > Requires `langgraph>=1.2`. An error handler runs after a node fails and all retries are exhausted. It receives the current state and can update it or route to a different node using @[`Command`]. This is useful for compensation flows (Saga patterns) where you want to recover gracefully rather than a…
- `24a59ca53bd84437` Fault tolerance › Graph defaults > Precedence
  > Per-node values passed directly to `add_node()` always override the defaults set by `set_node_defaults()`. Defaults are resolved at `compile()` time, so you can call `set_node_defaults()` before or after `add_node()` in any order: ```python graph = ( StateGraph(State) .set_node_defaults(error_handle…
- `e2c7a97d7428519d` Fault tolerance › Graph defaults > Default error handler
  > If `fetch_data` fails after retries, `mark_process_failed` runs. If `charge_payment` fails after retries, `refund_payment` runs instead because the per-node handler overrides the default. The handler accepts the same `(state, error: NodeError)` signature described in [Error handling](#error-handling…

## q061 · version_new · langchain · holdout

**What options control the execution environment and security policies for the shell session?**

- `361ee73a1c2f83ee` Prebuilt middleware › Provider-agnostic middleware > Shell tool (seed)
  > Base directory for the shell session. If omitted, a temporary directory is created when the agent starts and removed when it ends. Optional commands executed sequentially after the session starts Optional commands executed before the session shuts down Execution policy controlling timeouts, output l…
- `80ae383883778351` Prebuilt middleware › Provider-agnostic middleware > Shell tool
  > Expose a persistent shell session to agents for command execution. Shell tool middleware is useful for the following: - Agents that need to execute system commands - Development and deployment automation tasks - Testing and validation workflows - File system operations and script execution **Securit…
- `ab97fcc209c67442` Prebuilt middleware › Provider-agnostic middleware > Shell tool
  > Optional environment variables to supply to the shell session. Values are coerced to strings before command execution. **Full example** The middleware provides a single persistent shell session that agents can use to execute commands sequentially. **Execution policies:** - `HostExecutionPolicy` (def…
- `753a6ff93e749f4c` Prebuilt middleware › Provider-agnostic middleware > Shell tool
  > ```python from langchain.agents import create_agent from langchain.agents.middleware import ( ShellToolMiddleware, HostExecutionPolicy, DockerExecutionPolicy, RedactionRule, ) # Basic shell tool with host execution agent = create_agent( model="gpt-5.5", tools=[search_tool], middleware=[ ShellToolMid…

## q062 · version_new · langchain · tuning

**How can I configure a node to retry an operation multiple times with delays between attempts?**

- `28e585c1a124984d` Thinking in LangGraph › Step 4: Build your nodes > Handle errors appropriately (seed)
  > ```python from langgraph.types import RetryPolicy workflow.add_node( "search_documentation", search_documentation, retry_policy=RetryPolicy(max_attempts=3, initial_interval=1.0) ) ``` **LLM-recoverable** Store the error in state and loop back so the LLM can see what went wrong and try again: ```pyth…
- `ed39a95bcc7e337f` Fault tolerance › 
  > When a node fails—from a slow external API, a transient network error, or an unhandled exception—LangGraph gives you three composable mechanisms to respond: - [**Retries**](#retries): automatically re-run failed attempts based on exception type and backoff settings - [**Timeouts**](#timeouts): cap h…
- `6b30199facb71fa0` Fault tolerance › Retries > Parameters
  > | Parameter | Type | Default | Description | | --------- | ---- | ------- | ----------- | | `max_attempts` | `int` | `3` | Maximum number of attempts, including the first. | | `initial_interval` | `float` | `0.5` | Seconds before the first retry. | | `backoff_factor` | `float` | `2.0` | Multiplier a…
- `17590beb65f99a86` Fault tolerance › Retries
  > A retry policy automatically re-runs a failed node attempt based on exception type and backoff settings. Pass `retry_policy=` to @[`add_node`]: ```python from langgraph.types import RetryPolicy builder.add_node( "call_api", call_api, retry_policy=RetryPolicy(max_attempts=3), ) ```…
- `321b7e39990af5a4` Use the graph API › Add retry policies
  > There are many use cases where you may wish for your node to have a custom retry policy, for example if you are calling an API, querying a database, or calling an LLM, etc. LangGraph lets you add retry policies to nodes. To configure a retry policy, pass the `retry_policy` parameter to the @[`add_no…
- `a4badf01031bf403` Use the graph API › Set graph-wide node defaults > Access execution info inside a node > Adjust behavior based on retry state
  > When a node has a retry policy, use `execution_info` to inspect the current attempt number and switch to a fallback after the first attempt fails: ```python from langgraph.graph import StateGraph, START, END from langgraph.runtime import Runtime from langgraph.types import RetryPolicy from typing_ex…

## q063 · version_new · langchain · holdout

**How can I retrieve the current status and history of a paused thread in the system?**

- `53ec8c23b6742961` Backward compatibility › Technical compatibility > Detecting in-flight threads (seed)
  > - @[`graph.get_state(config)`][get_state] returns the latest checkpoint, including which node the thread is paused at and any pending interrupts. - @[`graph.get_state_history(config)`][get_state_history] returns the full chronological list of checkpoints for the thread. When in doubt, keep the depre…
- `d52f5c1eaf1e039f` Checkpointers › Get and update state > Get state history
  > You can get the full history of the graph execution for a given thread by calling @[`graph.get_state_history(config)`][get_state_history]. This will return a list of `StateSnapshot` objects associated with the thread ID provided in the config. Importantly, the checkpoints will be ordered chronologic…
- `5b1efc9ae36fc7dc` Memory › Manage short-term memory > Manage checkpoints > View the history of the thread
  > **Graph/Functional API** ```python config = { "configurable": { "thread_id": "1" } } list(graph.get_state_history(config)) ```…
- `a35c853f2aec1135` Add and manage memory › Manage short-term memory > Manage checkpoints > View thread state
  > ``` CheckpointTuple( config={'configurable': {'thread_id': '1', 'checkpoint_ns': '', 'checkpoint_id': '1f029ca3-1f5b-6704-8004-820c16b69a5a'}}, checkpoint={ 'v': 3, 'ts': '2025-05-05T16:01:24.680462+00:00', 'id': '1f029ca3-1f5b-6704-8004-820c16b69a5a', 'channel_versions': {'__start__': '000000000000…
- `dd7f15a8a5a9e353` Memory › Manage short-term memory > Manage checkpoints > View thread state
  > ``` StateSnapshot( values={'messages': [HumanMessage(content="hi! I'm bob"), AIMessage(content='Hi Bob! How are you doing today?), HumanMessage(content="what's my name?"), AIMessage(content='Your name is Bob.')]}, next=(), config={'configurable': {'thread_id': '1', 'checkpoint_ns': '', 'checkpoint_i…
- `78e169026130cc7b` Memory › Manage short-term memory > Manage checkpoints > View thread state
  > **Graph/Functional API** ```python config = { "configurable": { "thread_id": "1", # optionally provide an ID for a specific checkpoint, # otherwise the latest checkpoint is shown # "checkpoint_id": "1f029ca3-1f5b-6704-8004-820c16b69a5a" } } graph.get_state(config) ```…
- `bd817eff1faf8aab` Memory › Manage short-term memory > Manage checkpoints > View the history of the thread
  > ``` [ StateSnapshot( values={'messages': [HumanMessage(content="hi! I'm bob"), AIMessage(content='Hi Bob! How are you doing today? Is there anything I can help you with?'), HumanMessage(content="what's my name?"), AIMessage(content='Your name is Bob.')]}, next=(), config={'configurable': {'thread_id…
- `d3099e1cd5684c8b` Checkpointers › Core concepts > Threads
  > A thread is a unique ID or thread identifier assigned to each checkpoint saved by a checkpointer. It contains the accumulated state of a sequence of [runs](/langsmith/runs). When a run is executed, the [state](/oss/langgraph/graph-api#state) of the underlying graph of the assistant will be persisted…

## q064 · version_new · langchain · holdout

**How can I enhance an agent with features like tool approval, subgraphs, streaming, observability, tool integration, and retry logic?**

- `2fdf13e58c1557eb` Thinking in LangGraph › Summary and next steps > Where to go from here (seed)
  > This was an introduction to thinking about building agents with LangGraph. You can extend this foundation with: **Human-in-the-loop patterns** Learn how to add tool approval before execution, batch approval, and other patterns **Subgraphs** Create subgraphs for complex multi-step operations **Stream…
- `28e585c1a124984d` Thinking in LangGraph › Step 4: Build your nodes > Handle errors appropriately
  > ```python from langgraph.types import RetryPolicy workflow.add_node( "search_documentation", search_documentation, retry_policy=RetryPolicy(max_attempts=3, initial_interval=1.0) ) ``` **LLM-recoverable** Store the error in state and loop back so the LLM can see what went wrong and try again: ```pyth…
- `ca234327f849abe3` Interrupts › Common patterns > Interrupts in tools
  > This approach is useful when you want the approval logic to live with the tool itself, making it reusable across different parts of your graph. The LLM can call the tool naturally, and the interrupt will pause execution whenever the tool is invoked, allowing you to approve, edit, or cancel the actio…
- `cdabd3197b9ad0cd` Functional API overview › When to use a task
  > **Tasks** are useful in the following scenarios: * **Checkpointing**: When you need to save the result of a long-running operation to a checkpoint, so you don't need to recompute it when resuming the workflow. * **Human-in-the-loop**: If you're building a workflow that requires human intervention, y…
- `50eb3924378c9e0d` Prebuilt middleware › Provider-agnostic middleware
  > | Middleware | Description | |------------|-------------| | [Tool error](#tool-error) | Catch tool execution exceptions and convert them to error messages for the model. | | [Tool retry](#tool-retry) | Automatically retry failed tool calls with exponential backoff. | | [Model retry](#model-retry) | …
- `83507bdd3be4f93a` Prebuilt middleware › Provider-agnostic middleware > Subagent
  > A subagent is defined with a **name**, **description**, **system prompt**, and **tools**. You can also provide a subagent with a custom **model**, or with additional **middleware**. This can be particularly useful when you want to give the subagent an additional state key to share with the main agen…
- `523773490d53445a` Agents › Configure the harness
  > `create_agent` is highly extensible. Middleware is the primitive for customization: each piece handles one concern, hooks into the agent loop at the right moment, and composes freely with any other. Take exactly what your use case needs and skip the rest. Common patterns are prebuilt as first-class …
- `3f2bf5b5da6ce7e3` Agents › Configure the harness > Fault tolerance
  > Agents in production encounter failures that rarely appear in development: rate limits, model timeouts, transient API errors. Fault tolerance middleware handles these at the infrastructure level so your tools and business logic don't need try/catch around every call. ```python Google from langchain.…

## q065 · version_new · langchain · tuning

**How can I handle process termination signals to allow a Python program to finish ongoing tasks before exiting?**

- `933c1df276a49619` Fault tolerance › Graceful shutdown > SIGTERM hook pattern (seed)
  > The recommended pattern for handling process shutdown: ```python import signal from langgraph.runtime import RunControl from langgraph.errors import GraphDrained control = RunControl() signal.signal(signal.SIGTERM, lambda *_: control.request_drain("sigterm")) try: result = graph.invoke(inputs, confi…
- `014ad755f58158b5` Fault tolerance › Graceful shutdown
  > Cooperative shutdown lets you stop an in-flight graph run after the current superstep completes and save a resumable checkpoint. This is useful for handling SIGTERM signals or any external supervisor that needs to reclaim resources without losing work. Requires `langgraph>=1.2`. Create a @[`RunContr…

## q066 · version_new · langchain · holdout

**How does the system reconstruct a live value when delta data is missing from saved states?**

- `9af67d0715ad2227` Checkpointers › Build a custom checkpointer > Delta channel support > What the runtime needs (seed)
  > When loading a checkpoint whose delta channels are absent from `channel_values`, LangGraph calls `saver.get_delta_channel_history(config=config, channels=[...])`. This returns, for each channel: - **`writes`** — all writes to that channel in the ancestor chain, oldest first, up to the nearest snapsh…

## q067 · version_new · langchain · tuning

**What are the steps involved in the core agent loop and how can hooks be used around these steps?**

- `c1d3c33ce7af3dd3` Middleware overview › The agent loop (seed)
  > The core agent loop involves calling a model, letting it choose tools to execute, and then finishing when it calls no more tools: <img src="/oss/images/core_agent_loop.png" alt="Core agent loop diagram" style={{height: "200px", width: "auto", justifyContent: "center"}} className="rounded-lg block mx…
- `821fe0b7055c980b` Context engineering in agents › Life-cycle context
  > Control what happens **between** the core agent steps - intercepting data flow to implement cross-cutting concerns like summarization, guardrails, and logging. As you've seen in [Model Context](#model-context) and [Tool Context](#tool-context), [middleware](/oss/langchain/middleware) is the mechanis…
- `12f3e7f1ffc67feb` Custom middleware › Hooks
  > Middleware provides two styles of hooks to intercept agent execution: **Node-style hooks** Run sequentially at specific execution points. **Wrap-style hooks** Run around each model or tool call.…
- `a95f61ca2a14ed4d` Context engineering in agents › Overview > The agent loop
  > A typical agent loop consists of two main steps: 1. **Model call** - calls the LLM with a prompt and available tools, returns either a response or a request to execute tools 2. **Tool execution** - executes the tools that the LLM requested, returns tool results <div style={{ display: "flex", justify…
- `998d09e50a42828d` Custom middleware › Hooks > Node-style hooks
  > Run sequentially at specific execution points. Use for logging, validation, and state updates. Choose the hooks your middleware needs. You can choose between node-style hooks and wrap-style hooks. **Node-style hooks** run at specific execution points: | Hook | When it runs | |------|-------------| |…

## q068 · version_new · langchain · holdout

**When is it beneficial to use the Graph API for managing workflows?**

- `193d244c1695a8da` Choosing between Graph and Functional APIs › Detailed comparison > When to use the Graph API (seed)
  > The [Graph API](/oss/langgraph/graph-api) uses a declarative approach where you define nodes, edges, and shared state to create a visual graph structure. **1. Complex decision trees and branching logic** When your workflow has multiple decision points that depend on various conditions, the Graph API…
- `f44481b963d0144f` Choosing between Graph and Functional APIs › 
  > LangGraph provides two different APIs to build agent workflows: the **Graph API** and the **Functional API**. Both APIs share the same underlying runtime and can be used together in the same application, but they are designed for different use cases and development preferences. This guide will help …
- `9c30dfb7f2302370` Functional API overview › Functional API vs. Graph API
  > * **Control flow**: The Functional API does not require thinking about graph structure. You can use standard Python constructs to define workflows. This will usually trim the amount of code you need to write. * **Short-term memory**: The **GraphAPI** requires declaring a [**State**](/oss/langgraph/g…
- `9cbbf083764febdd` Functional API overview › Functional API vs. Graph API
  > For users who prefer a more declarative approach, LangGraph's [Graph API](/oss/langgraph/graph-api) allows you to define workflows using a Graph paradigm. Both APIs share the same underlying runtime, so you can use them together in the same application. Here are some key differences:…
- `4dd101482b2545a3` Choosing between Graph and Functional APIs › Quick decision guide
  > Use the **Graph API** when you need: - **Complex workflow visualization** for debugging and documentation - **Explicit state management** with shared data across multiple nodes - **Conditional branching** with multiple decision points - **Parallel execution paths** that need to merge later - **Team …
- `7afb1609770c943a` Choosing between Graph and Functional APIs › Detailed comparison > When to use the Graph API
  > ```python # Parallel processing of multiple data sources workflow.add_node("fetch_news", fetch_news) workflow.add_node("fetch_weather", fetch_weather) workflow.add_node("fetch_stocks", fetch_stocks) workflow.add_node("combine_data", combine_all_data) # All fetch operations run in parallel workflow.a…
- `3acbe28b773642b6` Choosing between Graph and Functional APIs › Summary
  > Choose the **Graph API** when you need explicit control over workflow structure, complex branching, parallel processing, or team collaboration benefits. Choose the **Functional API** when you want to add LangGraph features to existing code with minimal changes, have simple linear workflows, or need …
- `05c214d5d8b5af72` Choosing between Graph and Functional APIs › Detailed comparison > When to use the Graph API
  > ```python # Multiple nodes can access and modify shared state class WorkflowState(TypedDict): user_input: str search_results: list generated_response: str validation_status: str def search_node(state): # Access shared state results = search(state["user_input"]) return {"search_results": results} def…
- `8506dde410a4a5f0` Choosing between Graph and Functional APIs › Migration between APIs > From Functional to Graph API
  > ```python # Before: Functional API @entrypoint(checkpointer=checkpointer) def complex_workflow(input_data: dict) -> dict: step1 = process_step1(input_data).result() if step1["needs_analysis"]: analysis = analyze_data(step1).result() if analysis["confidence"] > 0.8: result = high_confidence_path(anal…

## q069 · version_new · langchain · holdout

**How can I prevent a long-running task from being stopped due to inactivity in langgraph?**

- `48b6cee7b9117b6b` Fault tolerance › Timeouts > Idle timeout > Manual heartbeats (seed)
  > For long-running work that doesn't naturally emit progress signals, call `runtime.heartbeat()` to manually reset the idle clock: ```python from langgraph.graph import StateGraph, START, END from langgraph.runtime import Runtime from langgraph.types import TimeoutPolicy from typing_extensions import …

## q070 · version_new · langchain · holdout

**How do you enable data protection automatically when using LangSmith?**

- `2930bd0a9a89de23` Checkpointers › Checkpointer libraries > Serializer > Encryption (seed)
  > When running on LangSmith, encryption is automatically enabled whenever `LANGGRAPH_AES_KEY` is present, so you only need to provide the environment variable. Other encryption schemes can be used by implementing @[`CipherProtocol`] and supplying it to @[`EncryptedSerializer`].…
- `72fcc0963d26d57b` Checkpointers › 
  > A checkpointer saves a snapshot of graph state at each super-step, organized into **threads**. Compile a graph with a checkpointer to enable human-in-the-loop workflows, time travel debugging, fault-tolerant execution, and conversational memory. ![Checkpoints](/oss/images/checkpoints.jpg) **Agent Se…

## q071 · version_new · langchain · holdout

**How can I restrict the number of times an agent calls a specific tool or all tools to avoid excessive API usage?**

- `ede23723bb143db7` Prebuilt middleware › Provider-agnostic middleware > Tool call limit (seed)
  > Control agent execution by limiting the number of tool calls, either globally across all tools or for specific tools. Tool call limits are useful for the following: - Preventing excessive calls to expensive external APIs. - Limiting web searches or database queries. - Enforcing rate limits on specif…
- `d640997127048a72` Prebuilt middleware › Provider-agnostic middleware > Tool call limit
  > Exit behaviors: - `'continue'` (default) - Block exceeded calls with error messages, agent continues - `'error'` - Raise exception immediately - `'end'` - Stop with ToolMessage + AI message (single-tool scenarios only) ```python from langchain.agents import create_agent from langchain.agents.middlew…

## q072 · version_new · langchain · holdout

**How can I limit the execution time of an asynchronous node in langgraph?**

- `d27b236f805ef7c1` Fault tolerance › Timeouts (seed)
  > Requires `langgraph>=1.2`. The `timeout=` parameter on @[`add_node`] caps how long a single node attempt may run. Pass a number (seconds), a `timedelta`, or a @[`TimeoutPolicy`] for separate run and idle limits: ```python from datetime import timedelta from langgraph.types import TimeoutPolicy # Sim…
- `7917fd0f93a924d8` Use the graph API › Set node timeouts
  > Use the `timeout` parameter with @[`add_node`] to limit how long a single async node invocation can run. Provide the timeout in seconds or as a `datetime.timedelta`. ```python import asyncio from typing_extensions import TypedDict from langgraph.errors import NodeTimeoutError from langgraph.graph im…
- `003bfdcdeafde15a` Use the graph API › Configure node timeouts
  > The `timeout=` parameter on @[`add_node`] caps how long a single async node attempt may run. Pass a number (seconds), a `timedelta`, or a @[`TimeoutPolicy`] for finer control over run and idle timeouts. When the limit is exceeded, LangGraph raises @[`NodeTimeoutError`] and lets the retry policy deci…

## q073 · unanswerable · langchain · holdout

**How do I configure the StreamingBufferSize parameter for streaming optimization?**

_No gold: the right outcome is “Not enough evidence”._


## q074 · unanswerable · langchain · tuning

**How do I enable real-time video processing with the VideoStreamProcessor class?**

_No gold: the right outcome is “Not enough evidence”._


## q075 · unanswerable · langchain · tuning

**Can I use the StoreSyncInterval setting to control store synchronization frequency?**

_No gold: the right outcome is “Not enough evidence”._


## q076 · unanswerable · langchain · tuning

**How does the GraphAPIClient.authenticateWithToken method work for API authentication?**

_No gold: the right outcome is “Not enough evidence”._


## q077 · unanswerable · langchain · holdout

**Is there a Models.loadPretrainedModel function to load pretrained models directly?**

_No gold: the right outcome is “Not enough evidence”._


## q078 · unanswerable · langchain · holdout

**What does the Guardrails.enableStrictMode flag do in guardrail enforcement?**

_No gold: the right outcome is “Not enough evidence”._


## q079 · unanswerable · langchain · holdout

**Is there a function to automatically generate 3D models from text descriptions?**

_No gold: the right outcome is “Not enough evidence”._


## q080 · unanswerable · langchain · holdout

**Does the Quickstart.runTutorial method provide an interactive tutorial?**

_No gold: the right outcome is “Not enough evidence”._


## q081 · unanswerable · langchain · holdout

**What features does the GraphAPIOverview.getEndpointList method provide?**

_No gold: the right outcome is “Not enough evidence”._


## q082 · unanswerable · langchain · holdout

**How can I use the NeuralNetOptimizer setting to improve AI training speed?**

_No gold: the right outcome is “Not enough evidence”._


## q083 · unanswerable · langchain · tuning

**Can the TestSuite.runStressTests function be used for performance testing?**

_No gold: the right outcome is “Not enough evidence”._


## q084 · unanswerable · langchain · tuning

**What is the role of the AgentManager.spawnAgent method in agent lifecycle?**

_No gold: the right outcome is “Not enough evidence”._


## q085 · unanswerable · langchain · holdout

**Does the library support blockchain transaction validation via the validateTransaction method?**

_No gold: the right outcome is “Not enough evidence”._


## q086 · unanswerable · langchain · holdout

**Is there a Tools.executeDiagnostics function for runtime diagnostics?**

_No gold: the right outcome is “Not enough evidence”._


## q087 · unanswerable · langchain · tuning

**What is the syntax for the AutoTranslateMiddleware to support multilingual chat?**

_No gold: the right outcome is “Not enough evidence”._


## q088 · unanswerable · langchain · tuning

**Can I configure the library to perform real-time facial recognition with FaceIDRecognizer?**

_No gold: the right outcome is “Not enough evidence”._


## q089 · unanswerable · cookbook · tuning

**How do I enable the fastSearchMode parameter in the embeddings-based search function?**

_No gold: the right outcome is “Not enough evidence”._


## q090 · unanswerable · cookbook · holdout

**Is there a function called optimizeFunctionCalls to improve API response times?**

_No gold: the right outcome is “Not enough evidence”._


## q091 · unanswerable · cookbook · holdout

**Can I use the setDisplayTheme function to customize pandas output colors?**

_No gold: the right outcome is “Not enough evidence”._


## q092 · unanswerable · cookbook · holdout

**Does the library support a class named AdvancedGraphRetriever for enhanced graph database queries?**

_No gold: the right outcome is “Not enough evidence”._


## q093 · unanswerable · cookbook · holdout

**How do I enable real-time voice transcription using the function transcribe_live_audio?**

_No gold: the right outcome is “Not enough evidence”._


## q094 · unanswerable · cookbook · holdout

**Is there a parameter called maxTokenWindow to extend the model's context length?**

_No gold: the right outcome is “Not enough evidence”._


## q095 · unanswerable · cookbook · holdout

**Does the library provide a function called embedAudioFiles for embedding sound data?**

_No gold: the right outcome is “Not enough evidence”._


## q096 · unanswerable · cookbook · holdout

**How do I configure the rerankThreshold setting in search reranking with cross-encoders?**

_No gold: the right outcome is “Not enough evidence”._


## q097 · cross_workspace · langchain · holdout

**How does the combined approach generate and utilize multiple queries to improve retrieval results?**

_No gold: the right outcome is “Not enough evidence”._


## q098 · cross_workspace · langchain · holdout

**How should you avoid addressing the reader's presumed thoughts or actions when writing instructions?**

_No gold: the right outcome is “Not enough evidence”._


## q099 · cross_workspace · langchain · holdout

**How can I find top locations of a specific category close to a given area based on user preferences and context?**

_No gold: the right outcome is “Not enough evidence”._


## q100 · cross_workspace · langchain · holdout

**How do David Dohan et al. interpret building reliable systems from less reliable components in their paper Language Model Cascades?**

_No gold: the right outcome is “Not enough evidence”._


## q101 · cross_workspace · langchain · holdout

**What accuracy improvement was observed on benchmarks with long reasoning chains using code-davinci-002 in the least-to-most approach?**

_No gold: the right outcome is “Not enough evidence”._


## q102 · cross_workspace · langchain · holdout

**What libraries do I need to install to run the example code for processing Amazon fine-food reviews?**

_No gold: the right outcome is “Not enough evidence”._


## q103 · cross_workspace · langchain · tuning

**What is the maximum text length supported by the gpt-4o-mini model?**

_No gold: the right outcome is “Not enough evidence”._


## q104 · cross_workspace · langchain · holdout

**How can section titles improve the ease of skimming content?**

_No gold: the right outcome is “Not enough evidence”._


## q105 · cross_workspace · langchain · holdout

**Which athletes won the gold medal in curling at the 2022 Winter Olympics?**

_No gold: the right outcome is “Not enough evidence”._


## q106 · cross_workspace · langchain · holdout

**How should technical writing be adjusted for readers with varying language skills and knowledge levels?**

_No gold: the right outcome is “Not enough evidence”._


## q107 · cross_workspace · langchain · holdout

**How did OpenAI train a model to select the best solution for grade school math problems in 2021?**

_No gold: the right outcome is “Not enough evidence”._


## q108 · cross_workspace · langchain · tuning

**What is the cost of using gpt-4o-mini for processing a 256px by 256px image?**

_No gold: the right outcome is “Not enough evidence”._


## q109 · cross_workspace · langchain · tuning

**When were the research papers mentioned in the passage published?**

_No gold: the right outcome is “Not enough evidence”._


## q110 · cross_workspace · langchain · holdout

**What parameters does the find_similar_items function accept and what do they represent?**

_No gold: the right outcome is “Not enough evidence”._


## q111 · cross_workspace · langchain · holdout

**How can I measure recall, precision, MRR, and MAP metrics at a specific k value in a vector-based document retrieval system?**

_No gold: the right outcome is “Not enough evidence”._


## q112 · cross_workspace · langchain · tuning

**How should topic sentences be structured to improve skimming efficiency?**

_No gold: the right outcome is “Not enough evidence”._


## q113 · cross_workspace · cookbook · tuning

**How do you set the maximum number of super-steps for a graph execution using the config dictionary in the invoke method?**

_No gold: the right outcome is “Not enough evidence”._


## q114 · cross_workspace · cookbook · holdout

**How can a node detect if a graceful shutdown has been initiated to avoid unnecessary processing?**

_No gold: the right outcome is “Not enough evidence”._


## q115 · cross_workspace · cookbook · tuning

**How can I efficiently store frequently updated data that grows large over time to reduce checkpoint size?**

_No gold: the right outcome is “Not enough evidence”._


## q116 · cross_workspace · cookbook · holdout

**How should storage keys be designed to enable efficient direct lookup by checkpoint ID?**

_No gold: the right outcome is “Not enough evidence”._


## q117 · cross_workspace · cookbook · tuning

**How can I define a state schema to track multiple values in LangGraph's graph API?**

_No gold: the right outcome is “Not enough evidence”._


## q118 · cross_workspace · cookbook · holdout

**How do you set a time to live of 120 seconds for a node in LangGraph?**

_No gold: the right outcome is “Not enough evidence”._


## q119 · cross_workspace · cookbook · holdout

**How can I set different data formats for the input and result of a StateGraph?**

_No gold: the right outcome is “Not enough evidence”._


## q120 · cross_workspace · cookbook · tuning

**How do providers handle automatic cost savings when repeated requests are made?**

_No gold: the right outcome is “Not enough evidence”._

