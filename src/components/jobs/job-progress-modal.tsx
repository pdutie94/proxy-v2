"use client";

import { Icon } from '@iconify/react';
import { useState, useEffect, useCallback } from 'react';
import { Button, Chip } from "@heroui/react";

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
        
        if (result.data.status === 'COMPLETED' || result.data.status === 'FAILED') {
          setIsPolling(false);
          if (onCompleted) onCompleted();
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [jobId, onCompleted, setIsPolling, setJob, setError]);

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
          <Chip 
            size="sm" 
            variant="secondary" 
            color="success"
          >
            Thành công
          </Chip>
        );
      case 'FAILED':
        return (
          <Chip 
            size="sm" 
            variant="secondary" 
            color="danger"
          >
            Thất bại
          </Chip>
        );
      case 'ACTIVE':
        return (
          <Chip 
            size="sm" 
            variant="secondary" 
            color="accent"
          >
            Đang chạy
          </Chip>
        );
      default:
        return (
          <Chip 
            size="sm" 
            variant="secondary" 
            color="default"
          >
            Đang chờ
          </Chip>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm text-sm">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-lg flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Icon icon="lucide:terminal" className="w-4 h-4 shrink-0 text-blue-600" />
            {getJobTypeLabel(job?.type || '')}
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <Icon icon="lucide:x" className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto bg-white text-sm">
          {/* Premium Server Info & Status Card */}
          <div className="relative border border-slate-200 rounded-lg bg-slate-50/40 overflow-hidden">
            <div className="p-3.5 flex items-center gap-3 min-w-0">
              <div className="p-2 bg-white border border-slate-200 rounded-md shrink-0 flex items-center justify-center">
                <Icon icon="lucide:server" className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800 text-sm truncate leading-tight">
                    {job?.server?.name || 'Máy chủ'}
                  </p>
                  {getStatusBadge(job?.status || 'WAITING')}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 select-none">
                  <span>Bắt đầu: {job?.startedAt ? format(new Date(job.startedAt), 'HH:mm:ss') : '--:--:--'}</span>
                  {job?.finishedAt && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>Kết thúc: {format(new Date(job.finishedAt), 'HH:mm:ss')}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sleek Progress Bar at the bottom edge */}
            <div className="absolute bottom-0 left-0 right-0 bg-slate-100 h-[2px]">
              <div 
                className={`h-full transition-all duration-500 ${getProgressColor(job?.status || 'WAITING')}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-rose-600 font-semibold flex gap-1.5 items-start text-xs">
              <Icon icon="lucide:alert-triangle" className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Terminal Logs View */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-slate-700">Nhật ký thực hiện</h4>
            <div className="bg-slate-950 border border-slate-800 rounded-md p-3 min-h-[200px] max-h-[240px] overflow-y-auto font-mono text-xs leading-relaxed">
              {logSteps.length === 0 ? (
                <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                  <span className="w-3.5 h-3.5 border-2 border-slate-500/30 border-t-slate-400 rounded-full animate-spin text-xs"></span>
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
                        <span className="text-[10px] text-slate-500 select-none shrink-0 font-medium tracking-tight">
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
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-md text-emerald-800 flex gap-2 items-center text-sm">
              <Icon icon="lucide:check-circle2" className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium text-emerald-800">
                {job?.type === 'SETUP_SERVER'
                  ? 'Cài đặt máy chủ thành công.'
                  : job?.type === 'RESET_SERVER'
                  ? 'Reset máy chủ thành công.'
                  : job?.type === 'SYNC_SERVER_PORT'
                  ? 'Đồng bộ cổng máy chủ thành công.'
                  : 'Thao tác hoàn tất thành công.'}
              </span>
            </div>
          )}

          {job?.status === 'FAILED' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 flex gap-2 items-center text-sm">
              <Icon icon="lucide:alert-circle" className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium text-slate-800">
                {isPolling 
                  ? 'Hệ thống đang thử lại...' 
                  : job?.type === 'SETUP_SERVER'
                  ? 'Cài đặt máy chủ thất bại.'
                  : job?.type === 'RESET_SERVER'
                  ? 'Reset máy chủ thất bại.'
                  : job?.type === 'SYNC_SERVER_PORT'
                  ? 'Đồng bộ cổng máy chủ thất bại.'
                  : 'Thao tác gặp sự cố. Vui lòng kiểm tra nhật ký.'}
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <Button
            size="sm"
            onPress={onClose}
            className="cursor-pointer font-medium text-sm h-8 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center animate-none"
          >
            {isPolling ? 'Ẩn (Chạy ngầm)' : 'Đóng'}
          </Button>
        </div>
      </div>
    </div>
  );
};
