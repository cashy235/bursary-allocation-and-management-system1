import type { Status } from "../api";

const styles: Record<Status, string> = {
  submitted: "bg-gray-100 text-gray-600",
  under_review: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-600",
  funded: "bg-green-100 text-green-700",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${styles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}
