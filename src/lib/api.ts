import { supabase } from './supabase';
import type { Profile } from '@/contexts/AuthContext';

// ── Types for API responses ──────────────────────────────────

export interface ApplicationWithDetails {
    id: string;
    candidate_id: string;
    job_id: string;
    status: string;
    current_stage: number;
    applied_at: string;
    ai_insight: string | null;
    next_action: string | null;
    job: {
        id: string;
        title: string;
        company_name: string;
        company_logo: string | null;
        location: string | null;
        salary_range: string | null;
        description: string;
        recruiter_id: string;
    };
    stages: {
        id: string;
        name: string;
        status: string;
        stage_order: number;
        date: string | null;
        note: string | null;
    }[];
}

export interface MessageRow {
    id: string;
    application_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender?: Profile;
}

export interface AssessmentRow {
    id: string;
    application_id: string;
    title: string;
    company: string;
    duration: number;
    question_count: number;
    status: string;
    due_date: string | null;
    topics: string[];
    difficulty: string;
    score: number | null;
}

export interface JobRow {
    id: string;
    recruiter_id: string;
    title: string;
    company_name: string;
    company_logo: string | null;
    location: string | null;
    salary_range: string | null;
    description: string;
    requirements: string[];
    status: string;
    created_at: string;
}

// ── Candidate API ────────────────────────────────────────────

export async function getApplications(candidateId: string): Promise<ApplicationWithDetails[]> {
    const { data, error } = await supabase
        .from('applications')
        .select(`
      *,
      job:jobs(*),
      stages:application_stages(*)
    `)
        .eq('candidate_id', candidateId)
        .order('applied_at', { ascending: false });

    if (error) {
        console.error('Error fetching applications:', error);
        return [];
    }

    return (data || []).map((app: any) => ({
        ...app,
        stages: (app.stages || []).sort((a: any, b: any) => a.stage_order - b.stage_order),
    }));
}

