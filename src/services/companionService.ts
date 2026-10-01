import { app } from "@/firebase/config";
import { containsCrisisLanguage } from "@/utils/crisisCheck";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

export const COMPANION_MODEL = "gemini-3.5-flash-lite";
export const MAX_COMPANION_MESSAGES = 20;
export const MAX_COMPANION_MESSAGE_LENGTH = 500;

export const COMPANION_SYSTEM_INSTRUCTION = `You are Breathe Companion, a warm, supportive peer-style companion for university students.
You are not a therapist or doctor. Never diagnose. Never give medical, medication, or treatment advice.
Keep every answer under 120 words. Be kind, practical, and concise. Suggest safe coping techniques such as paced breathing, grounding, a study break, sleep routines, or reaching out to someone trusted.
For anything ongoing or affecting daily life, gently encourage booking a campus counsellor.
If someone mentions self-harm, suicide, wanting to die, or being in immediate danger, do not explore methods or provide instructions. Encourage immediate help and point them to the Breathe Crisis Support screen and emergency services.
Do not ask for or use a student's name, email, ID, uid, anonymous ID, or other identifying information.`;

export type CompanionRole = "user" | "model";

export type CompanionMessage = {
  id: string;
  role: CompanionRole;
  text: string;
};

export type CompanionResult =
  | { kind: "response"; text: string }
  | { kind: "crisis" };

const model = getGenerativeModel(getAI(app, { backend: new GoogleAIBackend() }), {
  model: COMPANION_MODEL,
  systemInstruction: COMPANION_SYSTEM_INSTRUCTION,
  generationConfig: { maxOutputTokens: 220 },
});

function limitResponse(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length > 120 ? `${words.slice(0, 120).join(" ")}…` : text.trim();
}

export async function sendCompanionMessage(
  history: CompanionMessage[],
  text: string,
): Promise<CompanionResult> {
  if (containsCrisisLanguage(text)) return { kind: "crisis" };

  const chat = model.startChat({
    history: history.map(({ role, text: messageText }) => ({
      role,
      parts: [{ text: messageText }],
    })),
  });
  const result = await chat.sendMessage(text);
  return { kind: "response", text: limitResponse(result.response.text()) };
}
