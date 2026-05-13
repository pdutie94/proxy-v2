"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Modal, 
  Text, 
  Box, 
  BlockStack, 
  InlineStack, 
  Badge, 
  ProgressBar,
  Banner,
  Scrollable,
  Spinner,
  Icon
} from "@shopify/polaris";
import { 
  CheckCircleIcon, 
  ClockIcon,
  PlayIcon,
  SearchIcon
} from "@shopify/polaris-icons";
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
        
        // If FAILED, we DON'T stop polling immediately, 
        // because BullMQ might retry and change status back to ACTIVE.
        // We only show the error state in the UI.
      } else {
        setError(result.message);
        // Don't stop polling on API error either, could be transient
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
      case 'COMPLETED': return <Badge tone="success">THÀNH CÔNG</Badge>;
      case 'FAILED': return <Badge tone="critical">THẤT BẠI</Badge>;
      case 'ACTIVE': return <Badge tone="info">ĐANG CHẠY</Badge>;
      default: return <Badge>ĐANG CHỜ</Badge>;
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
      // Regex to parse [ISO_DATE] Message
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
  const progressTone = job?.status === 'FAILED' ? 'critical' : (job?.status === 'COMPLETED' ? 'success' : 'primary');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={getJobTypeLabel(job?.type || '')}
      primaryAction={{
        content: isPolling ? 'Ẩn (Chạy ngầm)' : 'Đóng',
        onAction: onClose,
      }}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Box padding="400" background="bg-surface-secondary" borderRadius="200">
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <InlineStack gap="200">
                  <Icon source={job?.type === 'SETUP_SERVER' ? PlayIcon : SearchIcon} tone="base" />
                  <Text as="h2" variant="headingMd">
                    {job?.server?.name || 'Đang xác định...'}
                  </Text>
                </InlineStack>
                {getStatusBadge(job?.status || 'WAITING')}
              </InlineStack>
              
              <ProgressBar progress={progress} tone={progressTone} size="small" />
              
              <InlineStack gap="400">
                <InlineStack gap="100">
                  <Icon source={ClockIcon} tone="subdued" />
                  <Text as="span" variant="bodyMd" tone="subdued">
                    Bắt đầu: {job?.startedAt ? format(new Date(job.startedAt), 'HH:mm:ss') : '--:--:--'}
                  </Text>
                </InlineStack>
                {job?.finishedAt && (
                  <InlineStack gap="100">
                    <Icon source={CheckCircleIcon} tone="subdued" />
                    <Text as="span" variant="bodyMd" tone="subdued">
                      Kết thúc: {format(new Date(job.finishedAt), 'HH:mm:ss')}
                    </Text>
                  </InlineStack>
                )}
              </InlineStack>
            </BlockStack>
          </Box>

          {error && (
            <Banner tone="critical">
              <p>{error}</p>
            </Banner>
          )}

          <Text as="h3" variant="headingSm">Nhật ký thực hiện</Text>
          
          <Box 
            background="bg-surface-inverse" 
            borderRadius="200" 
            padding="400"
            minHeight="240px"
          >
            <Scrollable style={{ height: '320px' }} focusable shadow>
              <BlockStack gap="100">
                {logSteps.length === 0 ? (
                  <Box padding="400">
                    <InlineStack align="center" gap="200">
                      <Spinner size="small" />
                      <Text as="span" tone="subdued">Đang kết nối tới máy chủ...</Text>
                    </InlineStack>
                  </Box>
                ) : (
                  logSteps.map((step, index) => {
                    let color = '#e2e8f0'; // Normal (Slate 200)
                    let borderColor = '#303030';
                    
                    if (step.message.startsWith('LỖI')) {
                      color = '#f87171'; // Error (Rose 400)
                      borderColor = '#f87171';
                    } else if (step.message.includes('[RETRY]')) {
                      color = '#fbbf24'; // Retry (Amber 400)
                      borderColor = '#fbbf24';
                    } else if (step.message.includes('thành công')) {
                      color = '#34d399'; // Success (Emerald 400)
                      borderColor = '#34d399';
                    } else if (index === logSteps.length - 1 && isPolling) {
                      borderColor = '#3b82f6'; // Active (Blue 500)
                    }

                    return (
                      <div 
                        key={index} 
                        style={{ 
                          paddingTop: '6px', 
                          paddingBottom: '6px',
                          display: 'flex',
                          gap: '16px',
                          alignItems: 'flex-start',
                          borderLeft: `2px solid ${borderColor}`,
                          paddingLeft: '12px',
                          marginBottom: '4px'
                        }}
                      >
                        <span style={{ 
                          fontSize: '13px', 
                          color: '#94a3b8', 
                          fontWeight: '500', 
                          minWidth: '65px',
                          fontFamily: 'monospace'
                        }}>
                          {step.time}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p style={{ 
                            fontSize: '14px', 
                            lineHeight: '1.4',
                            color: color,
                            margin: 0,
                            fontWeight: step.message.startsWith('LỖI') ? '600' : '400'
                          }}>
                            {step.message}
                          </p>
                        </div>
                        {index === logSteps.length - 1 && isPolling && (
                          <div style={{ paddingLeft: '8px' }}>
                            <Spinner size="small" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </BlockStack>
            </Scrollable>
          </Box>

          {job?.status === 'COMPLETED' && (
            <Banner tone="success" title="Hoàn tất thành công">
              <p>Máy chủ đã được thiết lập và sẵn sàng hoạt động.</p>
            </Banner>
          )}

          {job?.status === 'FAILED' && (
            <Banner tone="critical" title={isPolling ? "Đang thử lại..." : "Lỗi thực hiện"}>
              <p>
                {isPolling 
                  ? "Hệ thống đang gặp sự cố tạm thời và đang tự động thử lại. Vui lòng chờ..." 
                  : "Quá trình gặp sự cố. Vui lòng kiểm tra nhật ký chi tiết phía trên."}
              </p>
            </Banner>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
};
