import { FeedbackList } from "../components/FeedbackList"

export default function AdminFeedbackPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Feedback dos Usuários</h2>
                    <p className="text-slate-500">Gerencie as sugestões e relatos de problemas enviados.</p>
                </div>
            </div>

            <FeedbackList />
        </div>
    )
}
