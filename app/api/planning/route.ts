import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { respuestas, nombre } = await req.json()

  const prompt = `
Eres un experto en productividad y planificación personal. 
El usuario se llama ${nombre} y ha respondido lo siguiente sobre su situación actual:

- Hora de levantarse: ${respuestas.wake}
- Hora de acostarse: ${respuestas.sleep}
- Horas de estudio/trabajo al día: ${respuestas.study}
- Deporte: ${respuestas.sport}
- Mayor problema de productividad: ${respuestas.problem}
- Hábitos que quiere construir: ${respuestas.habits}
- Tiempo libre al día: ${respuestas.free}
- Objetivo principal en 3 meses: ${respuestas.goal}

Genera un planning semanal personalizado y realista para ${nombre}. 
Devuelve SOLO un JSON con esta estructura exacta, sin texto extra ni markdown:
{
  "resumen": "2-3 frases personalizadas dirigidas al usuario",
  "dias": [
    {
      "dia": "Lunes",
      "bloques": [
        { "hora": "07:00", "actividad": "...", "tipo": "morning" },
        { "hora": "09:00", "actividad": "...", "tipo": "work" },
        { "hora": "14:00", "actividad": "...", "tipo": "rest" },
        { "hora": "16:00", "actividad": "...", "tipo": "work" },
        { "hora": "19:00", "actividad": "...", "tipo": "sport" },
        { "hora": "22:00", "actividad": "...", "tipo": "night" }
      ]
    }
  ],
  "habitos": ["hábito 1", "hábito 2", "hábito 3"],
  "consejo": "Un consejo personalizado y directo para el usuario"
}
Los tipos posibles son: morning, work, rest, sport, night.
Genera los 7 días de la semana. Sé específico y personalizado con las respuestas del usuario.
`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })

  const data = await response.json()
  const text = data.choices[0].message.content
  
  try {
    const planning = JSON.parse(text)
    return NextResponse.json({ planning })
  } catch {
    return NextResponse.json({ error: 'Error generando el planning' }, { status: 500 })
  }
}
