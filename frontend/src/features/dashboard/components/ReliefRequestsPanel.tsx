import { useEffect, useState } from "react";
import { createReliefRequest } from "../services/userDashboardApi";

type ReliefRequest = {
  id?: string;
  requestType?: string;
  description?: string;
  location?: string;
  quantity?: number;
  urgency?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  initialRequests: ReliefRequest[];
  loading: boolean;
  canCreate: boolean;
};

const emptyForm = {
  requestType: "Food",
  description: "",
  location: "",
  quantity: 1,
  urgency: "Medium",
};

const urgencyClass = (urgency?: string) => {
  switch ((urgency || "").toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-700";
    case "high":
      return "bg-orange-100 text-orange-700";
    case "low":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-blue-100 text-blue-700";
  }
};

const statusClass = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "inprogress":
    case "in progress":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
};

const formatDate = (value?: string) => {
  if (!value) return "Just now";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
};

const getErrorMessage = (error: unknown) => {
  const value = error as {
    response?: {
      data?: unknown;
    };
    message?: string;
  };

  if (typeof value?.response?.data === "string") {
    return value.response.data;
  }

  if (
    value?.response?.data &&
    typeof value.response.data === "object" &&
    "message" in value.response.data
  ) {
    return String(
      (value.response.data as { message?: unknown }).message ||
        "Unable to submit the request."
    );
  }

  return value?.message || "Unable to submit the request.";
};

const ReliefRequestsPanel = ({
  initialRequests,
  loading,
  canCreate,
}: Props) => {
  const [requests, setRequests] =
    useState<ReliefRequest[]>(initialRequests);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  useEffect(() => {
    setRequests(initialRequests || []);
  }, [initialRequests]);

  const updateField = (
    field: keyof typeof emptyForm,
    value: string | number
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitRequest = async () => {
    setError("");
    setSuccess("");

    if (!form.requestType.trim()) {
      setError("Please select a request type.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (!form.location.trim()) {
      setError("Please enter your location.");
      return;
    }

    if (form.quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    if (submitting) return;

    setSubmitting(true);

    try {
      const response = await createReliefRequest({
        requestType: form.requestType,
        description: form.description.trim(),
        location: form.location.trim(),
        quantity: Number(form.quantity),
        urgency: form.urgency,
      });

      const created = response?.data;

      if (created) {
        setRequests((current) => [created, ...current]);
      }

      setForm(emptyForm);
      setShowForm(false);
      setSuccess(
        "Relief request submitted successfully. The response team can now review it."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {canCreate ? "My Relief Requests" : "Relief Requests"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {canCreate
              ? "Submit a request for assistance and track its status."
              : "Assistance requests returned by the system."}
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowForm((current) => !current);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <span className="text-lg leading-none">+</span>
            {showForm ? "Close Form" : "New Relief Request"}
          </button>
        )}
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {showForm && canCreate && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              Create Relief Request
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Provide the information needed to coordinate assistance.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Request Type *
              </label>

              <select
                value={form.requestType}
                onChange={(e) =>
                  updateField("requestType", e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Food">Food</option>
                <option value="Water">Water</option>
                <option value="Medicine">Medicine</option>
                <option value="Shelter">Shelter</option>
                <option value="Clothing">Clothing</option>
                <option value="Transportation">Transportation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Urgency *
              </label>

              <select
                value={form.urgency}
                onChange={(e) =>
                  updateField("urgency", e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Location *
              </label>

              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  updateField("location", e.target.value)
                }
                placeholder="e.g. Puttalam, Sri Lanka"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Quantity *
              </label>

              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) =>
                  updateField(
                    "quantity",
                    Math.max(1, Number(e.target.value) || 1)
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Description *
              </label>

              <textarea
                rows={5}
                value={form.description}
                onChange={(e) =>
                  updateField("description", e.target.value)
                }
                placeholder="Describe what assistance you need..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={submitRequest}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          Loading your requests...
        </div>
      ) : !requests.length ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
            📋
          </div>

          <h3 className="mt-4 font-bold text-slate-800">
            No relief requests yet
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {canCreate
              ? "Create your first relief request using the button above."
              : "No assistance requests are currently available."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request, index) => (
            <div
              key={request.id || `${request.requestType}-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    📋
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      {request.requestType || "Relief Request"}
                    </h4>

                    <p className="mt-1 text-sm text-slate-600">
                      {request.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold ${urgencyClass(
                      request.urgency
                    )}`}
                  >
                    {request.urgency || "Medium"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold ${statusClass(
                      request.status
                    )}`}
                  >
                    {request.status || "Submitted"}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Location
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {request.location || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Quantity
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {request.quantity ?? 0}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Submitted
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReliefRequestsPanel;
