const { GoogleGenAI } = require("@google/genai");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

function extractJson(text) {
    try {
        return JSON.parse(text);
    } catch {
        try {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
        } catch {}
    }
    return {};
}

// ✅ normalize questions
function normalizeQuestions(arr, fallback) {
    if (!Array.isArray(arr)) return fallback;

    return arr.map((item) => {
        if (typeof item === "string") {
            return {
                question: item,
                intention: "Auto-generated intention",
                answer: "Auto-generated answer",
            };
        }
        return {
            question: item?.question || "Question not available",
            intention: item?.intention || "Not specified",
            answer: item?.answer || "Not specified",
        };
    });
}

// ✅ normalize skill gaps
function normalizeSkillGaps(arr, fallback) {
    if (!Array.isArray(arr)) return fallback;

    return arr.map((item) => {
        if (typeof item === "string") {
            return {
                skill: item,
                severity: "medium",
            };
        }
        return {
            skill: item?.skill || "Unknown Skill",
            severity: item?.severity || "medium",
        };
    });
}

function ensureMinItems(arr, fallbackArr, min = 5) {
    if (!Array.isArray(arr)) return fallbackArr;
    if (arr.length >= min) return arr;
    return [...arr, ...fallbackArr].slice(0, min);
}

// ✅ fallback
function buildFallbackInterviewReport(jobDescription) {
    const title =
        jobDescription?.split("\n")[0]?.slice(0, 60) || "Interview Plan";

    return {
        matchScore: 65,
        title,

        technicalQuestions: [
            {
                question: "Explain REST API.",
                intention: "Check API understanding",
                answer: "REST APIs use HTTP methods like GET, POST, PUT, DELETE."
            },
            {
                question: "What is JWT?",
                intention: "Authentication knowledge",
                answer: "JWT is a token-based authentication mechanism."
            },
            {
                question: "Difference between SQL and MongoDB?",
                intention: "Database concepts",
                answer: "SQL uses tables, MongoDB uses documents."
            },
            {
                question: "What is middleware in Express?",
                intention: "Backend flow understanding",
                answer: "Middleware processes request before response."
            },
            {
                question: "What is async/await?",
                intention: "JS fundamentals",
                answer: "Used for handling asynchronous code."
            }
        ],

        behavioralQuestions: [
            {
                question: "Tell me about yourself.",
                intention: "Communication skills",
                answer: "Explain background, skills, and goals."
            },
            {
                question: "Describe a challenge.",
                intention: "Problem-solving",
                answer: "Explain issue + solution."
            },
            {
                question: "Why this role?",
                intention: "Motivation",
                answer: "Align skills with job."
            },
            {
                question: "How do you handle pressure?",
                intention: "Stress handling",
                answer: "Talk about calm decision making."
            },
            {
                question: "Team experience?",
                intention: "Teamwork",
                answer: "Explain collaboration experience."
            }
        ],

        skillGaps: [
            { skill: "System Design", severity: "medium" },
            { skill: "Optimization", severity: "medium" },
            { skill: "Deployment", severity: "low" }
        ],

        preparationPlan: [
            { day: 1, focus: "Node.js", tasks: ["Revise basics", "Practice questions"] },
            { day: 2, focus: "APIs", tasks: ["Build API", "JWT practice"] },
            { day: 3, focus: "MongoDB", tasks: ["Queries", "Schema design"] },
            { day: 4, focus: "Projects", tasks: ["Explain projects", "Debugging"] },
            { day: 5, focus: "Interview", tasks: ["Mock interview", "Revision"] }
        ]
    };
}

// ✅ MAIN AI FUNCTION
async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    try {
        const prompt = `
Return ONLY JSON.

Generate:
- matchScore
- title
- 5 technical questions
- 5 behavioral questions
- 3 skill gaps
- 5 day roadmap

Resume: ${resume}
Self: ${selfDescription}
Job: ${jobDescription}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const parsed = extractJson(response.text || "");
        const fallback = buildFallbackInterviewReport(jobDescription);

        return {
            matchScore:
                typeof parsed.matchScore === "number"
                    ? parsed.matchScore
                    : fallback.matchScore,

            title: parsed.title?.trim() || fallback.title,

            technicalQuestions: normalizeQuestions(
                ensureMinItems(parsed.technicalQuestions, fallback.technicalQuestions, 5),
                fallback.technicalQuestions
            ),

            behavioralQuestions: normalizeQuestions(
                ensureMinItems(parsed.behavioralQuestions, fallback.behavioralQuestions, 5),
                fallback.behavioralQuestions
            ),

            skillGaps: normalizeSkillGaps(
                ensureMinItems(parsed.skillGaps, fallback.skillGaps, 3),
                fallback.skillGaps
            ),

            preparationPlan: ensureMinItems(
                parsed.preparationPlan,
                fallback.preparationPlan,
                5
            ),
        };
    } catch (error) {
        console.error("AI ERROR:", error);
        return buildFallbackInterviewReport(jobDescription);
    }
}

// ✅ PDF FUNCTION (FIXED)
async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    let browser;

    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        const html = `
        <html>
        <body style="font-family: Arial; padding: 20px;">
            <h1>Resume</h1>

            <h2>Profile</h2>
            <p>${selfDescription || "No self description provided"}</p>

            <h2>Experience</h2>
            <p>${resume || "No resume content available"}</p>

            <h2>Target Role</h2>
            <p>${jobDescription || "Not specified"}</p>
        </body>
        </html>
        `;

        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
        });

        return pdfBuffer;
    } catch (error) {
        console.error("PDF ERROR:", error);
        throw new Error("Failed to generate PDF");
    } finally {
        if (browser) await browser.close();
    }
}

// ✅ EXPORTS (IMPORTANT)
module.exports = {
    generateInterviewReport,
    generateResumePdf,
};