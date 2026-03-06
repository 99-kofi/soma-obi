const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface ChatResponse {
    response: string;
    session_id: string;
    user_id: string;
    message_id: string;
    audio_status: 'generating' | 'completed' | 'failed';
    audio_url?: string;
}

export interface AudioStatusResponse {
    status: 'generating' | 'completed' | 'failed' | 'not_found';
    audio_url?: string;
    error?: string;
}

export const chatWithBlacko = async (
    message: string,
    sessionId?: string,
    userId?: string
): Promise<ChatResponse> => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message,
            session_id: sessionId,
            user_id: userId,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to talk to Blacko AI');
    }

    return response.json();
};

export const checkAudioStatus = async (messageId: string): Promise<AudioStatusResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/audio/${messageId}`);
    if (!response.ok) {
        // If 404, it might mean logic hasn't started or cache cleared, treat as failed or not found
        return { status: 'not_found' };
    }
    return response.json();
};

export const getAnalyticsSummary = async () => {
    const response = await fetch(`${API_BASE_URL}/analytics/summary`);
    if (!response.ok) {
        throw new Error('Failed to fetch analytics');
    }
    return response.json();
};
