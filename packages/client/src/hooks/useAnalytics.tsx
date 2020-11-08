import React from 'react';
import ReactGA from 'react-ga';

const GA_TRACKING_ID: string | undefined = process.env.REACT_APP_GA_TRACKING_ID;

type EventCategory = 'User' | 'Game' | 'Room';
type EventAction = 'Create' | 'Rename' | 'Share' | 'Join';

interface EventArgs {
    category: EventCategory;
    action: EventAction;
    label?: string;
    value?: number;
}

export function useAnalytics(): {
    init: () => void;
    page: (path: string) => void;
    track: (args: EventArgs) => void;
} {
    /**
     * Initialize analytics.
     */
    const init = () => {
        if (GA_TRACKING_ID) {
            ReactGA.initialize(GA_TRACKING_ID);
        }
    };

    /**
     * Track a page.
     */
    const page = (path: string) => {
        ReactGA.pageview(path);
    };

    /**
     * Track an event.
     */
    const track = (args: EventArgs) => {
        ReactGA.event(args);
    };

    return {
        init,
        page,
        track,
    };
}
