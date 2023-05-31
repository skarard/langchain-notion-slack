import weaviate from "weaviate-ts-client";
import config from "./config";

export const weaviateClient = weaviate.client({
  scheme: config.WEAVIATE_SCHEME,
  host: config.WEAVIATE_HOST,
  apiKey: new weaviate.ApiKey(config.WEAVIATE_TOKEN),
});
