

import { getFeedbackList } from "@/app/actions/feedback"
import { FeedbackTable } from "./FeedbackTable"

export async function FeedbackList() {
    const feedback = await getFeedbackList()

    return (
        <div className="space-y-4">
            <FeedbackTable initialData={feedback || []} />
        </div>
    )
}
