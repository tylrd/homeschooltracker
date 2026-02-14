"use server";

import { validateImageFile } from "@/lib/images/validation";

export type LessonTitleSuggestionResult = {
  suggestedTitle: string | null;
  reason: "ok" | "no_api_key" | "no_text" | "invalid_image" | "error";
};

function sanitizeSuggestedTitle(raw: string): string | null {
  const clean = raw
    .replace(/^title\s*[:-]\s*/i, "")
    .replace(/^"|"$/g, "")
    .replace(/^'|'$/g, "")
    .trim();

  if (!clean) {
    return null;
  }

  return clean.slice(0, 120);
}

export async function suggestLessonTitleFromImage(
  formData: FormData,
): Promise<LessonTitleSuggestionResult> {
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return { suggestedTitle: null, reason: "invalid_image" };
  }

  const validation = validateImageFile(file);
  if (!validation.ok) {
    return { suggestedTitle: null, reason: "invalid_image" };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { suggestedTitle: null, reason: "no_api_key" };
  }

  const contextName =
    (formData.get("resourceName") as string | null)?.trim() ||
    (formData.get("sharedCurriculumName") as string | null)?.trim() ||
    "";

  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const model = process.env.OPENAI_VISION_MODEL ?? "gpt-4.1-mini";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_output_tokens: 50,
        input: [
          {
            role: "system",
            content:
              "You suggest short homeschool lesson titles from visible textbook or workbook covers. Respond with only one concise title and no extra commentary.",
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: contextName
                  ? `Curriculum context: ${contextName}`
                  : "Curriculum context unknown.",
              },
              {
                type: "input_image",
                image_url: `data:${file.type};base64,${base64}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return { suggestedTitle: null, reason: "error" };
    }

    const json = (await response.json()) as {
      output_text?: string;
    };
    const outputText = json.output_text ?? "";
    const suggestedTitle = sanitizeSuggestedTitle(outputText);

    if (!suggestedTitle) {
      return { suggestedTitle: null, reason: "no_text" };
    }

    return { suggestedTitle, reason: "ok" };
  } catch {
    return { suggestedTitle: null, reason: "error" };
  }
}
