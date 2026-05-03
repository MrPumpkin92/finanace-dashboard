import React, { useState, useEffect, useRef } from 'react';
import { PowerBiEmbedded, models } from 'powerbi-client';
import { useEmbedToken } from '../hooks/useApi';

export const ReportPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const embedRef = useRef<PowerBiEmbedded | null>(null);
  const { data: embedToken, isLoading, error } = useEmbedToken();
  const [embedError, setEmbedError] = useState<string | null>(null);

  useEffect(() => {
    if (!embedToken || !containerRef.current) return;

    const initiateEmbedding = async () => {
      try {
        setEmbedError(null);

        // Initialize Power BI Embedded component
        const embed = new PowerBiEmbedded(containerRef.current!);

        // Configure and embed report
        await embed.embed(
          {
            type: 'report',
            id: embedToken.reportId,
            embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${embedToken.reportId}&groupId=${embedToken.groupId}`,
            accessToken: embedToken.token,
            tokenExpiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
            permissions: models.Permissions.Read,
            viewMode: models.ViewMode.View,
            settings: {
              panes: {
                filters: {
                  visible: true,
                },
                pageNavigation: {
                  visible: true,
                },
              },
              bars: {
                statusBar: {
                  visible: true,
                },
              },
            },
          },
          {}
        );

        embedRef.current = embed;
      } catch (err: any) {
        setEmbedError(err?.message || 'Failed to embed Power BI report');
      }
    };

    initiateEmbedding();

    return () => {
      // Cleanup
      if (embedRef.current) {
        embedRef.current.reset();
      }
    };
  }, [embedToken]);

  const handleRefresh = () => {
    if (embedRef.current) {
      embedRef.current.refresh();
    }
  };

  const handleFullScreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const handleExportPdf = () => {
    // Power BI client handles export through UI
    alert('Use Power BI toolbar to export to PDF');
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">📊 Report</h1>
          <p className="text-gray-400">Power BI Financial Analytics</p>
        </div>

        <div className="card bg-red-900/20 border-red-700 p-8 text-center">
          <p className="text-red-400 mb-4">❌ Failed to load report</p>
          <p className="text-gray-400 mb-4">{error.message}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">📊 Report</h1>
        <p className="text-gray-400">Power BI Financial Analytics</p>
      </div>

      {/* Toolbar */}
      <div className="card flex gap-2">
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="btn-secondary disabled:opacity-50 flex items-center gap-2"
        >
          🔄 Refresh Data
        </button>
        <button
          onClick={handleFullScreen}
          disabled={isLoading}
          className="btn-secondary disabled:opacity-50 flex items-center gap-2"
        >
          ⛶ Full Screen
        </button>
        <button
          onClick={handleExportPdf}
          disabled={isLoading}
          className="btn-secondary disabled:opacity-50 flex items-center gap-2"
        >
          📥 Export PDF
        </button>
      </div>

      {/* Report Container */}
      <div className="card p-0 overflow-hidden">
        {isLoading && (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="text-4xl mb-2">⏳</div>
              <p className="text-gray-400">Loading report...</p>
            </div>
          </div>
        )}

        {embedError && (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <p className="text-red-400 mb-4">❌ {embedError}</p>
              <button onClick={() => window.location.reload()} className="btn-primary">
                Retry
              </button>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className={`w-full ${isLoading ? 'hidden' : 'block'}`}
          style={{ minHeight: '600px' }}
        />
      </div>

      {/* Info */}
      <div className="card bg-blue-900/20 border-blue-700 p-4">
        <p className="text-blue-400 text-sm">
          💡 Use the Power BI toolbar to filter data, drill down into details, and customize your view
        </p>
      </div>
    </div>
  );
};

export default ReportPage;
