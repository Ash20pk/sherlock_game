export async function generateNarration(scene: string, context?: string): Promise<string> {
  try {
    const response = await fetch('/api/narrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scene, context }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate narration');
    }

    const data = await response.json();
    return data.narration;
  } catch (error) {
    console.error('Narration error:', error);
    throw error;
  }
}
