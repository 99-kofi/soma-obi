type BlackoEvent = 'app_opened' | 'session_started' | 'prompt_sent' | 'response_received' | 'error_occurred';

export const trackBlackoEvent = (event: BlackoEvent, data?: any) => {
    // In a real app, this could send data to Google Analytics, Mixpanel,
    // or our own backend analytics service.
    console.log(`[Blacko Analytics] Tracking event: ${event}`, data);

    // Example of sending to backend if needed
    // fetch('/api/analytics', { method: 'POST', body: JSON.stringify({ event, data, timestamp: new Date() }) });
};

export const initAnalytics = () => {
    trackBlackoEvent('app_opened');
};
