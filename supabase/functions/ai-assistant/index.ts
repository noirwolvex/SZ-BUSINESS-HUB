import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function getApiKey(): Promise<string | null> {
  const envKey = Deno.env.get("GEMINI_API_KEY");
  if (envKey) return envKey;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return null;

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from("app_secrets")
    .select("value")
    .eq("key", "GEMINI_API_KEY")
    .maybeSingle();

  if (error || !data) return null;
  return data.value;
}

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

function logError(
  status: number,
  errorBody: string,
  requestId: string | null,
): void {
  const timestamp = new Date().toISOString();
  console.error(
    JSON.stringify({
      timestamp,
      model: GEMINI_MODEL,
      httpStatus: status,
      errorBody: errorBody.slice(0, 500),
      requestId,
    }),
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service is not configured. The GEMINI_API_KEY secret is missing." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { action, prompt, documentText, documentBase64, documentMimeType, history, documents } = body as {
      action: "chat" | "summarize" | "extract" | "translate" | "analyze" | "generate" | "search" | "general-chat";
      prompt?: string;
      documentText?: string;
      documentBase64?: string;
      documentMimeType?: string;
      history?: { role: "user" | "assistant"; content: string }[];
      documents?: { name: string; text: string }[];
    };

    if (!prompt && action !== "summarize") {
      return new Response(
        JSON.stringify({ error: "A prompt is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemInstruction = buildSystemInstruction(action);

    const contents: GeminiContent[] = [];

    if (history && history.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    const userParts: GeminiPart[] = [];

    if (documentBase64 && documentMimeType) {
      userParts.push({
        inlineData: { mimeType: documentMimeType, data: documentBase64 },
      });
    }

    if (documentText) {
      userParts.push({
        text: `Document content:\n\n${documentText}\n\n---\n\n${prompt || "Please analyze this document."}`,
      });
    } else if (documents && documents.length > 0) {
      const docContext = documents
        .map((d, i) => `--- Document ${i + 1}: ${d.name} ---\n${d.text}`)
        .join("\n\n");
      userParts.push({
        text: `${prompt}\n\nHere are the documents to search through:\n\n${docContext}`,
      });
    } else if (prompt) {
      userParts.push({ text: prompt });
    }

    contents.push({ role: "user", parts: userParts });

    const geminiRequest = {
      contents,
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    };

    let geminiResponse: Response | null = null;
    let lastErrorBody = "";
    let lastRequestId: string | null = null;
    const maxRetries = 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      geminiResponse = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiRequest),
      });

      if (geminiResponse.ok) break;

      lastErrorBody = await geminiResponse.text();
      lastRequestId = geminiResponse.headers.get("x-goog-request-id") ||
        geminiResponse.headers.get("request-id");

      const isRetryable = geminiResponse.status === 429 ||
        (geminiResponse.status >= 500 && geminiResponse.status < 600);

      if (isRetryable && attempt < maxRetries) {
        const waitMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            model: GEMINI_MODEL,
            httpStatus: geminiResponse.status,
            requestId: lastRequestId,
            message: `Retryable error on attempt ${attempt + 1}, retrying in ${Math.round(waitMs)}ms`,
          }),
        );
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (geminiResponse.status === 429) {
        logError(geminiResponse.status, lastErrorBody, lastRequestId);
        return new Response(
          JSON.stringify({
            error: "The AI service rate limit was reached after multiple retries. Please wait a minute and try again.",
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      logError(geminiResponse.status, lastErrorBody, lastRequestId);
      return new Response(
        JSON.stringify({ error: `AI service returned an error (${geminiResponse.status}). Please try again.` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiResponse!.json();

    const candidates = geminiData?.candidates;
    if (!candidates || candidates.length === 0) {
      const blockedReason = geminiData?.promptFeedback?.blockReason;
      return new Response(
        JSON.stringify({ error: blockedReason ? `Request was blocked: ${blockedReason}` : "No response generated." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const responseText = candidates[0]?.content?.parts
      ?.map((p: GeminiPart) => p.text || "")
      .filter(Boolean)
      .join("\n") || "";

    if (!responseText) {
      const finishReason = candidates[0]?.finishReason;
      return new Response(
        JSON.stringify({ error: `No text in response${finishReason ? ` (finish reason: ${finishReason})` : ""}.` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, response: responseText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        model: GEMINI_MODEL,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred while processing your request." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function buildSystemInstruction(action: string): string {
  const base = "You are SZ TOOLS AI, a helpful assistant integrated into a PDF tooling web app. You help users understand, analyze, and work with their documents. Be concise, accurate, and helpful. Format your responses with clear structure using markdown when appropriate.";

  switch (action) {
    case "summarize":
      return `${base} Your task is to summarize documents. Provide a clear, structured summary with key points. Use bullet points for readability. Highlight the main themes, important data points, and any actionable items.`;
    case "extract":
      return `${base} Your task is to extract structured information from documents. Identify and list entities like names, dates, amounts, addresses, emails, phone numbers, and other key data points. Present them in a clear, organized format.`;
    case "translate":
      return `${base} Your task is to translate document content. Maintain the original meaning and tone while translating accurately. If the user doesn't specify a target language, ask them which language they'd like to translate to.`;
    case "analyze":
      return `${base} Your task is to analyze documents for clauses, risks, and unusual language. Identify any potentially problematic terms, missing protections, or unfavorable conditions. Provide a risk assessment with specific references to the document content.`;
    case "generate":
      return `${base} Your task is to generate well-structured documents based on the user's prompt. Create professional, complete content with proper formatting, headings, and structure. If the user asks for a specific document type (contract, invoice, letter, report, etc.), follow the standard format for that type. Output the document in clean markdown with clear section headings.`;
    case "search":
      return `${base} Your task is to search through the user's uploaded documents and find relevant information matching their query. For each match, cite which document it came from, quote the relevant passage, and explain why it matches the query. If no documents contain relevant information, say so clearly.`;
    case "general-chat":
      return "You are SZ TOOLS AI, a friendly and knowledgeable AI assistant. You can chat about anything — answer questions, explain concepts, help with writing, brainstorm ideas, or just have a conversation. Be helpful, accurate, and engaging. Use markdown formatting when appropriate. Keep responses reasonably concise unless the user asks for detail.";
    default:
      return `${base} Answer questions about the user's document accurately. If the answer isn't in the document, say so clearly. You can also help with general document-related questions.`;
  }
}
