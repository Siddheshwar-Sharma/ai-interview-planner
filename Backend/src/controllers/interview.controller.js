const pdfParse = require("pdf-parse");
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

/**
 * Generate Interview Report
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription = "", jobDescription = "" } = req.body;

        if (!jobDescription.trim()) {
            return res.status(400).json({
                message: "Job description is required.",
            });
        }

        let resumeText = "";

        // ✅ SAFE PDF PARSE
        if (req.file) {
            try {
                if (req.file.mimetype !== "application/pdf") {
                    return res.status(400).json({
                        message: "Only PDF resume is supported.",
                    });
                }

                const data = await pdfParse(req.file.buffer);

                if (!data || !data.text) {
                    throw new Error("Empty PDF content");
                }

                resumeText = data.text.trim();

            } catch (err) {
                console.error("PDF PARSE ERROR:", err.message);
                return res.status(400).json({
                    message: "Invalid or corrupted PDF file.",
                });
            }
        }

        if (!resumeText && !selfDescription.trim()) {
            return res.status(400).json({
                message: "Either resume or self description is required.",
            });
        }

        // ✅ AI CALL
        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription.trim(),
            jobDescription: jobDescription.trim(),
        });

        const fallbackTitle =
            interViewReportByAi?.title?.trim() ||
            jobDescription.trim().split("\n")[0].slice(0, 80) ||
            "Interview Plan";

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription.trim(),
            jobDescription: jobDescription.trim(),
            ...interViewReportByAi,
            title: fallbackTitle,
        });

        return res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport,
        });

    } catch (error) {
        console.error("GENERATE INTERVIEW REPORT ERROR:", error);
        return res.status(500).json({
            message: "Failed to generate interview report.",
        });
    }
}

/**
 * Get Single Report
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params;

        const interviewReport = await interviewReportModel.findOne({
            _id: interviewId,
            user: req.user.id,
        });

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found.",
            });
        }

        return res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport,
        });

    } catch (error) {
        console.error("GET REPORT ERROR:", error);
        return res.status(500).json({
            message: "Failed to fetch interview report.",
        });
    }
}

/**
 * Get All Reports
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v");

        return res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports,
        });

    } catch (error) {
        console.error("GET ALL REPORTS ERROR:", error);
        return res.status(500).json({
            message: "Failed to fetch interview reports.",
        });
    }
}

/**
 * Generate Resume PDF
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params;

        const interviewReport = await interviewReportModel.findById(interviewReportId);

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found.",
            });
        }

        const { resume, jobDescription, selfDescription } = interviewReport;

        const pdfBuffer = await generateResumePdf({
            resume,
            jobDescription,
            selfDescription,
        });

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
        });

        return res.send(pdfBuffer);

    } catch (error) {
        console.error("PDF GENERATION ERROR:", error);
        return res.status(500).json({
            message: "Failed to generate resume PDF.",
        });
    }
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
};