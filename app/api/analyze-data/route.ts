import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import formidable from "formidable";
import Papa from "papaparse";
import fs from "fs";
import path from "path";
import { Anthropic } from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});


interface DatasetMetadata {
  columns: string[];
  rowCount: number;
  columnTypes: Record<string, string>;
  missingValues: Record<string, number>;
  duplicateRows: number;
  sampleRows: any[];
}

interface CleaningNote {
  issue: string;
  resolution: string;
  justification: string;
  transformation: string;
}

interface ValidationItem {
  field: string;
  status: "valid" | "warning" | "error";
  message: string;
  count?: number;
}

interface PlotSuggestion {
  type: string;
  x_axis: string;
  y_axis?: string;
  description: string;
}

interface AnalysisResult {
  cleaning_notes: CleaningNote[];
  validation_report: ValidationItem[];
  insights: string[];
  plots: PlotSuggestion[];
}

function analyzeDataset(data: any[]): DatasetMetadata {
  if (!data || data.length === 0) {
    return {
      columns: [],
      rowCount: 0,
      columnTypes: {},
      missingValues: {},
      duplicateRows: 0,
      sampleRows: []
    };
  }

  const columns = Object.keys(data[0] || {});
  const rowCount = data.length;
  const columnTypes: Record<string, string> = {};
  const missingValues: Record<string, number> = {};

  // Analyze each column
  columns.forEach(col => {
    let numericCount = 0;
    let dateCount = 0;
    let missingCount = 0;

    data.forEach(row => {
      const value = row[col];
      if (value === null || value === undefined || value === '' || value === 'N/A' || value === 'null') {
        missingCount++;
      } else if (!isNaN(Number(value)) && value !== '') {
        numericCount++;
      } else if (!isNaN(Date.parse(value))) {
        dateCount++;
      }
    });

    missingValues[col] = missingCount;

    // Determine column type
    const validCount = rowCount - missingCount;
    if (numericCount > validCount * 0.7) {
      columnTypes[col] = 'numeric';
    } else if (dateCount > validCount * 0.7) {
      columnTypes[col] = 'date';
    } else {
      columnTypes[col] = 'text';
    }
  });

  // Count duplicate rows
  const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
  const duplicateRows = rowCount - uniqueRows.size;

  return {
    columns,
    rowCount,
    columnTypes,
    missingValues,
    duplicateRows,
    sampleRows: data.slice(0, 20)
  };
}

