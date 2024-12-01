import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { GamePhase } from '@/store/gameState';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Narrative prompts for different game phases
const NARRATIVE_PROMPTS = {
  NARRATOR_INTRODUCTION: `Set the Victorian noir atmosphere for our Sherlock Holmes case. Include:
- Rich description of London's atmosphere
- Time of day and weather
- Brief mention of recent events leading to the case
- Introduction of the initial mystery or crime
Write in a classic noir narrative style.`,

  HOLMES_INITIAL_REACTION: `Write Holmes's initial reaction to the case in his characteristic style. Include:
- His first deductions from the initial information
- A brief exchange with Watson
- His immediate thoughts on the case's peculiarities
- Any preliminary hypotheses
- Watson's medical or practical insights
Maintain Holmes's precise, analytical manner of speaking.`,

  STORY_DEVELOPMENT: `Develop the story with new revelations and developments, incorporating interactive challenges for Watson, the story moves forward with every chapter. Include:

Story Elements:
- New information coming to light
- Character interactions and witness accounts
- Environmental details and atmosphere
- Emerging patterns or contradictions
- Evidence content should be something text based something which can be decoded by words not pictures, always include it with the evidence
- Only 1 type of interactive challenge should be returned (e.g., action, riddle, puzzle, medical, observation, etc.)

Interactive Elements (choose 2-4 based on context):
1. Actions:
   - Options for Watson to choose for story development which leads to the other challenges
   - This should cover 50% of the narrative

2. Riddles:
   - Cryptic messages left by suspects
   - Hidden meanings in newspaper clippings
   - Symbolic patterns at crime scenes
   
3. Puzzles:
   - Locked boxes with combination mechanisms
   - Coded messages requiring decryption
   - Pattern-based security systems
   
4. Medical Challenges:
   - Analyzing unusual symptoms
   - Identifying specific poisons
   - Examining wound patterns
   
5. Observation Tests:
   - Spotting inconsistencies in witness statements
   - Finding hidden details in crime scene
   - Noticing environmental anomalies
   
6. Logic Problems:
   - Timeline reconstructions
   - Suspect alibis verification
   - Connection mapping between evidence

7. Physical Challenges:
   - Lock picking
   - Following tracks
   - Examining specific materials

For each challenge:
- Provide clear but subtle clues
- Make them solvable using available evidence
- Tie them to Watson's medical or military background
- Ensure they advance the story meaningfully

Evidence Types to Include:
- Medical findings (symptoms, injuries, substances)
- Physical clues (footprints, fibers, marks)
- Documents (letters, newspapers, telegrams)
- Witness testimonies
- Environmental details

Format actions as engaging challenges that require careful thought and deduction.
Each action should feel like a mini-puzzle that contributes to the larger mystery.`,

  HOLMES_INVESTIGATION: `Detail Holmes's and Watson's collaborative investigation process. Include:
- Holmes's methodical examination of evidence
- Watson's medical expertise and observations
- Interactions with witnesses or suspects
- Deductive reasoning from both Holmes and Watson
- Discovery of crucial clues
- Specific action choices for Watson based on available evidence
Write with attention to both characters' investigative techniques.`,

  CASE_CONCLUSION: `Write the dramatic conclusion of the case. Include:
- Holmes's masterful revelation of the complete case
- Watson's contributions to solving the mystery
- How different pieces of evidence came together
- The significance of Watson's chosen actions
- The culprit's reaction or capture
- Final deductions from both Holmes and Watson
Write with dramatic flair while acknowledging both characters' roles in solving the case.`,

  EPILOGUE: `Write the epilogue scene. Include:
- Wrap-up of loose ends
- Return to Baker Street
- Holmes's final comments
- Watson's closing thoughts
Write with a sense of completion.`,

  HOLMES_REFLECTION: `Write Holmes's reflection on the case. Include:
- His thoughts on the case's complexities
- How he pieced together the evidence
- Any surprises or challenges he faced
- His final thoughts on the case's outcome
Write in a way that showcases Holmes's analytical mind.`,

  WATSON_REFLECTION: `Write Watson's reflection on the case. Include:
- His thoughts on his role in the investigation
- How he contributed to solving the case
- Any challenges or obstacles he faced
- His final thoughts on the case's outcome
Write in a way that showcases Watson's practical and empathetic nature.`,

};

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

Current Context:
Location: ${context?.currentLocation || 'Unknown'}
Selected Action: ${context?.selectedAction ? JSON.stringify(context.selectedAction) : 'None'}
Available Evidence: ${JSON.stringify(context?.evidence || [])}
Recent Dialogue: ${JSON.stringify(context?.recentDialogue || [])}
Recent Deductions: ${JSON.stringify(context?.recentDeductions || [])}

For the STORY_DEVELOPMENT phase, please ensure there must be only 1 type of interactive challenge at a time:

For the NARRATOR_INTRODUCTION phase, please render the narrative only. Rest should be empty. 

For the HOLMES_INITIAL_REACTION phase, please render the narrative, dialogueEntries and deductions only. Rest should be empty.

Please provide your response in valid JSON format with the following structure:
{
  "narrative": "The main narrative text",
  "dialogueEntries": [
    {"speaker": "HOLMES/WATSON/NARRATOR/LESTRADE/WITNESS", "text": "Their words"}
  ],
  "chapterTitle": "Name of the chapter",
  "deductions": [
    {
      "observation": "What was observed",
      "conclusion": "What it means",
      "confidence": 0-100,
      "author": "HOLMES/WATSON"
    }
  ],
  "evidence": [
    {
      "id": "unique_id",
      "title": "Short name",
      "type": "Type of evidence",
      "content": "content of the evidence",
      "analysis": "Optional analysis of the evidence"
    }
  ],
  "availableActions": [
    {
    "id": "unique_id",
    "text": "Description of the challenge",
    "type": "ACTION/RIDDLE/PUZZLE/MEDICAL/OBSERVATION/LOGIC/PHYSICAL" (choose one per chapter),
    "challenge": { (If type is not ACTION, include this object)
      "question": "The actual riddle or puzzle text, include the evidence contents as required",
      "hints": ["Subtle hint 1", "Subtle hint 2"],
      "solution": "Direct solution in a word or phrase to the challenge",
      "difficulty": "EASY/MEDIUM/HARD"
    },
    "action": { (If type is ACTION, include this object)
      "text": "Description of the action",
      "actionOptions": ["Option 1", "Option 2"],
    },
    "requiresEvidence": ["evidence_ids"],
    "availableFor": "WATSON",
    "reward": {
      "type": "EVIDENCE/DEDUCTION/LOCATION",
      "description": "What solving this challenge reveals"
    }
  ]
}

Ensure your response is ONLY the JSON object, with no additional text before or after.`;

    const response = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a Victorian-era narrator crafting a Sherlock Holmes mystery. You must respond with a valid JSON object containing the narrative elements."
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

    // Create a streaming response using Web Streams API
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const onParse = (event: any) => {
          if (event.choices[0]?.delta?.content) {
            const text = event.choices[0].delta.content;
            controller.enqueue(encoder.encode(text));
          }
        };

        try {
          for await (const chunk of response) {
            onParse(chunk);
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
