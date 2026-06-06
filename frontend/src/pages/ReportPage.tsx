import { useState, useEffect, useRef } from 'react';
import { models, service, factories, Report } from 'powerbi-client';
import { useEmbedToken } from '../hooks/useApi';

// A single Power BI service instance drives all embeds on the page.
const powerbi = new service.Service(
  factories.hpmFactory,
  factories.wpmpFactory,
  factories.routerFactory
);

export const ReportPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const embedRef = useRef<Report | null>(null);
  const { data: embedToken, isLoading, error } = useEmbedToken();
  const [embedError, setEmbedError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!embedToken || !container) return;

    try {
      setEmbedError(null);

      const config: models.IReportEmbedConfiguration = {
        type: 'report',
        id: embedToken.reportId,
        embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${embedToken.reportId}&groupId=${embedToken.groupId}`,
        accessToken: embedToken.token,
        tokenType: models.TokenType.Embed,
        permissions: models.Permissions.Read,
        viewMode: models.ViewMode.View,
        settings: {
          panes: {
            filters: { visible: true },
            pageNavigation: { visible: true },
          },
          bars: {
            statusBar: { visible: true },
          },
        },
      };

      const report = powerbi.embed(container, config) as Report;
      report.on('error', (event) => {
        const detail = event.detail as { message?: string } | undefined;
        setEmbedError(detail?.message || 'Failed to embed Power BI report');
      });
      embedRef.current = report;
    } catch (err) {
      setEmbedError(err instanceof Error ? err.message : 'Failed to embed Power BI report');
    }

    return () => {
      // Cleanup
      if (container) {
        powerbi.reset(container);
      }
      embedRef.current = null;
    };
  }, [embedToken]);

  const handleRefresh = () => {
    if (embedRef.current) {
      void embedRef.current.refresh();
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
    // The most common reason this fails locally is that the optional Power BI
    // integration isn't configured. Treat it as an informational state rather
    // than a hard error — the built-in Dashboard already covers analytics.
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">📊 Report</h1>
          <p className="text-gray-400">Power BI Financial Analytics</p>
        </div>

        <div className="card bg-blue-900/20 border-blue-700 p-8">
          <p className="text-blue-300 text-lg font-medium mb-2">
            ⚙️ Power BI integration not configured
          </p>
          <p className="text-gray-400 mb-4">
            This page embeds a live Power BI report once Azure credentials are set. The app runs
            fully without it — head to the <strong>Dashboard</strong> for built-in charts powered by
            the same data.
          </p>
          <ul className="text-sm text-gray-400 list-disc list-inside space-y-1 mb-4">
            <li>Set the Azure / Power BI variables in <code className="text-blue-300">.env</code></li>
            <li>Restart the backend, then return to this page</li>
            <li>See <code className="text-blue-300">docs/AZURE_SETUP.md</code> for the full walkthrough</li>
          </ul>
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