async function analyzeWithClaude(metadata: DatasetMetadata): Promise<AnalysisResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not configured");
    return getFallbackAnalysis(metadata);
  }

  const prompt = 
  `
  You are producing a single JSON object that is easy to preview in a web app and easy to convert into Google Slides API requests.

Return ONLY valid RFC 8259 JSON. No markdown. No comments. No extra text.

CONTEXT
- mode: one of "education" or "business".
- source_text: text extracted from a PDF. It may be noisy.
- csv_summary: optional structured summary from CSV/Excel analysis (columns, types, issues, trends). Present only in "business" mode.
- num_slides: integer target for slide count.
- include_images: boolean. If false, do not include any images.
- theme_key: one of ["Material","Simple","Dark","Coral","Ocean","Sunset","Forest","Mono","Slate","Lavender","Emerald","Candy"]. Use this to set colors.
- constraints:
  - slides.length MUST equal num_slides.
  - Keep slide titles ≤ 70 chars; bullet lines ≤ 140 chars; ≤ 6 bullets per slide.
  - Prefer high-signal content, not boilerplate.
  - If unsure about any value, return null or [].
  - Do not invent external image URLs. If images are helpful, output imageSuggestion.query strings. If you know a reliable URL, you MAY include it.

THEME PRESETS
- "Material": {"backgroundColor":"#ffffff","textColor":"#202124","accentColor":"#1a73e8"}
- "Simple":   {"backgroundColor":"#ffffff","textColor":"#111827","accentColor":"#374151"}
- "Dark":     {"backgroundColor":"#111827","textColor":"#F9FAFB","accentColor":"#10B981"}
- "Coral":    {"backgroundColor":"#fff7ed","textColor":"#1f2937","accentColor":"#fb7185"}
- "Ocean":    { backgroundColor: "#0b132b", textColor: "#e0e1dd", accentColor: "#00a8e8"},
- "Sunset":   { backgroundColor: "#1f0a3a", textColor: "#fff7ed", accentColor: "#ff6b6b"},
- "Forest":   { backgroundColor: "#0b2614", textColor: "#e5f4ea", accentColor: "#34d399"},
- "Mono":     { backgroundColor: "#ffffff", textColor: "#0f172a", accentColor: "#0f172a"},
- "Slate":    { backgroundColor: "#0f172a", textColor: "#e2e8f0", accentColor: "#64748b"},
- "Lavender": { backgroundColor: "#f5f3ff", textColor: "#312e81", accentColor: "#8b5cf6"},
- "Emerald":  { backgroundColor: "#052e2b", textColor: "#d1fae5", accentColor: "#34d399"},
- "Candy":    { backgroundColor: "#fff1f2", textColor: "#1f2937", accentColor: "#ec4899"},

ALLOWED LAYOUTS (pick one per slide)
["TITLE","TITLE_AND_BODY","SECTION_HEADER","TWO_COLUMN","IMAGE_ONLY","QUOTE","BULLETS"]

GOOGLE SLIDES API SHAPES (for planning)
- Shapes: "TEXT_BOX" for text content.
- Images: use "createImage" with a sourceUrl (only if you provided a URL); otherwise omit.
- Use deterministic objectIds so a client can build a batchUpdate: 
  - slide IDs: "s1","s2",... 
  - title box: "s{n}_title" 
  - body box: "s{n}_body" 
  - left/right columns: "s{n}_col1","s{n}_col2"
  - image: "s{n}_img1","s{n}_img2"
- Do not include a presentationId. The client will supply it.

OUTPUT SHAPE
{
  "success": boolean,
  "presentationTitle": string|null,
  "mode": "education"|"business",
  "theme": {
    "key": "Material"|"Simple"|"Dark"|"Coral"|"Ocean"|"Sunset"|"Forest"|"Mono"|"Slate"|"Lavender"|"Emerald"|"Candy",
    "backgroundColor": string,   // hex
    "textColor": string,         // hex
    "accentColor": string,       // hex
    "backgroundImageUrl": string|null
  },
  "slides": [
    {
      "id": "s1",
      "layout": "TITLE_AND_BODY",
      "title": string,
      "bullets": [string, ...],      // 0-6 items
      "notes": string|null,
      "image": {
        "url": string|null,          // only if you are confident the URL is stable
        "background": boolean,       // true => use as slide background
        "alt": string|null,
        "imageSuggestion": { "query": string|null } // if url is null and include_images=true
      }
    }
  ],
  "analysis": {                     // present in both modes; richer in "business"
    "trends": [string, ...],
    "discrepancies": [
      {
        "id": string,               // stable slug like "missing-dates"
        "severity": "low"|"medium"|"high",
        "description": string,
        "evidence": [string, ...],  // short quotes, column names, counts
        "proposed_fix": string|null
      }
    ]
  },
  "slides_api_plan": {              // plan the Google Slides API requests; the client will send them
    "requests": [
      // Create slides with predefined layouts
      { "createSlide": { "objectId": "s1", "slideLayoutReference": { "predefinedLayout": "TITLE_AND_BODY" } } },
      // Create title box, body box, images, and insert text/bullets
      { "createShape": { "objectId": "s1_title", "shapeType": "TEXT_BOX", "elementProperties": { "pageObjectId": "s1", "size": { "width": { "magnitude": 700, "unit": "PT" }, "height": { "magnitude": 60, "unit": "PT" } }, "transform": { "scaleX": 1, "scaleY": 1, "translateX": 40, "translateY": 60, "unit": "PT" } } } },
      { "insertText": { "objectId": "s1_title", "insertionIndex": 0, "text": "<title for s1>" } },
      { "createShape": { "objectId": "s1_body", "shapeType": "TEXT_BOX", "elementProperties": { "pageObjectId": "s1", "size": { "width": { "magnitude": 700, "unit": "PT" }, "height": { "magnitude": 360, "unit": "PT" } }, "transform": { "scaleX": 1, "scaleY": 1, "translateX": 40, "translateY": 140, "unit": "PT" } } } },
      { "insertText": { "objectId": "s1_body", "insertionIndex": 0, "text": "- bullet one\n- bullet two" } },
      { "createParagraphBullets": { "objectId": "s1_body", "textRange": { "type": "ALL" }, "bulletPreset": "BULLET_DISC_CIRCLE_SQUARE" } },
      // Optional image if a URL is present for that slide (omit if url is null)
      { "createImage": { "objectId": "s1_img1", "url": "https://example.com/image.jpg", "elementProperties": { "pageObjectId": "s1", "size": { "width": { "magnitude": 300, "unit": "PT" }, "height": { "magnitude": 200, "unit": "PT" } }, "transform": { "scaleX": 1, "scaleY": 1, "translateX": 440, "translateY": 160, "unit": "PT" } } } },
      // Example: set slide background color to theme.backgroundColor
      { "updatePageProperties": { "objectId": "s1", "fields": "pageBackgroundFill.solidFill.color", "pageProperties": { "pageBackgroundFill": { "solidFill": { "color": { "rgbColor": { "red": 1, "green": 1, "blue": 1 } } } } } } }
    ],
    "notes": "Requests are examples. Repeat per slide with your deterministic objectIds. Omit createImage when image.url is null."
  }
}

INSTRUCTIONS
1) Read the inputs, produce a crisp deck. Use num_slides exactly.
2) Use theme_key to set theme colors from the presets above. You may keep deck.theme.backgroundImageUrl = null.
3) For "education", focus on clear teaching flow: title, outline, key ideas, examples, recap.
4) For "business", include a short analysis section with trends and discrepancies that a user can choose to include in slides.
5) In slides_api_plan.requests, include enough operations to:
   - create each slide with a predefined layout,
   - add title and body text boxes,
   - insert the bullet text and turn it into bullet lists,
   - optionally add an image if image.url is provided,
   - optionally set slide background to the theme background color.
   Keep IDs deterministic as specified. Do NOT include presentationId.
6) Output only the JSON object.

INPUTS
{
  "mode": "MODE_HERE",                       // "education" or "business"
  "source_text": "SOURCE_TEXT_HERE",
  "csv_summary": CSV_SUMMARY_OR_NULL,        // null for education
  "num_slides": NUM_SLIDES_HERE,             // integer
  "include_images": INCLUDE_IMAGES_BOOL,     // true or false
  "theme_key": "THEME_KEY_HERE"              // Material|Simple|Dark|Coral
}

  `;

  try {
    console.log("Calling Claude API...");
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    console.log("Claude API response received");
    const content = response.content[0];
    if (content.type === "text") {
      console.log("Claude response text:", content.text.substring(0, 500) + "...");
      
      // Extract JSON from the response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("Successfully parsed Claude response");
        return parsed;
      } else {
        console.error("No JSON found in Claude response");
      }
    }

    throw new Error("Failed to parse Claude response");
  } catch (error: any) {
    console.error("Claude analysis error:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      type: error.type
    });
    
    return getFallbackAnalysis(metadata);
  }
}

