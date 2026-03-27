import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { image, docType } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Missing image data" },
        { status: 400 },
      );
    }

    const isPdf = image.startsWith("data:application/pdf");

    // Strip the data URL prefix to get raw base64
    const base64Data = image.replace(/^data:[^;]+;base64,/, "");

    const prompt =
      docType === "passport"
        ? `You are an ID document scanner. Extract the passport number from this document.
           Return ONLY a JSON object with these fields:
           - "national_id": the passport number (string)
           - "name": full name as shown on the passport (string or null)
           - "confidence": "high", "medium", or "low"

           If you cannot read the passport number clearly, set national_id to null and confidence to "low".
           Return ONLY valid JSON, no other text.`
        : `You are an ID document scanner. Extract the Emirates ID number from this document.
           The Emirates ID number format is typically: 784-YYYY-NNNNNNN-C (15 digits with dashes).

           Return ONLY a JSON object with these fields:
           - "national_id": the Emirates ID number (string)
           - "name": full name as shown on the ID (string or null)
           - "confidence": "high", "medium", or "low"

           If you cannot read the ID number clearly, set national_id to null and confidence to "low".
           Return ONLY valid JSON, no other text.`;

    // Build the content block based on file type
    const fileContent: Anthropic.Messages.ContentBlockParam = isPdf
      ? {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64Data,
          },
        }
      : {
          type: "image",
          source: {
            type: "base64",
            media_type: image.startsWith("data:image/png")
              ? "image/png"
              : "image/jpeg",
            data: base64Data,
          },
        };

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            fileContent,
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract text from response
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response from vision model" },
        { status: 500 },
      );
    }

    // Parse the JSON response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse ID from document" },
        { status: 422 },
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      national_id: parsed.national_id ?? null,
      name: parsed.name ?? null,
      confidence: parsed.confidence ?? "low",
    });
  } catch (err) {
    console.error("Scan ID error:", err);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 },
    );
  }
}
