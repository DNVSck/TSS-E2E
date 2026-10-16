import { TASK_EASE_SCORE, SATISFACTION_SCORE } from '../constant/feedback-constant';
import { BOOLEAN, BooleanValue } from '../constant/radio-value-constant';

export interface FeedbackData {
    taskCompleted: BooleanValue;
    taskEaseScore: typeof TASK_EASE_SCORE[keyof typeof TASK_EASE_SCORE];
    taskEaseReason: string;
    satisfactionScore: typeof SATISFACTION_SCORE[keyof typeof SATISFACTION_SCORE];
    comment: string;
    isPageUseful: BooleanValue;
}

const defaults: FeedbackData = {
    taskCompleted: BOOLEAN.YES,
    taskEaseScore: TASK_EASE_SCORE.EASY,
    taskEaseReason: 'Automated E2E feedback: the declaration journey was straightforward.',
    satisfactionScore: SATISFACTION_SCORE.SATISFIED,
    comment: 'Automated E2E feedback: no suggestions.',
    isPageUseful: BOOLEAN.YES,
};

export const feedbackData = (overrides?: Partial<FeedbackData>): FeedbackData => ({
    ...defaults,
    ...overrides,
});