function getFallbackAnalysis(metadata: DatasetMetadata): AnalysisResult {
  const cleaningNotes: CleaningNote[] = [];
  const validationReport: ValidationItem[] = [];
  
  // Generate basic analysis based on metadata
  Object.entries(metadata.missingValues).forEach(([column, count]) => {
    if (count > 0) {
      const percentage = ((count / metadata.rowCount) * 100).toFixed(1);
      cleaningNotes.push({
        issue: `Missing values in column '${column}'`,
        resolution: `Found ${count} missing values (${percentage}%)`,
        justification: `Consider imputation strategy based on data type: ${metadata.columnTypes[column]}`,
        transformation: metadata.columnTypes[column] === 'numeric' ? 
          `fillna(${column}.median())` : 
          `fillna(${column}.mode()[0])`
      });
      
      validationReport.push({
        field: column,
        status: count > metadata.rowCount * 0.1 ? 'warning' : 'valid',
        message: `${count} missing values (${percentage}%)`,
        count
      });
    }
  });
  
  if (metadata.duplicateRows > 0) {
    cleaningNotes.push({
      issue: `Duplicate rows detected`,
      resolution: `Found ${metadata.duplicateRows} duplicate rows`,
      justification: `Duplicates can skew analysis results`,
      transformation: `drop_duplicates(keep='first')`
    });
  }
  
  const insights = [
    `Dataset contains ${metadata.rowCount} rows and ${metadata.columns.length} columns`,
    `Data types: ${Object.values(metadata.columnTypes).reduce((acc: any, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {})}`,
    metadata.duplicateRows > 0 ? `${metadata.duplicateRows} duplicate rows need attention` : 'No duplicate rows detected'
  ].filter(Boolean);
  
  // Generate intelligent plot suggestions based on data types
  const plots: PlotSuggestion[] = [];
  
  // Find numeric columns for histograms
  const numericColumns = Object.entries(metadata.columnTypes)
    .filter(([_, type]) => type === 'numeric')
    .map(([col, _]) => col);
  
  // Find categorical columns for frequency charts
  const categoricalColumns = Object.entries(metadata.columnTypes)
    .filter(([_, type]) => type === 'text')
    .map(([col, _]) => col);
  
  // Add histogram for first numeric column
  if (numericColumns.length > 0) {
    plots.push({
      type: "histogram",
      x_axis: numericColumns[0],
      description: `Distribution of ${numericColumns[0]} values`
    });
  }
  
  // Add frequency chart for first categorical column
  if (categoricalColumns.length > 0) {
    plots.push({
      type: "bar",
      x_axis: categoricalColumns[0],
      description: `Frequency distribution of ${categoricalColumns[0]} categories`
    });
  }
  
  // If we have both numeric and categorical, suggest a comparison
  if (numericColumns.length > 1) {
    plots.push({
      type: "line",
      x_axis: numericColumns[1],
      description: `Trend analysis of ${numericColumns[1]} over data points`
    });
  }
  
  // Fallback if no good columns found
  if (plots.length === 0 && metadata.columns.length > 0) {
    plots.push({
      type: "bar",
      x_axis: metadata.columns[0],
      description: `Distribution of ${metadata.columns[0]}`
    });
  }

  return {
    cleaning_notes: cleaningNotes,
    validation_report: validationReport,
    insights,
    plots: plots.slice(0, 2) // Limit to 2 charts
  };
}

