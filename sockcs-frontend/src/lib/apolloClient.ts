// src/lib/apolloClient.ts
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const GRAPHQL_URL = "http://10.0.0.47:8000/en/graphql"; // <-- Django

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URL, credentials: "include" }),
  cache: new InMemoryCache(),
});


