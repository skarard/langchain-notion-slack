import { ConversationalRetrievalQAChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import weaviate from "weaviate-ts-client";
import config from "./config";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "langchain";

import * as fs from "fs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const memory = new BufferMemory();

/* Initialize the LLM to use to answer the question */
const model = new OpenAI({});

/* Something wrong with the weaviate-ts-client types, so we need to disable */
const client = weaviate.client({
  scheme: config.WEAVIATE_SCHEME,
  host: config.WEAVIATE_HOST,
  apiKey: new weaviate.ApiKey(config.WEAVIATE_TOKEN),
});

/* Initialize the vector store to use to retrieve the answer */
const vectorStore = new WeaviateStore(
  new OpenAIEmbeddings({ openAIApiKey: config.OPENAI_API_KEY }),
  {
    client,
    indexName: config.WEAVIATE_INDEX,
  }
);

const qaTemplate = `The response should use positive and enthusiastic language an informal and conversational language to create a warm and approachable tone. It should integrate examples and anecdotes. Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.

{context}

Question: {question}
Positive and enthusiastic answer:`;

/* Create the chain */
const chain = ConversationalRetrievalQAChain.fromLLM(
  model,
  vectorStore.asRetriever(),
  {
    qaTemplate,
  }
);

export async function callChain(question: string) {
  return chain.call({ question, chat_history: memory });
}

export async function initData() {
  console.log("Init Data");
  /* Load in the file we want to do question answering over */
  const text = fs.readFileSync("TB.data.md", "utf8");
  /* Split the text into chunks */
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  const docs = await textSplitter.createDocuments([text]);
  console.log(docs.length);

  /* Create the vectorstore */
  await WeaviateStore.fromDocuments(
    docs,
    new OpenAIEmbeddings({ openAIApiKey: config.OPENAI_API_KEY }),
    {
      client,
      indexName: config.WEAVIATE_INDEX,
    }
  ).then((res) => console.log("Init Vector Store"));
}
