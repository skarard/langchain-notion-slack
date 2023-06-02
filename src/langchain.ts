import { RetrievalQAChain } from "langchain/chains";
import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

import config from "./config";

import * as fs from "fs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { weaviateClient } from "./weaviate";
import { PromptTemplate } from "langchain/prompts";
import { ChatOpenAI } from "langchain/chat_models/openai";

const qaTemplate = `Use the following pieces of context to create a multiple choice question base on the details below with 1 correct answer and 3 incorrect choices. The choices are in an array, include the index of the correct answer. The question, choices array and answer index are seperated by "--- ea07b3b9 ---". For more than on multiple choice question, seperate each question with a new line.

{context}

Multiple choice question and choices in the following format:
"What year was the first Moon landing?" --- ea07b3b9 --- ["1969", "1970", "1971", "1972"] --- ea07b3b9 --- 0

Multiple choice question: {question}
RESULT:`;

export async function callChain(question: string) {
  /* Initialize the models to use */
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo", // modelName: "gpt-3.5-turbo",
    temperature: 0,
  });

  /* Initialize the vector store to use to retrieve the answer */
  const vectorStore = new WeaviateStore(
    new OpenAIEmbeddings({ openAIApiKey: config.OPENAI_API_KEY }),
    {
      client: weaviateClient,
      indexName: config.WEAVIATE_INDEX,
    }
  );

  /* Initialize the chain */
  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
    prompt: new PromptTemplate({
      template: qaTemplate,
      inputVariables: ["context", "question"],
    }),
  });

  return chain.call({ query: question });
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
