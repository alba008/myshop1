// src/lib/session.js
import http from "./http";
export async function fetchSession() {
  try {
    return await http.get("/api/session/");
  } catch {
    return {};
  }
}
