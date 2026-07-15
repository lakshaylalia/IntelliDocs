import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FiArrowLeft, FiMoon, FiSun, FiMonitor, FiBell, FiBellOff } from 'react-icons/fi';
import { useSettings } from '../features/auth';

const Settings = () => {
  const navigate = useNavigate();
  const {
    preferences,
    loading,
    error,
    success,
    isSaving,
    handleThemeChange,
    handleNotificationsChange,
  } = useSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const themeIcons = {
    light: FiSun,
    dark: FiMoon,
    system: FiMonitor
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard')}
        className="mb-4 flex items-center gap-2"
      >
        <FiArrowLeft /> Back to Dashboard
      </Button>

      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Settings</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Appearance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiMoon className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {['light', 'dark', 'system'].map((theme) => {
                const Icon = themeIcons[theme];
                return (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    disabled={isSaving}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      preferences.theme === theme
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${preferences.theme === theme ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className={`text-sm font-medium ${preferences.theme === theme ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiBell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 dark:text-white">Push Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive notifications about document processing and chat updates
              </p>
            </div>
            <button
              onClick={handleNotificationsChange}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
              {preferences.notifications ? (
                <FiBell className="absolute left-1.5 top-1.5 w-3 h-3 text-white" />
              ) : (
                <FiBellOff className="absolute left-1.5 top-1.5 w-3 h-3 text-gray-400" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>Application information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>IntelliDocs</strong> - RAG Chatbot</p>
            <p>Version 1.0.0</p>
            <p>A powerful document management and AI-powered chat application</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;