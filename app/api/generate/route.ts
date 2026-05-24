import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Gemini SDK lazily on request
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Prompt and instruction templates
const SYSTEM_INSTRUCTION = `
Anda adalah "KampusKreatif AI", seorang Asisten Kreatif dan Social Media Strategist tingkat ahli yang berdedikasi membantu mahasiswa, anggota BEM (Badan Eksekutif Mahasiswa), HIMA (Himpunan Mahasiswa), dan UKM (Unit Kegiatan Mahasiswa) dalam membuat ide konten dan copywriting/caption media sosial.

Tugas utama Anda adalah:
1. Menghasilkan ide konten yang segar, kreatif, relevan dengan tren anak muda, kehidupan kampus, dan dinamika mahasiswa saat ini.
2. Menulis caption media sosial yang sangat engaging, komunikatif, asik, tidak kaku, namun tetap sopan dan bermakna.
3. Memahami dan beradaptasi dengan baik menggunakan istilah-istilah dunia perkuliahan (misalnya: KRS, IPK, Dosbing, Proker, Danus, Semester Tua, KKN, Maba, Kating, Skripsi, Sidang, Plagiarisme, Ambis, Ormawa, Gengsi, dll) serta slang/bahasa gaul media sosial terkini di Indonesia.

Gaya bahasa Anda harus adaptif, dekat dengan mahasiswa, ramah, dan solutif. Hindari bahasa yang terlalu formal seperti rilis pers koran lama, namun jangan sampai tidak sopan ketika membahas hal-hari formal perkuliahan.
`;

const CAPTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    captions: {
      type: Type.ARRAY,
      description: "Daftar 3 opsi caption berbeda sesuai instruksi",
      items: {
        type: Type.OBJECT,
        properties: {
          optionNumber: { type: Type.INTEGER, description: "Nomor opsi (1, 2, atau 3)" },
          style: { 
            type: Type.STRING, 
            description: "Gaya Bahasa/Pendekatan. Contoh: Humoris / Inspiratif / FOMO / Edukatif / Relatable" 
          },
          hook: { 
            type: Type.STRING, 
            description: "Kalimat pertama yang menarik perhatian (wajib ada unsur stopping power/clickbait positif khas kampus)" 
          },
          body: { 
            type: Type.STRING, 
            description: "Isi pesan utama yang disampaikan secara ringkas, asik, dan mudah dipahami, memakai slang kampus yang relevan." 
          },
          cta: { 
            type: Type.STRING, 
            description: "Ajakan bertindak yang jelas dan asik (misal: 'Komen di bawah dong pengalaman kalian!', 'Klik link di bio buat daftar!')" 
          },
          hashtags: {
            type: Type.ARRAY,
            description: "3-5 hashtag yang relevan dengan topik, tren, dan kehidupan kampus",
            items: { type: Type.STRING }
          }
        },
        required: ["optionNumber", "style", "hook", "body", "cta", "hashtags"]
      }
    },
    generalDraftNotes: { 
      type: Type.STRING, 
      description: "Catatan brief kreatif singkat, tips visual postingan, atau alasan pemilihan kata dari KampusKreatif AI." 
    }
  },
  required: ["captions", "generalDraftNotes"]
};

