'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { startTransition, useActionState } from 'react';
import { useFormState } from 'react-dom';
import { Lock, Trash2, Loader2 } from 'lucide-react';
import { addBrokerAccount } from './actions';


import React, { useEffect, useState } from 'react';
import { DataTable } from '../Common/DataTable';
import { ColumnDef } from "@tanstack/react-table";
import LoadingSpinner from '../Common/LoadingSpinner';
import { useUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';



interface AccountRow {
  email: string;
  id:number;
  broker_name: string;
  account_number: number;
}

type ActionState = {
    error?: string;
    success?: string;
  };

interface AccountProps {
    onContentLoaded: () => void;
}

const Accounts: React.FC<AccountProps> = ({ onContentLoaded }) => {
  const [accountsData, setAccountData] = useState<AccountRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const [submitState, submitAction, isSubmitPending] = useFormState<
    ActionState,
    FormData
  >(addBrokerAccount, { error: '', success: '' });

  useEffect(() => {
    const fetchAccountsData = async () => {
      setIsLoading(true);
      try {

        const response = await fetch('/api/getAccountsData?email=' + user?.email);
        if (!response.ok) {
          throw new Error('Failed to fetch account data');
        }
        const data = await response.json();        

        setAccountData(data);
      } catch (error) {
        console.error('Error fetching accounts data:', error);
      } finally {
        setIsLoading(false);
        onContentLoaded();
      }
    };

    fetchAccountsData();
  }, [user]);

  const columns: ColumnDef<AccountRow>[] = [
    {
        accessorKey: "email",
        header: "User",
      },
    {
      accessorKey: "broker_name",
      header: "Broker",
    },
    {
      accessorKey: "account_number",
      header: "Account Number",
    },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const handleAccountSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    // If you call the Server Action directly, it will automatically
    // reset the form. We don't want that here, because we want to keep the
    // client-side values in the inputs. So instead, we use an event handler
    // which calls the action. You must wrap direct calls with startTranstion.
    // When you use the `action` prop it automatically handles that for you.
    // Another option here is to persist the values to local storage. I might
    // explore alternative options.
    startTransition(() => {
        submitAction(new FormData(event.currentTarget));
    });
  };

  return (
    <>
    <Card>
        <CardHeader>
          <CardTitle>Add Broker Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleAccountSubmit}>
            <div>
              <Label htmlFor="broker_name">Broker Name</Label>
              <Input
                id="broker_name"
                name="broker_name"
                type="text"
                autoComplete="broker_name"
                required
                minLength={2}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                name="account_number"
                type="text"
                autoComplete="account_number"
                required
                minLength={2}
                maxLength={50}
              />
            </div>
            {submitState.error && (
              <p className="text-red-500 text-sm">{submitState.error}</p>
            )}
            {submitState.success && (
              <p className="text-green-500 text-sm">{submitState.success}</p>
            )}
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isSubmitPending}
              >
                {isSubmitPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Add Account
                  </>
                )}
            </Button>
          </form>
        </CardContent>
      </Card>
    <Card>
        <CardHeader>
          <CardTitle>User Broker Accounts</CardTitle>
        </CardHeader>
        <CardContent>
            <DataTable 
                columns={columns} 
                data={accountsData}
                showFooter={false}
                showPagination={false}
                showNoResultsMessage={!isLoading && accountsData.length === 0}
            />
   </CardContent>
   </Card>
   </>
  );
};

export default Accounts;
