"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@heroui/react";
import { 
  CheckCircle2, 
  Clock, 
  Terminal, 
  X,
  AlertTriangle
} from "lucide-react";
import { format } from 'date-fns';

interface JobStatus {
  id: string;
  type: string;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  logs: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  server?: {
    name: string;
    host: string;
  };
}

interface JobProgressModalProps {
  jobId: string | null;
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export const JobProgressModal = ({ jobId, open, onClose, onCompleted }: JobProgressModalProps) => {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(!!(open && jobId));

  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      const result = await response.json();

      if (result.success) {
        setJob(result.data);
        
        if (result.data.status === 'COMPLETED') {
          setIsPolling(false);
          if (onCompleted) onCompleted();
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [jobId, onCompleted]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (isPolling && open && jobId) {
      setTimeout(() => fetchJobStatus(), 0);
      intervalId = setInterval(fetchJobStatus, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPolling, open, jobId, fetchJobStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
            Thành công
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-rose-50 text-rose-600 border border-rose-200">
            Thất bại
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-blue-50 text-blue-600 border border-blue-200 animate-pulse">
            Đang chạy
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-50 text-slate-500 border border-slate-200">
            Đang chờ
          </span>
        );
    }
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'SETUP_SERVER': return 'Thiết lập máy chủ';
      case 'PROVISION_PROXY': return 'Khởi tạo Proxy';
      case 'BULK_PROVISION_PROXY': return 'Khởi tạo Proxy hàng loạt';
      case 'ROTATE_PROXY': return 'Xoay IPv6';
      case 'DELETE_PROXY': return 'Xóa Proxy';
      default: return type;
    }
  };

  const parseLogs = (logs: string | null) => {
    if (!logs) return [];
    return logs.split('\n').filter(line => line.trim() !== '').map(line => {
      const match = line.match(/^\[(.*?)\] (.*)$/);
      if (match) {
        return {
          time: format(new Date(match[1]), 'HH:mm:ss'),
          message: match[2]
        };
      }
      return { time: '', message: line };
    });
  };

  const logSteps = parseLogs(job?.logs || null);
  const progress = job?.status === 'COMPLETED' ? 100 : (job?.status === 'FAILED' ? 100 : (job?.status === 'ACTIVE' ? 50 : 10));

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500';
      case 'FAILED': return 'bg-rose-500';
      case 'ACTIVE': return 'bg-blue-500';
      default: return 'bg-slate-300';
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-lg flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 shrink-0 text-slate-500" />
            {getJobTypeLabel(job?.type || '')}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto bg-white text-xs">
          {/* Server Info & Status */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">
                {job?.server?.name || 'Đang kết nối...'}
              </span>
              {getStatusBadge(job?.status || 'WAITING')}
            </div>

            {/* Flat Dynamic Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(job?.status || 'WAITING')}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Timestamps */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-[10px]">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Bắt đầu: {job?.startedAt ? format(new Date(job.startedAt), 'HH:mm:ss') : '--:--:--'}</span>
              </div>
              {job?.finishedAt && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Kết thúc: {format(new Date(job.finishedAt), 'HH:mm:ss')}</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 font-semibold flex gap-1.5 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Terminal Logs View */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-600">Nhật ký thực hiện</h4>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 min-h-[220px] max-h-[280px] overflow-y-auto font-mono text-[10.5px] leading-relaxed shadow-inner">
              {logSteps.length === 0 ? (
                <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                  <span className="w-3.5 h-3.5 border-2 border-slate-500/30 border-t-slate-400 rounded-full animate-spin"></span>
                  <span>Đang kết nối tới máy chủ...</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {logSteps.map((step, index) => {
                    let colorClass = 'text-slate-300';
                    let dotColor = 'bg-slate-700 border-slate-800';
                    
                    if (step.message.startsWith('LỖI')) {
                      colorClass = 'text-rose-400 font-bold';
                      dotColor = 'bg-rose-500 border-rose-600';
                    } else if (step.message.includes('[RETRY]')) {
                      colorClass = 'text-amber-400 font-medium';
                      dotColor = 'bg-amber-400 border-amber-500';
                    } else if (step.message.includes('thành công')) {
                      colorClass = 'text-emerald-400 font-medium';
                      dotColor = 'bg-emerald-500 border-emerald-600';
                    } else if (index === logSteps.length - 1 && isPolling) {
                      dotColor = 'bg-blue-500 border-blue-600 animate-ping';
                    }

                    return (
                      <div key={index} className="flex gap-2.5 pl-3.5 border-l border-slate-800 relative py-0.5">
                        <div className={`absolute -left-1 top-1.5 w-1.5 h-1.5 rounded-full border ${dotColor}`} />
                        <span className="text-[9.5px] text-slate-500 select-none shrink-0 font-medium tracking-tight">
                          {step.time}
                        </span>
                        <p className={`flex-1 break-all ${colorClass}`}>
                          {step.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {job?.status === 'COMPLETED' && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-semibold flex gap-1.5 items-start">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-bold">Hoàn tất thành công</p>
                <p className="text-[10px] font-normal text-emerald-600/90 mt-0.5">Máy chủ đã được thiết lập và sẵn sàng hoạt động.</p>
              </div>
            </div>
          )}

          {job?.status === 'FAILED' && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold flex gap-1.5 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold">{isPolling ? "Đang thử lại..." : "Lỗi thực hiện"}</p>
                <p className="text-[10px] font-normal text-rose-600/90 mt-0.5">
                  {isPolling 
                    ? "Hệ thống đang gặp sự cố tạm thời và đang tự động thử lại. Vui lòng chờ..." 
                    : "Quá trình gặp sự cố. Vui lòng kiểm tra nhật ký chi tiết phía trên."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <Button
            size="sm"
            variant="primary"
            onPress={onClose}
            className="cursor-pointer font-bold text-xs h-8 px-4 rounded-lg"
          >
            {isPolling ? 'Ẩn (Chạy ngầm)' : 'Đóng'}
          </Button>
        </div>
      </div>
    </div>
  );
};
