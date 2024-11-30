import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = new URL(request.url).searchParams;
    const evidenceContent = searchParams.get('content');
    const solution = searchParams.get('solution');

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are Sherlock Holmes analyzing evidence in a case. 
          Provide insightful, deductive observations that showcase your analytical prowess.
          Format your response with Victorian flair and attention to detail.`
        },
        {
          role: "user",
          content: `Analyze this evidence keeping in mind the solution: ${solution}
          
          Evidence details:
          ${evidenceContent}
          
          Provide your analysis in your characteristic style, highlighting key deductions and observations.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      id,
      analysis: response.choices[0].message.content || '',
    });

  } catch (error: any) {
    console.error('Error generating Holmes analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate Holmes analysis' },
      { status: 500 }
    );
  }
}
