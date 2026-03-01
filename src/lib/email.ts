import emailjs from '@emailjs/browser';

// EmailJS Configuration
const SERVICE_ID = 'service_u6d8e8z';
const TEMPLATE_ID = 'template_nh0wzxb';
const PUBLIC_KEY = 'sM9Vs2EqaCX1PMCQo';

// Initialize EmailJS
emailjs.init(PUBLIC_KEY);

/**
 * Send an email notification via EmailJS.
 * Template uses a single {{message}} variable for flexible formatting.
 */
export async function sendEmailNotification(
    toEmail: string,
    message: string
): Promise<boolean> {
    try {
        const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
            to_email: toEmail,
            message,
        });
        console.log('Email sent:', result.status, result.text);
        return true;
    } catch (error) {
        console.error('Email send failed:', error);
        return false;
    }
}

// ── Pre-built notification helpers ──────────────────────────

/** Notify candidate when an interview is scheduled */
export function notifyInterviewScheduled(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    company: string,
    interviewDate: string,
    interviewType: string
) {
    const message = `Hi ${candidateName},\n\nGreat news! Your interview for the ${jobTitle} position at ${company} has been scheduled.\n\n📅 Date: ${interviewDate}\n🎯 Type: ${interviewType}\n\nPlease make sure to prepare and be on time. You can use the Interview Prep tool in CandidateOS to practice.\n\nGood luck!\n— CandidateOS`;
    return sendEmailNotification(candidateEmail, message);
}

/** Notify candidate when an assessment is assigned */
export function notifyAssessmentAssigned(
    candidateEmail: string,
    candidateName: string,
    assessmentTitle: string,
    company: string,
    duration: number,
    dueDate?: string
) {
    const dueLine = dueDate ? `\n📅 Due: ${new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : '';
    const message = `Hi ${candidateName},\n\nYou have a new assessment to complete for your application at ${company}.\n\n📝 Assessment: ${assessmentTitle}\n⏱ Duration: ${duration} minutes${dueLine}\n\nLog in to CandidateOS to start your assessment.\n\nBest of luck!\n— CandidateOS`;
    return sendEmailNotification(candidateEmail, message);
}

/** Notify candidate on application status change */
export function notifyStatusChange(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    company: string,
    newStatus: string
) {
    const statusMessages: Record<string, string> = {
        screening: `Your application for ${jobTitle} at ${company} has moved to the screening stage. The recruiter is reviewing your profile.`,
        interview_scheduled: `Exciting update! You've been shortlisted for an interview for ${jobTitle} at ${company}. Check your dashboard for details.`,
        assessment: `You have an assessment for ${jobTitle} at ${company}. Head to your Assessment Hub to complete it.`,
        offer: `🎉 Congratulations! You've received an offer for ${jobTitle} at ${company}! Log in to review the details.`,
        rejected: `We appreciate your interest in ${jobTitle} at ${company}. Unfortunately, the team has decided to move forward with other candidates. Use our Skill Gap Analysis tool to prepare for future opportunities.`,
        hired: `🎉 Welcome aboard! You've been officially hired for ${jobTitle} at ${company}!`,
    };

    const statusText = statusMessages[newStatus] || `Your application status for ${jobTitle} at ${company} has been updated to: ${newStatus}.`;
    const message = `Hi ${candidateName},\n\n${statusText}\n\nLog in to CandidateOS for the latest updates.\n\n— CandidateOS`;
    return sendEmailNotification(candidateEmail, message);
}

/** Notify candidate when they receive a new message */
export function notifyNewMessage(
    candidateEmail: string,
    candidateName: string,
    senderName: string,
    jobTitle: string,
    preview: string
) {
    const message = `Hi ${candidateName},\n\nYou have a new message from ${senderName} regarding your ${jobTitle} application.\n\n💬 "${preview.slice(0, 150)}${preview.length > 150 ? '...' : ''}"\n\nLog in to CandidateOS to reply.\n\n— CandidateOS`;
    return sendEmailNotification(candidateEmail, message);
}

/** Notify candidate when assessment is scored */
export function notifyAssessmentScored(
    candidateEmail: string,
    candidateName: string,
    assessmentTitle: string,
    score: number
) {
    const message = `Hi ${candidateName},\n\nYour assessment "${assessmentTitle}" has been scored.\n\n📊 Score: ${score}%\n${score >= 70 ? '✅ Great job!' : score >= 50 ? '📈 Good effort! There\'s room for improvement.' : '💪 Keep practicing and improving your skills.'}\n\nLog in to CandidateOS to see the full results.\n\n— CandidateOS`;
    return sendEmailNotification(candidateEmail, message);
}
