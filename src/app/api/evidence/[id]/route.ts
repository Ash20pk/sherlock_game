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
    const { searchParams } = new URL(request.url);
    const evidenceType = searchParams.get('type');
    const title = searchParams.get('title');
    const content = searchParams.get('content');
    const solution = searchParams.get('solution');

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a Victorian-era police evidence clerk, tasked with creating detailed evidence reports.
          
          Current Evidence:
          Type: ${evidenceType}
          Title: ${title}
          Content: ${content}
          
          Requirements:
          1. Generate appropriate metadata (date, location, case number)
          2. Create a brief description (10-20 words)
          3. Format the evidence content to be text-based and decodable
          4. No sensory clues, focus on written/visual information
          5. Return content in valid JSON format with:
             - metadata: { date, location, caseNumber }
             - description: brief summary
             - content: main evidence text`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const generatedContent = JSON.parse(response.choices[0].message.content || '{}');

    return NextResponse.json({
      metadata: generatedContent.metadata,
      description: generatedContent.description,
      content: generatedContent.content
    });

  } catch (error: any) {
    console.error('Error generating evidence:', error);
    return NextResponse.json(
      { error: 'Failed to generate evidence' },
      { status: 500 }
    );
  }
}
