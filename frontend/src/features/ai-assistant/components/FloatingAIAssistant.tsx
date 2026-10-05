import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import api from "../../../lib/api/apiClient";

export default function FloatingAIAssistant() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");

  const ask = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setReply("");
    try {
      const response = await api.post("/ai/orchestrator/run", {
        prompt: prompt.trim(),
        riskInput: {
          location: "Colombo",
          latitude: 6.9271,
          longitude: 79.8612,
        },
        executeAgents: true,
        maxReplans: 2,
      });
      const workflow =
        response.data?.workflow_id || response.data?.workflowId;
      setReply(
        workflow
          ? `Workflow ${workflow} started. Open AI Operations Center to monitor the live agent execution.`
          : "AI workflow started. Open AI Operations Center to monitor execution."
      );
      setPrompt("");
    } catch (error: any) {
      setReply(
        error?.response?.data?.message ||
          "The AI workflow could not be started."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[100] w-[min(390px,calc(100vw-32px))] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,.22)]">
          <div className="bg-[#071b3a] p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="rn-float-bot flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/25 to-indigo-500/25 text-cyan-200 ring-1 ring-white/10">
                <Bot size={22} />
              </div>
              <div>
                <p className="text-sm font-black">ReliefNexus AI</p>
                <p className="text-[10px] text-blue-200/70">
                  Agentic operations assistant
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Ask or start an operation
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                "Assess Colombo flood risk",
                "Show pending approvals",
                "Explain the current AI workflow",
                "Check system health",
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPrompt(item)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-[10px] font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {item}
                </button>
              ))}
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tell the AI what you need..."
              rows={3}
              className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            {reply && (
              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[10px] font-semibold leading-5 text-blue-800">
                {reply}
              </div>
            )}

            <button
              type="button"
              onClick={() => void ask()}
              disabled={loading}
              className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "AI IS PLANNING..." : "START AI WORKFLOW"}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open ReliefNexus AI Assistant"
        className="rn-ai-fab fixed bottom-5 right-5 z-[101] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 text-2xl text-white shadow-[0_15px_40px_rgba(37,99,235,.35)] ring-4 ring-white transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(37,99,235,.42)]"
      >
        {open ? "×" : <><Bot size={23} /><Sparkles className="absolute -right-1 -top-1" size={13} /></>}
      </button>
    </>
  );
}
