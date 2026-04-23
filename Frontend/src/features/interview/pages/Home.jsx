import React, { useState, useRef } from "react";
import "../style/home.scss";
import { useInterview } from "../hooks/useinterview.js";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const { loading, generateReport, reports } = useInterview();

    const [jobDescription, setJobDescription] = useState("");
    const [selfDescription, setSelfDescription] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null); // ✅ NEW

    const resumeInputRef = useRef();
    const navigate = useNavigate();

    const handleGenerateReport = async () => {
        setErrorMessage("");

        const resumeFile = selectedFile; // ✅ FIX

        if (!jobDescription.trim()) {
            setErrorMessage("Job description is required.");
            return;
        }

        if (!resumeFile && !selfDescription.trim()) {
            setErrorMessage("Please upload a resume or write a self description.");
            return;
        }

        if (resumeFile && resumeFile.type !== "application/pdf") {
            setErrorMessage("Please upload a valid PDF resume only.");
            return;
        }

        const data = await generateReport({
            jobDescription: jobDescription.trim(),
            selfDescription: selfDescription.trim(),
            resumeFile,
        });

        if (!data || !data._id) {
            setErrorMessage("Failed to generate interview report. Please try again.");
            return;
        }

        navigate(`/interview/${data._id}`);
    };

    if (loading) {
        return (
            <main className="loading-screen">
                <h1>Loading your interview plan...</h1>
            </main>
        );
    }

    return (
        <div className="home-page">
            <header className="page-header">
                <h1>
                    Create Your Custom <span className="highlight">Interview Plan</span>
                </h1>
                <p>
                    Let our AI analyze the job requirements and your unique profile to
                    build a winning strategy.
                </p>
            </header>

            <div className="interview-card">
                <div className="interview-card__body">

                    {/* LEFT PANEL */}
                    <div className="panel panel--left">
                        <div className="panel__header">
                            <h2>Target Job Description</h2>
                            <span className="badge badge--required">Required</span>
                        </div>

                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            className="panel__textarea"
                            placeholder={`Paste the full job description here...
e.g. Backend Developer role requiring Node.js, Express, MongoDB, APIs...`}
                            maxLength={5000}
                        />

                        <div className="char-counter">
                            {jobDescription.length} / 5000 chars
                        </div>
                    </div>

                    <div className="panel-divider" />

                    {/* RIGHT PANEL */}
                    <div className="panel panel--right">
                        <div className="panel__header">
                            <h2>Your Profile</h2>
                        </div>

                        {/* Resume Upload */}
                        <div className="upload-section">
                            <label className="section-label">
                                Upload Resume
                                <span className="badge badge--best">Best Results</span>
                            </label>

                            <label className="dropzone" htmlFor="resume">
                                <p className="dropzone__title">
                                    {selectedFile ? "File Selected" : "Click to upload"}
                                </p>
                                <p className="dropzone__subtitle">PDF only (Max 5MB)</p>

                                <input
                                    ref={resumeInputRef}
                                    hidden
                                    type="file"
                                    id="resume"
                                    name="resume"
                                    accept=".pdf"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setSelectedFile(file); // ✅ STORE FILE
                                        }
                                    }}
                                />
                            </label>

                            {/* ✅ SHOW FILE NAME */}
                            {selectedFile && (
                                <p style={{ marginTop: "8px", color: "#22c55e", fontSize: "14px" }}>
                                    ✅ {selectedFile.name}
                                </p>
                            )}
                        </div>

                        <div className="or-divider">
                            <span>OR</span>
                        </div>

                        {/* SELF DESCRIPTION */}
                        <div className="self-description">
                            <label className="section-label">
                                Quick Self-Description
                            </label>

                            <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "6px" }}>
                                The more detailed your description, the better your interview strategy will be.
                            </p>

                            <textarea
                                value={selfDescription}
                                onChange={(e) => setSelfDescription(e.target.value)}
                                className="panel__textarea panel__textarea--short"
                                placeholder="e.g. Backend developer with Node.js, Express & MongoDB experience. Built REST APIs and authentication systems."
                            />

                            <div style={{ fontSize: "13px", marginTop: "8px", color: "#888" }}>
                                💡 Tip: Mention your <strong>experience</strong>, <strong>projects</strong>,
                                <strong> tech stack</strong>, and <strong>goal</strong> for best results.
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="info-box">
                            <p>
                                Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required.
                            </p>
                        </div>

                        {errorMessage && (
                            <div style={{ color: "red", marginTop: "12px" }}>
                                {errorMessage}
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="interview-card__footer">
                    <span className="footer-info">
                        AI-Powered Strategy Generation • Approx 30s
                    </span>

                    <button onClick={handleGenerateReport} className="generate-btn">
                        Generate My Interview Strategy
                    </button>
                </div>
            </div>

            {/* RECENT REPORTS */}
            {reports.length > 0 && (
                <section className="recent-reports">
                    <h2>My Recent Interview Plans</h2>
                    <ul className="reports-list">
                        {reports.map((report) => (
                            <li
                                key={report._id}
                                className="report-item"
                                onClick={() => navigate(`/interview/${report._id}`)}
                            >
                                <h3>{report.title || "Untitled Position"}</h3>

                                <p className="report-meta">
                                    Generated on {new Date(report.createdAt).toLocaleDateString()}
                                </p>

                                <p>
                                    Match Score: {report.matchScore}%
                                </p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

export default Home;