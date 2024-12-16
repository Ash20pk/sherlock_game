import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateEvidencePrompt = (type: string, description: string, hints: string, solution: string) => {
  const basePrompt = `You are a Victorian-era police evidence clerk, tasked with creating detailed evidence reports.
  
Current Case Information:
Type: ${type}
Description: ${description}
Hints: ${hints}
Required Solution: ${solution}

Your task is to create compelling evidence that will lead an investigator to discover the solution through careful analysis.`;

  const typeSpecificPrompts: { [key: string]: string } = {
    'RIDDLE': `Create a cryptic riddle or poem that, when solved correctly, leads to the solution: "${solution}".
Requirements:
- Use Victorian-era appropriate language and references
- Include subtle hints or wordplay that point to the solution
- Make it challenging but solvable with careful thought
- Ensure all clues are text-based (no visual or audio elements)`,

    'PUZZLES': `Create a puzzle or coded message that, when decoded, reveals the solution: "${solution}".
Requirements:
- Use period-appropriate ciphers or codes (e.g., substitution ciphers, number codes)
- Include a subtle hint about the decoding method
- Make it challenging but solvable with logical deduction
- Ensure all elements are text-based`,

    'MEDICAL': `Create a medical report or autopsy finding that contains clues leading to the solution: "${solution}".
Requirements:
- Use Victorian medical terminology
- Include relevant symptoms, observations, or test results
- Embed subtle medical clues that point to the solution
- Keep it scientifically plausible for the era`,

    'LOGIC': `Create a logical puzzle or timeline that, when analyzed, reveals the solution: "${solution}".
Requirements:
- Present a series of connected events or statements
- Include temporal or causal relationships
- Ensure the solution can be deduced through logical reasoning
- Make it complex enough to require careful analysis`,

    'ACTION': `Create a detailed scene description or witness statement that points to the solution: "${solution}".
Requirements:
- Include relevant environmental details
- Embed subtle behavioral clues
- Make observations that would be notable to a detective
- Keep the narrative engaging and period-appropriate`
  };

  return basePrompt + '\n\n' + (typeSpecificPrompts[type] || typeSpecificPrompts['ACTION']) + `

Output Format Requirements:
1. Return a JSON object with the following structure:
{
  "metadata": {
    "date": "Victorian-era date",
    "location": "Specific London location",
    "caseNumber": "Unique case reference",
    "evidenceType": "Type of evidence (document, letter, report, etc.)"
  },
  "description": "Brief 10-20 word summary of the evidence",
  "content": "The main evidence text that leads to the solution",
  "content-type": "${type}",
  "hints": ["2-3 subtle hints that could help solve the puzzle without giving away the solution"]
}

2. Ensure all content is:
   - Historically accurate for Victorian London
   - Text-based and fully decodable
   - Challenging but fair
   - Leading to the specified solution through logical deduction`;
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const evidenceType = searchParams.get('type') || 'ACTION';
    const description = searchParams.get('description') || '';
    const hints = searchParams.get('hint') || '';
    const solution = searchParams.get('solution') || '';

    const prompt = generateEvidencePrompt(evidenceType, description, hints, solution);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const generatedContent = JSON.parse(response.choices[0].message.content || '{}');

    return NextResponse.json({
      metadata: generatedContent.metadata,
      description: generatedContent.description,
      content: generatedContent.content,
      'content-type': generatedContent['content-type']
    });

  } catch (error: any) {
    console.error('Error generating evidence:', error);
    return NextResponse.json(
      { error: 'Failed to generate evidence' },
      { status: 500 }
    );
  }
}
