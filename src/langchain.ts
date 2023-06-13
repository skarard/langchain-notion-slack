import {
  ConversationalRetrievalQAChain,
  RetrievalQAChain,
} from "langchain/chains";
import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { BufferMemory } from "langchain/memory";
import { RedisChatMessageHistory } from "langchain/stores/message/redis";

import config from "./config";

import * as fs from "fs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { weaviateClient } from "./weaviate";
import { PromptTemplate } from "langchain/prompts";
import { Document } from "langchain/document";
import { OpenAI } from "langchain/llms/openai";

const multiChoiceQATemplate = `Use the following pieces of context to create a multiple choice question base on the details below with 1 correct answer and 3 incorrect choices. The choices are in an array, include the index of the correct answer. The question, choices array and answer index are seperated by "--- ea07b3b9 ---". For more than on multiple choice question, seperate each question with a new line.

{context}

Each line of the multiple choice question USE ONLY the following format, do not include any prefix or suffix:
"What year was the first Moon landing?" --- ea07b3b9 --- ["1969", "1970", "1971", "1972"] --- ea07b3b9 --- 0\n

Multiple choice question: {question}
RESULT:`;

export async function multiChoiceCallChain(question: string) {
  /* Initialize the models to use */
  const model = new OpenAI({
    modelName: "gpt-3.5-turbo", // modelName: "gpt-3.5-turbo",
    temperature: 0,
  });

  /* Initialize the vector store to use to retrieve the answer */
  const vectorStore = new WeaviateStore(
    new OpenAIEmbeddings({ openAIApiKey: config.OPENAI_API_KEY }),
    {
      client: weaviateClient as any,
      indexName: config.WEAVIATE_INDEX,
    }
  );

  /* Initialize the chain */
  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
    prompt: new PromptTemplate({
      template: multiChoiceQATemplate,
      inputVariables: ["context", "question"],
    }),
  });

  return chain.call({ query: question });
}

export async function addData(docs: Document[]) {
  /* Create the vectorstore */
  await WeaviateStore.fromDocuments(
    docs,
    new OpenAIEmbeddings({ openAIApiKey: config.OPENAI_API_KEY }),
    {
      client: weaviateClient as any,
      indexName: config.WEAVIATE_INDEX,
    }
  ).then((res) => console.log("Init Vector Store"));
}

const questionGeneratorTemplate = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question. Do not invent any new information, only rephrase the question. Do include personally identifiable details from the chat history like name, age, location, etc.

Chat History:
{chat_history}

Follow Up Input: {question}
Standalone question:`;

const qaTemplate = `Either answer with the SQL command in a codeblock or explain what the user can do for you to form the correct answer

Context:
{context}

Question: {question}
answer:`;

export async function callChain(
  question: string,
  { name, userId }: { name: string; userId: string }
) {
  /* Initialize the models to use */
  const fastModel = new OpenAI({
    modelName: "text-davinci-003", // modelName: "gpt-3.5-turbo", "text-davinci-003"
    temperature: 0,
  });
  const slowModel = new OpenAI({
    modelName: "text-davinci-003", // modelName: "gpt-4"
    temperature: 0.5,
  });

  /* Initialize the vector store to use to retrieve the answer */
  const vectorStore = new WeaviateStore(
    new OpenAIEmbeddings({ openAIApiKey: config.OPENAI_API_KEY }),
    {
      client: weaviateClient as any,
      indexName: config.WEAVIATE_INDEX,
      metadataKeys: ["notionId", "url", "properties_title"],
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
    vectorStore.asRetriever(5),
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
      client: weaviateClient as any,
      indexName: config.WEAVIATE_INDEX,
    }
  ).then((res) => console.log("Init Vector Store"));
}
