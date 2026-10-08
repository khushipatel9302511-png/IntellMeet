import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

export const generateMeetingSummary = async (
  transcript: string
) => {
  if (!transcript.trim()) {
    throw new Error(
      'Transcript is empty. Cannot generate meeting summary.'
    )
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `You are an AI meeting assistant.

Analyze the meeting transcript and create a concise professional meeting summary.

Include these sections:
1. Overview
2. Key Discussion Points
3. Decisions Made
4. Action Items

Do not invent information that is not present in the transcript.

Meeting Transcript:
${transcript}`,
          },
        ],
      },
    ],
  })

  return response.text || ''
}
