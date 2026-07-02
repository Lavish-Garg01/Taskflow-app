// AI-powered task assistant using OpenAI API
// Given a task title (+ optional description), suggests a priority level
// and breaks the task down into actionable subtasks.

const suggestTaskDetails = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: 'Task title is required' });

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ message: 'AI service is not configured' });
    }

    const prompt = `You are a project management assistant. Given a task, respond ONLY with valid JSON (no markdown, no extra text) in this exact shape:
{
  "priority": "low" | "medium" | "high",
  "enhancedDescription": "a clearer, 1-2 sentence version of the task description",
  "subtasks": ["subtask 1", "subtask 2", "subtask 3"]
}

Task title: "${title}"
Task description: "${description || 'No description provided'}"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI error:', errText);
      return res.status(502).json({ message: 'AI suggestion failed, please try again' });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || '{}';
    const cleaned = raw.replace(/```json|```/g, '').trim();

    let suggestion;
    try {
      suggestion = JSON.parse(cleaned);
    } catch (parseErr) {
      return res.status(502).json({ message: 'Could not parse AI response' });
    }

    res.status(200).json({ suggestion });
  } catch (error) {
    console.error('AI suggestion error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { suggestTaskDetails };