export async function POST(req: Request) {
  try {
    // Parse form data
    const form = await req.formData();
    const files = form.getAll("files") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ ok: false, error: "No files provided" }, { status: 400 });
    }

    // Process all uploaded files
    const datasets: any[] = [];
    const fileNames: string[] = [];

    for (const file of files) {
      if (!file.name.match(/\.(csv|xlsx?)$/i)) {
        return NextResponse.json({ 
          ok: false, 
          error: `Unsupported file type: ${file.name}. Only CSV and Excel files are supported.` 
        }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const content = buffer.toString('utf-8');

      // Parse CSV data
      const parseResult = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      if (parseResult.errors.length > 0) {
        console.warn("CSV parsing warnings:", parseResult.errors);
      }

      datasets.push(parseResult.data);
      fileNames.push(file.name);
    }

    // Merge datasets if multiple files
    let combinedData = datasets[0];
    if (datasets.length > 1) {
      // Simple merge - combine all rows
      combinedData = datasets.flat();
    }

    // Analyze the dataset
    const metadata = analyzeDataset(combinedData);
    
    // Get AI analysis
    const analysis = await analyzeWithClaude(metadata);

    // Analysis completed successfully
    let storagePath: string | null = null;

    return NextResponse.json({
      ok: true,
      metadata,
      analysis,
      storagePath,
      dataPreview: combinedData.slice(0, 10) // Return first 10 rows for preview
    });

  } catch (error: any) {
    console.error("Data analysis error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error?.message ?? "Unknown server error" 
    }, { status: 500 });
  }
}