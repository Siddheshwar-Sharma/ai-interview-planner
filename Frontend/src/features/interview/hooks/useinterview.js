import {
    getAllInterviewReports,
    generateInterviewReport,
    getInterviewReportById,
    generateResumePdf
} from "../services/interview.api";
import { useContext, useEffect } from "react";
import { InterviewContext } from "../interview.context";
import { useParams } from "react-router";

export const useInterview = () => {
    const context = useContext(InterviewContext);
    const { interviewId } = useParams();

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider");
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context;

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true);

        try {
            const response = await generateInterviewReport({
                jobDescription,
                selfDescription,
                resumeFile,
            });

            if (!response || !response.interviewReport) {
                throw new Error("No interview report received from server");
            }

            setReport(response.interviewReport);
            return response.interviewReport;
        } catch (error) {
            console.log("GENERATE REPORT ERROR:", error?.response?.data || error.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const getReportById = async (interviewId) => {
        setLoading(true);

        try {
            const response = await getInterviewReportById(interviewId);

            if (!response || !response.interviewReport) {
                throw new Error("Interview report not found");
            }

            setReport(response.interviewReport);
            return response.interviewReport;
        } catch (error) {
            console.log("GET REPORT BY ID ERROR:", error?.response?.data || error.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const getReports = async () => {
        setLoading(true);

        try {
            const response = await getAllInterviewReports();
            const allReports = response?.interviewReports || [];
            setReports(allReports);
            return allReports;
        } catch (error) {
            console.log("GET REPORTS ERROR:", error?.response?.data || error.message);
            setReports([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const getResumePdf = async (interviewReportId) => {
        setLoading(true);

        try {
            const response = await generateResumePdf({ interviewReportId });

            const url = window.URL.createObjectURL(
                new Blob([response], { type: "application/pdf" })
            );

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `resume_${interviewReportId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.log("GET RESUME PDF ERROR:", error?.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId);
        } else {
            getReports();
        }
    }, [interviewId]);

    return {
        loading,
        report,
        reports,
        generateReport,
        getReportById,
        getReports,
        getResumePdf,
    };
};