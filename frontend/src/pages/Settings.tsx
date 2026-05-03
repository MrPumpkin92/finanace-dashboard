import React from 'react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">⚙️ Settings</h1>
        <p className="text-gray-400">Manage your preferences and settings</p>
      </div>

      {/* Coming Soon */}
      <div className="card">
        <div className="text-center py-12">
          <p className="text-4xl mb-4">🔧</p>
          <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
          <p className="text-gray-400">
            Settings page features are under development. Check back soon for options to:
          </p>
          <ul className="mt-4 text-left max-w-md mx-auto space-y-2 text-gray-400">
            <li>✓ Theme preferences</li>
            <li>✓ Currency configuration</li>
            <li>✓ Notification settings</li>
            <li>✓ Account management</li>
            <li>✓ Data export</li>
            <li>✓ Security & privacy</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