export async function getApplication(id: string): Promise<ApplicationWithDetails | null> {
    const { data, error } = await supabase
        .from('applications')
        .select(`
      *,
      job:jobs(*),
      stages:application_stages(*)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching application:', error);
        return null;
    }

    return {
        ...data,
        stages: (data.stages || []).sort((a: any, b: any) => a.stage_order - b.stage_order),
    };
}

export async function getAssessments(candidateId: string): Promise<AssessmentRow[]> {
    const { data, error } = await supabase
        .from('assessments')
        .select(`
      *,
      application:applications!inner(candidate_id)
    `)
        .eq('application.candidate_id', candidateId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching assessments:', error);
        return [];
    }

    return data || [];
}

export async function getMessages(applicationId: string): Promise<MessageRow[]> {
    const { data, error } = await supabase
        .from('messages')
        .select(`
      *,
      sender:profiles!sender_id(id, full_name, avatar_url, role)
    `)
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }

    return data || [];
}

export async function sendMessage(applicationId: string, senderId: string, content: string) {
    const { data, error } = await supabase
        .from('messages')
        .insert({ application_id: applicationId, sender_id: senderId, content })
        .select(`*, sender:profiles!sender_id(id, full_name, avatar_url, role)`)
        .single();

    if (error) {
        console.error('Error sending message:', error);
        return null;
    }

    return data;
}

export async function getMessageThreads(userId: string) {
    // Get all applications with their latest message
    const { data, error } = await supabase
        .from('applications')
        .select(`
      id,
      job:jobs(title, company_name, company_logo, recruiter_id),
      candidate_id
    `)
        .or(`candidate_id.eq.${userId},job.recruiter_id.eq.${userId}`);

    if (error) {
        console.error('Error fetching threads:', error);
        return [];
    }

    // For each application, get the last message and the other party's profile
    const threads = await Promise.all(
        (data || []).map(async (app: any) => {
            const { data: msgs } = await supabase
                .from('messages')
                .select('*, sender:profiles!sender_id(id, full_name, avatar_url, role)')
                .eq('application_id', app.id)
                .order('created_at', { ascending: false })
                .limit(1);

            const otherPartyId = app.candidate_id === userId
                ? app.job?.recruiter_id
                : app.candidate_id;

            const { data: otherProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', otherPartyId)
                .single();

            return {
                applicationId: app.id,
                jobTitle: app.job?.title,
                companyName: app.job?.company_name,
                companyLogo: app.job?.company_logo,
                otherParty: otherProfile,
                lastMessage: msgs?.[0] || null,
                unread: 0, // TODO: implement read tracking
            };
        })
    );

    return threads.filter((t) => t.lastMessage !== null);
}

// ── Jobs API ─────────────────────────────────────────────────

export async function getActiveJobs(): Promise<JobRow[]> {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching jobs:', error);
        return [];
    }

    return data || [];
}

export async function applyToJob(candidateId: string, jobId: string) {
    // Create application
    const { data: app, error: appError } = await supabase
        .from('applications')
        .insert({
            candidate_id: candidateId,
            job_id: jobId,
            status: 'applied',
            current_stage: 1,
        })
        .select()
        .single();

    if (appError) {
        console.error('Error applying to job:', appError);
        return { error: appError.message };
    }

    // Create initial stage
    await supabase.from('application_stages').insert({
        application_id: app.id,
        name: 'Application',
        status: 'completed',
        stage_order: 1,
        date: new Date().toISOString(),
        note: 'Applied via CandidateOS',
    });

    return { error: null, applicationId: app.id };
}

// ── Recruiter API ────────────────────────────────────────────

export async function createJob(job: Omit<JobRow, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('jobs')
        .insert(job)
        .select()
        .single();

    if (error) {
        console.error('Error creating job:', error);
        return null;
    }

    return data;
}

export async function updateJob(jobId: string, updates: Partial<Omit<JobRow, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId)
        .select()
        .single();

    if (error) {
        console.error('Error updating job:', error);
        return null;
    }

    return data;
}

export async function getRecruiterJobs(recruiterId: string): Promise<JobRow[]> {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('recruiter_id', recruiterId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching recruiter jobs:', error);
        return [];
    }

    return data || [];
}

export async function getJobApplicants(jobId: string) {
    const { data, error } = await supabase
        .from('applications')
        .select(`
      *,
      candidate:profiles!candidate_id(*),
      stages:application_stages(*)
    `)
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false });

    if (error) {
        console.error('Error fetching applicants:', error);
        return [];
    }

    return (data || []).map((app: any) => ({
        ...app,
        stages: (app.stages || []).sort((a: any, b: any) => a.stage_order - b.stage_order),
    }));
}

export async function updateApplicationStatus(applicationId: string, status: string, note?: string) {
    const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

    if (error) {
        console.error('Error updating application status:', error);
        return { error: error.message };
    }

    return { error: null };
}

export async function addApplicationStage(
    applicationId: string,
    name: string,
    stageOrder: number,
    status: string = 'pending',
    note?: string
) {
    const { error } = await supabase
        .from('application_stages')
        .insert({
            application_id: applicationId,
            name,
            stage_order: stageOrder,
            status,
            date: status === 'completed' || status === 'active' ? new Date().toISOString() : null,
            note: note || null,
        });

    if (error) {
        console.error('Error adding stage:', error);
        return { error: error.message };
    }

    return { error: null };
}

// ── Profile API ──────────────────────────────────────────────

export async function updateProfile(userId: string, updates: Partial<Profile>) {
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) {
        console.error('Error updating profile:', error);
        return { error: error.message };
    }

    return { error: null };
}

// ── Assessment Assignment ────────────────────────────────────

export async function createAssessment(data: {
    application_id: string;
    title: string;
    company: string;
    duration: number;
    question_count: number;
    topics: string[];
    difficulty: string;
    due_date: string | null;
}) {
    const { data: result, error } = await supabase
        .from('assessments')
        .insert({ ...data, status: 'pending', score: null })
        .select()
        .single();

    if (error) {
        console.error('Error creating assessment:', error);
        return null;
    }

    return result;
}

export async function getRecruiterAssessments(recruiterId: string) {
    const { data, error } = await supabase
        .from('assessments')
        .select(`
      *,
      application:applications!inner(
        id, candidate_id, status,
        candidate:profiles!candidate_id(id, full_name, email, avatar_url),
        job:jobs!inner(id, title, company_name, recruiter_id)
      )
    `)
        .eq('application.job.recruiter_id', recruiterId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching recruiter assessments:', error);
        return [];
    }

    return data || [];
}

export async function updateAssessment(assessmentId: string, updates: Record<string, any>) {
    const { data, error } = await supabase
        .from('assessments')
        .update(updates)
        .eq('id', assessmentId)
        .select()
        .single();

    if (error) {
        console.error('Error updating assessment:', error);
        return null;
    }

    return data;
}

// ── Interview Scheduling ─────────────────────────────────────

export async function scheduleInterview(
    applicationId: string,
    candidateId: string,
    recruiterId: string,
    interviewDate: string,
    interviewType: string,
    notes: string
) {
    // 1. Update application status
    await updateApplicationStatus(applicationId, 'interview_scheduled');

    // 2. Add interview stage
    const existingStages = await supabase
        .from('application_stages')
        .select('stage_order')
        .eq('application_id', applicationId)
        .order('stage_order', { ascending: false })
        .limit(1);

    const nextOrder = (existingStages.data?.[0]?.stage_order || 0) + 1;

    await addApplicationStage(
        applicationId,
        `Interview – ${interviewType}`,
        nextOrder,
        'active',
        `Scheduled for ${new Date(interviewDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}. ${notes}`
    );

    // 3. Send a message to the candidate
    await sendMessage(
        applicationId,
        recruiterId,
        `Your ${interviewType} interview has been scheduled for ${new Date(interviewDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}. ${notes ? `Notes: ${notes}` : ''}`
    );

    return { error: null };
}

// ── Recruiter Stats ──────────────────────────────────────────

export async function getRecruiterStats(recruiterId: string) {
    const { data: jobs } = await supabase.from('jobs').select('id, status').eq('recruiter_id', recruiterId);
    const jobIds = (jobs || []).map((j) => j.id);
    const activeJobs = (jobs || []).filter((j) => j.status === 'active').length;

    let totalApplicants = 0;
    let interviewCount = 0;
    let offerCount = 0;

    if (jobIds.length > 0) {
        const { data: apps } = await supabase
            .from('applications')
            .select('id, status')
            .in('job_id', jobIds);

        totalApplicants = apps?.length || 0;
        interviewCount = apps?.filter((a) => a.status === 'interview_scheduled').length || 0;
        offerCount = apps?.filter((a) => a.status === 'offer').length || 0;
    }

    return { activeJobs, totalJobs: jobs?.length || 0, totalApplicants, interviewCount, offerCount };
}

// ── Copilot Messages ─────────────────────────────────────────

export async function getCopilotHistory(userId: string) {
    const { data, error } = await supabase
        .from('copilot_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(50);

    if (error) {
        console.error('Error fetching copilot history:', error);
        return [];
    }

    return data || [];
}

export async function saveCopilotMessage(userId: string, role: 'user' | 'assistant', content: string) {
    const { error } = await supabase
        .from('copilot_messages')
        .insert({ user_id: userId, role, content });

    if (error) {
        console.error('Error saving copilot message:', error);
    }
}

// ── Realtime Subscriptions ───────────────────────────────────

export function subscribeToMessages(applicationId: string, callback: (msg: MessageRow) => void) {
    return supabase
        .channel(`messages:${applicationId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `application_id=eq.${applicationId}`,
            },
            async (payload) => {
                // Fetch sender info
                const { data: sender } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, role')
                    .eq('id', payload.new.sender_id)
                    .single();

                callback({ ...payload.new as MessageRow, sender: sender as any });
            }
        )
        .subscribe();
}
