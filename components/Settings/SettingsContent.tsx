import React, { lazy, Suspense } from 'react';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorBoundary from '../Common/ErrorBoundary';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'


interface SettingsContentProps {
    onContentLoaded: () => void;
  }
  
  const SettingsContent: React.FC<SettingsContentProps> = ({ onContentLoaded }) => {
  
    const handleContentLoaded = () => {
      // You can implement any logic needed when content is loaded
    };
  
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
            <div className="mt-6">
            <Card>
                <CardHeader>
                <CardTitle>General</CardTitle>
                </CardHeader>
                <CardContent>
                <p>Yet to be implemented</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                <CardTitle>Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                <p>Yet to be implemented</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent>
                <p>Yet to be implemented</p>
                </CardContent>
            </Card>
            </div>
        </Suspense>
      </ErrorBoundary>
    );
  };
  
  export default SettingsContent;