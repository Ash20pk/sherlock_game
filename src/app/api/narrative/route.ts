import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { GamePhase } from '@/store/gameState';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Improved narrative prompts with clearer section requirements
const NARRATIVE_PROMPTS = {
  NARRATOR_INTRODUCTION: `Set the Victorian noir atmosphere for our Sherlock Holmes case.
Required sections: NARRATIVE only
Include:
- Rich description of London's atmosphere
- Time of day and weather
- Brief mention of recent events leading to the case
- Introduction of the initial mystery or crime
- Write in a classic noir narrative style.`,

  HOLMES_INITIAL_REACTION: `Write Holmes's initial reaction to the case in his characteristic style.
Required sections: NARRATIVE, DIALOGUE only
Include:
- His first deductions from the initial information
- A brief exchange with Watson
- His immediate thoughts on the case's peculiarities
- Any preliminary hypotheses
- Watson's medical or practical insights
- Maintain Holmes's precise, analytical manner of speaking.`,

  STORY_DEVELOPMENT: `Develop the story with new revelations and developments.
Required sections: CHAPTER, NARRATIVE, DIALOGUE, EVIDENCE, DEDUCTIONS, ACTIONS

Story Elements:
- New information coming to light
- Character interactions and witness accounts
- Environmental details and atmosphere
- Evidence must be text-based, decodable through words not pictures
- Only ONE type of interactive element per chapter

Interactive Element Types (select exactly one):
1. Actions (50% probability):
   - Story development choices for Watson
   
2. Riddles (20% probability):
   - Cryptic messages or hidden meanings
   
3. Puzzles (10% probability):
   - Combination locks or coded messages
   
4. Medical (5% probability):
   - Medical analysis challenges
   
5. Observation (5% probability):
   - Detail-finding challenges
   
6. Logic (5% probability):
   - Timeline or alibi verification
   
7. Physical (5% probability):
   - Material examination or tracking

Challenge Requirements:
- Each challenge must be unique
- Must be contextually appropriate
- Must advance the story
- Include clear but subtle clues
- Tie to Watson's background where appropriate`,

  CASE_CONCLUSION: `Write the dramatic conclusion of the case.
Required sections: NARRATIVE, DIALOGUE, DEDUCTIONS only
Include:
- Holmes's complete case revelation
- Watson's contributions
- Evidence connections
- Culprit's capture
- Final deductions`,

  EPILOGUE: `Write the epilogue scene.
Required sections: NARRATIVE, DIALOGUE only
Include:
- Wrap-up of loose ends
- Return to Baker Street
- Holmes's final comments
- Watson's closing thoughts`
};

// Improved section formatting rules
const SECTION_FORMAT = `
Your response must follow these exact rules:

1. Use these section markers EXACTLY ONCE in this order (include only if content exists):
   ###CHAPTER### (Story Development only)
   ###NARRATIVE###
   ###DIALOGUE###
   ###DEDUCTIONS###
   ###EVIDENCE###
   ###ACTION###

2. Format for each section:
   CHAPTER: Single line chapter title
   NARRATIVE: Continuous single paragraph
   DIALOGUE: array of entries in one single line formatted as:
     ##SPEAKER## [name] ##TEXT## [dialogue] ##SPEAKER## [name] ##TEXT## [dialogue] (Don't use JSON formatting)
   DEDUCTIONS: JSON array of deduction objects
   EVIDENCE: JSON array of evidence objects
   ACTION: JSON array with exactly one challenge object

3. Challenge Object Structure:
   {
     "id": "unique_id",
     "text": "Description",
     "type": "ONE_OF_CHALLENGE_TYPES",
     "challenge": {  // For non-ACTION types
       "question": "Challenge text",
       "hints": ["Hint1", "Hint2"],
       "solution": "Answer to the challenge in one word",
       "difficulty": "EASY/MEDIUM/HARD"
     },
     "action": {  // For ACTION type only
       "text": "Description",
       "actionOptions": ["Option1", "Option2"]
     },
     "requiresEvidence": ["evidence_ids"],
     "availableFor": "WATSON",
     "reward": {
       "type": "EVIDENCE/DEDUCTION/LOCATION",
       "description": "Reward description"
     }
   }

4. Important Rules:
   - Each section marker must appear exactly once or not at all
   - No repeated content within sections
   - No additional formatting or markers
   - Include only sections relevant to the current phase
   - Ensure JSON formatting is valid for DEDUCTIONS, EVIDENCE, and ACTION sections`;

export async function POST(request: Request) {
  try {
    const { phase, context } = await request.json();

    if (!phase || !NARRATIVE_PROMPTS[phase]) {
      return NextResponse.json(
        { error: 'Invalid game phase' },
        { status: 400 }
      );
    }

    const prompt = `${NARRATIVE_PROMPTS[phase]}

${SECTION_FORMAT}

Current Context:
Location: ${context?.currentLocation || 'Unknown'}
Selected Action: ${context?.selectedAction ? JSON.stringify(context.selectedAction) : 'None'}
Available Evidence: ${JSON.stringify(context?.evidence || [])}
Recent Dialogue: ${JSON.stringify(context?.recentDialogue || [])}
Recent Deductions: ${JSON.stringify(context?.recentDeductions || [])}`;

    const response = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a Victorian-era narrator crafting a Sherlock Holmes mystery. Follow the section formatting rules exactly. Never duplicate section markers and follow the order"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });

    // Improved streaming response handler
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sections = new Set();
        let currentSection = null;
        let buffer = '';

        const processSectionMarker = (text) => {
          const markerMatch = text.match(/###(\w+)###/);
          if (markerMatch) {
            const section = markerMatch[1];
            if (sections.has(section)) {
              return false;
            }
            sections.add(section);
            currentSection = section;
            // Send the section marker immediately
            controller.enqueue(encoder.encode(text));
            return false; // Don't send the marker again
          }
          return true;
        };

        const onParse = (event: any) => {
          if (event.choices[0]?.delta?.content) {
            const text = event.choices[0].delta.content;
            
            // If we encounter a section marker in the buffer, process it first
            if (buffer) {
              if (buffer.includes('###')) {
                const parts = buffer.split(/(###\w+###)/);
                parts.forEach(part => {
                  if (part) {
                    if (processSectionMarker(part)) {
                      controller.enqueue(encoder.encode(part));
                    }
                  }
                });
                buffer = '';
              } else {
                controller.enqueue(encoder.encode(buffer));
                buffer = '';
              }
            }

            // Process the new text
            if (text.includes('###')) {
              const parts = text.split(/(###\w+###)/);
              parts.forEach(part => {
                if (part) {
                  if (processSectionMarker(part)) {
                    // Stream non-marker text character by character
                    [...part].forEach(char => {
                      controller.enqueue(encoder.encode(char));
                    });
                  }
                }
              });
            } else {
              // Stream regular text character by character
              [...text].forEach(char => {
                controller.enqueue(encoder.encode(char));
              });
            }
          }
        };

        try {
          for await (const chunk of response) {
            onParse(chunk);
          }
          // Flush any remaining buffer
          if (buffer && processSectionMarker(buffer)) {
            controller.enqueue(encoder.encode(buffer));
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error generating narrative:', error);
    return NextResponse.json(
      { error: 'Failed to generate narrative' },
      { status: 500 }
    );
  }
}