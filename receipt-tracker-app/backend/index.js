import express from 'express';
import cors from 'cors';
import 'dotenv/config'; 
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Gemini
const ai = new GoogleGenAI({});

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allows sending large image strings

app.post('/api/scan-receipt', async (req, res) => {
  try {
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: image // Pure base64 data string
          }
        },
        "Extract vendor, date, total cost, and a category from this receipt."
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            merchant: { type: "STRING" },
            date: { type: "STRING", description: "YYYY-MM-DD format" },
            total: { type: "NUMBER" },
            category: { type: "STRING", description: "Food, Travel, Shopping, etc." }
          },
          required: ["merchant", "date", "total", "category"]
        }
      }
    });

    const receiptData = JSON.parse(response.text);
    return res.status(200).json({ success: true, data: receiptData });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'AI processing failed' });
  }
});

app.listen(PORT, () => console.log(`Backend live on http://localhost:${PORT}`));