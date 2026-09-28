import React, { useState } from 'react';
import { Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { organizerService } from '../../services/organizerService';
import { ApiError } from '../../api/apiClient';

export const CsvExportButton: React.FC<{ eventId?: string }> = ({ eventId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleExport = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const blob = await organizerService.exportCsv(eventId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `forge-results-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setStatusMessage({ type: 'success', text: 'CSV export downloaded successfully.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setStatusMessage({ type: 'error', text: 'Authentication required. Please log in.' });
        } else if (err.status === 403) {
          setStatusMessage({ type: 'error', text: 'Access denied. Organizer permissions required.' });
        } else {
          setStatusMessage({ type: 'error', text: `Server error (${err.status}): ${err.message}` });
        }
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to download CSV export.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleExport}
        isLoading={isLoading}
        title="Download scoring results in CSV format"
      >
        <Download className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
        Export CSV
      </Button>

      {statusMessage && (
        <div
          className={`flex items-center gap-1.5 text-[11px] font-mono ${
            statusMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
};
