import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface SlideGenerationRequest {
  pdfBuffer: Buffer;
  numSlides: number;
  originalName: string;
}

export interface SlideGenerationResponse {
  success: boolean;
  slides?: string;
  error?: string;
}

export async function generateSlidesFromPDF(
  pdfBuffer: Buffer,
  numSlides: number = 5,
  originalName: string = 'document.pdf'
): Promise<SlideGenerationResponse> {
  try {
    // Validate inputs
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return {
        success: false,
        error: "PDF buffer is required"
      };
    }

    if (numSlides < 1 || numSlides > 20) {
      return {
        success: false,
        error: "Number of slides must be between 1 and 20"
      };
    }

    // Validate PDF format
    const header = pdfBuffer.slice(0, 4).toString();
    if (header !== '%PDF') {
      return {
        success: false,
        error: "Invalid PDF file format"
      };
    }

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        success: false,
        error: "Anthropic API key not configured"
      };
    }

    // Convert buffer to base64
    const pdfBase64 = pdfBuffer.toString('base64');

    const msg = await anthropic.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze the attached PDF document and create exactly ${numSlides} slides from it.

Format each slide with:

SLIDE [number]: [Title]
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]

Make sure each slide covers different key aspects of the document and is suitable for a presentation. Focus on the most important information, insights, and findings.

PDF Base64 Data:
${pdfBase64}`
            }
          ]
        }
      ],
    });
    
    // Validate response
    if (!msg.content || !msg.content[0]) {
      return {
        success: false,
        error: "Invalid response from AI service"
      };
    }
    
    const content = msg.content[0];
    if (content.type !== 'text' || typeof content.text !== 'string') {
      return {
        success: false,
        error: "Invalid response format from AI service"
      };
    }
    
    return {
      success: true,
      slides: content.text
    };

  } catch (error) {
    console.error("Error generating slides:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return {
          success: false,
          error: "Invalid or missing Anthropic API key"
        };
      }
      if (error.message.includes('rate limit')) {
        return {
          success: false,
          error: "API rate limit exceeded. Please try again later."
        };
      }
      if (error.message.includes('timeout')) {
        return {
          success: false,
          error: "Request timeout. Please try again."
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

// Clean up uploaded files (optional - call this periodically)
export function cleanupOldFiles(uploadsDir: string, maxAgeHours: number = 24) {
  const fs = require('fs');
  const path = require('path');
  
  if (!fs.existsSync(uploadsDir)) return;
  
  const files = fs.readdirSync(uploadsDir);
  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
  
  files.forEach((file: string) => {
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtime.getTime() > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up old file: ${file}`);
    }
  });
}
