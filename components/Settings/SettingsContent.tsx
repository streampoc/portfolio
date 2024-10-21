import React, { lazy, Suspense } from 'react';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorBoundary from '../Common/ErrorBoundary';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import Security from './Security';
import General from './General';


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
                <General/>
            </div>
            <div className="mt-6">
                <Security/>
            </div>
        </Suspense>
      </ErrorBoundary>
    );
  };
  
  export default SettingsContent;