import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '../../hooks/enterpriseHooks';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Settings, Building2, Mail, ShieldAlert, 
  Save, RefreshCw, Languages, Globe 
} from 'lucide-react';


export function SettingsPage() {
  const { user } = useAuthStore();
  const { data: settingsData, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();

  const [activeTab, setActiveTab] = useState<'branding' | 'smtp' | 'security'>('branding');

  // Form states
  const [orgName, setOrgName] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [theme, setTheme] = useState('INDIGO');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(2525);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState('');
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState('');
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [passwordMinLength, setPasswordMinLength] = useState(8);

  // Sync form states with loaded settings
  useEffect(() => {
    if (settingsData) {
      setOrgName(settingsData.orgName || '');
      setBrandLogoUrl(settingsData.brandLogoUrl || '');
      setTheme(settingsData.theme || 'INDIGO');
      setSmtpHost(settingsData.smtpHost || '');
      setSmtpPort(settingsData.smtpPort || 2525);
      setSmtpUser(settingsData.smtpUser || '');
      setSmtpPass(settingsData.smtpPass || '');
      setCloudinaryCloudName(settingsData.cloudinaryCloudName || '');
      setCloudinaryApiKey(settingsData.cloudinaryApiKey || '');
      setCloudinaryApiSecret(settingsData.cloudinaryApiSecret || '');
      setSessionTimeout(settingsData.sessionTimeout || 30);
      setLanguage(settingsData.language || 'en');
      setTimezone(settingsData.timezone || 'UTC');
      setPasswordMinLength(settingsData.passwordMinLength || 8);
    }
  }, [settingsData]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      orgName,
      brandLogoUrl,
      theme,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      cloudinaryCloudName,
      cloudinaryApiKey,
      cloudinaryApiSecret,
      sessionTimeout,
      language,
      timezone,
      passwordMinLength
    }, {
      onSuccess: () => {
        alert('ERP Configuration updated successfully.');
      }
    });
  };

  const isAdmin = user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="h-6 w-6 text-indigo-500" />
          System Settings & Policies
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure organization profiles, custom SMTP notification relays, and password complexity.</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('branding')}
          className={`pb-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'branding' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="h-4.5 w-4.5" />
          Branding & Preferences
        </button>
        <button
          onClick={() => setActiveTab('smtp')}
          className={`pb-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'smtp' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Mail className="h-4.5 w-4.5" />
          SMTP & Cloud Integrations
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'security' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldAlert className="h-4.5 w-4.5" />
          Access Policy & Security
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
        
        {/* BRANDING TAB */}
        {activeTab === 'branding' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Organization Branding</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Organization Name</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Brand Logo URL</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={brandLogoUrl}
                  onChange={(e) => setBrandLogoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
                  placeholder="https://assets.mycompany.com/logo.png"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Theme Color Accent</label>
                <select
                  disabled={!isAdmin}
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-600 dark:text-slate-400 disabled:opacity-50"
                >
                  <option value="INDIGO">Indigo / Blue (Default)</option>
                  <option value="SLATE">Slate / Graphite</option>
                  <option value="EMERALD">Emerald / Mint</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SMTP INTEGRATIONS TAB */}
        {activeTab === 'smtp' && (
          <div className="space-y-6">
            {/* SMTP config */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Mail className="h-4.5 w-4.5 text-slate-400" />
                SMTP Mailer Relay Parameters
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">SMTP Host</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
                    placeholder="smtp.mailtrap.io"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">SMTP Port</label>
                  <input
                    type="number"
                    disabled={!isAdmin}
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(parseInt(e.target.value) || 2525)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">SMTP Username</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">SMTP Password</label>
                  <input
                    type="password"
                    disabled={!isAdmin}
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Cloudinary config */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Cloudinary Image Storage Keys</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Cloud Name</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={cloudinaryCloudName}
                    onChange={(e) => setCloudinaryCloudName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">API Key</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={cloudinaryApiKey}
                    onChange={(e) => setCloudinaryApiKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">API Secret Key</label>
                  <input
                    type="password"
                    disabled={!isAdmin}
                    value={cloudinaryApiSecret}
                    onChange={(e) => setCloudinaryApiSecret(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY & ACCESS TAB */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Security Credentials & Policies</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Password Minimum Length</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={passwordMinLength}
                  onChange={(e) => setPasswordMinLength(parseInt(e.target.value) || 8)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
                  min={6}
                  max={32}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Session Timeout (Minutes)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 30)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
                  min={5}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 dark:text-slate-400 flex items-center gap-1">
                  <Languages className="h-3.5 w-3.5 text-slate-400" />
                  Default System Language
                </label>
                <select
                  disabled={!isAdmin}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-600 dark:text-slate-400 disabled:opacity-50"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español (ES)</option>
                  <option value="fr">Français (FR)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 dark:text-slate-400 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  Default System Timezone
                </label>
                <select
                  disabled={!isAdmin}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-600 dark:text-slate-400 disabled:opacity-50"
                >
                  <option value="UTC">UTC (Universal Time)</option>
                  <option value="EST">EST (Eastern Time)</option>
                  <option value="IST">IST (Indian Standard Time)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        {isAdmin && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <RefreshCw className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <Save className="h-4.5 w-4.5" />
              )}
              {updateMutation.isPending ? 'Saving...' : 'Apply Configurations'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
