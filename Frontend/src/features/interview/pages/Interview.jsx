import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useinterview.js'
import { useParams } from 'react-router'

const NAV_ITEMS = [
    { id: 'technical', label: '⚙️ Technical' },
    { id: 'behavioral', label: '🧠 Behavioral' },
    { id: 'roadmap', label: '🗺️ Roadmap' },
]

// ── Components ─────────────────

const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false)

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(!open)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p>{item?.question || "Question not available"}</p>
            </div>

            {open && (
                <div className='q-card__body'>
                    <p><strong>Intention:</strong> {item?.intention || "Not provided"}</p>
                    <p><strong>Answer:</strong> {item?.answer || "Not provided"}</p>
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day }) => (
    <div className='roadmap-day'>
        <h3>Day {day?.day}</h3>
        <p>{day?.focus}</p>
        <ul>
            {(day?.tasks || []).map((task, i) => (
                <li key={i}>{task}</li>
            ))}
        </ul>
    </div>
)

// ── MAIN ─────────────────

const Interview = () => {
    const [activeNav, setActiveNav] = useState('technical')
    const { report, getReportById, loading, getResumePdf } = useInterview()
    const { interviewId } = useParams()

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [interviewId])

    if (loading) {
        return (
            <main className='loading-screen'>
                <h1>Analyzing your profile...</h1>
                <p>Generating interview strategy using AI</p>
            </main>
        )
    }

    if (!report) {
        return (
            <main className='loading-screen'>
                <h1>Something went wrong</h1>
                <p>Please try again.</p>
            </main>
        )
    }

    return (
        <div className='interview-page'>

            {/* 🔥 TOP NAV */}
            <nav className='top-nav'>
                {NAV_ITEMS.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveNav(item.id)}
                        className={activeNav === item.id ? 'active' : ''}
                    >
                        {item.label}
                    </button>
                ))}

                <button
                    className='download-btn'
                    onClick={() => getResumePdf(interviewId)}
                >
                    ⬇️ Download Resume
                </button>
            </nav>

            {/* 🔥 MAIN LAYOUT */}
            <div className='interview-layout'>

                {/* CONTENT */}
                <main className='interview-content'>

                    {activeNav === 'technical' && (
                        <section>
                            <h2>Technical Questions</h2>

                            {report.technicalQuestions?.length > 0 ? (
                                report.technicalQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))
                            ) : (
                                <p className="empty-msg">No technical questions.</p>
                            )}
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <h2>Behavioral Questions</h2>

                            {report.behavioralQuestions?.length > 0 ? (
                                report.behavioralQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))
                            ) : (
                                <p className="empty-msg">No behavioral questions.</p>
                            )}
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <h2>Preparation Roadmap</h2>

                            {report.preparationPlan?.length > 0 ? (
                                report.preparationPlan.map((day, i) => (
                                    <RoadMapDay key={i} day={day} />
                                ))
                            ) : (
                                <p className="empty-msg">No roadmap generated.</p>
                            )}
                        </section>
                    )}

                </main>

                {/* 🔥 SIDEBAR */}
                <aside className='interview-sidebar'>
                    <h2>Match Score</h2>
                    <h1>{report.matchScore || 0}%</h1>

                    <h3>Skill Gaps</h3>

                    {report.skillGaps?.length > 0 ? (
                        report.skillGaps.map((gap, i) => (
                            <p key={i}>
                                {gap.skill} ({gap.severity})
                            </p>
                        ))
                    ) : (
                        <p>No skill gaps</p>
                    )}
                </aside>

            </div>
        </div>
    )
}

export default Interview