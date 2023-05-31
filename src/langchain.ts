import { ConversationalRetrievalQAChain } from "langchain/chains";
import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RedisChatMessageHistory } from "langchain/stores/message/redis";

import config from "./config";
import { BufferMemory } from "langchain/memory";

import * as fs from "fs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { weaviateClient } from "./weaviate";
import { PromptTemplate } from "langchain/prompts";
import { ChatOpenAI } from "langchain/chat_models/openai";

const questionGeneratorTemplate = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question. Do not invent any new information, only rephrase the question. Do include personally identifiable details from the chat history like name, age, location, etc.

Chat History:
{chat_history}

Follow Up Input: {question}
Standalone question:`;

const qaTemplate = `The response should use positive, enthusiastic, informal and conversational language to create a warm and approachable tone. It should integrate examples and anecdotes. Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer. Leave the conversation open to a reply, the user SHOULD initiate saying goodbye. Do NOT start OR end the response with an exclimation. Format the answer with Markdown.

Context:
{context}

Question: {question}
Helpful answer:`;

export async function callChain(
  question: string,
  { name, userId }: { name: string; userId: string }
) {
  /* Initialize the models to use */
  const fastModel = new ChatOpenAI({
    modelName: "gpt-3.5-turbo", // modelName: "gpt-3.5-turbo",
    temperature: 0,
  });
  const slowModel = new ChatOpenAI({
    modelName: "gpt-3.5-turbo", // modelName: "gpt-4",
    temperature: 0.5,
  });

  /* Initialize the vector store to use to retrieve the answer */
  const vectorStore = new WeaviateStore(
    new OpenAIEmbeddings({ openAIApiKey: config.OPENAI_API_KEY }),
    {
      client: weaviateClient,
      indexName: config.WEAVIATE_INDEX,
    }
  );

  /* Initialize the memory to use to store the chat history */
  const memory = new BufferMemory({
    chatHistory: new RedisChatMessageHistory({
      sessionId: userId,
      config: {
        url: config.REDIS_URL,
        username: config.REDIS_USER,
        password: config.REDIS_PASSWORD,
      },
    }),
    humanPrefix: name,
    memoryKey: "chat_history",
  });

  /* Initialize the chain */
  const chain = ConversationalRetrievalQAChain.fromLLM(
    slowModel,
    vectorStore.asRetriever(),
    {
      memory,
      questionGeneratorChainOptions: {
        llm: fastModel,
        template: questionGeneratorTemplate,
      },
      qaChainOptions: {
        type: "stuff",
        prompt: new PromptTemplate({
          template: qaTemplate,
          inputVariables: ["context", "question"],
        }),
      },
    }
  );

  return chain.call({ question });
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
      client: weaviateClient,
      indexName: config.WEAVIATE_INDEX,
    }
  ).then((res) => console.log("Init Vector Store"));
}