const IDEA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    theme: { type: Type.STRING, description: "Tema besar konten yang diangkat" },
    targetAudience: { type: Type.STRING, description: "Target audiens mahasiswa spesifik" },
    blueprintTitle: { type: Type.STRING, description: "Judul blueprint rencana konten" },
    ideas: {
      type: Type.ARRAY,
      description: "3 sampai 4 ide konten kreatif konkret",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Judul Ide Konten yang memikat" },
          hook: { type: Type.STRING, description: "Ide Hook atau kalimat pertama/visual awal" },
          visualBrief: { 
            type: Type.STRING, 
            description: "Panduan visual/video singkat (misal: transisi Reels, infografis slide-by-slide, layout foto)" 
          },
          explanation: { 
            type: Type.STRING, 
            description: "Penjelasan detail kenapa ide ini asik, pesan yang ingin disampaikan, dan eksekusinya." 
          },
          estimatedEffort: { 
            type: Type.STRING, 
            description: "Estimasi effort pembuatan (e.g. Ringan, Sedang, Sangat Kreatif)" 
          }
        },
        required: ["title", "hook", "visualBrief", "explanation", "estimatedEffort"]
      }
    },
    strategy: {
      type: Type.OBJECT,
      properties: {
        dos: { 
          type: Type.ARRAY, 
          description: "2-3 hal penting yang harus dilakukan agar konten ini sukses",
          items: { type: Type.STRING } 
        },
        donts: { 
          type: Type.ARRAY, 
          description: "2-3 hal yang harus dihindari saat membuat konten ini",
          items: { type: Type.STRING } 
        },
        bestTime: { 
          type: Type.STRING, 
          description: "Rekomendasi jam tayang terbaik di lingkungan mahasiswa beserta alasannya" 
        },
        interactionHack: { 
          type: Type.STRING, 
          description: "Trik meningkatkan komen dan share di kalangan mahasiswa (misal: pancing perdebatan santau bubur diaduk vs tidak)" 
        }
      },
      required: ["dos", "donts", "bestTime", "interactionHack"]
    }
  },
  required: ["theme", "targetAudience", "blueprintTitle", "ideas", "strategy"]
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, context, topic, tone, organization, platform, customInstructions } = body;

    if (!mode) {
      return NextResponse.json(
        { error: "Parameter 'mode' (caption / ideas) wajib ditentukan." },
        { status: 400 }
      );
    }

    if (!topic) {
      return NextResponse.json(
        { error: "Deskripsi topik atau konsep wajib diisi." },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();

    let userPrompt = "";
    let selectedSchema: any = null;

    if (mode === "caption") {
      selectedSchema = CAPTION_SCHEMA;
      userPrompt = `
      BUATKAN 3 OPSI CAPTION MEDIA SOSIAL UNTUK MAHASISWA.
      
      Detail Masukan Kreatif:
      - Organisasi/Konstruksi Pengirim: ${organization || "Mahasiswa / UKM umum"}
      - Topik/Event/Masalah Kunci: "${topic}"
      - Kategori Konteks Kampus: ${context || "Kehidupan Kampus/Umum"}
      - Nada Bicara/Tone Utama: ${tone || "Santai dan Asik"}
      ${customInstructions ? `- Instruksi Tambahan: "${customInstructions}"` : ""}
      
      PENTING: Pastikan setiap opsi caption memiliki:
      1. OptionNumber (1, 2, atau 3)
      2. Style yang berbeda (contoh: Humoris ditiup candaan tongkrongan, Edukatif berbobot tapi asik, FOMO manas-manasin daftar, dll)
      3. Hook yang kuat, menghentikan jempol jemari saat scroll (stopping power)
      4. Body yang informatif tetapi pendek, memakai diksi kampus yang kekinian
      5. CTA yang ngajak interaksi seru
      6. Hashtags yang pas (3 sampai 5 hashtags).
      `;
    } else if (mode === "ideas") {
      selectedSchema = IDEA_SCHEMA;
      userPrompt = `
      BUATKAN BLUEPRINT STRATEGI & RENCANA IDE KONTEN KREATIF.
      
      Detail Masukan Kreatif:
      - Ditujukan untuk Organisasi: ${organization || "Kreator Konten Kampus / UKM / BEM"}
      - Platform Target: ${platform || "Instagram (Carousel & Reels)"}
      - Topik Kampus/Tantangan Utama: "${topic}"
      - Tema/Area Konteks: ${context || "Program Kerja/Kehidupan Mahasiswa"}
      ${customInstructions ? `- Instruksi Tambahan: "${customInstructions}"` : ""}
      
      PENTING: Hasilkan rencana taktis berisi tema besar, target audiens yang spesifik (misal: anak kos, semester tua terpuruk, maba ambis), blueprint title yang keren, lalu 3-4 ide konten taktis beserta Do's & Don'ts dan bocoran jam tayang & interaction hack.
      `;
    } else {
      return NextResponse.json(
        { error: "Mode tidak valid. Pilih antara 'caption' atau 'ideas'." },
        { status: 400 }
      );
    }

    // Call Gemini with schema configuration
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 1.0, // High temperature for high creativity
        responseMimeType: "application/json",
        responseSchema: selectedSchema,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Gemini tidak mengembalikan teks respon.");
    }

    const parsedData = JSON.parse(responseText.trim());
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Error in KampusKreatif AI backend:", error);
    return NextResponse.json(
      { 
        error: error.message || "Terjadi kesalahan internal ketika memproses AI.",
        details: error.toString() 
      },
      { status: 500 }
    );
  }
}
