import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
} from "lucide-react";

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Status badge component
function StatusBadge({ status }) {
  const statusConfig = {
    pending: {
      icon: Clock,
      variant: "secondary",
      className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    },
    running: {
      icon: Play,
      variant: "secondary",
      className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    },
    passed: {
      icon: CheckCircle,
      variant: "secondary",
      className: "bg-green-100 text-green-800 hover:bg-green-100",
    },
    failed: {
      icon: XCircle,
      variant: "secondary",
      className: "bg-red-100 text-red-800 hover:bg-red-100",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon size={12} className="mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function TestItem({ test }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-stone-200/60 hover:border-stone-300 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Test Name and Status */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-medium text-slate-800">
              {test.name}
            </h3>
            <StatusBadge status={test.status} />
          </div>

          {/* Description */}
          {test.description && (
            <p className="text-stone-600 mb-3 text-sm">
              {test.description}
            </p>
          )}

          {/* Instructions Preview */}
          <p className="text-stone-500 text-xs mb-4 line-clamp-2">
            Instructions: {test.instructions}
          </p>

          {/* Meta Information */}
          <div className="flex items-center gap-6 text-xs text-stone-500">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{formatDate(test.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-stone-600 hover:text-slate-800"
          >
            <Link href={`/dashboard/tests/${test.id}`}>
              <Eye size={14} className="mr-1" />
              View
            </Link>
          </Button>
          {/*
          {test.status === "failed" && (
            <Button
              variant="outline"
              size="sm"
              className="text-amber-600 hover:text-amber-700"
            >
              <Play size={14} className="mr-1" />
              Retry
            </Button>
          )}*/}
        </div>
      </div>
    </div>
  );
}