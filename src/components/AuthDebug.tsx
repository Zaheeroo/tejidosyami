'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthDebug() {
  const { user, loading } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <Card className="fixed bottom-4 right-4 w-64 shadow-lg z-50 bg-yellow-50">
        <CardHeader className="p-3">
          <CardTitle className="text-sm">Auth Debug: Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 shadow-lg z-50 bg-blue-50">
      <CardHeader className="p-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="text-sm flex justify-between items-center">
          <span>Auth Debug {user ? '✅' : '❌'}</span>
          <span>{isExpanded ? '▲' : '▼'}</span>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-3 pt-0">
          {user ? (
            <div className="text-xs space-y-1">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.user_metadata?.role || 'Not set'}</p>
              <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
              <details>
                <summary className="cursor-pointer">Full User Object</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-[10px] overflow-auto max-h-40">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-xs">Not logged in</p>
          )}
        </CardContent>
      )}
    </Card>
  );
} 