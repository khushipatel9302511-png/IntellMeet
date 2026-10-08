import { Router, Request, Response } from 'express'
import { generateMeetingSummary } from '../services/aiSummaryService'

const router = Router()

router.post(
  '/generate',
  async (req: Request, res: Response) => {
    console.log('[AI Summary] Generate request received')

    try {
      const { transcript } = req.body

      console.log(
        '[AI Summary] Transcript received:',
        typeof transcript,
        transcript?.length || 0
      )

      if (
        !transcript ||
        typeof transcript !== 'string' ||
        !transcript.trim()
      ) {
        console.log(
          '[AI Summary] Transcript validation failed'
        )

        return res.status(400).json({
          message: 'Transcript is required.',
        })
      }

      console.log(
        '[AI Summary] Calling OpenAI service...'
      )

      const summary =
        await generateMeetingSummary(
          transcript
        )

      console.log(
        '[AI Summary] Summary generated successfully'
      )

      return res.status(200).json({
        summary,
      })
    } catch (error) {
      console.error(
        '[AI Summary] FULL ERROR:',
        error
      )

      if (error instanceof Error) {
        console.error(
          '[AI Summary] Error message:',
          error.message
        )

        console.error(
          '[AI Summary] Error stack:',
          error.stack
        )
      }

      return res.status(500).json({
        message:
          'Unable to generate meeting summary.',
      })
    }
  }
)

export default router